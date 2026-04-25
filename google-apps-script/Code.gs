// ============================================================================
// Fammi Governance OS — Google Apps Script Web App
// Upload file ini ke Google Apps Script, deploy sebagai Web App
// ============================================================================

const SHEET_IDS = {
  finance: PropertiesService.getScriptProperties().getProperty("FINANCE_SHEET_ID"),
  weekly: PropertiesService.getScriptProperties().getProperty("WEEKLY_SHEET_ID"),
  timelines: PropertiesService.getScriptProperties().getProperty("TIMELINES_SHEET_ID"),
  requests: PropertiesService.getScriptProperties().getProperty("REQUESTS_SHEET_ID"),
  projects: PropertiesService.getScriptProperties().getProperty("PROJECTS_SHEET_ID"),
  operations: PropertiesService.getScriptProperties().getProperty("OPS_SHEET_ID"),
  product: PropertiesService.getScriptProperties().getProperty("PRODUCT_SHEET_ID"),
  growth: PropertiesService.getScriptProperties().getProperty("GROWTH_SHEET_ID"),
  team: PropertiesService.getScriptProperties().getProperty("TEAM_SHEET_ID"),
  rbac: PropertiesService.getScriptProperties().getProperty("RBAC_SHEET_ID"),
};

function doGet(e) {
  var secret = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (e.parameter.key !== secret) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var domain = e.parameter.domain;

  try {
    var data;
    switch (domain) {
      case "finance":   data = getFinanceHealth();     break;
      case "ops":       data = getOperationsData();    break;
      case "product":   data = getProductData();       break;
      case "growth":    data = getGrowthData();        break;
      case "team":      data = getTeamWellbeing();     break;
      case "impact":    data = getImpactData();        break;
      case "timeline":  data = getTimelineData();      break;
      case "executive": data = getExecutiveSummary();  break;
      case "rbac":      data = getRbacConfig();        break;
      default:          data = { error: "Unknown domain" };
    }
    return ContentService.createTextOutput(JSON.stringify({
      data: data,
      lastUpdated: new Date().toISOString(),
      source: domain,
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// FINANCE
// ============================================================================

function getFinanceHealth() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.finance);
  var sheet = ss.getSheetByName("Cashflow_Bulanan");
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
  // [0]periode [1]saldo_awal [2]pemasukan [3]pct_pencapaian
  // [4]pengeluaran [5]burn_rate [6]rps [7]dcr [8]ccc [9]runway [10]catatan
  return {
    runway:        data[9]  || 0,
    cashflowPct:   data[3]  || 0,
    burnRateChange: data[5] || 0,
    rps:           data[6]  || 0,
    dcr:           data[7]  || 0,
    ccc:           data[8]  || 0,
  };
}

// ============================================================================
// OPERATIONS — helper functions
// ============================================================================

/** Ubah nilai sel menjadi boolean */
function toBool(val) {
  if (val === true || val === false) return val;
  var s = String(val).toLowerCase().trim();
  return ["true", "ya", "y", "yes", "1", "✓", "x", "true"].indexOf(s) >= 0;
}

/** Ubah nilai sel (Date object atau string) menjadi "yyyy-MM-dd" */
function toDateStr(val) {
  if (!val || val === "") return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
  }
  var s = String(val).trim();
  var ID_BULAN = {
    januari:0, februari:1, maret:2, april:3, mei:4, juni:5,
    juli:6, agustus:7, september:8, oktober:9, november:10, desember:11
  };
  var parts = s.split(/\s+/);
  if (parts.length === 3) {
    var m = ID_BULAN[parts[1].toLowerCase()];
    if (m !== undefined) {
      return parts[2] + "-" + String(m + 1).padStart(2, "0") + "-" + String(parseInt(parts[0])).padStart(2, "0");
    }
  }
  var d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, "Asia/Jakarta", "yyyy-MM-dd");
  return "";
}

/** Hitung sisa hari dari sekarang ke tanggal deadline */
function daysUntil(dateStr) {
  if (!dateStr) return undefined;
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d - now) / 86400000);
}

/**
 * Hitung traffic light berdasarkan deadline paling relevan.
 * - Jika selesaiInput → cek delivery deadline (walas/individu/kepsek/ortu)
 * - Jika belum selesaiInput → cek batasInput
 * - Setelah delivery selesai → cek paparan (distribusi)
 */
