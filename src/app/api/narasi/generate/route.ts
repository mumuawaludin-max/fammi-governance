import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300; // 5 menit — generate narasi karakter butuh banyak API calls berurutan
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

interface TargetRow {
  karakter: string;
  rentangSkorIndikator: string;
  type: "karakter" | "keselarasan";
}

interface GenerateRequest {
  namaSekolah: string;
  jenjang: Jenjang;
  levelList: string[];
  narrativeTone?: NarrativeTone;
  workbook: IParsedWorkbook;
  targetRows?: TargetRow[]; // fine-grained: karakter × tier spesifik
}


const JENJANG_KONTEKS: Record<Jenjang, string> = {
  DAYCARE: "usia 1-3 tahun, pembiasaan lewat rutinitas konkret dan bermain, bahasa sangat lembut dan sederhana",
  TK:      "usia 4-6 tahun, eksplorasi bermakna, pembiasaan harian, bahasa hangat",
  SD:      "usia 6-12 tahun, membangun kebiasaan dan tanggung jawab, bahasa lugas hangat",
  SMP:     "usia 12-15 tahun, refleksi diri, ruang dialog, bahasa reflektif",
  SMA:     "usia 15-18 tahun, komitmen pribadi, kemandirian, bahasa dewasa",
};

// 7 set bridging × 6 tier — setiap karakter dapat set uniknya sendiri
// Format: "{k}" diganti nama karakter saat runtime
const KARAKTER_BRIDGING_POOL: string[][] = [
  [ // Set 0
    "Dalam karakter {k}, Ananda",
    "Terkait karakter {k}, Ananda",
    "Pada karakter {k}, Ananda",
    "Mencermati karakter {k}, Ananda",
    "Untuk karakter {k}, Ananda",
    "Karakter {k} pada Ananda",
  ],
  [ // Set 1
    "Berbicara tentang karakter {k}, Ananda",
    "Dalam hal {k}, Ananda",
    "Melihat karakter {k}, Ananda",
    "Soal karakter {k}, Ananda",
    "Dari sisi {k}, Ananda",
    "Karakter {k} yang Ananda tunjukkan",
  ],
  [ // Set 2
    "Memperhatikan karakter {k}, Ananda",
    "Dari pengamatan pada karakter {k}, Ananda",
    "Terkait perkembangan {k}, Ananda",
    "Pada perkembangan karakter {k}, Ananda",
    "Menyimak karakter {k} pada Ananda",
    "Terkait dengan {k}, Ananda",
  ],
  [ // Set 3
    "Mengamati karakter {k} pada Ananda",
    "Pada perkembangan {k}, Ananda",
    "Dalam pengamatan karakter {k}, Ananda",
    "Pada aspek {k}, Ananda",
    "Memerhatikan karakter {k}, Ananda",
    "Pada capaian {k}, Ananda",
  ],
  [ // Set 4
    "Dari sisi pengamatan karakter {k}, Ananda",
    "Seputar karakter {k}, Ananda",
    "Melihat perkembangan {k} pada Ananda",
    "Mencermati perkembangan {k}, Ananda",
    "Dari pantauan karakter {k}, Ananda",
    "Dalam karakter {k} ini, Ananda",
  ],
  [ // Set 5
    "Ananda, dalam karakter {k},",
    "Dari catatan pada karakter {k}, Ananda",
    "Dalam aspek karakter {k}, Ananda",
    "Dari catatan karakter {k}, Ananda",
    "Dalam catatan karakter {k}, Ananda",
    "Memerhatikan perkembangan {k}, Ananda",
  ],
  [ // Set 6
    "Memandang karakter {k} pada Ananda",
    "Dari pengamatan karakter {k}, Ananda",
    "Pada perkembangan karakter {k}, Ananda",
    "Dalam pengamatan pada karakter {k}, Ananda",
    "Menyoroti karakter {k}, Ananda",
    "Melihat catatan karakter {k}, Ananda",
  ],
];

