import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  IParsedWorkbook,
  INarasiUmumRow,
  INarasiKarakterRow,
  INarasiKeselarasanRow,
  IPreviewData,
  Jenjang,
  NarrativeTone,
} from "@/types/narasi";
import {
  JENJANG_LABELS,
  NARASI_UMUM_TIERS,
  NARASI_KARAKTER_TIERS,
  NARASI_KESELARASAN_TIERS,
  KESELARASAN_BGCOLOR,
  KESELARASAN_TEXTCOLOR,
} from "@/types/narasi";

interface GenerateRequest {
  namaSekolah: string;
  jenjang: Jenjang;
  levelList: string[];
  narrativeTone?: NarrativeTone;
  workbook: IParsedWorkbook;
}


const JENJANG_KONTEKS: Record<Jenjang, string> = {
  DAYCARE: "usia 1-3 tahun, pembiasaan lewat rutinitas konkret dan bermain, bahasa sangat lembut dan sederhana",
  TK:      "usia 4-6 tahun, eksplorasi bermakna, pembiasaan harian, bahasa hangat",
  SD:      "usia 6-12 tahun, membangun kebiasaan dan tanggung jawab, bahasa lugas hangat",
  SMP:     "usia 12-15 tahun, refleksi diri, ruang dialog, bahasa reflektif",
  SMA:     "usia 15-18 tahun, komitmen pribadi, kemandirian, bahasa dewasa",
};

// ── System prompt ─────────────────────────────────────────────

function buildSystem(jenjang: Jenjang, narrativeTone: NarrativeTone = "islami"): string {
  const toneInstr =
    narrativeTone === "islami"
      ? `TONE ISLAMI: Gunakan frasa Islami secara natural dan proporsional: Alhamdulillah, insyaallah, semoga Allah mudahkan, Aamiin ya Rabbal alamin. Jangan berlebihan di setiap kalimat. Selalu gunakan sapaan Ayah Bunda dan ananda.`
      : `TONE GENERAL: Gunakan bahasa hangat, netral, inklusif, apresiatif. JANGAN gunakan: Alhamdulillah, insyaallah, Allah, Aamiin, semoga Allah, puji syukur, atau frasa religius apapun. Gunakan pembuka seperti "Ananda menunjukkan...", "Berdasarkan pengamatan...". Selalu gunakan sapaan Ayah Bunda dan ananda. JANGAN gunakan Bapak/Ibu.`;

  return `Kamu menulis narasi rapor karakter pendidikan Indonesia untuk jenjang ${JENJANG_LABELS[jenjang]} (${JENJANG_KONTEKS[jenjang]}).

WAJIB KBBI/EYD:
- Ananda (kapital, sapaan)
- Ayah Bunda (kapital, sapaan)
- istikamah (bukan istiqomah)
- insyaallah (satu kata)
- Alhamdulillah (satu kata)
- Kalimat diawali kapital, diakhiri titik

${toneInstr}

WAJIB TONE FAMMI:
- Apresiatif: hindari gagal/buruk/lemah/nakal/malas
- Sapaan Ananda dan Ayah Bunda
- Skor rendah = ruang tumbuh, bukan kekurangan
- Panduan orangtua: 3 langkah konkret
- JANGAN sebut nama sekolah atau jenjang dalam narasi

LARANGAN FRASA (DILARANG KERAS — akan menyebabkan output ditolak):
- JANGAN tulis "aspek pembelajaran" → gunakan "karakter"
- JANGAN tulis "indikator pembelajaran" → gunakan "indikator"
- JANGAN tulis "penguasaan nyaris sempurna" → gunakan "capaian indikator yang sangat baik"
- JANGAN tulis "menguasai X indikator secara solid" → gunakan "mencapai X indikator"
- JANGAN awali kalimat dengan kata "Bagus"
- JANGAN gunakan karakter em-dash (—) di dalam teks narasi. Jika ingin memisahkan klausa, gunakan koma atau buat kalimat baru.

Placeholder seperti {NK1}, {nama_panggilan}, {total_indikator} JANGAN diubah.`;
}

// ── Tool schemas ──────────────────────────────────────────────

const toolNarasiUmum: Anthropic.Tool = {
  name: "set_narasi_umum",
  description: "Simpan narasi umum (Catatan Umum Perkembangan) untuk 6 predikat",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            hasilPredikat:           { type: "string" },
            catatanUmumPerkembangan: { type: "string" },
          },
          required: ["hasilPredikat", "catatanUmumPerkembangan"],
        },
        minItems: 6,
        maxItems: 6,
      },
    },
    required: ["rows"],
  },
};

