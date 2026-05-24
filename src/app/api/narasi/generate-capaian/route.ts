import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  IParsedCapaianWorkbook,
  ICapaianRow,
  ICapaianOutputRow,
  ICapaianPembukaRow,
  ICapaian100Row,
  ICapaianTKB100Row,
  ICapaian0Row,
  ICapaianLevelSection,
  ICapaianPreviewData,
  Jenjang,
  NarrativeTone,
} from "@/types/narasi";
import { JENJANG_LABELS } from "@/types/narasi";

interface GenerateCapaianRequest {
  namaSekolah: string;
  jenjang: Jenjang;
  levelList: string[];
  narrativeTone: NarrativeTone;
  workbook: IParsedCapaianWorkbook;
}

// Primary: haiku ~3-4s per call. Fallback: sonnet kalau haiku 529 overloaded.
const MODEL = "claude-haiku-4-5-20251001";
const MODEL_FALLBACK = "claude-sonnet-4-5-20250929";

const JENJANG_KONTEKS: Record<Jenjang, string> = {
  DAYCARE: "usia 1-3 tahun, bahasa sangat lembut dan sederhana, berbasis rasa aman, stimulasi awal, rutinitas kecil",
  TK: "usia 4-6 tahun, bahasa hangat dan konkret, berbasis bermain, pembiasaan, keberanian mencoba",
  SD: "usia 6-12 tahun, bahasa lugas dan hangat, membangun kebiasaan, tanggung jawab, tugas sederhana",
  SMP: "usia 12-15 tahun, bahasa reflektif, kesadaran diri, dialog terbuka, target pribadi",
  SMA: "usia 15-18 tahun, bahasa dewasa, kemandirian, komitmen pribadi, evaluasi diri",
};

const PEMBUKA_RENTANG = ["65–100", "40–64", "0–39"];

// 10 baris per batch → ~2000 output token — jauh di bawah limit 8192
// Penyebab kosong sebelumnya: 30 baris melebihi token limit → JSON terpotong → {}
const BATCH_SIZE = 10;

