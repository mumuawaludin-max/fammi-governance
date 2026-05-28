import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  IParsedCapaianWorkbook,
  ICapaianRow,
  ICapaianOutputRow,
  ICapaianPembukaRow,
  ICapaian100Row,
  ICapaian100LevelSection,
  ICapaian0Row,
  ICapaian0LevelSection,
  ICapaianLevelSection,
  ICapaianPreviewData,
  Jenjang,
  NarrativeTone,
} from "@/types/narasi";
import { JENJANG_LABELS } from "@/types/narasi";

type RegenRowPayload =
  | { type: "capaian"; level: string; row: ICapaianRow }
  | { type: "pembuka"; elemen: string; rentangSkor: string }
  | { type: "narasi100"; level: string; elemen: string }
  | { type: "narasi0"; level: string; elemen: string };

interface GenerateCapaianRequest {
  namaSekolah: string;
  jenjang: Jenjang;
  levelList: string[];
  narrativeTone: NarrativeTone;
  workbook: IParsedCapaianWorkbook;
  regenRow?: RegenRowPayload;
}

// Module-level response types (used by both main handler and regenRow)
type PembukaInput = {
  rows: { namaElemen: string; rentangSkor: string; kalimatPembuka: string; kalimatPenutup: string }[];
};
type N100Input = {
  rows: { namaElemen: string; narasiCapaian: string; ideSederhana: string }[];
};
type N0Input = { rows: { elemen: string; halHalBaik: string }[] };

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
const BATCH_SIZE = 10;

// ── Level pattern: menentukan pola narasi per level ───────────
type LevelPattern = "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "KB" | "TKA" | "TKB";

function getLevelPattern(level: string): LevelPattern {
  const l = level.toUpperCase().replace(/\s+/g, "");
  // Daycare per tahun
  if (l === "1TAHUN" || l === "1THN" || l === "USIA1") return "D1";
  if (l === "2TAHUN" || l === "2THN" || l === "USIA2") return "D2";
  if (l === "3TAHUN" || l === "3THN" || l === "USIA3") return "D3";
  if (l === "4TAHUN" || l === "4THN" || l === "USIA4") return "D4";
  if (l === "5TAHUN" || l === "5THN" || l === "USIA5") return "D5";
  if (l === "6TAHUN" || l === "6THN" || l === "USIA6") return "D6";
  // TK sub-level
  if (l.includes("TKB") || l === "B") return "TKB";
  if (l.includes("KB") || l.includes("KELOMPOKBERMAIN")) return "KB";
  // Daycare tanpa sub-level (fallback)
  if (l.includes("DAYCARE")) return "D1";
  return "TKA";
}

// Konteks usia spesifik per level
const LEVEL_USIA_KONTEKS: Record<LevelPattern, string> = {
  D1: "usia 1 tahun, tahap bayi akhir/toddler awal, bahasa sangat lembut, komunikasi nonverbal dominan, berbasis rasa aman dan kelekatan, stimulasi sensori dan motorik awal",
  D2: "usia 2 tahun, toddler, mulai bicara kata-kata sederhana, eksplorasi aktif, bermain paralel, rutinitas sangat penting, emosi kuat namun regulasi belum berkembang",
  D3: "usia 3 tahun, pra-sekolah awal, mulai bicara kalimat pendek, bermain pura-pura muncul, mulai butuh teman sebaya, aturan sederhana mulai bisa dipahami",
  D4: "usia 4 tahun, pra-sekolah, bahasa mulai lancar, bertanya banyak, bermain imajinatif, mulai mengenal konsep sederhana seperti berbagi dan menunggu giliran",
  D5: "usia 5 tahun, pra-sekolah lanjut, bahasa lebih terstruktur, mulai mandiri dalam kegiatan sehari-hari, senang bekerja sama, pembiasaan awal mulai konsisten",
  D6: "usia 6 tahun, transisi ke sekolah dasar, bahasa cukup kompleks, mulai memahami aturan dan konsekuensi, siap belajar terstruktur, pembiasaan harian lebih stabil",
  KB:  "usia 2–4 tahun, bahasa sangat sederhana, berbasis rasa aman dan rutinitas, stimulasi awal melalui bermain bebas",
  TKA: "usia 4–5 tahun, bahasa hangat dan konkret, berbasis bermain terstruktur, pembiasaan awal, keberanian mencoba hal baru",
  TKB: "usia 5–6 tahun, bahasa hangat dan lebih terstruktur, mulai mandiri, pembiasaan konsisten, siap transisi ke SD",
};