function computeTrafficLight(d) {
  if (d.isComplete) return "HIJAU";

  if (d.selesaiInput) {
    // Cek delivery deadline berikutnya (pakai nama field baru per penerima)
    var delivDate = null;
    if (d.produk === "CP") {
      if (!d.rOrtu) delivDate = d.deliverOrtu || null;
    } else {
      // RK & SP: cek secara berurutan per penerima
      if      (!d.rWalas    && d.deliverWalas)    delivDate = d.deliverWalas;
      else if (!d.rIndividu && d.deliverIndividu)  delivDate = d.deliverIndividu;
      else if (!d.rKepsek   && d.deliverKepsek)    delivDate = d.deliverKepsek;
    }
    if (delivDate) {
      var dd = daysUntil(delivDate);
      if (dd !== undefined && dd !== null) {
        if (dd <= 3) return "MERAH";
        if (dd <= 7) return "KUNING";
        return "HIJAU";
      }
    }
    // Cek distribusi/paparan
    var distribDate = null;
    if (!d.statusPaparanKepsek && d.deadlinePaparanKepsek) distribDate = d.deadlinePaparanKepsek;
    else if (!d.statusPaparanWalas && d.deadlinePaparanWalas) distribDate = d.deadlinePaparanWalas;
    else if (!d.statusPaparanOrtu && d.deadlinePaparanOrtu)   distribDate = d.deadlinePaparanOrtu;
    if (distribDate) {
      var dd2 = daysUntil(distribDate);
      if (dd2 !== undefined && dd2 !== null) {
        if (dd2 <= 3) return "MERAH";
        if (dd2 <= 7) return "KUNING";
      }
    }
    return "HIJAU";
  }

  // Belum selesai input → pakai batasInput
  var daysLeft = daysUntil(d.batasInput);
  if (daysLeft === undefined || daysLeft === null) return "HIJAU";
  if (daysLeft <= 3) return "MERAH";
  if (daysLeft <= 7) return "KUNING";
  return "HIJAU";
}

// ── Stage helpers ─────────────────────────────────────────────────────────────

function isPersiapanDone(d) {
  if (!d.dataSiswa) return false;
  if (d.setupGuru === false) return false;
  if (d.setupOrtu === false) return false;
  if (d.setupSiswa === false) return false;
  if (d.dataGuru === false) return false;
  // Numeric: jika kolom ada (non-undefined) tapi kosong/0 → persiapan belum selesai
  if (d.jumlahSiswa !== undefined && d.jumlahSiswa === 0) return false;
  // String: jika kolom ada tapi kosong → persiapan belum selesai
  if (d.tipeInput !== undefined && d.tipeInput === "") return false;
  return true;
}

function isPembuatanDone(d) {
  var items = [];
  if (d.approval !== undefined)            items.push(d.approval);
  if (d.coda !== undefined)                items.push(d.coda);
  if (d.excel !== undefined)               items.push(d.excel);
  if (d.foto !== undefined)                items.push(d.foto);
  if (d.excelApproval !== undefined)       items.push(d.excelApproval);
  if (d.codaPembuatanRapor !== undefined)  items.push(d.codaPembuatanRapor);
  if (d.pluginPembuatanRapor !== undefined) items.push(d.pluginPembuatanRapor);
  return items.length === 0 || items.every(function(v) { return v === true; });
}

function isPengirimanDone(d) {
  var items = [];
  if (d.rWalas !== undefined)   items.push(d.rWalas);
  if (d.rIndividu !== undefined) items.push(d.rIndividu);
  if (d.rKepsek !== undefined)  items.push(d.rKepsek);
  if (d.rOrtu !== undefined)    items.push(d.rOrtu);
  return items.length === 0 || items.every(function(v) { return v === true; });
}

function isDistribusiDone(d) {
  var items = [];
  if (d.statusPaparanKepsek !== undefined) items.push(d.statusPaparanKepsek);
  if (d.statusPaparanWalas !== undefined)  items.push(d.statusPaparanWalas);
  if (d.statusPaparanOrtu !== undefined)   items.push(d.statusPaparanOrtu);
  return items.length === 0 || items.every(function(v) { return v === true; });
}

/**
 * Urutan stage: PERSIAPAN → PENGISIAN → PEMBUATAN → PENGIRIMAN → DISTRIBUSI → SELESAI
 */
function computeStage(d) {
  if (d.isComplete) return "SELESAI";
  if (!isPersiapanDone(d)) return "PERSIAPAN";
  if (!d.selesaiInput) return "PENGISIAN";
  if (!isPembuatanDone(d)) return "PEMBUATAN";
  if (!isPengirimanDone(d)) return "PENGIRIMAN";
  if (!isDistribusiDone(d)) return "DISTRIBUSI";
  return "SELESAI";
}