/** Strip \r\n dari nama elemen multi-line Excel */
function cleanElemen(e: string): string {
  return e.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// ── Retry dengan jeda flat 5s — haiku-4-5 sering 529 transient ──
function isOverloaded(err: unknown): boolean {
  const status =
    err != null && typeof err === "object" && "status" in err
      ? Number((err as { status: unknown }).status)
      : NaN;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    status === 429 || status === 529 ||
    msg.includes("429") || msg.includes("529") ||
    msg.toLowerCase().includes("rate_limit") ||
    msg.toLowerCase().includes("overload")
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isOverloaded(err) && attempt < maxRetries) {
        const delay = Math.min(5000 * Math.pow(2, attempt), 30000);
        console.error(`[generate-capaian] retry ${attempt + 1}/${maxRetries} — tunggu ${delay / 1000}s`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// Coba haiku dulu (cepat). Kalau 529 sampai 3x → fallback ke sonnet.
async function callWithFallback<T extends { rows: unknown[] }>(
  client: Anthropic,
  system: string,
  userPrompt: string,
  tool: Anthropic.Tool,
  maxTokens = 8192,
): Promise<T> {
  // Haiku: 3 percobaan
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      return await callWithTool<T>(client, system, userPrompt, tool, maxTokens, MODEL);
    } catch (err) {
      if (isOverloaded(err) && attempt < 2) {
        const delay = 5000 * (attempt + 1);
        console.error(`[haiku] overloaded attempt ${attempt + 1}/3 — tunggu ${delay / 1000}s`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (isOverloaded(err)) {
        console.error(`[haiku] 3x overloaded → fallback ke sonnet`);
        return await withRetry(
          () => callWithTool<T>(client, system, userPrompt, tool, maxTokens, MODEL_FALLBACK),
          3,
        );
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

// ── Sequential queue — satu call ke Anthropic per satu ────────
function makeQueue() {
  let chain = Promise.resolve();
  return function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = chain.then(() => fn()).then(
      (v) => { chain = Promise.resolve(); return v; },
      (e) => { chain = Promise.resolve(); throw e; }
    );
    chain = result.then(() => undefined, () => undefined);
    return result;
  };
}

// ── System prompt ─────────────────────────────────────────────
function buildSystem(jenjang: Jenjang, narrativeTone: NarrativeTone): string {
  const toneInstr =
    narrativeTone === "islami"
      ? `TONE ISLAMI: Gunakan frasa Islami secara natural dan proporsional: Alhamdulillah, insyaallah, semoga Allah mudahkan, Aamiin ya Rabbal alamin. Jangan berlebihan. Selalu gunakan Ayah Bunda dan ananda.`
      : `TONE GENERAL: Bahasa hangat, netral, inklusif. JANGAN gunakan: Alhamdulillah, insyaallah, Allah, Aamiin, semoga Allah, puji syukur, atau frasa religius apapun. Selalu gunakan Ayah Bunda dan ananda. JANGAN gunakan Bapak/Ibu.`;

  return `Kamu menulis narasi capaian pembelajaran pendidikan Indonesia untuk jenjang ${JENJANG_LABELS[jenjang]} (${JENJANG_KONTEKS[jenjang]}).

WAJIB KBBI/EYD: Ananda (kapital), Ayah Bunda (kapital), insyaallah (satu kata), Alhamdulillah (satu kata). Kalimat diawali kapital, diakhiri titik.

${toneInstr}

TONE FAMMI WAJIB:
- Apresiatif: hindari gagal/buruk/lemah/nakal/malas/tidak bisa/tidak mampu
- Gunakan: sedang berproses, patut diapresiasi, mulai tampak, perlu penguatan
- JANGAN gunakan "dilatih pelan-pelan" — ganti: dikuatkan secara bertahap, dibiasakan secara konsisten, diperkuat melalui rutinitas sederhana
- Ayah Bunda sebagai mitra aktif
- Panduan rumah: konkret dan spesifik pada indikator

LARANGAN GLOBAL (berlaku untuk semua narasi):
- JANGAN campur kata ganti orang pertama "aku" dan "saya" dalam satu kalimat atau satu narasi — pilih satu dan konsisten.
- JANGAN tulis contoh kalimat anak yang ambigu secara sosial atau mengandung konteks sensitif jenis kelamin.
- JANGAN tulis "pemahaman yang solid" → gunakan "pemahaman yang baik" atau "pemahaman yang berkembang".
- JANGAN tulis "menghadapi X indikator" atau "indikator yang kaya" → framing harus positif dan ringan.
- JANGAN gunakan karakter em-dash (—) di dalam teks narasi. Jika ingin memisahkan klausa, gunakan koma atau buat kalimat baru.`;
}

// ── Sanitasi em-dash dari semua string dalam rows ─────────────
function stripEmDash(value: string): string {
  return value.replace(/ — /g, ", ").replace(/—/g, "");
}

function sanitizeRows(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (row === null || typeof row !== "object") return row;
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      sanitized[k] = typeof v === "string" ? stripEmDash(v) : v;
    }
    return sanitized;
  });
}

// ── Claude API call dengan tool use ──────────────────────────
async function callWithTool<T extends { rows: unknown[] }>(
  client: Anthropic,
  system: string,
  userPrompt: string,
  tool: Anthropic.Tool,
  maxTokens = 8000,
  model = MODEL,
): Promise<T> {
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolBlock = res.content.find((c) => c.type === "tool_use") as
    | Anthropic.ToolUseBlock
    | undefined;

  // Log seluruh response content untuk debug
  console.error(`[${tool.name}] stop_reason=${res.stop_reason}`);
  console.error(`[${tool.name}] content blocks:`, res.content.map((c) => c.type).join(", "));
  if (!toolBlock) {
    // Log isi content untuk tahu kenapa tool tidak dipanggil
    console.error(`[${tool.name}] NO TOOL BLOCK — raw content:`, JSON.stringify(res.content).slice(0, 500));
    throw new Error(`Tool ${tool.name} tidak dipanggil oleh model`);
  }

  const input = toolBlock.input as Record<string, unknown>;
  // Log raw input structure untuk debug field name issues
  console.error(`[${tool.name}] raw input keys:`, Object.keys(input));
  console.error(`[${tool.name}] raw input sample:`, JSON.stringify(input).slice(0, 800));

  let rows: unknown[];
  if (Array.isArray(input)) {
    rows = input;
  } else if (Array.isArray(input?.rows)) {
    rows = input.rows as unknown[];
  } else {
    const firstArr = Object.values(input).find((v) => Array.isArray(v));
    rows = (firstArr as unknown[] | undefined) ?? [];
  }

  rows = sanitizeRows(rows);
  console.error(`[${tool.name}] extracted rows=${rows.length}`);
  if (rows.length > 0) {
    console.error(`[${tool.name}] first row keys:`, Object.keys(rows[0] as object));
    console.error(`[${tool.name}] first row:`, JSON.stringify(rows[0]).slice(0, 400));
  }
  return { rows } as T;
}

// ── Tool schemas ──────────────────────────────────────────────

const toolCapaianRows: Anthropic.Tool = {
  name: "set_capaian_rows",
  description: "Simpan narasi capaian pembelajaran per indikator",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            elemen: { type: "string" },
            tujuanPembelajaran: { type: "string" },
            indikator: { type: "string" },
            deskripsiBSBBSH: { type: "string", description: "Narasi 2 kalimat untuk anak BSB/BSH" },
            deskripsiMBBB: { type: "string", description: "Narasi 2 kalimat untuk anak MB/BB (hangat)" },
            solusiRumah: { type: "string", description: "1 kalimat solusi konkret di rumah" },
          },
          required: ["elemen", "indikator", "deskripsiBSBBSH", "deskripsiMBBB", "solusiRumah"],
        },
      },
    },
    required: ["rows"],
  },
};

