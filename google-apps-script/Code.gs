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
  const secret = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (e.parameter.key !== secret) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const domain = e.parameter.domain;

  try {
    let data;
    switch (domain) {
      case "finance":   data = getFinanceHealth();     break;
      case "ops":       data = getOperationsData();    break;
      case "product":   data = getProductData();       break;
      case "growth":    data = getGrowthData();        break;
      case "team":      data = getTeamWellbeing();     break;
      case "impact":    data = getImpactData();        break;
      case "timeline":  data = getTimelineData();      break;
      case "executive": data = getExecutiveSummary();  break;
      default:          data = { error: "Unknown domain" };
    }
    return ContentService.createTextOutput(JSON.stringify({
      data,
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
  const ss = SpreadsheetApp.openById(SHEET_IDS.finance);
  const sheet = ss.getSheetByName("Cashflow_Bulanan");
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
  // Kolom: [0]periode [1]saldo_awal [2]pemasukan [3]pct_pencapaian
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
// OPERATIONS
// ============================================================================

function getOperationsData() {
  const ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  const sheet = ss.getSheetByName("Delivery_Status");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .filter(r => r["status_lampu"] !== "SELESAI");
}

function countByStatus(status) {
  const ss = SpreadsheetApp.openById(SHEET_IDS.operations);
  const sheet = ss.getSheetByName("Delivery_Status");
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 0;
  const headers = data[0];
  const statusIdx = headers.indexOf("status_lampu");
  if (statusIdx < 0) return 0;
  return data.slice(1).filter(row => row[statusIdx] === status).length;
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

  // Ambil sprint terbaru (baris terakhir berdasarkan sprint_id)
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