/** Hitung progress pct dari semua boolean milestone yang ada di data */
function computeProgress(d) {
  var bools = [
    d.dataSiswa, d.sosialisasi, d.setupGuru, d.setupOrtu, d.setupSiswa, d.dataGuru,
    d.selesaiInput,
    d.approval, d.coda, d.excel, d.foto, d.excelApproval, d.codaPembuatanRapor, d.pluginPembuatanRapor,
    d.rWalas, d.rIndividu, d.rKepsek, d.rOrtu,
    d.statusPaparanKepsek, d.statusPaparanWalas, d.statusPaparanOrtu,
    d.isComplete,
  ];
  var total = 0, done = 0;
  for (var i = 0; i < bools.length; i++) {
    if (bools[i] !== undefined) {
      total++;
      if (bools[i] === true) done++;
    }
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/**
 * Cari kolom berdasarkan nama header (case-insensitive, trim whitespace).
 * Mencari di semua baris header (rows 0..headerRowCount-1).
 * Mengembalikan index kolom (0-based) atau -1 jika tidak ditemukan.
 */
function findColByName(allRows, headerRowCount) {
  var searchTerms = Array.prototype.slice.call(arguments, 2);
  for (var ri = 0; ri < Math.min(headerRowCount, allRows.length); ri++) {
    var row = allRows[ri];
    for (var ci = 0; ci < row.length; ci++) {
      var h = String(row[ci] || "").toLowerCase().replace(/\s+/g, "");
      if (!h) continue;
      for (var si = 0; si < searchTerms.length; si++) {
        var term = String(searchTerms[si]).toLowerCase().replace(/\s+/g, "");
        if (h === term || h.indexOf(term) >= 0) return ci;
      }
    }
  }
  return -1;
}

/**
 * Khusus mencari kolom jumlah siswa dengan banyak variasi nama.
 * Mencari di 3 baris header pertama, dan juga mencoba mendeteksi via pola angka besar.
 */
function findColSiswa(allRows) {
  // 1. Coba match eksak dan substring terhadap banyak variasi nama kolom
  var SISWA_TERMS = [
    "jumlahsiswa", "jmlsiswa", "jlhsiswa", "jmlhsiswa",
    "totalsiswa", "banyaksiswa",
    "jumlahmurid", "jmlmurid", "totalmurid",
    "jumlahanak", "jmlanak",
    "jml.siswa", "juml.siswa",
    "pesertadidik", "jumlahpd", "jmlpd",
    "siswa", "murid", "anak"  // fallback paling luas
  ];

  // Cek 3 baris pertama sebagai header
  var headerRows = Math.min(3, allRows.length);
  for (var ri = 0; ri < headerRows; ri++) {
    var row = allRows[ri];
    for (var ci = 0; ci < row.length; ci++) {
      var raw = String(row[ci] || "");
      var h = raw.toLowerCase().replace(/[\s._\-\/]+/g, "");  // strip semua separator
      if (!h) continue;

      for (var ti = 0; ti < SISWA_TERMS.length; ti++) {
        var term = SISWA_TERMS[ti];
        if (h === term || h.indexOf(term) >= 0) {
          // Pastikan bukan kolom setup/data siswa (checkbox/boolean)
          // Cek baris data pertama: kalau nilainya angka besar (>1) kemungkinan jumlah
          var dataRow = allRows[headerRows] || allRows[headerRows - 1] || [];
          var sample = dataRow[ci];
          var isNumeric = !isNaN(parseInt(sample)) && parseInt(sample) > 1;
          var isBool = (typeof sample === "boolean") || sample === "TRUE" || sample === "FALSE"
            || sample === "Ya" || sample === "Tidak" || sample === "x" || sample === "✓";
          if (!isBool) return ci;
        }
      }
    }
  }
  return -1;
}

/**
 * Bangun peta kolom (field → index) dari baris header.
 * Normalisasi: lowercase + hapus semua karakter [\s_.\-\/\(\)].
 * Cek 2 baris header pertama. Urutan prioritas: exact match, lalu kiri ke kanan.
 *
 * Kolom RK yang diketahui:
 *   0:NO  1:KODE  2:NAMA_SEKOLAH  3:JML_KELAS  4:JML_SISWA  5:JML_GURU
 *   6:TIPE_INPUT_RAPOR  7:DATA_SISWA  8:SOSIALISASI
 *   9:GURU_RUMAH_ONLINE  10:ORTU_RUMAH_ONLINE  11:SISWA_RUMAH_ONLINE
 *   12:MULAI_PENGISIAN  13:BATAS_AKHIR_PENGISIAN  14:STATUS_PENGISIAN
 *   15:WALAS_DEADLINE_PENGIRIMAN_LAPORAN  16:WALAS_STATUS_PENGIRIMAN_LAPORAN
 *   17:WALAS_APPROVAL  18:PEMBUATAN_CODA  19:PEMBUATAN_EXCEL
 *   20:INDIIVDU_DEADLINE_PENGIRIMAN_LAPORAN  21:KEPSEK_DEADLINE_PENGIRIMAN_LAPORAN
 *   22:INDIVIDU_STATUS_PENGIRIMAN_LAPORAN  23:KEPSEK_STATUS_PENGIRIMAN_LAPORAN
 *   24:KETERANGAN  25:DEADLINE PAPARAN_KEPSEK  26:STATUS_PAPARAN_KEPSEK
 *   27:POLLING_KEPUASAN  28:TESTIMONI
 */
function buildColMap(allRows) {
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[\s_.\-\/\(\)]+/g, "");
  }

  var idx = {};
  for (var ri = 0; ri < Math.min(2, allRows.length); ri++) {
    var row = allRows[ri];
    for (var ci = 0; ci < row.length; ci++) {
      var n = norm(row[ci]);
      if (n && idx[n] === undefined) idx[n] = ci;
    }
  }

  function find() {
    for (var i = 0; i < arguments.length; i++) {
      var n = norm(arguments[i]);
      if (idx[n] !== undefined) return idx[n];
    }
    return -1;
  }

  return {
    no:          find("no"),
    kode:        find("kode"),
    schoolName:  find("namasekolah", "namainstansi", "nama"),
    jumlahKelas: find("jmlkelas", "jumlahkelas", "jlhkelas"),
    jumlahSiswa: findColSiswa(allRows),
    jumlahGuru:  find("jmlguru", "jumlahguru"),
    tipeInput:   find("tipeinputrapor", "tipeinput", "tipeisian"),

    // Persiapan
    dataSiswa:   find("datasiswa"),
    dataGuru:    find("dataguru"),
    sosialisasi: find("sosialisasi"),
    setupGuru:   find("gururumahonline",  "setupguru"),
    setupOrtu:   find("orturumahonline",  "setuportu"),   // ORTU_RUMAH_ONLINE → "orturumahonline"
    setupSiswa:  find("siswarumahonline", "setupsiswa"),

    // Pengisian
    mulaiInput:   find("mulaipengisian", "mulaiinput", "mulai"),
    batasInput:   find("batasakhirpengisian", "batasinput", "batas"),
    selesaiInput: find("statuspengisian", "selesaiinput"),

    // Pembuatan
    approval:             find("walasapproval", "approval"),
    coda:                 find("pembuatancoda", "coda"),
    excel:                find("pembuatanexcel", "excel"),
    foto:                 find("foto"),
    excelApproval:        find("excelapproval"),
    codaPembuatanRapor:   find("codapembuatanrapor"),
    pluginPembuatanRapor: find("pluginpembuatanrapor", "plugin"),

    // ── Pengiriman: tanggal deadline per penerima ────────────────────────────────
    // RK/SP: setiap penerima punya kolom terpisah; SP memakai alias DEADLINE_*_KIRIM_RAPOR
    deliverWalas: find(
      "walasdeadlinepengirimanlaporan",    // RK:  WALAS_DEADLINE_PENGIRIMAN_LAPORAN
      "deadlinewalaskirimrapor"            // SP:  DEADLINE_WALAS_KIRIM_RAPOR
    ),
    deliverIndividu: find(
      "indiivdudeadlinepengirimanlaporan", // RK:  INDIIVDU_DEADLINE_PENGIRIMAN_LAPORAN (typo intentional)
      "individudeadlinepengirimanlaporan", // RK:  INDIVIDU_DEADLINE... (koreksi typo)
      "deadlineindividukirimrapor",        // SP:  DEADLINE_INDIVIDU_KIRIM_RAPOR
      "deadlinekirimrapor"                 // SP:  DEADLINE_KIRIM_RAPOR (generik individu)
    ),
    deliverKepsek: find(
      "kepsekdeadlinepengirimanlaporan",   // RK:  KEPSEK_DEADLINE_PENGIRIMAN_LAPORAN
      "deadlinekepsekkirimrapor"           // SP:  DEADLINE_KEPSEK_KIRIM_RAPOR
    ),
    // CP: satu kolom untuk pengiriman ke orang tua
    deliverOrtu: find(
      "deadlinekirimrapor"                 // CP:  DEADLINE_KIRIM_RAPOR
    ),

    // Pengiriman — status boolean
    rWalas:    find("walasstatuspengirimanlaporan",    "rwalas"),
    rIndividu: find("individustatuspengirimanlaporan", "rindividu"),
    rKepsek:   find("kepsekstatuspengirimanlaporan",   "rkepsek"),
    rOrtu:     find("statuspengirimanlaporanortu",     "rortu"),

    // Distribusi / Paparan
    deadlinePaparanKepsek: find("deadlinepaparankepsek"),
    statusPaparanKepsek:   find("statuspaparankepsek"),
    deadlinePaparanWalas:  find("deadlinepaparanwalas"),
    statusPaparanWalas:    find("statuspaparanwalas"),
    deadlinePaparanOrtu:   find("deadlinepaparanortu"),
    statusPaparanOrtu:     find("statuspaparanortu"),

    statusCatatan:   find("keterangan", "statuscatatan", "catatan"),
    detailTestimoni: find("testimoni", "detailtestimoni"),
    isComplete:      find("pollingkepuasan", "polling"),
  };
}