// Kosakata per level
const LEVEL_VOCAB_GUARD: Record<LevelPattern, string> = {
  D1: `DAYCARE 1 TAHUN — KOSAKATA WAJIB SANGAT DASAR:
Bayi akhir/toddler awal. Perkembangan berbasis sensori, motorik, dan kelekatan emosional.
DILARANG KERAS — semua kata abstrak dan kognitif tinggi:
"memahami", "mengerti", "menyadari", "konsistensi", "tanggung jawab", "disiplin", "mandiri", "berani",
"komunikasi", "interaksi sosial" (ganti: "bermain bersama"), "eksplorasi" (ganti: "mencoba"), "kreativitas"
GUNAKAN: kata kerja paling dasar — merespons, menoleh, menyentuh, memegang, mencoba, mendekat, menjauh, meniru, ikut.
POLA: sangat singkat. "Ananda mulai menunjukkan [respons konkret]." + "Proses ini membangun [rasa aman/kemampuan dasar]."`,

  D2: `DAYCARE 2 TAHUN — KOSAKATA SANGAT SEDERHANA:
Toddler aktif. Mulai bicara kata tunggal dan dua kata. Emosi kuat, regulasi belum berkembang.
DILARANG KERAS:
"konsistensi", "tanggung jawab", "disiplin diri", "empati", "regulasi emosi" (ganti: "mulai tenang"),
"integritas", "refleksi", "memahami konsep", "kerja sama" (ganti: "bermain bersama")
GUNAKAN: mau, mencoba, ikut, menyebut, menunjuk, menolak, berbagi (jika konteks konkret ada), menunggu.
POLA 3 kalimat KB: "tampak belajar...", "Proses ini membangun..."`,

  D3: `DAYCARE 3 TAHUN — KOSAKATA SEDERHANA, MULAI KALIMAT:
Pra-sekolah awal. Mulai bicara kalimat pendek, bermain pura-pura muncul.
DILARANG KERAS:
"konsistensi", "integritas", "tanggung jawab" (ganti: "mau membantu"), "disiplin diri", "empati" (ganti: "peduli"),
"regulasi emosi" (ganti: "mulai bisa tenang"), "refleksi", "komitmen", "internalisasi"
GUNAKAN: mau mencoba, mau berbagi, mulai mengenal, ikut bermain, menyebut, menunjukkan, membantu.
POLA 3 kalimat KB: pembuka dari situasi, "tampak belajar", "Proses ini membangun..."`,

  D4: `DAYCARE 4 TAHUN — KOSAKATA KONKRET, MULAI KONSEP SEDERHANA:
Anak sudah cukup verbal, bertanya banyak, bermain imajinatif.
DILARANG KERAS:
"integritas", "komitmen", "refleksi", "internalisasi", "regulasi emosi" (ganti: "mulai bisa mengatur perasaan"),
"konsistensi" (ganti: "sudah sering"), "tanggung jawab" (ganti: "mau membereskan")
GUNAKAN: pola "sudah mulai [kata kerja]", bahasa hangat, berbasis kebiasaan harian dan permainan.`,

  D5: `DAYCARE 5 TAHUN — KOSAKATA HANGAT, MANDIRI AWAL:
Anak mulai mandiri dalam rutinitas, pembiasaan mulai stabil.
DILARANG KERAS:
"integritas", "komitmen", "refleksi diri", "internalisasi", "disiplin diri",
"konsistensi" (ganti: "sudah terbiasa"), "regulasi emosi" (ganti: "mulai bisa tenang")
GUNAKAN: pola "sudah mulai [kata kerja]", mirip TK A. Kata seperti: mandiri (jika konteks konkret ada), mau mencoba sendiri, berani.`,

  D6: `DAYCARE 6 TAHUN — KOSAKATA LEBIH MANDIRI, SIAP TRANSISI:
Anak siap masuk SD, pembiasaan lebih stabil, mulai memahami aturan.
DILARANG KERAS:
"integritas", "komitmen", "refleksi mendalam", "internalisasi", "regulasi emosi"
BOLEH (jika ada konteks perilaku konkret): mandiri, mau mengikuti aturan, konsisten, tanggung jawab sederhana.
GUNAKAN: pola "sudah mampu [kata kerja]", mirip TK B.`,

  KB: `LEVEL KB (2–4 tahun) — KOSAKATA WAJIB SANGAT SEDERHANA:
Anak usia ini masih sangat awal dalam perkembangan bahasa dan kognitif.
DILARANG KERAS:
"konsistensi", "komitmen", "integritas", "refleksi", "internalisasi", "tanggung jawab",
"disiplin diri", "kesadaran diri", "empati", "regulasi emosi", "mandiri" (ganti: "mau melakukan sendiri"),
"berani" (ganti: "mau mencoba"), "memahami" (ganti: "mengenali" atau "mulai mengenal")
GUNAKAN: kata kerja konkret — mau, mencoba, ikut, memperhatikan, menunggu, mendekat, memegang, menyebut.
POLA KHAS KB: "Ananda tampak belajar...", "Proses ini membangun...", hindari kalimat panjang.`,

  TKA: `LEVEL TK A (4–5 tahun) — KOSAKATA SEDERHANA DAN KONKRET:
Anak mulai berpikir konkret, belum memahami konsep abstrak.
DILARANG KERAS:
"integritas", "kerendahan hati", "refleksi diri", "komitmen", "menghayati nilai", "internalisasi",
"konsistensi" (ganti: "sudah sering" atau "sudah terbiasa"), "disiplin diri" (ganti: "mau mengikuti aturan"),
"tanggung jawab" (ganti: "mau membereskan" atau "mau membantu"), "regulasi emosi" (ganti: "mulai bisa tenang")
GUNAKAN: pola "sudah mulai [kata kerja]", bahasa hangat berbasis kebiasaan harian.`,

  TKB: `LEVEL TK B (5–6 tahun) — KOSAKATA LEBIH MANDIRI, TETAP KONKRET:
Anak mulai konsisten dalam perilaku, siap transisi ke SD.
DILARANG KERAS:
"integritas", "komitmen", "menghayati nilai", "internalisasi", "refleksi mendalam", "regulasi emosi",
"kerendahan hati" (ganti: "mau mendengar")
GUNAKAN: pola "sudah mampu [kata kerja]". Boleh pakai: mandiri, konsisten (jika perilaku konkret ada), berani mencoba sendiri.`,
};