const toolPembuka: Anthropic.Tool = {
  name: "set_narasi_pembuka",
  description: "Simpan narasi pembuka dan penutup per elemen per rentang skor",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            namaElemen: { type: "string" },
            rentangSkor: { type: "string" },
            kalimatPembuka: { type: "string" },
            kalimatPenutup: { type: "string" },
          },
          required: ["namaElemen", "rentangSkor", "kalimatPembuka", "kalimatPenutup"],
        },
      },
    },
    required: ["rows"],
  },
};

const toolNarasi100: Anthropic.Tool = {
  name: "set_narasi_100",
  description: "Simpan narasi 100% tercapai per elemen",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            namaElemen: { type: "string" },
            narasiCapaian: { type: "string", description: "Narasi pencapaian optimal (kolom: Ganti dilatih pelan-pelan jadi)" },
            ideSederhana: { type: "string", description: "Ide mempertahankan capaian di rumah (kolom: Ide sederhana di rumah)" },
          },
          required: ["namaElemen", "narasiCapaian", "ideSederhana"],
        },
      },
    },
    required: ["rows"],
  },
};

const toolNarasiTKB100: Anthropic.Tool = {
  name: "set_narasi_tkb100",
  description: "Simpan narasi CAPAIAN TK B 100%",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            namaElemen: { type: "string" },
            perluDilatih: { type: "string", description: "Narasi pencapaian penuh TK B (kolom: Perlu dilatih pelan2)" },
            fokusEndampingan: { type: "string", description: "Fokus pendampingan (kolom: Fokus pendampingan)" },
          },
          required: ["namaElemen", "perluDilatih", "fokusEndampingan"],
        },
      },
    },
    required: ["rows"],
  },
};

const toolNarasi0: Anthropic.Tool = {
  name: "set_narasi_0",
  description: "Simpan narasi semua 0% per elemen",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            elemen: { type: "string" },
            halHalBaik: { type: "string" },
          },
          required: ["elemen", "halHalBaik"],
        },
      },
    },
    required: ["rows"],
  },
};