// ── Rapor Karakter (RK) ──────────────────────────────────────────────────────
//
// Kolom (0-based, data mulai baris ke-3 / index r=2):
//   0:NO  1:KODE  2:NAMA SEKOLAH  3:jumlahKelas  4:tipeInput
//   5:dataSiswa  6:sosialisasi  7:setupGuru  8:setupOrtu  9:setupSiswa
//   10:mulaiInput  11:batasInput  12:selesaiInput
//   13:deliverWalas   14:deliverIndividu 15:deliverKepsek
//   16:statusCatatan  17:kepsekTerikat(SKIP)  18:approval  19:coda
//   20:rWalas  21:rIndividu  22:rKepsek  23:polling  24:detailTestimoni
//
/**
 * Reader generik: baca satu sheet menggunakan buildColMap untuk deteksi kolom dinamis.
 * Dipakai oleh readRK, readCP, readSP — tiap sheet bisa punya struktur kolom berbeda.
 */
function readSheet(ss, sheetName, produk) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var allRows = sheet.getDataRange().getValues();
  if (allRows.length < 2) return [];

  var C = buildColMap(allRows);

  function getB(row, ci) { return ci >= 0 ? toBool(row[ci]) : undefined; }
  function getD(row, ci) { var s = ci >= 0 ? toDateStr(row[ci]) : ""; return s || undefined; }
  function getS(row, ci) { return ci >= 0 ? (String(row[ci] || "").trim() || undefined) : undefined; }
  function getSe(row, ci) { return ci >= 0 ? String(row[ci] || "").trim() : undefined; }

  var results = [];
  for (var r = 1; r < allRows.length; r++) {
    var row = allRows[r];
    var schoolName = C.schoolName >= 0 ? String(row[C.schoolName] || "").trim() : "";
    if (!schoolName) continue;

    var batasInput   = getD(row, C.batasInput);
    var selesaiInput = C.selesaiInput >= 0 ? toBool(row[C.selesaiInput]) : undefined;
    var isComplete   = C.isComplete >= 0 ? toBool(row[C.isComplete]) : false;
    var daysLeft     = daysUntil(batasInput);

    // jumlahSiswa: 0 kalau kolom ada tapi kosong, undefined kalau kolom tidak ada
    var jumlahSiswa = C.jumlahSiswa >= 0 ? (parseInt(row[C.jumlahSiswa]) || 0) : undefined;
    // tipeInput: "" kalau kolom ada tapi kosong (untuk cek persiapan), undefined kalau tidak ada
    var tipeInput = getSe(row, C.tipeInput);

    var d = {
      no:           (C.no >= 0 ? parseInt(row[C.no]) : 0) || r,
      produk:       produk,
      schoolName:   schoolName,
      kode:         getS(row, C.kode),
      jumlahKelas:  C.jumlahKelas >= 0 ? (parseInt(row[C.jumlahKelas]) || 0) : 0,
      jumlahSiswa:  jumlahSiswa,
      jumlahGuru:   C.jumlahGuru >= 0 ? (parseInt(row[C.jumlahGuru]) || undefined) : undefined,
      tipeInput:    tipeInput,

      // Persiapan
      dataSiswa:    getB(row, C.dataSiswa) !== undefined ? getB(row, C.dataSiswa) : false,
      dataGuru:     getB(row, C.dataGuru),
      sosialisasi:  getB(row, C.sosialisasi),
      setupGuru:    getB(row, C.setupGuru),
      setupOrtu:    getB(row, C.setupOrtu),
      setupSiswa:   getB(row, C.setupSiswa),

      // Pengisian
      mulaiInput:   getD(row, C.mulaiInput),
      batasInput:   batasInput,
      selesaiInput: selesaiInput,

      // Pembuatan
      approval:             getB(row, C.approval),
      coda:                 getB(row, C.coda),
      excel:                getB(row, C.excel),
      foto:                 getB(row, C.foto),
      excelApproval:        getB(row, C.excelApproval),
      codaPembuatanRapor:   getB(row, C.codaPembuatanRapor),
      pluginPembuatanRapor: getB(row, C.pluginPembuatanRapor),

      // Pengiriman — tanggal deadline per penerima
      deliverWalas:    getD(row, C.deliverWalas),
      deliverIndividu: getD(row, C.deliverIndividu),
      deliverKepsek:   getD(row, C.deliverKepsek),
      deliverOrtu:     getD(row, C.deliverOrtu),

      // Pengiriman — status boolean
      rWalas:    getB(row, C.rWalas),
      rIndividu: getB(row, C.rIndividu),
      rKepsek:   getB(row, C.rKepsek),
      rOrtu:     getB(row, C.rOrtu),

      // Distribusi / Paparan
      deadlinePaparanKepsek: getD(row, C.deadlinePaparanKepsek),
      statusPaparanKepsek:   getB(row, C.statusPaparanKepsek),
      deadlinePaparanWalas:  getD(row, C.deadlinePaparanWalas),
      statusPaparanWalas:    getB(row, C.statusPaparanWalas),
      deadlinePaparanOrtu:   getD(row, C.deadlinePaparanOrtu),
      statusPaparanOrtu:     getB(row, C.statusPaparanOrtu),

      statusCatatan:   getS(row, C.statusCatatan),
      polling:         isComplete,
      detailTestimoni: getS(row, C.detailTestimoni),

      daysUntilBatasInput: daysLeft,
      isComplete:          isComplete,
    };

    d.deliveryStage = computeStage(d);
    d.trafficLight  = computeTrafficLight(d);
    d.progressPct   = computeProgress(d);

    results.push(d);
  }
  return results;
}