/** Strip \r\n dari nama elemen multi-line Excel */
function cleanElemen(e: string): string {
  return e.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

// ── Retry ────────────────────────────────────────────────────
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

async function callWithFallback<T extends { rows: unknown[] }>(
  client: Anthropic,
  system: string,
  userPrompt: string,
  tool: Anthropic.Tool,
  maxTokens = 8192,
): Promise<T> {
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

// ── Kosakata wajib per jenjang ────────────────────────────────
const JENJANG_VOCAB_GUARD: Record<Jenjang, string> = {
  DAYCARE: `JENJANG DAYCARE/KB (1-3 tahun) — KOSAKATA WAJIB SANGAT SEDERHANA:
Anak usia ini belum memahami konsep abstrak apapun. Narasi harus berbasis tindakan yang bisa dilihat langsung.
DILARANG KERAS — terlalu berat untuk usia ini:
"integritas", "kerendahan hati", "refleksi", "konsistensi", "komitmen", "menghayati", "internalisasi",
"tanggung jawab", "disiplin diri", "kesadaran diri", "nilai-nilai", "empati", "regulasi emosi",
"mandiri" (gunakan: "mau melakukan sendiri"), "berani" (gunakan: "mau mencoba")
GUNAKAN: kata kerja konkret — mau, mencoba, ikut, menolak, memeluk, menyentuh, memperhatikan, menunggu.`,

  TK: `JENJANG TK (4-6 tahun) — KOSAKATA WAJIB SEDERHANA DAN KONKRET:
Anak usia ini berpikir konkret, belum bisa memahami konsep abstrak atau moral filosofis.
DILARANG KERAS:
"integritas", "kerendahan hati", "refleksi diri", "komitmen", "menghayati nilai", "internalisasi",
"konsistensi" (gunakan: "sudah terbiasa" atau "sudah sering"), "disiplin diri" (gunakan: "mau mengikuti aturan"),
"kesadaran moral", "tanggung jawab" (gunakan: "mau membereskan", "mau membantu"),
"regulasi emosi" (gunakan: "mulai bisa tenang"), "mentalitas", "introspeksi"
GUNAKAN: bahasa seperti guru TK berbicara kepada orangtua — konkret, hangat, berbasis kebiasaan sehari-hari.`,

  SD: `JENJANG SD (6-12 tahun) — KOSAKATA SESUAI USIA SEKOLAH DASAR:
DILARANG KERAS:
"integritas" (gunakan: "jujur"), "kerendahan hati" (gunakan: "tidak sombong" atau "mau mendengar"),
"refleksi mendalam", "komitmen jangka panjang", "menghayati nilai-nilai", "internalisasi karakter",
"regulasi emosi" (gunakan: "mulai bisa mengatur perasaan"), "mentalitas"
BOLEH: tanggung jawab, jujur, disiplin, berani, mau membantu, peduli, sabar.`,

  SMP: `JENJANG SMP (12-15 tahun) — KOSAKATA REFLEKTIF TAPI TIDAK TERLALU FILOSOFIS:
DILARANG KERAS:
"integritas" (gunakan: "kejujuran dalam bertindak"), "menghayati nilai secara mendalam",
"komitmen sejati", "kerendahan hati yang hakiki" — terlalu filosofis
BOLEH: refleksi, konsistensi, tanggung jawab, kepedulian, kejujuran, keberanian, empati.`,

  SMA: `JENJANG SMA (15-18 tahun) — KOSAKATA DEWASA DIPERBOLEHKAN:
Narasi boleh menggunakan kosakata yang lebih dewasa dan reflektif.
TETAP HINDARI: frasa filosofis berlebihan, klaim spekulatif tentang masa depan.
BOLEH: integritas, komitmen, refleksi diri, konsistensi, kemandirian, empati.`,
};

// ── System prompt ─────────────────────────────────────────────
function buildSystem(jenjang: Jenjang, narrativeTone: NarrativeTone): string {
  const toneInstr =
    narrativeTone === "islami"
      ? `TONE ISLAMI: Gunakan frasa Islami secara natural dan proporsional: Alhamdulillah, insyaallah, semoga Allah mudahkan, Aamiin ya Rabbal alamin. Jangan berlebihan. Selalu gunakan Ayah Bunda dan ananda.`
      : `TONE GENERAL: Bahasa hangat, netral, inklusif. JANGAN gunakan: Alhamdulillah, insyaallah, Allah, Aamiin, semoga Allah, puji syukur, atau frasa religius apapun. Selalu gunakan Ayah Bunda dan ananda. JANGAN gunakan Bapak/Ibu.`;

  return `Kamu menulis narasi capaian pembelajaran pendidikan Indonesia untuk jenjang ${JENJANG_LABELS[jenjang]} (${JENJANG_KONTEKS[jenjang]}).

WAJIB KBBI/EYD: Ananda (kapital), Ayah Bunda (kapital), insyaallah (satu kata), Alhamdulillah (satu kata). Kalimat diawali kapital, diakhiri titik.

${toneInstr}

DILARANG MUTLAK — kata ini TIDAK BOLEH muncul dalam narasi dalam kondisi apapun:
- "mantap" — DILARANG KERAS, bukan bahasa guru profesional
- "keren", "wow", "top", "josss", "ciamik", "kece" — DILARANG KERAS
- "luar biasa" — DILARANG KERAS, termasuk dalam frasa apapun
- "murid" — DILARANG KERAS, selalu gunakan "ananda"

TONE FAMMI WAJIB:
- Apresiatif: hindari gagal/buruk/lemah/nakal/malas/tidak bisa/tidak mampu
- Skor rendah = ruang tumbuh, bukan kekurangan
- JANGAN gunakan "dilatih pelan-pelan" — ganti: dikuatkan secara bertahap, dibiasakan secara konsisten, diperkuat melalui rutinitas sederhana
- Ayah Bunda sebagai mitra aktif
- Panduan rumah: konkret dan spesifik pada indikator
- JANGAN sebut nama sekolah atau jenjang dalam narasi

LARANGAN FRASA (DILARANG KERAS):

[A] KATA KERJA FORMAL BERLEBIHAN — ganti dengan kata sehari-hari:
- "mendemonstrasikan" → "menunjukkan"
- "mengimplementasikan" → "menerapkan"
- "mengoptimalkan" → "meningkatkan"
- "memanifestasikan" → "menunjukkan"
- "menginternalisasi" → "menghayati" atau "menyerap"
- "mengaktualisasikan" → "menerapkan"
- "mengekspresikan" → "menunjukkan" atau "mengungkapkan"
- "berpartisipasi secara aktif" → "ikut serta" atau "turut"
- "telah berhasil menunjukkan" → cukup "menunjukkan"
- "berhasil membuktikan" → cukup "menunjukkan"
- "mampu membuktikan bahwa" → langsung saja ke fakta

[B] FRASA PUJIAN BOMBASTIS — jangan dipakai sama sekali:
- "luar biasa", "mengagumkan", "membanggakan", "terpuji", "terbaik"
- "sangat mengesankan", "sangat membanggakan", "sungguh membanggakan"
- "capaian gemilang", "prestasi gemilang", "hasil yang gemilang"
- "fondasi yang kokoh", "pondasi yang kuat"
- "semangat yang membara", "tekad yang kuat", "jiwa yang mulia"
- "potensi yang besar", "talenta yang luar biasa"
- "karakter yang matang", "kepribadian yang matang"
- "menjadi teladan", "menjadi contoh", "patut dibanggakan"

[C] FRASA PERTUMBUHAN KLISE — ganti yang sederhana:
- "pertumbuhan yang mengesankan" → "perkembangan yang baik"
- "kemajuan yang pesat" → "kemajuan yang terlihat"
- "perkembangan yang signifikan" → "perkembangan yang nyata"
- "solid dan terukur" → "baik dan mulai konsisten"
- "konsisten dan berkelanjutan" → cukup "konsisten"
- "penguasaan nyaris sempurna" → "capaian yang sangat baik"

[D] KATA AKADEMIK TIDAK PERLU — hindari:
- "kompetensi" → "kemampuan" atau langsung sebut perilakunya
- "rubrik", "KKM", "standar kompetensi" → jangan sebut sama sekali
- "penilaian formatif/sumatif" → jangan sebut
- "proses internalisasi nilai" → "pembiasaan" atau "latihan"
- "secara komprehensif", "secara holistik" → hapus saja
- "optimal", "maksimal" → "baik" atau "sebaik mungkin"
- "pemahaman yang solid" → "pemahaman yang baik" atau "pemahaman yang berkembang"
- "menghadapi X indikator" atau "indikator yang kaya" → framing harus positif dan ringan

[E] PEMBUKA KALIMAT AI-ISH — jangan dipakai:
- "Bagus, Ananda..." atau diawali kata "Bagus"
- "Sangat menggembirakan bahwa..."
- "Patut diapresiasi bahwa..."
- "Tidak dapat dipungkiri bahwa..."
- "Hal ini menunjukkan bahwa..." (sebagai pembuka)
- "Secara keseluruhan, Ananda..."
- "Pada akhirnya..."
- "Dalam perjalanan ini..."
- "Sungguh, Ananda..."
- "Dengan demikian, Ananda..." (sebagai pembuka)
- "Oleh karena itu, Ananda..." (sebagai pembuka)
- "Lebih lanjut, Ananda..."
- "Perlu diketahui bahwa..."
- "Penting untuk dicatat bahwa..."

[F] PENUTUP KALIMAT KLISE — hindari:
- "terus berkarya dengan sepenuh hati"
- "jadikan sebagai bekal sepanjang hayat"
- "menjadi bekal berharga di masa depan"
- "terus tumbuh dan berkembang" (terlalu generik, tanpa arah konkret)
- "semoga terus meningkat" (tanpa langkah konkret)
- "Ananda akan menjadi pribadi yang..." (prediksi, bukan observasi)
- "Kami yakin Ananda akan..." (terlalu percaya diri)

[G] KATA SIFAT DAN ADVERB BERPASANGAN — pilih satu, jangan dua sekaligus:
- "aktif dan antusias", "rajin dan tekun", "baik dan benar", "sabar dan telaten" → pilih salah satu
- "dengan sungguh-sungguh dan konsisten" → pilih salah satu
Pasangan kata sifat adalah tanda tulisan tidak jujur dan terasa seperti daftar.

[H] KATA BENDA ABSTRAK TERLALU LUAS — selalu konkretkan:
- "nilai-nilai positif" → terlalu kabur, sebut konteks perilakunya
- "hal-hal positif" → terlalu kabur
- "perilaku yang baik" tanpa konteks → harus spesifik

[I] KATA KEPASTIAN PALSU — hapus dari kalimat:
- "tentunya Ananda...", "pastinya akan...", "tentu saja Ananda..." → hapus kata kepastiannya
- "sejatinya", "niscaya", "pada hakikatnya" → terlalu filosofis, hapus

[J] KATA PENGHUBUNG FILLER — hindari jika muncul lebih dari sekali per narasi:
- "Selain itu, Ananda...", "Di samping itu, Ananda...", "Adapun Ananda..."
- "dalam hal ini", "terkait hal tersebut", "dalam konteks ini" → hapus, langsung ke poinnya

[K] HEDGING BERLAPIS — pilih satu lapisan, tidak boleh tiga:
- "mulai berusaha untuk menunjukkan" → pilih: "mulai menunjukkan" atau "sudah menunjukkan"
- "tampak mulai mencoba" → pilih satu: "mulai" atau "tampak"
- "sudah mulai terlihat berupaya" → terlalu berlapis
- Skor rendah = ceritakan satu hal nyata yang sudah muncul, bukan "masih berusaha"

[L] MONOTONI STRUKTUR KALIMAT:
- JANGAN awali setiap kalimat dengan "Ananda" berturut-turut lebih dari dua kali
- Variasikan pembuka: mulai dari konteks, aksi, atau ajakan
- Ritme yang sama di setiap kalimat = tanda tulisan AI

[M] ATRIBUSI EMOSI TANPA BUKTI — jangan pakai:
- "dengan antusias", "dengan penuh semangat", "dengan gembira", "dengan bangga" → tulis aksinya saja
- Emosi hanya boleh ditulis jika dideskripsikan dari perilaku yang terlihat, bukan diasumsikan

[N] "MERUPAKAN" YANG BERLEBIHAN:
- "Hal ini merupakan sebuah pencapaian..." → langsung ke faktanya
- "Ananda merupakan pribadi yang..." → tulis ulang jadi kalimat aktif
- "merupakan" boleh dipakai, tapi maksimal sekali per narasi

[O] KARAKTER TIPOGRAFI:
- JANGAN gunakan em-dash (—) di dalam teks narasi. Gunakan koma atau buat kalimat baru.

[P] KATA GANTI ORANG PERTAMA:
- JANGAN campur "aku" dan "saya" dalam satu narasi — pilih satu dan konsisten.
- JANGAN tulis contoh kalimat anak yang ambigu secara sosial atau mengandung konteks sensitif jenis kelamin.

[Q] ABSTRAKSI BERLAPIS — GANTI DENGAN PERILAKU KONKRET:
- JANGAN jadikan sifat/karakter sebagai subjek kalimat:
  - "Ketulusan Ananda sudah menjadi..." → tulis ulang: "Ananda membantu tanpa diminta..."
  - "Kejujuran Ananda terlihat..." → "Ananda menyampaikan dengan apa adanya..."
  Aturan: subjek kalimat harus "Ananda" atau situasi konkret, bukan nama sifatnya.
- JANGAN pakai "sangat" sebagai intensifier:
  - "sangat nyata", "sangat jelas", "sangat konsisten", "sangat baik" → hapus "sangat", pilih kata yang lebih tepat.
- JANGAN klaim "sudah menjadi pola/kebiasaan" tanpa fakta:
  - "sudah menjadi pola yang nyata", "sudah tertanam dalam dirinya" → hapus, tulis perilaku konkretnya.
- JANGAN pakai frase penutup filler tanpa isi:
  - "dalam kehidupan sehari-hari", "dalam aktivitas sehari-hari", "dalam keseharian Ananda" → hapus.

[R] REGISTER BAHASA GURU — BUKAN BAHASA GAUL ATAU IKLAN:
Narasi ini ditulis oleh guru profesional kepada orangtua. Bukan teman, bukan copywriter, bukan motivator.
DILARANG KERAS — kosakata tidak pantas untuk guru:
- "mantap", "keren", "wow", "top", "josss", "ciamik", "kece", "nggak kaleng-kaleng"
- "luar biasa banget", "kereeeen", "amazing"
- "yuk", "ayo dong", "coba deh" (terlalu casual)
- "terbukti", "terbukti nyata" (klaim tanpa data)
- Kata-kata iklan: "terdepan", "terbaik", "unggulan", "berkualitas tinggi"
- Kata sifat bertumpuk tanpa makna: "penuh makna dan berarti", "bermakna dan berkesan"

[S] PRINSIP PENULISAN MANUSIAWI (anti-AI):
- JANGAN inflasi makna: hindari "bermakna mendalam", "menjadi tonggak", "menorehkan jejak", "mencerminkan perjalanan" — langsung ke faktanya.
- JANGAN copula avoidance: "menjadi cerminan dari" → cukup "adalah". "Berfungsi sebagai" → "adalah".
- JANGAN signposting: "Berikut ini akan dijelaskan..." atau "Mari kita lihat..." → langsung ke isinya.
- JANGAN rule of three palsu: jangan paksa tiga poin jika dua sudah cukup. Daftar tiga sifat = tanda AI.
- JANGAN passive voice tanpa pelaku: "Ananda diharapkan dapat..." → "Ayah Bunda bisa mengajak Ananda..."
- VARIASIKAN panjang kalimat: jangan semua kalimat panjang atau semua pendek.

[T] KOSAKATA WAJIB SESUAI JENJANG:
${JENJANG_VOCAB_GUARD[jenjang]}

LARANGAN SITUASI FIKTIF:
- JANGAN mengarang situasi, konteks, media, atau aktivitas yang tidak ada secara eksplisit di teks indikator. Jika indikator tidak menyebut "bermain balok", "saat makan siang", "di halaman sekolah", maka narasi tidak boleh menyebutnya.
- Tulis HANYA kecenderungan perilaku yang bisa disimpulkan dari teks indikator dan rentang skor. Tidak lebih.

LARANGAN DIKSI ANEH:
- "menguat", "terlihat menguat", "semakin menguat" → ganti: "sudah muncul", "mulai terlihat", "lebih konsisten"
- "terwujud", "terealisasi" → ganti: "muncul", "terlihat"
- "terinternalisasi" → ganti: "sudah menjadi kebiasaan"
- Aturan umum: jika kata tersebut tidak akan diucapkan guru saat ngobrol santai dengan orangtua, jangan pakai.

PRINSIP UTAMA: Tulis seperti guru yang benar-benar mengenal anak ini. Kalimat pendek, jujur, spesifik. Satu kalimat = satu fakta atau satu langkah. Hindari kata yang ditulis untuk terkesan, bukan untuk berkomunikasi.`;
}

// ── Sanitasi em-dash ──────────────────────────────────────────
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

  console.error(`[${tool.name}] stop_reason=${res.stop_reason}`);
  console.error(`[${tool.name}] content blocks:`, res.content.map((c) => c.type).join(", "));
  if (!toolBlock) {
    console.error(`[${tool.name}] NO TOOL BLOCK — raw content:`, JSON.stringify(res.content).slice(0, 500));
    throw new Error(`Tool ${tool.name} tidak dipanggil oleh model`);
  }

  const input = toolBlock.input as Record<string, unknown>;
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
            deskripsiBSBBSH: { type: "string", description: "Narasi untuk anak BSB/BSH sesuai pola level" },
            deskripsiMBBB: { type: "string", description: "Narasi untuk anak MB/BB — hangat, berbasis kesiapan" },
            solusiRumah: { type: "string", description: "Rekomendasi konkret di rumah" },
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
            narasiCapaian: { type: "string", description: "Narasi pencapaian optimal — seluruh indikator berkembang sesuai tahap" },
            ideSederhana: { type: "string", description: "Ide mempertahankan capaian di rumah — bukan remedial" },
          },
          required: ["namaElemen", "narasiCapaian", "ideSederhana"],
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

// ── Pola narasi per level ─────────────────────────────────────

function getPolaInstruksi(pattern: LevelPattern): string {
  // D5 dan D6 pakai pola yang lebih mandiri (mirip TKA/TKB)
  if (pattern === "D6") return getPolaInstruksi("TKB");
  if (pattern === "D5") return getPolaInstruksi("TKA");
  // D1–D4 dan KB pakai pola 3 kalimat berbasis observasi
  if (pattern === "D1" || pattern === "D2" || pattern === "D3" || pattern === "D4") {
    return getPolaInstruksi("KB");
  }

  if (pattern === "TKA") {
    return `POLA NARASI WAJIB — TK A:

deskripsiBSBBSH — 2 kalimat:
- Kalimat 1: "Ananda sudah mulai [kata kerja konkret] [detail spesifik]."
- Kalimat 2: dampak positif atau observasi kelanjutan perilaku.

deskripsiMBBB — 2 kalimat WAJIB, urutan tidak boleh dibalik:
- Kalimat 1: "Ananda menunjukkan kesiapan [awal] dengan [hal positif konkret yang sudah terlihat]."
- Kalimat 2: "Ananda masih memerlukan [pendampingan/bimbingan/arahan/dorongan] agar [capaian ke depan]."
LARANGAN: kalimat 1 DILARANG dimulai dengan "Ananda masih..." — wajib dimulai dari kesiapan positif.

solusiRumah — 1 kalimat WAJIB menyebut nama indikator di awal dengan variasi pembuka:
- Variasi 1: "Untuk membantu Ananda [nama indikator], Ayah dan Bunda dapat [aksi spesifik]."
- Variasi 2: "Agar Ananda semakin terbiasa [nama indikator], Ayah dan Bunda bisa [aksi konkret]."
- Variasi 3: "Dalam mendukung kemampuan [nama indikator], Ayah dan Bunda dapat [langkah konkret]."
- Variasi 4: "Sebagai pendampingan untuk [nama indikator], coba ajak Ananda [aksi]."
WAJIB: nama indikator disebut secara eksplisit di awal kalimat. JANGAN hanya sebut domain/elemen.`;
  }

  if (pattern === "TKB") {
    return `POLA NARASI WAJIB — TK B:

deskripsiBSBBSH — 2 kalimat (lebih mandiri dari TK A, gunakan "sudah mampu"):
- Kalimat 1: "Ananda sudah mampu [kata kerja] [detail spesifik]."
- Kalimat 2: observasi kualitas, konsistensi, atau inisiatif.

deskripsiMBBB — 2 kalimat WAJIB:
- Kalimat 1: "Ananda menunjukkan kesiapan dengan [hal positif yang sudah terlihat]."
- Kalimat 2: "Ananda masih memerlukan penguatan agar [capaian ke depan]."
LARANGAN: kalimat 1 DILARANG dimulai "Ananda masih..." — wajib dari kesiapan positif.

solusiRumah — 1 kalimat WAJIB menyebut nama indikator di awal dengan variasi pembuka:
- Variasi 1: "Untuk membantu Ananda [nama indikator], Ayah dan Bunda dapat [aksi konkret]."
- Variasi 2: "Agar Ananda semakin terbiasa [nama indikator], Ayah dan Bunda bisa [aksi]."
- Variasi 3: "Dalam mendukung kemampuan [nama indikator], Ayah dan Bunda dapat [langkah konkret]."
- Variasi 4: "Sebagai pendampingan untuk [nama indikator], coba ajak Ananda [aksi]."
WAJIB: nama indikator disebut secara eksplisit di awal kalimat. JANGAN hanya sebut domain/elemen.`;
  }

  // KB / Daycare
  return `POLA NARASI WAJIB — KB/Daycare (usia lebih muda, 3 kalimat):

deskripsiBSBBSH — 3 kalimat:
- Kalimat 1: "Ananda sudah mulai [aksi] dengan [cara/konteks]." atau "Ananda tampak [perilaku positif] saat [situasi]."
- Kalimat 2: observasi lanjutan — awali dengan variasi seperti "Ananda tampak...", "Ia berusaha...", atau dari situasi.
- Kalimat 3: "Proses ini [mendukung/membangun/membantu] [tujuan perkembangan konkret]."

deskripsiMBBB — 3 kalimat WAJIB:
- Kalimat 1: "Ananda sudah mulai [tanda positif awal] meski [limitasi — gunakan kata 'meski', bukan 'namun']."
- Kalimat 2: "Ananda tampak belajar [melalui.../mengenali...]."
- Kalimat 3: "Proses ini [membuka/mendukung/membangun] fondasi [tujuan perkembangan] berikutnya."
LARANGAN: kalimat 1 DILARANG dimulai dari kekurangan. Wajib ada hal positif yang sudah muncul.

solusiRumah — 2 kalimat, kalimat 1 WAJIB menyebut nama indikator di awal:
- Kalimat 1 variasi: "Untuk membantu Ananda [nama indikator], Ayah dan Bunda dapat [aksi konkret]." / "Agar Ananda semakin terbiasa [nama indikator], coba [aksi]." / "Dalam mendukung [nama indikator], Ayah dan Bunda bisa [langkah]."
- Kalimat 2: satu langkah tambahan atau cara pelaksanaannya yang singkat.
WAJIB: nama indikator disebut secara eksplisit di kalimat pertama. JANGAN hanya sebut domain/elemen.`;
}

// ── Prompt builders ───────────────────────────────────────────

function promptCapaianBatch(
  batch: ICapaianRow[],
  batchNum: number,
  totalBatches: number,
  level: string,
  jenjang: Jenjang,
): string {
  const jenjangLabel = JENJANG_LABELS[jenjang];
  const pattern = getLevelPattern(level);
  const usiaKonteks = LEVEL_USIA_KONTEKS[pattern];
  const vocabGuard = LEVEL_VOCAB_GUARD[pattern];
  const lines = batch
    .map(
      (r, i) =>
        `[${i + 1}] Elemen: ${cleanElemen(r.elemen)} | Indikator: ${r.indikator}`,
    )
    .join("\n");

  return `Buat narasi capaian pembelajaran untuk level ${level} (${jenjangLabel}).
KONTEKS USIA: ${usiaKonteks}
Batch ${batchNum} dari ${totalBatches} — ${batch.length} indikator.

INDIKATOR:
${lines}

KOSAKATA WAJIB UNTUK LEVEL INI:
${vocabGuard}

${getPolaInstruksi(pattern)}

LARANGAN WAJIB:
- DILARANG KERAS menyebut, mengutip, atau memparafrase teks indikator secara harfiah di kolom deskripsiBSBBSH dan deskripsiMBBB. Indikator diberikan sebagai KONTEKS SAJA — tulis perilaku nyata yang mencerminkannya.
- KHUSUS solusiRumah: nama indikator WAJIB disebut eksplisit di awal kalimat pertama (bukan domain/elemen). Ini bukan mengutip indikator — ini membantu Ayah Bunda memahami konteks panduan.
- JANGAN tulis contoh kalimat anak yang ambigu secara sosial (misal: "bersama tetangga atau saudara dari berbagai jenis kelamin") — gunakan konteks sekolah/rumah yang netral.
- JANGAN campur kata ganti orang pertama: pilih SATU saja, "aku" ATAU "saya", konsisten dalam satu narasi.
- JANGAN pakai "pemahaman yang solid" → gunakan "pemahaman yang baik" atau "pemahaman yang berkembang".
- JANGAN pakai "murid" → selalu gunakan "ananda".

Gunakan tool set_capaian_rows. Output TEPAT ${batch.length} rows, urutan WAJIB sama dengan daftar indikator di atas.`;
}

function promptPembuka(
  workbook: IParsedCapaianWorkbook,
  jenjang: Jenjang,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami"
      ? `Tone islami: pembuka boleh pakai "Alhamdulillah". Penutup 65–100 dan 40–64: "Semoga Allah...". Penutup 0–39: "Kami berharap Allah...".`
      : "JANGAN pakai frasa religius apapun.";
  const jenjangLabel = JENJANG_LABELS[jenjang];
  const elemenClean = workbook.elemenList.map(cleanElemen);

  return `Buat NARASI PEMBUKA PENUTUP untuk jenjang ${jenjangLabel}.

ELEMEN:
${elemenClean.map((e, i) => `${i + 1}. ${e}`).join("\n")}

RENTANG SKOR (rentangSkor harus PERSIS): 65–100 | 40–64 | 0–39
${toneNote}

Untuk setiap elemen × rentang (${elemenClean.length} × 3 = ${elemenClean.length * 3} baris):

kalimatPembuka — 2 kalimat, sebut nama elemen, sesuaikan dengan rentang skor:
- 65–100: apresiasi kuat, "tampak", "menunjukkan perkembangan yang baik"
- 40–64: apresiasi + dorongan, "mulai menunjukkan", "dengan bimbingan"
- 0–39: sangat hangat, "masih membutuhkan pendampingan", tidak menstigma, tidak menyebut kekurangan

kalimatPenutup — 1 kalimat harapan atau dorongan WAJIB BERFOKUS PADA ANANDA:
- POLA WAJIB: "Semoga Ananda terus [berkembang/bertumbuh]..." atau "Dengan pendampingan yang konsisten, Ananda akan [perkembangan konkret]..."
- DILARANG KERAS: "Semoga Ayah Bunda diberikan...", "Kami mendoakan Ayah Bunda...", "Semoga Allah memudahkan Ayah Bunda..." — kalimat penutup adalah tentang perkembangan ANAK, bukan tentang orang tua.
- Islami (jika tone islami): "Semoga Ananda terus berkembang, insyaallah." atau "Semoga Allah mudahkan tumbuh kembang Ananda." — tetap fokus pada Ananda.

Urutan output: tiap elemen berurutan, tiap elemen 3 baris (65–100 dulu, lalu 40–64, lalu 0–39).

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

  const pattern = getLevelPattern(level);
  const usiaKonteks = LEVEL_USIA_KONTEKS[pattern];
  const vocabGuard = LEVEL_VOCAB_GUARD[pattern];

  return `Buat NARASI 100% TERCAPAI untuk ${jenjangLabel} level ${level}.
KONTEKS USIA: ${usiaKonteks}
${toneNote}

ELEMEN:
${elemenInfo}

KOSAKATA WAJIB UNTUK LEVEL INI:
${vocabGuard}

Untuk setiap elemen, isi 2 field:

narasiCapaian — 2-3 kalimat, seluruh indikator berkembang optimal:
- Pembuka WAJIB bervariasi antara: "Berdasarkan pengamatan yang dilakukan secara berkelanjutan, seluruh indikator..." / "Hasil pengamatan menunjukkan bahwa seluruh indikator..." / "Berdasarkan hasil pemantauan, seluruh indikator..."
- Menyebut nama elemen dan jumlah indikator.
- Bahasa formal dan afirmatif, tapi tidak bombastis. JANGAN pakai "luar biasa", "gemilang", "fondasi yang kokoh".

ideSederhana — 2 kalimat rekomendasi MEMPERTAHANKAN capaian di rumah (bukan remedial):
- Pembuka WAJIB bervariasi: "Pada tahap perkembangan ini, fokus pendampingan diarahkan pada..." / "Pendampingan pada tahap ini difokuskan pada..." / "Pada tahap ini, pendampingan difokuskan pada..."
- Ayah Bunda sebagai mitra aktif, satu aksi konkret.
- JANGAN pakai "dikuatkan secara bertahap" atau "dilatih pelan-pelan" atau variannya.

LARANGAN:
- JANGAN tulis "pemahaman yang solid" → gunakan "pemahaman yang baik" atau "pemahaman yang berkembang".
- JANGAN campur kata ganti: pilih "aku" atau "saya", konsisten.
- JANGAN pakai "murid" → selalu "ananda".

Gunakan tool set_narasi_100. Output TEPAT ${workbook.elemenList.length} rows.`;
}


function promptNarasi0(
  workbook: IParsedCapaianWorkbook,
  level: string,
  tone: NarrativeTone,
): string {
  const toneNote =
    tone === "islami" ? "Boleh tambah harapan Islami, gunakan 'Kami berharap Allah...'." : "JANGAN pakai frasa religius.";
  const elemenInfo = workbook.elemenList
    .map((e, i) => `${i + 1}. ${cleanElemen(e)} (${workbook.indikatorPerElemen[e] ?? 0} indikator)`)
    .join("\n");

  const patternZ = getLevelPattern(level);
  const usiaKonteksZ = LEVEL_USIA_KONTEKS[patternZ];
  const vocabGuardZ = LEVEL_VOCAB_GUARD[patternZ];

  return `Buat NARASI SEMUA 0% untuk level ${level}.
KONTEKS USIA: ${usiaKonteksZ}
${toneNote}

KOSAKATA WAJIB UNTUK LEVEL INI:
${vocabGuardZ}

ELEMEN:
${elemenInfo}

Untuk setiap elemen, field halHalBaik berisi 2 kalimat hangat dengan POLA WAJIB:

Kalimat 1 — WAJIB dimulai dari KONTEKS SITUASI, bukan langsung "Ananda":
- Pola: "[Konteks situasi/kegiatan], ananda masih berada pada tahap awal [nama domain/elemen]."
- Contoh konteks: "Dalam keseharian di sekolah,", "Selama kegiatan berlangsung,", "Pada aktivitas [elemen] sehari-hari,", "Dalam proses bermain dan belajar,"
- DILARANG: "ananda menghadapi X indikator" — hindari framing beban.
- DILARANG: "indikator yang kaya" — terlalu formal.
- DILARANG: dimulai langsung dengan "Ananda..." — wajib konteks situasi dulu.

Kalimat 2 — harapan pendampingan bertahap:
- Fokus pada satu tanda positif awal yang sudah terlihat, atau harapan pendampingan bersama Ayah Bunda.
- Boleh gunakan pola: "Ananda mulai menunjukkan [tanda awal positif]." atau "Dengan pendampingan Ayah Bunda, ananda akan perlahan [tujuan perkembangan]."

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

    // ── Single-row regenerate mode ────────────────────────────
    if (body.regenRow) {
      const regen = body.regenRow;
      const client = new Anthropic({ apiKey });
      const system = buildSystem(jenjang, narrativeTone);
      const enqueue = makeQueue();

      if (regen.type === "capaian") {
        const singleWorkbook: IParsedCapaianWorkbook = { ...workbook, rows: [regen.row] };
        const [regenerated] = await generateLevelSection(client, system, singleWorkbook, regen.level, jenjang, enqueue);
        return NextResponse.json({ row: regenerated });
      }

      if (regen.type === "pembuka") {
        const indikatorCount = workbook.indikatorPerElemen[regen.elemen] ?? 0;
        const singleWorkbook: IParsedCapaianWorkbook = {
          ...workbook,
          elemenList: [regen.elemen],
          indikatorPerElemen: { [regen.elemen]: indikatorCount },
        };
        const result = await enqueue(() =>
          callWithFallback<PembukaInput>(client, system, promptPembuka(singleWorkbook, jenjang, narrativeTone), toolPembuka, 2048),
        );
        const row = result.rows.find((r) => r.rentangSkor === regen.rentangSkor) ?? result.rows[0];
        return NextResponse.json({ row });
      }

      if (regen.type === "narasi100") {
        const indikatorCount = workbook.indikatorPerElemen[regen.elemen] ?? 0;
        const singleWorkbook: IParsedCapaianWorkbook = {
          ...workbook,
          elemenList: [regen.elemen],
          indikatorPerElemen: { [regen.elemen]: indikatorCount },
        };
        const result = await enqueue(() =>
          callWithFallback<N100Input>(client, system, promptNarasi100(singleWorkbook, regen.level, jenjang, narrativeTone), toolNarasi100, 2048),
        );
        return NextResponse.json({ row: result.rows[0] });
      }

      if (regen.type === "narasi0") {
        const indikatorCount = workbook.indikatorPerElemen[regen.elemen] ?? 0;
        const singleWorkbook: IParsedCapaianWorkbook = {
          ...workbook,
          elemenList: [regen.elemen],
          indikatorPerElemen: { [regen.elemen]: indikatorCount },
        };
        const result = await enqueue(() =>
          callWithFallback<N0Input>(client, system, promptNarasi0(singleWorkbook, regen.level, narrativeTone), toolNarasi0, 2048),
        );
        return NextResponse.json({ row: result.rows[0] });
      }

      return NextResponse.json({ error: "Unknown regenRow type" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });
    const system = buildSystem(jenjang, narrativeTone);

    const enqueue = makeQueue();

    const levelSectionRows: ICapaianOutputRow[][] = [];
    for (const level of levelList) {
      const rows = await generateLevelSection(client, system, workbook, level, jenjang, enqueue);
      levelSectionRows.push(rows);
    }

    const resPembuka = await enqueue(() =>
      callWithFallback<PembukaInput>(client, system, promptPembuka(workbook, jenjang, narrativeTone), toolPembuka, 8192),
    );

    const narasi100SectionRows: ICapaian100Row[][] = [];
    for (const level of levelList) {
      const r = await enqueue(() =>
        callWithFallback<N100Input>(client, system, promptNarasi100(workbook, level, jenjang, narrativeTone), toolNarasi100, 8192),
      );
      narasi100SectionRows.push(
        workbook.elemenList.map((elemen, idx) => ({
          namaElemen: cleanElemen(elemen),
          narasiCapaian: r.rows[idx]?.narasiCapaian ?? "(Belum dihasilkan)",
          ideSederhana: r.rows[idx]?.ideSederhana ?? "(Belum dihasilkan)",
        })),
      );
    }

    const narasi0SectionRows: ICapaian0Row[][] = [];
    for (const level of levelList) {
      const r = await enqueue(() =>
        callWithFallback<N0Input>(client, system, promptNarasi0(workbook, level, narrativeTone), toolNarasi0, 8192),
      );
      narasi0SectionRows.push(
        workbook.elemenList.map((elemen, idx) => ({
          elemen: cleanElemen(elemen),
          total: `${workbook.indikatorPerElemen[elemen] ?? 0} indikator`,
          masih: "Masih perlu penguatan",
          halHalBaik: r.rows[idx]?.halHalBaik ?? "(Belum dihasilkan)",
        })),
      );
    }

    // ── Assemble output ───────────────────────────────────────

    const levelSections: ICapaianLevelSection[] = levelList.map((level, idx) => ({
      levelName: level === "Daycare" ? "CAPAIAN DAYCARE" : `CAPAIAN ${level.toUpperCase()}`,
      level,
      rows: levelSectionRows[idx],
    }));

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

    const narasi100Sections: ICapaian100LevelSection[] = levelList.map((level, idx) => ({
      levelName: `NARASI 100% ${level.toUpperCase()}`,
      level,
      rows: narasi100SectionRows[idx],
    }));

    const narasi0Sections: ICapaian0LevelSection[] = levelList.map((level, idx) => ({
      levelName: `NARASI 0% ${level.toUpperCase()}`,
      level,
      rows: narasi0SectionRows[idx],
    }));

    const previewData: ICapaianPreviewData = {
      levelSections,
      narasiPembukaData,
      narasi100Sections,
      narasi0Sections,
    };

    const jenjangLabel = JENJANG_LABELS[jenjang];
    const sekolahSlug = (namaSekolah || "Fammi").replace(/\s+/g, "_");
    const levelSlug = levelList.join("-").replace(/\s+/g, "");
    const namaFile = `Narasi_Capaian_${sekolahSlug}_${jenjangLabel}_${levelSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const _debug = {
      levelRowCounts: levelSectionRows.map((rows, i) => ({
        level: levelList[i],
        pattern: getLevelPattern(levelList[i]),
        total: rows.length,
        filledBSB: rows.filter((r) => r.deskripsiBSBBSH && r.deskripsiBSBBSH !== "(Belum dihasilkan)").length,
        sampleBSB: rows[0]?.deskripsiBSBBSH?.slice(0, 80) ?? "EMPTY",
      })),
      pembuka: { total: resPembuka.rows.length },
      narasi100: narasi100Sections.map((s) => ({ level: s.level, rows: s.rows.length })),
      narasi0: narasi0Sections.map((s) => ({ level: s.level, rows: s.rows.length })),
    };
    console.error("[generate-capaian] _debug:", JSON.stringify(_debug, null, 2));

    return NextResponse.json({ data: previewData, namaFile, _debug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[narasi/generate-capaian]", msg);
    return NextResponse.json({ error: `Gagal generate: ${msg}` }, { status: 500 });
  }
}