// ── Prompt builders ───────────────────────────────────────────

function promptCapaianBatch(
  batch: ICapaianRow[],
  batchNum: number,
  totalBatches: number,
  level: string,
  jenjang: Jenjang,
): string {
  const jenjangLabel = JENJANG_LABELS[jenjang];
  const lines = batch
    .map(
      (r, i) =>
        `[${i + 1}] Elemen: ${cleanElemen(r.elemen)} | Indikator: ${r.indikator}`,
    )
    .join("\n");

  return `Buat narasi capaian pembelajaran untuk level ${level} (${jenjangLabel}).
Batch ${batchNum} dari ${totalBatches} — ${batch.length} indikator.

INDIKATOR:
${lines}

Untuk SETIAP baris (urutan WAJIB sama), isi 3 field:
- deskripsiBSBBSH: 2 kalimat untuk anak Berkembang Sangat Baik/Sesuai Harapan. Kalimat 1: pencapaian spesifik. Kalimat 2: dampak positif.
- deskripsiMBBB: 2 kalimat untuk anak Masih/Belum Berkembang (hangat). Kalimat 1: gambaran positif kesiapan. Kalimat 2: harapan pendampingan.
- solusiRumah: 1 kalimat rekomendasi konkret yang spesifik pada indikator ini.

LARANGAN WAJIB (DILARANG KERAS):
- JANGAN tulis contoh kalimat anak yang ambigu secara sosial (misal: "bersama tetangga atau saudara dari berbagai jenis kelamin") — gunakan konteks sekolah/rumah yang netral.
- JANGAN campur kata ganti orang pertama: pilih SATU saja, "aku" ATAU "saya", konsisten dalam satu narasi. Jangan ada kalimat yang pakai keduanya sekaligus.
- JANGAN pakai "pemahaman yang solid" → gunakan "pemahaman yang baik" atau "pemahaman yang berkembang".

Gunakan tool set_capaian_rows. Output TEPAT ${batch.length} rows.`;
}

function promptPembuka(
  workbook: IParsedCapaianWorkbook,
  jenjang: Jenjang,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami"
      ? "Boleh pakai Alhamdulillah, insyaallah, Aamiin secara natural."
      : "JANGAN pakai frasa religius apapun.";
  const jenjangLabel = JENJANG_LABELS[jenjang];
  const elemenClean = workbook.elemenList.map(cleanElemen);

  return `Buat NARASI PEMBUKA PENUTUP untuk jenjang ${jenjangLabel}.

ELEMEN:
${elemenClean.map((e, i) => `${i + 1}. ${e}`).join("\n")}

RENTANG SKOR (rentangSkor harus PERSIS): 65–100 | 40–64 | 0–39
${toneNote}

Untuk setiap elemen × rentang (${elemenClean.length} × 3 = ${elemenClean.length * 3} baris):
- kalimatPembuka: 2 kalimat pembuka, sebut nama elemen, sesuaikan dengan rentang.
- kalimatPenutup: 1 kalimat penutup/harapan.

Panduan: 65–100 = apresiasi kuat | 40–64 = apresiasi + dorongan | 0–39 = sangat hangat, tidak menstigma.
Urutan: tiap elemen berurutan, tiap elemen 3 baris (65–100 dulu, lalu 40–64, lalu 0–39).

Gunakan tool set_narasi_pembuka. Total TEPAT ${elemenClean.length * 3} rows.`;
}