function tryReadSheet(ss, names, produk) {
  for (var i = 0; i < names.length; i++) {
    var rows = readSheet(ss, names[i], produk);
    if (rows.length > 0) return rows;
  }
  // Fallback: cari sheet yang namanya mengandung kata kunci produk
  var keyword = produk === "RK" ? "rapor" : produk === "CP" ? "capaian" : "screening";
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    var sName = sheets[j].getName().toLowerCase();
    if (sName.indexOf(keyword) >= 0) {
      var rows2 = readSheet(ss, sheets[j].getName(), produk);
      if (rows2.length > 0) return rows2;
    }
  }
  return [];
}

function readRK(ss) {
  return tryReadSheet(ss,
    ["Rapor Karakter", "Rapor_Karakter", "RK", "Rapor Karakter "],
    "RK");
}
function readCP(ss) {
  return tryReadSheet(ss,
    ["Capaian Pembelajaran PAUD", "Capaian Pembelajaran", "Capaian_Pembelajaran_PAUD", "CP", "PAUD", "Capaian"],
    "CP");
}
function readSP(ss) {
  return tryReadSheet(ss,
    ["Screening Psikologi", "Screening_Psikologi", "SP", "Screening", "Psikologi"],
    "SP");
}

// ── Aggregator ───────────────────────────────────────────────────────────────