const toolNarasiKarakter: Anthropic.Tool = {
  name: "set_narasi_karakter",
  description: "Simpan narasi karakter per karakter dan rentang skor",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            karakter:            { type: "string" },
            rentangSkorIndikator: { type: "string" },
            narasi:              { type: "string" },
          },
          required: ["karakter", "rentangSkorIndikator", "narasi"],
        },
      },
    },
    required: ["rows"],
  },
};

const toolNarasiKeselarasan: Anthropic.Tool = {
  name: "set_narasi_keselarasan",
  description: "Simpan narasi keselarasan sekolah dan orangtua per karakter dan rentang skor",
  input_schema: {
    type: "object" as const,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            karakter:                { type: "string" },
            rentangSkorIndikator:    { type: "string" },
            narasiHasilDariSekolah:  { type: "string" },
            narasiHasilDariOrangtua: { type: "string" },
          },
          required: ["karakter", "rentangSkorIndikator", "narasiHasilDariSekolah", "narasiHasilDariOrangtua"],
        },
      },
    },
    required: ["rows"],
  },
};

// ── Prompt builders ───────────────────────────────────────────


function promptUmum(workbook: IParsedWorkbook): string {
  const karakterList = workbook.karakterList.slice(0, 7);
  const nkStr = karakterList.map((_, i) => `{NK${i + 1}}`).join(" ");
  const nkKeterangan = karakterList.map((k, i) => `{NK${i + 1}} = ringkasan karakter ${k}`).join("\n");
  const tierLabels = NARASI_UMUM_TIERS.map((t) => t.hasilPredikat).join(", ");
  return `Buat 6 baris Catatan Umum Perkembangan, satu per predikat: ${tierLabels}

Field hasilPredikat harus persis sama dengan label tier di atas.
Wajib gunakan placeholder: {nama_panggilan}, {total_indikator}, dan kode NK berikut: ${nkStr}

Keterangan kode NK (WAJIB sesuai urutan):
${nkKeterangan}

ATURAN PENEMPATAN KODE NK:
- Tulis kode NK TANPA awalan "NK:" — langsung tulis {NK1} {NK2} bukan "NK: {NK1} {NK2}"
- Gunakan kata penghubung/bridging sebelum kode NK untuk mengantar pembaca ke ringkasan per karakter.
  Contoh bridging: "Berikut gambaran singkat per karakter: {NK1} {NK2} {NK3}" atau
  "Secara rinci, {NK1} {NK2} {NK3}" atau frasa transisi natural lainnya.
- Pisahkan setiap kode NK dengan spasi (bukan koma), tanpa titik di antara kode.
- Placeholder TIDAK BOLEH diubah bentuknya.

Setiap narasi minimal 4 kalimat. Gunakan tool set_narasi_umum dengan field catatanUmumPerkembangan.`;
}

function promptKarakterSingle(karakter: string, workbook: IParsedWorkbook): string {
  const map: Record<string, string[]> = {};
  for (const row of workbook.indikatorGuru) {
    if (!row.karakter) continue;
    if (!map[row.karakter]) map[row.karakter] = [];
    const ind = row.indikatorPencapaian || "";
    if (ind && !map[row.karakter].includes(ind)) map[row.karakter].push(ind);
  }
  const inds = (map[karakter] ?? []).slice(0, 5).join("; ") || "indikator umum";
  const tierLines = NARASI_KARAKTER_TIERS.map((t, i) => `${i + 1}. ${t.rentang}`).join("\n");

  return `Buat TEPAT 6 narasi karakter "${karakter}" — satu per rentang skor, urutan wajib:
${tierLines}

INDIKATOR ${karakter}: ${inds}

ATURAN WAJIB:
- Output TEPAT 6 rows, urutan PERSIS seperti daftar di atas.
- Field rentangSkorIndikator harus PERSIS sama dengan label di atas (salin bulat-bulat).
- Awali setiap narasi: "Dalam karakter ${karakter}, Ananda ..." atau "Pada karakter ${karakter}, Ananda ..."
- Sebutkan minimal satu indikator spesifik dalam narasi.
- JANGAN awali dengan "Bagus".
- Skor rendah = ruang tumbuh. 3-4 kalimat per narasi, diakhiri titik.

Gunakan tool set_narasi_karakter.`;
}