function promptNarasi100(
  workbook: IParsedCapaianWorkbook,
  level: string,
  jenjang: Jenjang,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami"
      ? "Boleh pakai Alhamdulillah atau Aamiin."
      : "JANGAN pakai frasa religius.";
  const jenjangLabel = JENJANG_LABELS[jenjang];
  const elemenInfo = workbook.elemenList
    .map((e, i) => `${i + 1}. ${cleanElemen(e)} (${workbook.indikatorPerElemen[e] ?? 0} indikator)`)
    .join("\n");

  return `Buat NARASI 100% TERCAPAI untuk ${jenjangLabel} level ${level}.
${toneNote}

ELEMEN:
${elemenInfo}

Untuk setiap elemen, isi 2 field:
- narasiCapaian: 2-3 kalimat, seluruh indikator tercapai optimal. Sebutkan nama elemen dan jumlah indikator. Apresiasi kuat.
- ideSederhana: 2 kalimat rekomendasi MEMPERTAHANKAN capaian di rumah (bukan remedial). JANGAN pakai "dilatih pelan-pelan".

LARANGAN:
- JANGAN tulis "pemahaman yang solid" → gunakan "pemahaman yang baik", "pemahaman yang berkembang", atau "pemahaman yang menguat".
- JANGAN campur kata ganti: pilih "aku" atau "saya", konsisten dalam satu narasi.

Gunakan tool set_narasi_100. Output TEPAT ${workbook.elemenList.length} rows.`;
}

function promptNarasiTKB100(
  workbook: IParsedCapaianWorkbook,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami" ? "Boleh pakai frasa Islami secara natural." : "JANGAN pakai frasa religius.";
  const elemenInfo = workbook.elemenList
    .map((e, i) => `${i + 1}. ${cleanElemen(e)} (${workbook.indikatorPerElemen[e] ?? 0} indikator)`)
    .join("\n");

  return `Buat NARASI CAPAIAN TK B 100%.
${toneNote}

ELEMEN:
${elemenInfo}

Untuk setiap elemen, isi 2 field:
- perluDilatih: 2-3 kalimat, seluruh indikator TK B tercapai. Apresiasi kuat.
- fokusEndampingan: 2 kalimat fokus pendampingan mempertahankan capaian. Ayah Bunda sebagai mitra. JANGAN pakai "dilatih pelan-pelan".

Gunakan tool set_narasi_tkb100. Output TEPAT ${workbook.elemenList.length} rows.`;
}

function promptNarasi0(
  workbook: IParsedCapaianWorkbook,
  level: string,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami" ? "Boleh tambah harapan Islami." : "JANGAN pakai frasa religius.";
  const elemenInfo = workbook.elemenList
    .map((e, i) => `${i + 1}. ${cleanElemen(e)} (${workbook.indikatorPerElemen[e] ?? 0} indikator)`)
    .join("\n");

  return `Buat NARASI SEMUA 0% untuk level ${level}.
${toneNote}

ELEMEN:
${elemenInfo}

Untuk setiap elemen, field halHalBaik berisi 2 kalimat hangat:
- Kalimat 1: framing positif sebagai awal perjalanan belajar. JANGAN tulis "ananda menghadapi X indikator yang kaya..." — gunakan pola seperti "Ananda mulai mengenali berbagai kegiatan yang berkaitan dengan [nama elemen]..." atau "Perjalanan Ananda dalam [nama elemen] baru saja dimulai...".
- Kalimat 2: harapan pendampingan bertahap bersama Ayah Bunda.

LARANGAN:
- JANGAN tulis "menghadapi X indikator" — hindari framing beban/tantangan.
- JANGAN tulis "indikator yang kaya" — terlalu formal dan terasa seperti laporan teknis.

Gunakan tool set_narasi_0. Output TEPAT ${workbook.elemenList.length} rows.`;
}

// ── Level section generator (batched, sequential) ────────────

type CapaianBatchRow = {
  elemen: string;
  tujuanPembelajaran?: string;
  indikator: string;
  deskripsiBSBBSH: string;
  deskripsiMBBB: string;
  solusiRumah: string;
};