function getOperationsData() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  var deliveries = [].concat(readRK(ss), readCP(ss), readSP(ss));

  var active  = deliveries.filter(function(d) { return !d.isComplete; });
  var selesai = deliveries.filter(function(d) { return  d.isComplete; });

  // Hitung apakah ada jumlahSiswa tersedia
  var hasSiswaData = deliveries.some(function(d) {
    return d.jumlahSiswa !== undefined && d.jumlahSiswa > 0;
  });

  return {
    totalActive:  active.length,
    merahCount:   active.filter(function(d) { return d.trafficLight === "MERAH";  }).length,
    kuningCount:  active.filter(function(d) { return d.trafficLight === "KUNING"; }).length,
    hijauCount:   active.filter(function(d) { return d.trafficLight === "HIJAU";  }).length,
    selesaiCount: selesai.length,
    hasSiswaData: hasSiswaData,
    deliveries:   deliveries,
  };
}

// ── Debug helpers ─────────────────────────────────────────────────────────────

function debugAllSheetHeaders() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  var sheets = ["Rapor Karakter", "Capaian Pembelajaran PAUD", "Screening Psikologi"];
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) { Logger.log(name + ": SHEET NOT FOUND"); return; }
    var lastCol = sheet.getLastColumn();
    var allRows = sheet.getRange(1, 1, Math.min(4, sheet.getLastRow()), lastCol).getValues();
    var row1 = allRows[0], row2 = allRows[1] || [], row3 = allRows[2] || [];
    Logger.log("=== " + name + " === (" + lastCol + " kolom)");
    row1.forEach(function(h, i) {
      Logger.log("  col[" + i + "] h1='" + h + "' h2='" + (row2[i]||"") + "' sample='" + row3[i] + "'");
    });
    // Coba deteksi kolom siswa
    var colSiswa = findColSiswa(allRows);
    Logger.log("  >> findColSiswa() = " + colSiswa + (colSiswa >= 0 ? " ('" + row1[colSiswa] + "')" : " (TIDAK DITEMUKAN)"));
  });
}

/** Jalankan fungsi ini untuk test deteksi kolom Jumlah Siswa */
function debugSiswaDetection() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.operations);

  // Print semua nama sheet yang ada
  var allSheets = ss.getSheets().map(function(s) { return s.getName(); });
  Logger.log("Sheet tersedia: " + allSheets.join(", "));

  var sheetNames = ["Rapor Karakter", "Capaian Pembelajaran PAUD", "Screening Psikologi"];
  for (var si = 0; si < sheetNames.length; si++) {
    var name = sheetNames[si];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      Logger.log("[NOT FOUND] '" + name + "' — cek nama sheet di spreadsheet");
      continue;
    }

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var fetchRows = Math.min(5, lastRow);
    if (fetchRows < 1) {
      Logger.log("[KOSONG] " + name + " — tidak ada baris data");
      continue;
    }

    try {
      var allRows = sheet.getRange(1, 1, fetchRows, lastCol).getValues();

      // Print semua header (baris 1 dan 2)
      Logger.log("=== " + name + " (" + lastCol + " kolom, " + lastRow + " baris) ===");
      for (var ci = 0; ci < lastCol; ci++) {
        var h1 = allRows[0] ? String(allRows[0][ci] || "") : "";
        var h2 = allRows[1] ? String(allRows[1][ci] || "") : "";
        var smp = allRows[2] ? String(allRows[2][ci] || "") : (allRows[1] ? String(allRows[1][ci] || "") : "");
        if (h1 || h2) {
          Logger.log("  col[" + ci + "] '" + h1 + "' / '" + h2 + "' | sample: '" + smp + "'");
        }
      }

      var col = findColSiswa(allRows);
      if (col >= 0) {
        var h = allRows[0] ? String(allRows[0][col] || "") : "";
        var sampleVal = allRows[2] ? String(allRows[2][col] || "") : "";
        Logger.log(">> DITEMUKAN: col[" + col + "] = '" + h + "', sample = '" + sampleVal + "'");
      } else {
        Logger.log(">> TIDAK DITEMUKAN — tambahkan kolom 'Jumlah Siswa' atau rename kolom yang ada");
      }
    } catch(e) {
      Logger.log("[ERROR] " + name + ": " + e.message);
    }
  }
}

function debugRKHeaders() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  var sheet = ss.getSheetByName("Rapor Karakter");
  var lastCol = sheet.getLastColumn();
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  var row3 = sheet.getRange(3, 1, 1, lastCol).getValues()[0];
  Logger.log("Row1: " + JSON.stringify(row1));
  Logger.log("Row2: " + JSON.stringify(row2));
  Logger.log("Row3 (data): " + JSON.stringify(row3));
  row1.forEach(function(h, i) {
    Logger.log("col[" + i + "]: header='" + h + "' | row2='" + row2[i] + "' | data='" + row3[i] + "'");
  });
}

function debugDataRow() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  var sheet = ss.getSheetByName("Rapor Karakter");
  var row = sheet.getRange(3, 1, 1, sheet.getLastColumn()).getValues()[0];
  row.forEach(function(v, i) { Logger.log(i + ": " + v); });
}