function promptKeselarasanSingle(karakter: string): string {
  const tierLines = NARASI_KESELARASAN_TIERS.map((t, i) => `${i + 1}. ${t.rentang}`).join("\n");

  return `Buat TEPAT 5 narasi keselarasan untuk karakter "${karakter}" — urutan wajib:
${tierLines}

ATURAN:
- Output TEPAT 5 rows, urutan PERSIS seperti daftar di atas.
- Field rentangSkorIndikator harus PERSIS sama dengan label di atas (salin bulat-bulat).
- Rentang "0% (belum ada refleksi)": field narasiHasilDariSekolah WAJIB diisi "—" saja.
- Rentang lainnya: narasiHasilDariSekolah = 2 kalimat observasi guru (Ananda...).

ATURAN narasiHasilDariOrangtua (SEMUA rentang termasuk 0%):
- Kalimat orangtua berbicara LANGSUNG ke anak. JANGAN pakai "Ananda".
- Gunakan "kamu" atau "Nak, kamu...". 3 kalimat dengan 3 langkah konkret.
- Contoh: "Nak, kamu sudah..." / "Yuk, kita coba bersama..."

Gunakan tool set_narasi_keselarasan.`;
}

// ── Sanitasi em-dash dari semua string dalam rows ─────────────
// Jaring pengaman: jika Claude tetap menyelipkan em-dash (—) meski sudah dilarang,
// hapus otomatis sebelum data dikirim ke frontend/Excel.
// Pengecualian: nilai literal "—" (satu karakter, field narasiHasilDariSekolah pada
// rentang 0%) dibiarkan karena itu bukan teks narasi melainkan penanda kosong.
function stripEmDash(value: string): string {
  // Ganti em-dash yang diapit spasi → koma+spasi (misal: "A — B" → "A, B")
  // Ganti em-dash tanpa spasi → hapus saja
  return value
    .replace(/ — /g, ", ")
    .replace(/—/g, "");
}