const JENJANG_VOCAB_GUARD: Record<Jenjang, string> = {
  DAYCARE: `JENJANG DAYCARE (1-3 tahun) — KOSAKATA WAJIB SANGAT SEDERHANA:
Anak usia ini belum memahami konsep abstrak apapun. Narasi harus berbasis tindakan yang bisa dilihat langsung.
DILARANG KERAS — kata-kata ini terlalu berat untuk usia 1-3 tahun:
"integritas", "kerendahan hati", "refleksi", "konsistensi", "komitmen", "menghayati", "internalisasi",
"tanggung jawab", "disiplin diri", "kesadaran diri", "nilai-nilai", "karakter", "empati", "regulasi emosi",
"mandiri" (gunakan: "mau melakukan sendiri"), "berani" (gunakan: "mau mencoba")
GUNAKAN SEBAGAI GANTINYA: kata kerja konkret — mau, mencoba, ikut, menolak, memeluk, menyentuh, memperhatikan, menunggu.`,

  TK: `JENJANG TK (4-6 tahun) — KOSAKATA WAJIB SEDERHANA DAN KONKRET:
Anak usia ini berpikir konkret, belum bisa memahami konsep abstrak atau moral filosofis.
DILARANG KERAS — kata-kata ini terlalu berat untuk usia 4-6 tahun:
"integritas", "kerendahan hati", "refleksi diri", "komitmen", "menghayati nilai", "internalisasi",
"konsistensi" (gunakan: "sudah terbiasa" atau "sudah sering"), "disiplin diri" (gunakan: "mau mengikuti aturan"),
"kesadaran moral", "tanggung jawab" (gunakan: "mau membereskan", "mau membantu"),
"regulasi emosi" (gunakan: "mulai bisa tenang"), "mentalitas", "intropeksi"
GUNAKAN SEBAGAI GANTINYA: bahasa seperti guru TK berbicara kepada orangtua — konkret, hangat, berbasis kebiasaan sehari-hari.`,

  SD: `JENJANG SD (6-12 tahun) — KOSAKATA SESUAI USIA SEKOLAH DASAR:
DILARANG KERAS — terlalu berat untuk usia 6-12 tahun:
"integritas" (gunakan: "kejujuran" atau "bersikap jujur"), "kerendahan hati" (gunakan: "tidak sombong" atau "mau mendengar"),
"refleksi mendalam", "komitmen jangka panjang", "menghayati nilai-nilai", "internalisasi karakter",
"regulasi emosi" (gunakan: "mulai bisa mengatur perasaan"), "mentalitas"
BOLEH DIGUNAKAN: tanggung jawab, jujur, disiplin, berani, mau membantu, peduli, sabar.`,

  SMP: `JENJANG SMP (12-15 tahun) — KOSAKATA REFLEKTIF TAPI TIDAK TERLALU FILOSOFIS:
DILARANG KERAS:
"integritas" (gunakan: "kejujuran dalam bertindak"), "menghayati nilai secara mendalam",
"komitmen sejati", "kerendahan hati yang hakiki" — terlalu filosofis
BOLEH DIGUNAKAN: refleksi, konsistensi, tanggung jawab, kepedulian, kejujuran, keberanian, empati.`,

  SMA: `JENJANG SMA (15-18 tahun) — KOSAKATA DEWASA DIPERBOLEHKAN:
Narasi boleh menggunakan kosakata yang lebih dewasa dan reflektif.
TETAP HINDARI: frasa filosofis berlebihan, klaim spekulatif tentang masa depan.
BOLEH DIGUNAKAN: integritas, komitmen, refleksi diri, konsistensi, kemandirian, empati.`,
};

// ── System prompt ─────────────────────────────────────────────