function countByStatus(status) {
  try {
    var result = getOperationsData();
    return result.deliveries.filter(function(d) { return d.trafficLight === status; }).length;
  } catch(e) {
    return 0;
  }
}

// ============================================================================
// RBAC CONFIG — User Management
// ============================================================================

/**
 * Baca fammi_rbac_config dan kembalikan daftar user beserta permissions.
 * Sheet format: baris pertama bisa berupa judul gabungan, baris kedua header kolom.
 * Kolom: User ID | Email | Nama Lengkap | Role | Aktif? | Passcode | Created At
 *        | Mission Control | Operasional | Keuangan | Produk | Sales & Growth | Tim | Impact
 */
function getRbacConfig() {
  var ss = SpreadsheetApp.openById(SHEET_IDS.rbac);
  if (!ss) return { users: [] };

  // Ambil sheet pertama (atau sheet bernama "Users" jika ada)
  var sheet = ss.getSheetByName("Users") || ss.getSheets()[0];
  if (!sheet) return { users: [] };

  var allRows = sheet.getDataRange().getValues();
  if (allRows.length < 2) return { users: [] };

  // Cari baris header: baris yang mengandung "User ID" atau "Email"
  var headerIdx = -1;
  for (var ri = 0; ri < Math.min(4, allRows.length); ri++) {
    var row = allRows[ri];
    for (var ci = 0; ci < row.length; ci++) {
      var h = String(row[ci] || "").trim().toLowerCase();
      if (h === "user id" || h === "email" || h === "email (google workspace)") {
        headerIdx = ri;
        break;
      }
    }
    if (headerIdx >= 0) break;
  }
  if (headerIdx < 0) return { users: [] };

  // Buat peta header → index kolom (case-insensitive, strip whitespace)
  var headers = allRows[headerIdx];
  var colIdx = {};
  for (var ci2 = 0; ci2 < headers.length; ci2++) {
    var key = String(headers[ci2] || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (key) colIdx[key] = ci2;
  }

  function col(row, name) {
    var idx = colIdx[name.toLowerCase()];
    return idx !== undefined ? row[idx] : undefined;
  }

  var users = [];
  for (var r = headerIdx + 1; r < allRows.length; r++) {
    var row = allRows[r];
    var userId = String(col(row, "user id") || "").trim();
    if (!userId) continue;

    users.push({
      userId:   userId,
      email:    String(col(row, "email (google workspace)") || col(row, "email") || "").trim(),
      name:     String(col(row, "nama lengkap") || "").trim(),
      role:     String(col(row, "role") || "").trim(),
      isActive: toBool(col(row, "aktif?")),
      passcode: String(col(row, "passcode") || "").trim(),
      permissions: {
        missionControl: toBool(col(row, "mission control")),
        operasional:    toBool(col(row, "operasional")),
        keuangan:       toBool(col(row, "keuangan")),
        produk:         toBool(col(row, "produk")),
        salesGrowth:    toBool(col(row, "sales & growth")),
        tim:            toBool(col(row, "tim")),
        impact:         toBool(col(row, "impact")),
      }
    });
  }

  return { users: users };
}

// ============================================================================
// PRODUCT
// ============================================================================

function getProductData() {
  const ss = SpreadsheetApp.openById(SHEET_IDS.product);
  const featSheet = ss.getSheetByName("Feature_Lifecycle");
  const featData = featSheet.getDataRange().getValues();
  const featHeaders = featData[0];

  const features = featData.slice(1).map(row => {
    const obj = {};
    featHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  }).filter(f => f["dev_state"] && f["dev_state"] !== "DEPRECATED");

  const csatSheet = ss.getSheetByName("CSAT_Log");
  const csatData = csatSheet.getDataRange().getValues();
  const csatHeaders = csatData[0];
  const csat = csatData.slice(1).map(row => {
    const obj = {};
    csatHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const scores = csat.map(r => r["score"]).filter(s => s > 0);
  const avgCsat = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  return { features, csatAvg: avgCsat, csatEntries: csat.slice(-20) };
}

// ============================================================================
// GROWTH
// ============================================================================

function getGrowthData() {
  const ss = SpreadsheetApp.openById(SHEET_IDS.growth);

  const leadsSheet = ss.getSheetByName("Sales_Pipeline");
  const leadsData = leadsSheet.getDataRange().getValues();
  const leadsHeaders = leadsData[0];
  const leads = leadsData.slice(1).map(row => {
    const obj = {};
    leadsHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const partnerSheet = ss.getSheetByName("Partnership_Tracker");
  const partnerData = partnerSheet.getDataRange().getValues();
  const partnerHeaders = partnerData[0];
  const partnerships = partnerData.slice(1).map(row => {
    const obj = {};
    partnerHeaders.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  return {
    leads,
    partnerships,
    wpv: getWPV(leads),
    staleLeads: countStaleLeads(leads),
  };
}

function getWPV(leads) {
  if (!leads || !leads.length) return 0;
  const stageWeights = {
    COLD: 0.05, CONTACTED: 0.1, INTERESTED: 0.2, DEMO: 0.35,
    PROPOSAL: 0.5, NEGOTIATION: 0.75, CLOSED_WON: 1, CLOSED_LOST: 0,
  };
  return leads.reduce((sum, lead) => {
    const weight = stageWeights[lead["stage"]] || 0;
    return sum + ((lead["est_deal_value"] || 0) * weight);
  }, 0);
}

function countStaleLeads(leads) {
  if (!leads || !leads.length) return 0;
  const now = new Date();
  const staleDays = 14;
  return leads.filter(lead => {
    if (!lead["last_updated"]) return true;
    const lastUpdate = new Date(lead["last_updated"]);
    const diff = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    return diff > staleDays && lead["stage"] !== "CLOSED_WON" && lead["stage"] !== "CLOSED_LOST";
  }).length;
}

// ============================================================================
// TEAM WELLBEING
// ============================================================================

function getTeamWellbeing() {
  const ss = SpreadsheetApp.openById(SHEET_IDS.team);
  const sheet = ss.getSheetByName("Checkin_Log");
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return {
      sprintId: "-", avgHappiness: 0, avgEnergy: 0,
      burnoutHighCount: 0, burnoutMediumCount: 0,
      topStressor: "-", participationRate: 0, supportRequestsCount: 0,
    };
  }
  const headers = data[0];
  const rows = data.slice(1);

  const sprintIdIdx = headers.indexOf("sprint_id");
  const sprints = [...new Set(rows.map(r => r[sprintIdIdx]))].filter(Boolean);
  const latestSprint = sprints[sprints.length - 1];

  const sprintRows = rows.filter(r => r[sprintIdIdx] === latestSprint);

  const happinessIdx   = headers.indexOf("happiness_score");
  const energyIdx      = headers.indexOf("energy_score");
  const burnoutIdx     = headers.indexOf("burnout_level");
  const stressorIdx    = headers.indexOf("top_stressor");
  const supportIdx     = headers.indexOf("support_needed");

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const happiness = sprintRows.map(r => r[happinessIdx]).filter(v => v > 0);
  const energy    = sprintRows.map(r => r[energyIdx]).filter(v => v > 0);
  const burnoutHigh   = sprintRows.filter(r => r[burnoutIdx] === "HIGH").length;
  const burnoutMedium = sprintRows.filter(r => r[burnoutIdx] === "MEDIUM").length;

  const stressorCounts = {};
  sprintRows.forEach(r => {
    const s = r[stressorIdx];
    if (s) stressorCounts[s] = (stressorCounts[s] || 0) + 1;
  });
  const topStressor = Object.entries(stressorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const supportRequests = sprintRows.filter(r => r[supportIdx] === true || r[supportIdx] === "TRUE").length;

  const totalMember = rows.filter(r => r[sprintIdIdx] === latestSprint || !r[sprintIdIdx]).length;
  const participationRate = totalMember > 0 ? Math.round((sprintRows.length / totalMember) * 100) : 100;

  return {
    sprintId: String(latestSprint),
    avgHappiness: Math.round(avg(happiness) * 10) / 10,
    avgEnergy: Math.round(avg(energy) * 10) / 10,
    burnoutHighCount: burnoutHigh,
    burnoutMediumCount: burnoutMedium,
    topStressor,
    participationRate,
    supportRequestsCount: supportRequests,
  };
}

// ============================================================================
// IMPACT (cross-sheet aggregation)
// ============================================================================

function getImpactData() {
  const ops = SpreadsheetApp.openById(SHEET_IDS.operations)
    .getSheetByName("School_Master").getDataRange().getValues();
  const schoolsActive = ops.slice(1).filter(r => r[11] !== "").length;
  const studentsServed = ops.slice(1).reduce((sum, r) => sum + (r[6] || 0), 0);

  const csatSheet = SpreadsheetApp.openById(SHEET_IDS.product)
    .getSheetByName("CSAT_Log").getDataRange().getValues();
  const scores = csatSheet.slice(1).map(r => r[4]).filter(s => s > 0);
  const csatAvg = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  const schoolsTarget = 4000;
  const progressToTarget = Math.round((schoolsActive / schoolsTarget) * 1000) / 10;
  const impactScore = Math.round(
    (progressToTarget * 0.4) + (csatAvg * 8 * 0.4) + (Math.min(studentsServed / 10000, 1) * 100 * 0.2)
  );

  return {
    schoolsActive,
    schoolsTarget,
    studentsServed,
    familiesReached: Math.round(studentsServed * 1.2),
    csatAvg,
    impactScore,
    progressToTarget,
  };
}

// ============================================================================
// TIMELINE
// ============================================================================

function getTimelineData() {
  const ss = SpreadsheetApp.openById(SHEET_IDS.timelines);
  const sheet = ss.getSheetByName("Master_Timeline");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .filter(r => r["status"] !== "DONE")
    .sort((a, b) => (a["urgency_score"] || 0) > (b["urgency_score"] || 0) ? -1 : 1);
}

// ============================================================================
// EXECUTIVE SUMMARY (semua domain sekaligus, untuk landing page)
// ============================================================================

function getExecutiveSummary() {
  return {
    finance: getFinanceHealth(),
    impact: getImpactData(),
    ops: {
      merahCount: countByStatus("MERAH"),
      kuningCount: countByStatus("KUNING"),
    },
    team: getTeamWellbeing(),
    growth: {
      wpv: getWPV(null),
      staleLeads: countStaleLeads(null),
    },
  };
}