function sanitizeRows(rows: unknown[]): unknown[] {
  return rows.map((row) => {
    if (row === null || typeof row !== "object") return row;
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
      if (typeof v === "string" && v !== "—") {
        sanitized[k] = stripEmDash(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  });
}

// ── Panggil Claude dengan tool_use ────────────────────────────

async function callWithTool<T extends { rows: unknown[] }>(
  client: Anthropic,
  system: string,
  userPrompt: string,
  tool: Anthropic.Tool,
): Promise<T> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8000,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolBlock = res.content.find((c) => c.type === "tool_use") as
    | Anthropic.ToolUseBlock
    | undefined;

  if (!toolBlock) {
    console.error(`[${tool.name}] stop_reason=${res.stop_reason}, blocks=`, JSON.stringify(res.content).slice(0, 300));
    throw new Error(`Tool ${tool.name} tidak dipanggil oleh model`);
  }

  const input = toolBlock.input as Record<string, unknown>;

  let rows: unknown[];
  if (Array.isArray(input)) {
    rows = input;
  } else if (Array.isArray(input?.rows)) {
    rows = input.rows as unknown[];
  } else {
    const firstArr = Object.values(input).find((v) => Array.isArray(v));
    rows = (firstArr as unknown[] | undefined) ?? [];
  }

  return { rows: sanitizeRows(rows) } as T;
}

// ── Main handler ──────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json() as GenerateRequest;
    const { namaSekolah, jenjang, levelList, narrativeTone = "islami", workbook } = body;

    if (!workbook || workbook.karakterList.length === 0) {
      return NextResponse.json({ error: "Workbook tidak valid atau tidak ada karakter." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith("REPLACE")) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY belum dikonfigurasi." }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });
    const system = buildSystem(jenjang, narrativeTone);

    type UmumInput = { rows: { hasilPredikat: string; catatanUmumPerkembangan: string }[] };
    type KarInput  = { rows: { karakter: string; rentangSkorIndikator: string; narasi: string }[] };
    type KesInput  = { rows: { karakter: string; rentangSkorIndikator: string; narasiHasilDariSekolah: string; narasiHasilDariOrangtua: string }[] };

    // Narasi Umum — satu call, hanya 6 rows, aman dari token limit
    const resUmum = await callWithTool<UmumInput>(client, system, promptUmum(workbook), toolNarasiUmum);

    // Narasi Karakter + Keselarasan — PER KARAKTER (1 call per karakter per tipe)
    // Penyebab bug sebelumnya: satu call untuk semua karakter → JSON > 8000 token → terpotong → kosong.
    // Solusi: setiap karakter = 2 call paralel (karakter 6 rows + keselarasan 5 rows) — kecil, reliable.
    const narasiKarakter:    INarasiKarakterRow[]    = [];
    const narasiKeselarasan: INarasiKeselarasanRow[] = [];

    for (const karakter of workbook.karakterList) {
      const [resK, resKS] = await Promise.all([
        callWithTool<KarInput>(client, system, promptKarakterSingle(karakter, workbook), toolNarasiKarakter),
        callWithTool<KesInput>(client, system, promptKeselarasanSingle(karakter),        toolNarasiKeselarasan),
      ]);

      // Index 0..5 = 6 tier karakter — dijamin terurut karena 1 karakter per call
      for (let ti = 0; ti < NARASI_KARAKTER_TIERS.length; ti++) {
        const tier = NARASI_KARAKTER_TIERS[ti];
        const rK = resK.rows[ti];
        narasiKarakter.push({
          karakter,
          rentangSkorIndikator: tier.rentang,
          narasi:               rK?.narasi ?? `(${karakter} - ${tier.rentang} belum dihasilkan)`,
          nilaiAwal:            tier.nilaiAwal,
          nilaiAkhir:           tier.nilaiAkhir,
        });
      }

      // Index 0..4 = 5 tier keselarasan — dijamin terurut karena 1 karakter per call
      for (let ti = 0; ti < NARASI_KESELARASAN_TIERS.length; ti++) {
        const tier = NARASI_KESELARASAN_TIERS[ti];
        const rKS = resKS.rows[ti];
        const isZero = tier.rentang === "0% (belum ada refleksi)";
        narasiKeselarasan.push({
          karakter,
          rentangSkorIndikator:    tier.rentang,
          nilaiAwal:               tier.nilaiAwal,
          nilaiAkhir:              tier.nilaiAkhir,
          narasiHasilDariSekolah:  isZero ? "—" : (rKS?.narasiHasilDariSekolah ?? `(${karakter} - sekolah - ${tier.rentang} belum dihasilkan)`),
          narasiHasilDariOrangtua: rKS?.narasiHasilDariOrangtua ?? `(${karakter} - orangtua - ${tier.rentang} belum dihasilkan)`,
          bgcolor:                 KESELARASAN_BGCOLOR,
          textcolor:               KESELARASAN_TEXTCOLOR,
        });
      }
    }

    // ── Assemble Narasi Umum ───────────────────────────────────

    const narasiUmum: INarasiUmumRow[] = NARASI_UMUM_TIERS.map((tier) => {
      const row = resUmum.rows.find((r) => r.hasilPredikat === tier.hasilPredikat);
      return {
        hasilPredikat:           tier.hasilPredikat,
        nilaiAwal:               tier.nilaiAwal,
        nilaiAkhir:              tier.nilaiAkhir,
        catatanUmumPerkembangan: row?.catatanUmumPerkembangan ?? `(Predikat ${tier.hasilPredikat} belum dihasilkan)`,
      };
    });

    const indikatorGuruColumns  = workbook.rawIndikatorGuru.length  > 0 ? Object.keys(workbook.rawIndikatorGuru[0])  : [];
    const rubrikOrangtuaColumns = workbook.rawRubrikOrangtua.length > 0 ? Object.keys(workbook.rawRubrikOrangtua[0]) : [];

    const previewData: IPreviewData = {
      indikatorGuru:         workbook.rawIndikatorGuru,
      rubrikOrangtua:        workbook.rawRubrikOrangtua,
      narasiUmum,
      narasiKarakter,
      narasiKeselarasan,
      indikatorGuruColumns,
      rubrikOrangtuaColumns,
    };

    const jenjangLabel = JENJANG_LABELS[jenjang].replace(/\s*\/\s*/g, "-");
    const levelStr = levelList.length > 0 ? levelList.join("-").replace(/\s+/g, "") : "";
    const namaFile = `Narasi_Rapor_Karakter_${(namaSekolah || "Fammi").replace(/\s+/g, "_")}_${jenjangLabel}${levelStr ? `_${levelStr}` : ""}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return NextResponse.json({ data: previewData, namaFile });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[narasi/generate]", msg);
    return NextResponse.json({ error: `Gagal generate: ${msg}` }, { status: 500 });
  }
}