async function generateLevelSection(
  client: Anthropic,
  system: string,
  workbook: IParsedCapaianWorkbook,
  level: string,
  jenjang: Jenjang,
  enqueue: ReturnType<typeof makeQueue>,
): Promise<ICapaianOutputRow[]> {
  const batches: ICapaianRow[][] = [];
  for (let i = 0; i < workbook.rows.length; i += BATCH_SIZE) {
    batches.push(workbook.rows.slice(i, i + BATCH_SIZE));
  }

  const outputRows: ICapaianOutputRow[] = [];
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const result = await enqueue(() =>
      callWithFallback<{ rows: CapaianBatchRow[] }>(
        client, system,
        promptCapaianBatch(batch, batchIdx + 1, batches.length, level, jenjang),
        toolCapaianRows, 8192,
      ),
    );

    for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
      const srcRow = batch[rowIdx];
      const match = result.rows[rowIdx];
      outputRows.push({
        elemen: srcRow.elemen,
        tujuanPembelajaran: srcRow.tujuanPembelajaran,
        indikator: srcRow.indikator,
        deskripsiBSBBSH: match?.deskripsiBSBBSH ?? "(Belum dihasilkan)",
        deskripsiMBBB: match?.deskripsiMBBB ?? "(Belum dihasilkan)",
        solusiRumah: match?.solusiRumah ?? "(Belum dihasilkan)",
      });
    }
  }
  return outputRows;
}