function buildSystem(jenjang: Jenjang, narrativeTone: NarrativeTone = "islami"): string {
  const toneInstr =
    narrativeTone === "islami"
      ? `TONE ISLAMI: Gunakan frasa Islami secara natural dan proporsional: Alhamdulillah, insyaallah, semoga Allah mudahkan, Aamiin ya Rabbal alamin. Jangan berlebihan di setiap kalimat. Selalu gunakan sapaan Ayah Bunda dan ananda.
- Setiap kalimat yang mengandung doa atau harapan WAJIB diakhiri atau disertai "insyaallah". Jangan tulis harapan tanpa insyaallah.
- Narasi Umum (Catatan Umum Perkembangan) WAJIB diawali dengan "Assalamu'alaikum wr. wb. Ayah Bunda," (persis seperti ini, titik setelah wb. lalu Ayah Bunda lalu koma) sebelum kalimat pertama narasi.`
      : `TONE GENERAL: Gunakan bahasa hangat, netral, inklusif, apresiatif. JANGAN gunakan: Alhamdulillah, insyaallah, Allah, Aamiin, semoga Allah, puji syukur, atau frasa religius apapun. Gunakan pembuka seperti "Ananda menunjukkan...", "Berdasarkan pengamatan...". Selalu gunakan sapaan Ayah Bunda dan ananda. JANGAN gunakan Bapak/Ibu.`;

  return `Kamu menulis narasi rapor karakter pendidikan Indonesia untuk jenjang ${JENJANG_LABELS[jenjang]} (${JENJANG_KONTEKS[jenjang]}).

WAJIB KBBI/EYD:
- Ananda (kapital, sapaan)
- Ayah Bunda (kapital, sapaan)
- istikamah (bukan istiqomah)
- insyaallah (satu kata)
- Alhamdulillah (satu kata)
- Kalimat diawali kapital, diakhiri titik

DILARANG MUTLAK — kata ini TIDAK BOLEH muncul dalam narasi dalam kondisi apapun:
- "mantap" — DILARANG KERAS, bukan bahasa guru profesional
- "keren", "wow", "top", "josss", "ciamik", "kece" — sama, DILARANG KERAS
- "luar biasa" — DILARANG KERAS, termasuk dalam frasa apapun

${toneInstr}

WAJIB TONE FAMMI:
- Apresiatif: hindari gagal/buruk/lemah/nakal/malas
- Sapaan Ananda dan Ayah Bunda
- Skor rendah = ruang tumbuh, bukan kekurangan
- Panduan orangtua: 3 langkah konkret
- JANGAN sebut nama sekolah atau jenjang dalam narasi

LARANGAN FRASA (DILARANG KERAS):

[A] KATA KERJA FORMAL BERLEBIHAN — ganti dengan kata sehari-hari:
- "mendemonstrasikan" → "menunjukkan"
- "mengimplementasikan" → "menerapkan"
- "mengoptimalkan" → "meningkatkan"
- "memanifestasikan" → "menunjukkan"
- "menginternalisasi" → DILARANG, jangan pakai dalam bentuk apapun
- "menghayati nilai" → DILARANG, terlalu abstrak. Tulis perilakunya langsung.
- "mengaktualisasikan" → "menerapkan"
- "mengekspresikan" → "menunjukkan" atau "mengungkapkan"
- "berpartisipasi secara aktif" → "ikut serta" atau "turut"
- "telah berhasil menunjukkan" → cukup "menunjukkan"
- "berhasil membuktikan" → cukup "menunjukkan"
- "mampu membuktikan bahwa" → langsung saja ke fakta

[B] FRASA PUJIAN BOMBASTIS — jangan dipakai sama sekali:
- "luar biasa" (berdiri sendiri maupun dalam frasa)
- "mengesankan", "mengagumkan", "membanggakan", "terpuji", "terbaik"
- "sangat mengesankan", "sangat membanggakan", "sungguh membanggakan"
- "kematangan", "kedewasaan" (sebagai pujian: "menunjukkan kematangan yang...")
- "kedalaman perilaku", "kedalaman karakter"
- "dedikasi Ananda", "dedikasi yang tinggi"
- "capaian gemilang", "prestasi gemilang", "hasil yang gemilang"
- "fondasi yang kokoh", "pondasi yang kuat"
- "semangat yang membara", "tekad yang kuat", "jiwa yang mulia"
- "potensi yang besar", "talenta yang luar biasa"
- "karakter yang matang", "kepribadian yang matang"
- "menjadi teladan", "menjadi contoh", "patut dibanggakan"
- "kekuatan yang indah sepanjang hidup"
- "Kami sangat puas", "Kami sangat bangga" — guru tidak mengekspresikan emosi personal seperti ini

[C] FRASA PERTUMBUHAN KLISE — ganti yang sederhana:
- "pertumbuhan yang mengesankan" → "perkembangan yang baik"
- "kemajuan yang pesat" → "kemajuan yang terlihat"
- "perkembangan yang signifikan" → "perkembangan yang nyata"
- "solid dan terukur" → "baik dan mulai konsisten"
- "konsisten dan berkelanjutan" → cukup "konsisten" atau "terus-menerus"
- "menguasai X indikator secara solid" → "mencapai X indikator"
- "penguasaan nyaris sempurna" → "capaian indikator yang sangat baik"

[D] KATA AKADEMIK TIDAK PERLU — hindari:
- "aspek pembelajaran" → "karakter"
- "indikator pembelajaran" → "indikator"
- "proses internalisasi nilai" → "pembiasaan" atau "latihan"
- "pengembangan karakter yang holistik" → hapus, cukup sebutkan karakternya
- "secara komprehensif", "secara holistik" → hapus saja
- "dalam konteks pembelajaran" → hapus saja
- "dimensi karakter", "domain karakter" → cukup "karakter"
- "optimal", "maksimal" → "baik" atau "sebaik mungkin"
- "dalam rangka pengembangan karakter" → hapus saja
- "sebagai bagian dari proses pembelajaran" → hapus saja

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
- "Tidak lupa kami sampaikan bahwa..."

[F] PENUTUP KALIMAT KLISE — hindari:
- "terus berkarya dengan sepenuh hati"
- "jadikan sebagai bekal sepanjang hayat"
- "menjadi bekal berharga di masa depan"
- "terus tumbuh dan berkembang" (terlalu generik, tanpa arah konkret)
- "semoga terus meningkat" (tanpa langkah konkret)
- "semoga menjadi insan yang mulia" (terlalu berat untuk narasi karakter)
- "Ananda akan menjadi pribadi yang..." (prediksi, bukan observasi)
- "Kami yakin Ananda akan..." (terlalu percaya diri)
- "Ananda berpotensi menjadi..." (spekulasi)
- "menjadi motivasi bagi teman-teman" (klaim tanpa dasar pengamatan)
- "sosok yang diteladani", "sosok yang diteladani dalam komunitas" → termasuk di [B]
- "komunitas" dalam konteks rapor anak — terlalu formal, ganti dengan "teman-teman" atau hapus

[G] KATA SIFAT DAN ADVERB BERPASANGAN — pilih satu, jangan dua sekaligus:
- "tulus dan ikhlas" → pilih salah satu
- "aktif dan antusias" → pilih salah satu
- "rajin dan tekun" → pilih salah satu
- "baik dan benar" → pilih salah satu
- "sabar dan telaten" → pilih salah satu
- "secara aktif dan antusias" → hapus salah satu
- "dengan penuh kesadaran dan keikhlasan" → sederhanakan
- "dengan sungguh-sungguh dan konsisten" → pilih salah satu
Pasangan kata sifat seperti ini adalah tanda tulisan tidak jujur dan terasa seperti daftar.

[H] KATA BENDA ABSTRAK TERLALU LUAS — selalu konkretkan:
- "nilai-nilai luhur" → sebutkan karakternya secara spesifik
- "nilai-nilai positif" → terlalu kabur, sebut konteks perilakunya
- "hal-hal positif" → terlalu kabur
- "perilaku yang baik" tanpa konteks → harus spesifik situasinya
- "sikap yang terpuji" → sebutkan sikap apa konkretnya

[I] KATA KEPASTIAN PALSU — hapus dari kalimat:
- "tentunya Ananda..." → hapus "tentunya"
- "pastinya akan..." → hapus "pastinya"
- "tentu saja Ananda..." → hapus "tentu saja"
- "sejatinya", "niscaya", "pada hakikatnya" → terlalu filosofis, hapus
- "sudah tentu" → hapus

[J] KATA PENGHUBUNG FILLER — hindari jika muncul lebih dari sekali per narasi:
- "Selain itu, Ananda..." → pakai maksimal sekali, kalau bisa hindari
- "Di samping itu, Ananda..."
- "Adapun Ananda..."
- "Sementara itu, Ananda..."
- "dalam hal ini" → hapus, langsung ke poinnya
- "terkait hal tersebut" → hapus
- "dalam konteks ini" → hapus

[K] HEDGING BERLAPIS — pilih satu lapisan, tidak boleh tiga:
- "mulai berusaha untuk menunjukkan" → terlalu banyak keraguan, pilih: "mulai menunjukkan" atau "sudah menunjukkan"
- "tampak mulai mencoba" → pilih satu: "mulai" atau "tampak"
- "sudah mulai terlihat berupaya" → terlalu berlapis
- "berupaya" dan "berusaha" sebagai pelarian dari fakta → tulis apa yang konkret terjadi, meski kecil
- Skor rendah = ceritakan satu hal nyata yang sudah muncul, bukan "masih berusaha"

[L] MONOTONI STRUKTUR KALIMAT:
- JANGAN awali setiap kalimat dengan "Ananda" berturut-turut lebih dari dua kali
- Variasikan pembuka: mulai dari konteks, aksi, situasi, atau ajakan
- JANGAN buat 6 tier narasi yang hanya beda satu kata — setiap tier harus punya sudut pandang berbeda
- Ritme yang sama di setiap kalimat = tanda tulisan AI

[M] ATRIBUSI EMOSI TANPA BUKTI — jangan pakai:
- "dengan antusias" → bagaimana tahu? Tulis aksinya saja
- "dengan penuh semangat" → sama, tulis aksinya
- "dengan gembira" → sama
- "dengan bangga" → sama
Emosi hanya boleh ditulis jika dideskripsikan dari perilaku yang terlihat, bukan diasumsikan.

[N] "MERUPAKAN" YANG BERLEBIHAN:
- "Hal ini merupakan sebuah pencapaian..." → langsung ke faktanya
- "Ananda merupakan pribadi yang..." → tulis ulang jadi kalimat aktif
- "merupakan" boleh dipakai, tapi maksimal sekali per narasi

[O] JARGON PENDIDIKAN YANG BOCOR KE NARASI ORANGTUA:
- "capaian belajar" → cukup "capaian"
- "kompetensi" → "kemampuan" atau langsung sebut perilakunya
- "rubrik", "KKM", "standar kompetensi" → jangan sebut sama sekali
- "penilaian formatif/sumatif" → jangan sebut

[P] KARAKTER TIPOGRAFI:
- JANGAN gunakan em-dash (—) dalam teks narasi. Gunakan koma atau buat kalimat baru.

[Q] ABSTRAKSI BERLAPIS — GANTI DENGAN PERILAKU KONKRET:
Pola ini adalah tanda paling khas tulisan AI: menggantikan perilaku nyata dengan klaim abstrak berlapis.

- JANGAN jadikan sifat/karakter sebagai subjek kalimat:
  - "Ketulusan Ananda sudah menjadi..." → tulis ulang: "Ananda membantu tanpa diminta..."
  - "Kejujuran Ananda terlihat..." → "Ananda menyampaikan dengan apa adanya..."
  - "Semangat Ananda sudah..." → "Ananda terus mencoba meski..."
  Aturan: subjek kalimat harus "Ananda" atau situasi konkret, bukan nama sifatnya.

- JANGAN pakai "sangat" sebagai intensifier:
  - "sangat nyata", "sangat jelas", "sangat konsisten", "sangat baik" → hapus "sangat", pilih kata yang lebih tepat atau tulis ulang kalimatnya.

- JANGAN klaim "sudah menjadi pola/kebiasaan" tanpa fakta:
  - "sudah menjadi pola yang nyata" → tulis perilaku konkret yang mendukung klaim itu, atau hapus klaimnya.
  - "sudah tertanam dalam dirinya" → terlalu filosofis, hapus.
  - "sudah menjadi bagian dari dirinya" → sama, hapus.

- JANGAN pakai frase penutup filler tanpa isi:
  - "dalam kehidupan sehari-hari" → hapus.
  - "dalam aktivitas sehari-hari" → hapus.
  - "dalam keseharian Ananda" → hapus, kecuali ada detail konkret setelahnya.

LARANGAN SITUASI FIKTIF:
- JANGAN mengarang situasi, konteks, media, atau aktivitas yang tidak ada di teks indikator. Jika indikator tidak menyebut "bermain balok", "di kelas", "saat makan siang", maka narasi tidak boleh menyebutnya.
- Tulis HANYA kecenderungan perilaku dan pola yang bisa disimpulkan dari indikator dan rentang skor. Tidak lebih.

LARANGAN DIKSI ANEH:
- "menguat", "terlihat menguat", "semakin menguat" → ganti: "sudah muncul", "mulai terlihat", "lebih konsisten"
- "terwujud", "terealisasi" → ganti: "muncul", "terlihat"
- "terinternalisasi" → ganti: "sudah menjadi kebiasaan"
- Aturan umum: jika kata tersebut tidak akan diucapkan guru saat ngobrol santai dengan orangtua, jangan pakai.

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
- JANGAN inflasi makna: hindari kata seperti "bermakna mendalam", "menjadi tonggak", "menorehkan jejak", "mencerminkan perjalanan" — langsung ke faktanya.
- JANGAN copula avoidance: "menjadi cerminan dari" → cukup "adalah". "Berfungsi sebagai" → "adalah".
- JANGAN signposting: "Berikut ini akan dijelaskan..." atau "Mari kita lihat..." → langsung ke isinya.
- JANGAN rule of three palsu: jangan paksa tiga poin jika dua sudah cukup. "jujur, disiplin, dan bertanggung jawab" sebagai daftar = tanda AI.
- JANGAN passive voice tanpa pelaku: "Ananda diharapkan dapat..." → "Ayah Bunda bisa mengajak Ananda..."
- JANGAN persuasive tropes: "yang terpenting adalah", "pada intinya", "yang sesungguhnya perlu dipahami" → hapus, tulis poinnya langsung.
- VARIASIKAN panjang kalimat: jangan semua kalimat panjang atau semua pendek. Satu pendek, satu sedang, variasi.

[T] KOSAKATA WAJIB SESUAI JENJANG:
${JENJANG_VOCAB_GUARD[jenjang as Jenjang]}

PRINSIP UTAMA: Tulis seperti guru yang benar-benar mengenal anak ini. Kalimat pendek, jujur, spesifik. Satu kalimat = satu fakta atau satu langkah. Hindari kata yang ditulis untuk terkesan, bukan untuk berkomunikasi.

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


function promptUmum(workbook: IParsedWorkbook, jenjang: Jenjang): string {
  const karakterList = workbook.karakterList.slice(0, 7);
  const nkStr = karakterList.map((_, i) => `{NK${i + 1}}`).join(" ");
  const nkKeterangan = karakterList.map((k, i) => `{NK${i + 1}} = ringkasan karakter ${k}`).join("\n");
  const tierLabels = NARASI_UMUM_TIERS.map((t) => t.hasilPredikat).join(", ");

  // Reinforcement kosakata per jenjang — langsung di prompt, bukan hanya di system
  const jenjangReinforcement: Record<Jenjang, string> = {
    DAYCARE: `PERINGATAN JENJANG DAYCARE: Anak usia 1-3 tahun. DILARANG KERAS: "konsistensi", "komitmen", "integritas", "kematangan", "dedikasi", "menghayati nilai", "karakter yang berkembang", "kedalaman". Pakai kata konkret: mau, mencoba, ikut, sudah mulai. Kalimat pendek.`,
    TK:      `PERINGATAN JENJANG TK: Anak usia 4-6 tahun. DILARANG KERAS: "konsistensi" (ganti: "sudah sering" atau "sudah terbiasa"), "komitmen", "integritas", "kematangan", "dedikasi", "menghayati nilai", "kedalaman perilaku", "tanggung jawab" (ganti: "mau membantu" atau "mau membereskan"). Kalimat harus konkret dan hangat seperti percakapan guru TK ke orangtua.`,
    SD:      `PERINGATAN JENJANG SD: Anak usia 6-12 tahun. DILARANG KERAS: "integritas" (ganti: "jujur"), "kerendahan hati", "menghayati nilai", "dedikasi", "kematangan yang mengesankan", "kedalaman karakter". Boleh: tanggung jawab, jujur, disiplin, peduli.`,
    SMP:     `PERINGATAN JENJANG SMP: DILARANG: "integritas" (ganti: "kejujuran dalam bertindak"), "menghayati nilai secara mendalam", "kerendahan hati yang hakiki", "dedikasi". Boleh: refleksi, tanggung jawab, konsistensi, kepedulian.`,
    SMA:     `PERINGATAN JENJANG SMA: Tetap hindari frasa filosofis berlebihan. Boleh gunakan: integritas, komitmen, refleksi, konsistensi.`,
  };

  return `Buat 6 baris Catatan Umum Perkembangan, satu per predikat: ${tierLabels}

${jenjangReinforcement[jenjang]}

Field hasilPredikat harus persis sama dengan label tier di atas.
Wajib gunakan placeholder: {nama_panggilan}, {total_indikator}, dan kode NK berikut: ${nkStr}

Keterangan kode NK (WAJIB sesuai urutan):
${nkKeterangan}

ATURAN PLACEHOLDER:
- Sebelum {nama_panggilan} WAJIB ada kata "Ananda " (dengan spasi setelahnya), contoh: "Ananda {nama_panggilan}"
- WAJIB ada spasi di antara setiap kata dan placeholder. Jangan tempel placeholder langsung ke kata sebelumnya tanpa spasi.
- Placeholder TIDAK BOLEH diubah bentuknya.

ATURAN PENEMPATAN KODE NK:
- Tulis kode NK TANPA awalan "NK:" — langsung tulis {NK1} {NK2} bukan "NK: {NK1} {NK2}"
- Gunakan kata penghubung/bridging sebelum kode NK untuk mengantar pembaca ke ringkasan per karakter.
  Contoh bridging: "Berikut gambaran singkat per karakter: {NK1} {NK2} {NK3}" atau
  "Secara rinci, {NK1} {NK2} {NK3}" atau frasa transisi natural lainnya.
- Pisahkan setiap kode NK dengan spasi (bukan koma), tanpa titik di antara kode.
- WAJIB ada spasi sebelum dan sesudah setiap kode NK.
- DILARANG KERAS memberi tanda baca apapun (titik, koma, titik koma, tanda seru) SETELAH kode NK terakhir. Setiap kode NK sudah mengandung kalimat utuh yang berakhir titik — tanda baca tambahan setelahnya akan menggandakan titik.
  BENAR  : "...karakter: {NK1} {NK2} {NK3} Kalimat penutup."
  SALAH  : "...karakter: {NK1} {NK2} {NK3}. Kalimat penutup."
  SALAH  : "...karakter: {NK1} {NK2} {NK3}, Kalimat penutup."

KALIMAT PENUTUP WAJIB:
- Setiap narasi harus diakhiri 1 kalimat penutup setelah blok NK.
- Kalimat penutup harus spesifik sesuai tier predikat — BERBEDA untuk setiap tier, tidak boleh generik atau klise.
- JANGAN pakai: "terus tumbuh dan berkembang", "semoga terus meningkat", "menjadi bekal berharga", atau frasa penutup serupa yang bisa dipakai di tier mana pun.

Setiap narasi minimal 4 kalimat. Gunakan tool set_narasi_umum dengan field catatanUmumPerkembangan.`;
}

function promptKarakterSingle(
  karakter: string,
  workbook: IParsedWorkbook,
  karakterIndex: number,
  jenjang: Jenjang,
  tierIndices: number[] = NARASI_KARAKTER_TIERS.map((_, i) => i),
): string {
  const map: Record<string, string[]> = {};
  for (const row of workbook.indikatorGuru) {
    if (!row.karakter) continue;
    if (!map[row.karakter]) map[row.karakter] = [];
    const ind = row.indikatorPencapaian || "";
    if (ind && !map[row.karakter].includes(ind)) map[row.karakter].push(ind);
  }
  const inds = (map[karakter] ?? []).join("; ") || "indikator umum";
  const count = tierIndices.length;
  const tierLines = tierIndices.map((ti, pos) => `${pos + 1}. ${NARASI_KARAKTER_TIERS[ti].rentang}`).join("\n");

  const bridgingSet = KARAKTER_BRIDGING_POOL[karakterIndex % KARAKTER_BRIDGING_POOL.length];
  const bridgingLines = tierIndices.map((ti, pos) =>
    `  Tier ${pos + 1} (${NARASI_KARAKTER_TIERS[ti].rentang}): "${bridgingSet[ti].replace("{k}", karakter)}"`
  ).join("\n");

  const jenjangKarReinforcement: Record<Jenjang, string> = {
    DAYCARE: `PERINGATAN JENJANG DAYCARE: DILARANG KERAS: "konsistensi", "komitmen", "integritas", "kematangan", "dedikasi", "menghayati", "kedalaman". Gunakan kata konkret dan sederhana.`,
    TK:      `PERINGATAN JENJANG TK: DILARANG KERAS: "konsistensi" (ganti: "sudah sering"/"sudah terbiasa"), "komitmen", "integritas", "kematangan", "dedikasi", "menghayati nilai", "kedalaman", "tanggung jawab" tanpa konteks konkret.`,
    SD:      `PERINGATAN JENJANG SD: DILARANG KERAS: "integritas", "kerendahan hati", "menghayati nilai", "dedikasi", "kematangan", "kedalaman karakter".`,
    SMP:     `PERINGATAN JENJANG SMP: DILARANG: frasa filosofis berat, "menghayati nilai secara mendalam", "kerendahan hati yang hakiki".`,
    SMA:     `PERINGATAN JENJANG SMA: Hindari frasa filosofis berlebihan meski kosakata dewasa diizinkan.`,
  };

  return `Buat TEPAT ${count} narasi karakter "${karakter}" — satu per rentang skor, urutan wajib:
${tierLines}

${jenjangKarReinforcement[jenjang]}

SUMBER DATA: Narasi ini HANYA berdasarkan Indikator Guru di bawah. Tidak ada sumber lain.
KONTEKS INDIKATOR ${karakter} — hanya untuk memahami karakternya, DILARANG KERAS disebut, dikutip, atau diparafrasekan langsung di narasi: ${inds}

MENGAPA INDIKATOR TIDAK BOLEH DISEBUT LANGSUNG:
Skor 80% tidak berarti semua indikator merata. Bisa jadi 4 dari 5 indikator sudah konsisten, tapi satu belum muncul. Jika narasi menyebut indikator spesifik, bisa tidak akurat untuk sebagian anak. Narasi ini dipakai untuk semua anak di rentang skor tersebut — tulis gambaran pola dan kecenderungan perilaku yang mewakili rentang ini secara umum.

ATURAN WAJIB:
- Output TEPAT ${count} rows, urutan PERSIS seperti daftar di atas.
- Field rentangSkorIndikator harus PERSIS sama dengan label di atas (salin bulat-bulat).
- Narasi ini MURNI sudut pandang pengamatan sekolah. JANGAN sebut "Ayah Bunda" di narasi ini — sapaan orangtua hanya untuk Narasi Keselarasan.
- WAJIB gunakan PERSIS bridging pembuka berikut untuk setiap tier — tidak boleh diganti:
${bridgingLines}
- DILARANG KERAS menyebut, mengutip, atau memparafrase teks indikator secara harfiah. Tulis perilaku nyata yang mencerminkan karakter tersebut, bukan mendefinisikan atau merujuk indikatornya.
- Gambarkan pola perilaku dan kecenderungan yang mencerminkan rentang skor tersebut.
- Skor rendah = ruang tumbuh, ceritakan satu hal nyata yang sudah mulai terlihat.
- 3-4 kalimat per narasi, diakhiri titik.
- DILARANG KERAS kata gaul/slang: "mantap", "keren", "wow", "top", "josss", "ciamik", "kece", "nggak kaleng-kaleng", "luar biasa banget", "amazing". Ini tulisan guru profesional kepada orangtua.

Gunakan tool set_narasi_karakter.`;
}

function promptKeselarasanSingle(
  karakter: string,
  tierIndices: number[] = NARASI_KESELARASAN_TIERS.map((_, i) => i),
): string {
  const count = tierIndices.length;
  const tierLines = tierIndices.map((ti, pos) => `${pos + 1}. ${NARASI_KESELARASAN_TIERS[ti].rentang}`).join("\n");

  return `Buat TEPAT ${count} narasi keselarasan untuk karakter "${karakter}" — urutan wajib:
${tierLines}

KONTEKS SUDUT PANDANG:
Narasi ini ditulis dari sudut pandang GURU yang berbicara kepada Ayah Bunda.
- narasiHasilDariSekolah = guru melaporkan pengamatan di sekolah
- narasiHasilDariOrangtua = guru merangkum/merefleksikan apa yang Ayah Bunda laporkan dari rumah

ATURAN narasiHasilDariSekolah:
- Rentang "0% (belum ada refleksi)": WAJIB diisi "—" saja (satu karakter).
- Rentang lainnya: 2 kalimat, sudut pandang guru melaporkan pengamatan di sekolah.
- WAJIB gunakan bridging pembuka yang BERBEDA untuk setiap tier. Contoh variasi:
  Tier 1: "Dari pengamatan kami di sekolah, Ananda ..."
  Tier 2: "Selama di sekolah, kami melihat Ananda ..."
  Tier 3: "Berdasarkan pengamatan guru di kelas, Ananda ..."
  Tier 4: "Di lingkungan sekolah, Ananda ..."
  Tier 5: "Dalam keseharian Ananda di sekolah, ..."
- JANGAN pakai bridging yang sama di dua tier berbeda.

ATURAN narasiHasilDariOrangtua (SEMUA rentang termasuk 0%):
- Guru merangkum pengamatan Ayah Bunda dari rumah — tetap suara guru, bukan suara orangtua.
- WAJIB gunakan bridging pembuka yang BERBEDA untuk setiap tier. Contoh variasi:
  Tier 1: "Sementara itu, berdasarkan yang Ayah Bunda sampaikan, Ananda ..."
  Tier 2: "Dari catatan Ayah Bunda di rumah, Ananda ..."
  Tier 3: "Jika kami melihat dari pengamatan Ayah Bunda, Ananda ..."
  Tier 4: "Menurut Ayah Bunda, di rumah Ananda ..."
  Tier 5: "Berdasarkan refleksi Ayah Bunda, Ananda ..."
- JANGAN pakai bridging yang sama di dua tier berbeda.
- Lanjutkan dengan observasi dari sudut pandang rumah, lalu 1 langkah konkret yang bisa dilakukan bersama.
- Gunakan sapaan "Ananda" dan "Ayah Bunda". 2-3 kalimat, diakhiri titik.

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
    const { namaSekolah, jenjang, levelList, narrativeTone = "islami", workbook, targetRows } = body;

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

    // Narasi Umum — hanya di-generate jika full regeneration (bukan partial targetRows)
    const resUmum = targetRows
      ? null
      : await callWithTool<UmumInput>(client, system, promptUmum(workbook, jenjang), toolNarasiUmum);

    // Build tier-index maps dari targetRows (jika partial regeneration)
    // karTierMap[karakter] = array tier index yang perlu di-generate untuk narasi karakter
    // kesTierMap[karakter] = array tier index yang perlu di-generate untuk narasi keselarasan
    const karTierMap = new Map<string, number[]>();
    const kesTierMap = new Map<string, number[]>();

    if (targetRows && targetRows.length > 0) {
      for (const tr of targetRows) {
        if (tr.type === "karakter") {
          const idx = NARASI_KARAKTER_TIERS.findIndex((t) => t.rentang === tr.rentangSkorIndikator);
          if (idx >= 0) {
            if (!karTierMap.has(tr.karakter)) karTierMap.set(tr.karakter, []);
            karTierMap.get(tr.karakter)!.push(idx);
          }
        } else {
          const idx = NARASI_KESELARASAN_TIERS.findIndex((t) => t.rentang === tr.rentangSkorIndikator);
          if (idx >= 0) {
            if (!kesTierMap.has(tr.karakter)) kesTierMap.set(tr.karakter, []);
            kesTierMap.get(tr.karakter)!.push(idx);
          }
        }
      }
    }

    const narasiKarakter:    INarasiKarakterRow[]    = [];
    const narasiKeselarasan: INarasiKeselarasanRow[] = [];

    // Karakter yang perlu diproses: jika partial, hanya yang ada di map; jika full, semua
    const karakterToGenerate = targetRows
      ? workbook.karakterList.filter((k) => karTierMap.has(k) || kesTierMap.has(k))
      : workbook.karakterList;

    for (const karakter of karakterToGenerate) {
      const originalIndex = workbook.karakterList.indexOf(karakter);
      const karTierIndices = karTierMap.get(karakter) ?? (targetRows ? [] : NARASI_KARAKTER_TIERS.map((_, i) => i));
      const kesTierIndices = kesTierMap.get(karakter) ?? (targetRows ? [] : NARASI_KESELARASAN_TIERS.map((_, i) => i));

      const [resK, resKS] = await Promise.all([
        karTierIndices.length > 0
          ? callWithTool<KarInput>(client, system, promptKarakterSingle(karakter, workbook, originalIndex, jenjang, karTierIndices), toolNarasiKarakter)
          : Promise.resolve(null),
        kesTierIndices.length > 0
          ? callWithTool<KesInput>(client, system, promptKeselarasanSingle(karakter, kesTierIndices), toolNarasiKeselarasan)
          : Promise.resolve(null),
      ]);

      // Map hasil kembali ke tier aslinya menggunakan karTierIndices
      if (resK) {
        karTierIndices.forEach((ti, pos) => {
          const tier = NARASI_KARAKTER_TIERS[ti];
          const rK = resK.rows[pos];
          narasiKarakter.push({
            karakter,
            rentangSkorIndikator: tier.rentang,
            narasi:               rK?.narasi ?? `(${karakter} - ${tier.rentang} belum dihasilkan)`,
            nilaiAwal:            tier.nilaiAwal,
            nilaiAkhir:           tier.nilaiAkhir,
          });
        });
      }

      if (resKS) {
        kesTierIndices.forEach((ti, pos) => {
          const tier = NARASI_KESELARASAN_TIERS[ti];
          const rKS = resKS.rows[pos];
          const isZero = tier.rentang === "0% (belum ada refleksi)";
          narasiKeselarasan.push({
            karakter,
            rentangSkorIndikator:    tier.rentang,
            nilaiAwal:               tier.nilaiAwal,
            nilaiAkhir:              tier.nilaiAkhir,
            narasiHasilDariSekolah:  isZero ? "—" : (rKS?.narasiHasilDariSekolah ?? `(${karakter} - sekolah - ${tier.rentang} belum dihasilkan)`),
            narasiHasilDariOrangtua: rKS?.narasiHasilDariOrangtua ?? `(${karakter} - orangtua - ${tier.rentang} belum dihasilkan)`  ,
            bgcolor:                 KESELARASAN_BGCOLOR,
            textcolor:               KESELARASAN_TEXTCOLOR,
          });
        });
      }
    }

    // ── Assemble Narasi Umum (hanya pada full generation) ─────

    const narasiUmum: INarasiUmumRow[] = resUmum
      ? NARASI_UMUM_TIERS.map((tier) => {
          const row = resUmum.rows.find((r) => r.hasilPredikat === tier.hasilPredikat);
          return {
            hasilPredikat:           tier.hasilPredikat,
            nilaiAwal:               tier.nilaiAwal,
            nilaiAkhir:              tier.nilaiAkhir,
            catatanUmumPerkembangan: row?.catatanUmumPerkembangan ?? `(Predikat ${tier.hasilPredikat} belum dihasilkan)`,
          };
        })
      : [];

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