// ── Main handler ──────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateCapaianRequest;
    const { namaSekolah, jenjang, levelList, narrativeTone, workbook } = body;

    if (!workbook || workbook.rows.length === 0) {
      return NextResponse.json(
        { error: "Workbook tidak valid atau tidak ada data." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("REPLACE")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY belum dikonfigurasi." },
        { status: 503 },
      );
    }

    const client = new Anthropic({ apiKey });
    const system = buildSystem(jenjang, narrativeTone);
    const hasTKB = levelList.includes("TK B");
    const representativeLevel = levelList[0] ?? "Umum";

    // Satu antrian sequential — tidak ada concurrent call ke Anthropic
    const enqueue = makeQueue();

    type PembukaInput = {
      rows: {
        namaElemen: string;
        rentangSkor: string;
        kalimatPembuka: string;
        kalimatPenutup: string;
      }[];
    };
    type N100Input = {
      rows: { namaElemen: string; narasiCapaian: string; ideSederhana: string }[];
    };
    type NTKB100Input = {
      rows: { namaElemen: string; perluDilatih: string; fokusEndampingan: string }[];
    };
    type N0Input = { rows: { elemen: string; halHalBaik: string }[] };

    // Generate level sections secara sequential (tiap level, tiap batch satu per satu)
    const levelSectionRows: ICapaianOutputRow[][] = [];
    for (const level of levelList) {
      const rows = await generateLevelSection(client, system, workbook, level, jenjang, enqueue);
      levelSectionRows.push(rows);
    }

    // Generate shared sections — sequential via antrian yang sama
    const resPembuka = await enqueue(() =>
      callWithFallback<PembukaInput>(client, system, promptPembuka(workbook, jenjang, narrativeTone), toolPembuka, 8192),
    );

    const res100 = await enqueue(() =>
      callWithFallback<N100Input>(client, system, promptNarasi100(workbook, representativeLevel, jenjang, narrativeTone), toolNarasi100, 8192),
    );

    const res0 = await enqueue(() =>
      callWithFallback<N0Input>(client, system, promptNarasi0(workbook, representativeLevel, narrativeTone), toolNarasi0, 8192),
    );

    const resTKB100 = hasTKB
      ? await enqueue(() =>
          callWithFallback<NTKB100Input>(client, system, promptNarasiTKB100(workbook, narrativeTone), toolNarasiTKB100, 8192),
        )
      : { rows: [] as NTKB100Input["rows"] };

    // ── Assemble output ───────────────────────────────────────

    const levelSections: ICapaianLevelSection[] = levelList.map((level, idx) => ({
      levelName: level === "Daycare" ? "CAPAIAN DAYCARE" : `CAPAIAN ${level.toUpperCase()}`,
      level,
      rows: levelSectionRows[idx],
    }));

    // Pembuka — index-based (urutan elemen × rentang sesuai prompt)
    const narasiPembukaData: ICapaianPembukaRow[] = [];
    let pembukaIdx = 0;
    for (const elemen of workbook.elemenList) {
      for (const rentang of PEMBUKA_RENTANG) {
        const match = resPembuka.rows[pembukaIdx++];
        narasiPembukaData.push({
          namaElemen: cleanElemen(elemen),
          rentangSkor: rentang,
          kalimatPembuka: match?.kalimatPembuka ?? "(Belum dihasilkan)",
          kalimatPenutup: match?.kalimatPenutup ?? "(Belum dihasilkan)",
        });
      }
    }

    // 100% — index-based
    const narasi100Data: ICapaian100Row[] = workbook.elemenList.map((elemen, idx) => ({
      namaElemen: cleanElemen(elemen),
      narasiCapaian: res100.rows[idx]?.narasiCapaian ?? "(Belum dihasilkan)",
      ideSederhana: res100.rows[idx]?.ideSederhana ?? "(Belum dihasilkan)",
    }));

    // TKB100 — index-based, kondisional
    let narasiTKB100Data: ICapaianTKB100Row[] | undefined;
    if (hasTKB) {
      narasiTKB100Data = workbook.elemenList.map((elemen, idx) => ({
        namaElemen: cleanElemen(elemen),
        perluDilatih: resTKB100.rows[idx]?.perluDilatih ?? "(Belum dihasilkan)",
        fokusEndampingan: resTKB100.rows[idx]?.fokusEndampingan ?? "(Belum dihasilkan)",
      }));
    }

    // 0% — index-based
    const narasi0Data: ICapaian0Row[] = workbook.elemenList.map((elemen, idx) => ({
      elemen: cleanElemen(elemen),
      total: `${workbook.indikatorPerElemen[elemen] ?? 0} indikator`,
      masih: "Masih perlu penguatan",
      halHalBaik: res0.rows[idx]?.halHalBaik ?? "(Belum dihasilkan)",
    }));

    const previewData: ICapaianPreviewData = {
      levelSections,
      narasiPembukaData,
      narasi100Data,
      narasiTKB100Data,
      narasi0Data,
    };

    const jenjangLabel = JENJANG_LABELS[jenjang];
    const sekolahSlug = (namaSekolah || "Fammi").replace(/\s+/g, "_");
    const levelSlug = levelList.join("-").replace(/\s+/g, "");
    const namaFile = `Narasi_Capaian_${sekolahSlug}_${jenjangLabel}_${levelSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Debug info — bantu diagnose field names dari Claude
    const _debug = {
      levelRowCounts: levelSectionRows.map((rows, i) => ({
        level: levelList[i],
        total: rows.length,
        filledBSB: rows.filter((r) => r.deskripsiBSBBSH && r.deskripsiBSBBSH !== "(Belum dihasilkan)").length,
        sampleFirstRowKeys: rows[0] ? Object.keys(rows[0]) : [],
        sampleBSB: rows[0]?.deskripsiBSBBSH?.slice(0, 80) ?? "EMPTY",
      })),
      pembuka: { total: resPembuka.rows.length, sampleKeys: resPembuka.rows[0] ? Object.keys(resPembuka.rows[0]) : [] },
      n100: { total: res100.rows.length, sample: res100.rows[0] ? JSON.stringify(res100.rows[0]).slice(0, 200) : "EMPTY" },
      n0: { total: res0.rows.length, sample: res0.rows[0] ? JSON.stringify(res0.rows[0]).slice(0, 200) : "EMPTY" },
    };
    console.error("[generate-capaian] _debug:", JSON.stringify(_debug, null, 2));

    return NextResponse.json({ data: previewData, namaFile, _debug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[narasi/generate-capaian]", msg);
    return NextResponse.json({ error: `Gagal generate: ${msg}` }, { status: 500 });
  }
}
