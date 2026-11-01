// ============================================================
// ÜKSUS STUUDIO — Monthly Billing Automation
// ============================================================

const SPREADSHEET_ID         = '__ARVELDUSE_BILANSS_ID__';
const BOOKING_SPREADSHEET_ID = '__BRONEERINGU_FAILI_ID__';
const SENDER_EMAIL           = 'yksus.stuudio@gmail.com';

const TRAINERS = [
  {
    name: 'Katrin',
    aliases: ['Katrin', 'Katriin', 'Katirn', 'Karin', 'Kairin', 'KatrinPT', 'Katirn PT'],
    dataTab: 'Katrin',
    invoiceTab: 'Katrin_arve',
    weekStartRow: 52,  // Nädal 1 first data row
    weekStride: 8      // rows between Nädal block starts
  },
  {
    name: 'Kadri',
    aliases: ['Kadri', 'Kardri', 'Kaddri', 'Krrddri', 'KadriPT', 'KardriPT', 'Kadari'],
    dataTab: 'Kadri',
    invoiceTab: 'Kadri_arve',
    weekStartRow: 6,
    weekStride: 8
  }
];

// ── GROUP TRAINERS ────────────────────────────────────────────
// Kadi and Villem are group class trainers — different detection
// and billing logic from PT trainers above.

const GROUP_TRAINERS = [
  {
    name: 'Kadi',
    // Match col A containing "Kalisteenika", col B containing "Kadi" or "rühmatrenn"
    colA: 'kalisteenika',
    colB: ['kadi'],
    dataTab: 'Kadi',
    invoiceTab: 'Kadi_arve',
    piecesRow: 17,   // row for pieces count in data tab
    sumRow: 18,      // row for sum (done by sheet formula, script writes pieces only)
    pricePerSession: 30,
    invoiceItemName: 'Kalisteenika rühmatrennid'
  },
  {
    name: 'Villem',
    // Match col A containing "Handstand", col B containing "Villem" or "rühmatrenn"
    colA: 'handstand',
    colB: ['villem'],
    dataTab: 'Villem',
    invoiceTab: 'Villem_arve',
    piecesRow: 13,
    sumRow: 14,
    pricePerSession: 30,
    invoiceItemName: 'Kätelseisu rühmatrenn'
  }
];

// ── ALEX ──────────────────────────────────────────────────────
// Alex is NOT counted from the booking sheet. The script reads the
// numbers already in the "Alex" tab for the billed month (arv column:
// Jaanuar C ... Detsember Y; rows 5-7) with prices from column B,
// writes the Alex_arve invoice and emails it. Nothing in the Alex tab
// is changed.

const ALEX = {
  name: 'Alex',
  dataTab: 'Alex',
  invoiceTab: 'Alex_arve',                   // copy of Kadri_arve, Alex's email in C13
  rows: { tbp: 5, muu: 6, pass: 7 },         // rows in the Alex tab
  priceCol: 'B',                             // prices in Alex!B5:B7
  invoiceNames: {
    tbp:  'Total Body Performance',
    muu:  'Muu trenn',
    pass: 'Treeneri pääse'
  }
};

// Alex tab: Jan arv = C (0-indexed 2), Feb arv = E (4) ... Dec arv = Y (24)
function getAlexMonthCol(monthIndex) {
  return 2 + monthIndex * 2;
}

// Group trainer data tab: June=col M(12), July=col O(14)... step 2
// M=12(0-indexed), so colIndex = 12 + (monthIndex - 5) * 2  where June=5
function getGroupMonthCol(monthIndex) {
  return 12 + (monthIndex - 5) * 2; // M for June, O for July, Q for Aug...
}

// Within each Nädal block, row offsets (0-based) for each session type
const WEEK_ROW_OFFSETS = {
  normal_1:  0,
  normal_2:  1,
  normal_3:  2,
  private_1: 3,
  private_2: 4,
  private_3: 5
};

// Fallback prefix map
const TAB_PREFIX_MAP = {
  'June_': 5, 'July_': 6, 'Augs_': 7, 'Sept_': 8,
  'Oktb_': 9, 'Nvb_': 10, 'Decm_': 11,
  'Jan_': 0, 'Feb_': 1, 'Mar_': 2, 'Apr_': 3, 'Mai_': 4
};

const HEADER_ROW     = 16;
const DATA_START_ROW = 19;

const DAY_BLOCKS = [
  { dateCol: 2,  clientA: 2,  clientB: 3  },
  { dateCol: 4,  clientA: 4,  clientB: 5  },
  { dateCol: 7,  clientA: 7,  clientB: 8  },
  { dateCol: 9,  clientA: 9,  clientB: 10 },
  { dateCol: 12, clientA: 12, clientB: 13 },
  { dateCol: 14, clientA: 14, clientB: 15 },
  { dateCol: 17, clientA: 17, clientB: 18 }
];

// (Week numbering is determined by tab encounter order in processTrainer)

// ── READ VALID TAB PREFIXES FROM SEADED ──────────────────────

function readValidTabPrefixes(ss, targetYear) {
  try {
    const sheet = ss.getSheetByName('Seaded') || ss.getSheetByName('seaded');
    if (!sheet) throw new Error('Seaded not found');

    const colG = sheet.getRange('G1:G30').getValues().map(r => r[0].toString().trim());
    const prefixes = [];
    let insideTargetYear = false;

    for (const cell of colG) {
      if (cell === '') continue;
      const yearMatch = cell.match(/^(\d{4}):?$/);
      if (yearMatch) {
        insideTargetYear = parseInt(yearMatch[1]) === targetYear;
        continue;
      }
      if (insideTargetYear) prefixes.push(cell);
    }

    if (prefixes.length === 0) throw new Error('No prefixes found for year ' + targetYear);
    Logger.log('Valid tab prefixes for ' + targetYear + ': ' + JSON.stringify(prefixes));
    return prefixes;
  } catch (e) {
    Logger.log('Could not read tab prefixes from Seaded (' + e.message + '), using fallback.');
    return Object.keys(TAB_PREFIX_MAP);
  }
}

function isValidBookingTab(tabName, validPrefixes) {
  return validPrefixes.some(prefix => tabName.startsWith(prefix));
}

// ── FUZZY MATCHING ───────────────────────────────────────────

function levenshtein(a, b) {
  a = a.toLowerCase().replace(/\s+/g, '');
  b = b.toLowerCase().replace(/\s+/g, '');
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function matchTrainer(cellText, otherCell, trainer) {
  if (!cellText || cellText.toString().trim() === '') return null;
  const raw = cellText.toString().trim();
  const isProov = /p[r]+[ou]+[ao]*v/i.test(raw.replace(/[()"\-\s]/g,''));
  const namePart = raw.replace(/\bPT\b.*/i, '').replace(/[()"\-]/g,'').trim();

  let matched = false;
  for (const alias of trainer.aliases) {
    const aliasName = alias.replace(/PT.*/i,'').replace(/\s+/g,'').toLowerCase();
    const nameClean = namePart.replace(/\s+/g,'').toLowerCase();
    if (!aliasName) continue;
    if (nameClean === aliasName || nameClean.startsWith(aliasName) || aliasName.startsWith(nameClean)) {
      matched = true; break;
    }
    const threshold = Math.max(1, Math.floor(aliasName.length / 4));
    if (levenshtein(nameClean, aliasName) <= threshold) { matched = true; break; }
  }

  if (!matched) return null;
  if (!/\bPT\b/i.test(raw) && !isProov) return null;

  let extraClients = 0;
  const plusMatch = raw.match(/\+(\d)/);
  if (plusMatch) extraClients = parseInt(plusMatch[1]);
  const clientCount = 1 + extraClients;

  const otherTrimmed = (otherCell || '').toString().trim();
  const isPrivate = otherTrimmed.toUpperCase() === 'P';
  const isGroup = /kalisteenika|group|rühmatrenn/i.test(raw);

  return { matched: true, isProov, isPrivate, clientCount, isGroup, rawText: raw };
}

function cellIsProov(cellText) {
  if (!cellText || cellText.toString().trim() === '') return false;
  const clean = cellText.toString().replace(/[()"\-\s]/g,'').toLowerCase();
  return /p[r]+[ou]+[ao]*v/.test(clean);
}

// ── DATE PARSING ─────────────────────────────────────────────

function parseDateHeader(header, year) {
  if (!header) return null;
  if (header instanceof Date && !isNaN(header.getTime())) return header;
  const str = header.toString().trim();
  const full = new Date(str);
  if (!isNaN(full.getTime())) return full;
  const match = str.match(/(\d+)[.\-\/](\w+)/);
  if (!match) return null;
  const day = parseInt(match[1]);
  const monthStr = match[2].toLowerCase();
  const months = { jan:0, feb:1, mar:2, apr:3, mai:4, may:4, jun:5, jul:6,
                   aug:7, sep:8, okt:9, oct:9, nov:10, dec:11 };
  const monthKey = Object.keys(months).find(k => monthStr.startsWith(k));
  if (monthKey === undefined) return null;
  return new Date(year, months[monthKey], day);
}

// ── PRICE LOOKUP ─────────────────────────────────────────────

function readPrices(ss) {
  const sheet = ss.getSheetByName('Seaded') || ss.getSheetByName('seaded');
  if (!sheet) throw new Error('Seaded tab not found!');
  const data = sheet.getRange('A1:B20').getValues();
  const prices = { normal: [0,0,0,0,0], private: [0,0,0,0,0], group: 0 };

  let inNormal = false, inPrivate = false;
  for (const row of data) {
    const label = row[0].toString().trim().toUpperCase();
    const val = parseFloat(row[1].toString().replace('€','').trim()) || 0;
    if (label.includes('NORMAL'))                                { inNormal = true; inPrivate = false; continue; }
    if (label.includes('PRIVAT') || label.includes('PRIVAATNE')){ inPrivate = true; inNormal = false; continue; }
    if (label.includes('TREENER +1 KLIENT') || label === 'TREENER +1 KLIENT:') {
      if (inNormal)  prices.normal[1]  = val;
      if (inPrivate) prices.private[1] = val;
    } else if (label.includes('+2 KLIENT')) {
      if (inNormal)  prices.normal[2]  = val;
      if (inPrivate) prices.private[2] = val;
    } else if (label.includes('+3 KLIENT')) {
      if (inNormal)  prices.normal[3]  = val;
      if (inPrivate) prices.private[3] = val;
    } else if (label.includes('+4 KLIENT')) {
      if (inNormal)  prices.normal[4]  = val;
      if (inPrivate) prices.private[4] = val;
    } else if (label === 'GROUP') {
      prices.group = val;
    }
  }
  return prices;
}

// ── MONTH COLUMN MAPPING ──────────────────────────────────────

function getMonthCol(monthIndex) {
  // Jan=C(2), Feb=E(4)... step 2 per month
  return 2 + (monthIndex * 2);
}

function colToLetter(col) {
  let letter = '';
  col++;
  while (col > 0) {
    let rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

// ── MAIN ENTRY POINT ──────────────────────────────────────────

function runMonthlyBilling() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const now = new Date();

  const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const targetYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  Logger.log(`Running billing for: ${targetYear}-${targetMonth + 1}`);

  const prices        = readPrices(ss);
  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);

  if (targetTabs.length === 0) {
    Logger.log('No booking tabs found for target month. Aborting.');
    return;
  }

  const reportLines = [];
  reportLines.push(`=== ÜKSUS Billing Report — ${getMonthName(targetMonth)} ${targetYear} ===\n`);

  for (const trainer of TRAINERS) {
    Logger.log(`\nProcessing trainer: ${trainer.name}`);
    const result = processTrainer(trainer, targetTabs, targetMonth, targetYear, prices);
    writeToDataTab(ss, trainer, result, targetMonth, prices);

    // Skip invoice if no billable sessions
    let preTotal = 0;
    for (let c = 1; c <= 3; c++) {
      preTotal += (result.normal[c]  || 0) * (prices.normal[c]  || 0);
      preTotal += (result.private[c] || 0) * (prices.private[c] || 0);
    }
    preTotal += result.group.normal  * prices.group;
    preTotal += result.group.private * prices.group;

    if (preTotal === 0) {
      Logger.log(`  No billable sessions for ${trainer.name} — skipping invoice and email`);
      reportLines.push(`Trainer: ${trainer.name}`);
      reportLines.push(`  No sessions this month — no invoice sent.\n`);
      continue;
    }

    const invoiceTotal = writeInvoice(ss, trainer, result, targetMonth, targetYear, prices);
    sendInvoiceEmail(ss, trainer, targetMonth, targetYear, invoiceTotal);

    reportLines.push(`Trainer: ${trainer.name}`);
    reportLines.push(`  Normal sessions: ${JSON.stringify(result.normal)}`);
    reportLines.push(`  Private sessions: ${JSON.stringify(result.private)}`);
    reportLines.push(`  Free (proov): ${result.proov}`);
    reportLines.push(`  TOTAL: €${invoiceTotal.toFixed(2)}\n`);
  }

  // Process group trainers
  for (const gTrainer of GROUP_TRAINERS) {
    Logger.log(`\nProcessing group trainer: ${gTrainer.name}`);
    const gResult = processGroupTrainer(gTrainer, targetTabs, targetMonth, targetYear);

    if (gResult.pieces === 0) {
      Logger.log(`  No sessions for ${gTrainer.name} — skipping invoice and email`);
      reportLines.push(`Trainer: ${gTrainer.name}`);
      reportLines.push(`  No sessions this month — no invoice sent.\n`);
      continue;
    }

    writeGroupToDataTab(ss, gTrainer, gResult, targetMonth);
    const gTotal = writeGroupInvoice(ss, gTrainer, gResult, targetMonth, targetYear);
    sendGroupInvoiceEmail(ss, gTrainer, targetMonth, targetYear, gTotal);

    reportLines.push(`Trainer: ${gTrainer.name}`);
    reportLines.push(`  Sessions: ${gResult.pieces}`);
    reportLines.push(`  TOTAL: €${gTotal.toFixed(2)}\n`);
  }

  // Alex (numbers taken from the Alex tab)
  Logger.log(`\nProcessing ${ALEX.name}`);
  const aTotal = writeAlexInvoice(ss, targetMonth, targetYear);
  reportLines.push(`Trainer: ${ALEX.name}`);
  if (aTotal > 0) {
    sendInvoiceEmail(ss, ALEX, targetMonth, targetYear, aTotal);
    reportLines.push(`  TOTAL: €${aTotal.toFixed(2)}\n`);
  } else {
    reportLines.push(`  Nothing in the Alex tab this month — no invoice sent.\n`);
  }

  sendOwnerReport(reportLines.join('\n'), targetMonth, targetYear);
  Logger.log('Done!');
}

// ── GET TARGET TABS ───────────────────────────────────────────

function getTargetTabs(bss, validPrefixes, targetMonth, targetYear) {
  const allSheets = bss.getSheets();
  const targetTabs = [];

  for (const sheet of allSheets) {
    const tabName = sheet.getName();
    if (!isValidBookingTab(tabName, validPrefixes)) {
      Logger.log(`  Skipping tab (wrong year/format): ${tabName}`);
      continue;
    }
    try {
      const headerVals = sheet.getRange(16, 1, 1, 20).getValues()[0];
      const hasTarget = headerVals.some(cell => {
        const d = parseDateHeader(cell, targetYear);
        return d && d.getMonth() === targetMonth;
      });
      if (hasTarget) {
        targetTabs.push(sheet);
        Logger.log(`  Found tab: ${tabName}`);
      }
    } catch(e) {
      Logger.log(`  Skipping tab ${tabName}: ${e.message}`);
    }
  }
  return targetTabs;
}

// ── PROCESS ONE TRAINER ───────────────────────────────────────

/**
 * Scans all target tabs in order. The first tab containing days from the
 * target month = Nädal 1, second = Nädal 2, etc.
 * Week number is determined purely by tab encounter order, not by date or tab name.
 * e.g. July_5 containing August 1-2 correctly becomes Nädal 1 for August.
 */
function processTrainer(trainer, tabs, targetMonth, targetYear, prices) {
  const result = {
    byWeek:  {},
    normal:  { 1: 0, 2: 0, 3: 0 },
    private: { 1: 0, 2: 0, 3: 0 },
    group:   { normal: 0, private: 0 },
    proov:   0
  };

  let weekCounter = 0;

  for (const tab of tabs) {
    const tabName = tab.getName();
    Logger.log(`  Scanning tab: ${tabName}`);

    const allData   = tab.getDataRange().getValues();
    const headerRow = allData[HEADER_ROW - 1] || [];

    const dayStructures = [];
    for (const block of DAY_BLOCKS) {
      const cell = headerRow[block.dateCol];
      const date = parseDateHeader(cell, targetYear);
      if (date && date.getMonth() === targetMonth) {
        dayStructures.push({ date, clientA: block.clientA, clientB: block.clientB });
        Logger.log(`    ${date.toDateString()} clientA=col${block.clientA+1} clientB=col${block.clientB+1}`);
      }
    }

    if (dayStructures.length === 0) continue;

    weekCounter++;
    const weekNum = weekCounter;
    Logger.log(`    → Nädal ${weekNum}`);

    if (!result.byWeek[weekNum]) {
      result.byWeek[weekNum] = {
        normal:  { 1: 0, 2: 0, 3: 0 },
        private: { 1: 0, 2: 0, 3: 0 }
      };
    }

    for (let r = DATA_START_ROW - 1; r < allData.length; r++) {
      const row = allData[r];
      for (const day of dayStructures) {
        const cellA = (row[day.clientA] || '').toString().trim();
        const cellB = (row[day.clientB] || '').toString().trim();

        let matchResult = matchTrainer(cellA, cellB, trainer);
        if (!matchResult) matchResult = matchTrainer(cellB, cellA, trainer);
        if (!matchResult) continue;

        let isActuallyProov = matchResult.isProov;
        if (!isActuallyProov) {
          const otherCell = matchResult.rawText === cellA ? cellB : cellA;
          if (cellIsProov(otherCell)) {
            const otherHasTrainer = /\bPT\b/i.test(otherCell) &&
              !cellIsProov(otherCell.replace(/p[r]+[ou]+[ao]*v/gi,''));
            if (!otherHasTrainer) isActuallyProov = true;
          }
        }

        if (isActuallyProov) {
          result.proov += 0.5;
        } else {
          const key = Math.min(matchResult.clientCount, 3);
          if (matchResult.isGroup) {
            if (matchResult.isPrivate) result.group.private += 0.5;
            else                       result.group.normal  += 0.5;
          } else if (matchResult.isPrivate) {
            result.byWeek[weekNum].private[key] = (result.byWeek[weekNum].private[key] || 0) + 0.5;
            result.private[key] = (result.private[key] || 0) + 0.5;
          } else {
            result.byWeek[weekNum].normal[key] = (result.byWeek[weekNum].normal[key] || 0) + 0.5;
            result.normal[key] = (result.normal[key] || 0) + 0.5;
          }
        }
      }
    }
  }

  Logger.log(`  Result for ${trainer.name}: normal=${JSON.stringify(result.normal)} private=${JSON.stringify(result.private)} proov=${result.proov}`);
  Logger.log(`  By week: ${JSON.stringify(result.byWeek)}`);
  return result;
}

// ── WRITE TO DATA TAB ─────────────────────────────────────────

function writeToDataTab(ss, trainer, result, targetMonth, prices) {
  const sheet = ss.getSheetByName(trainer.dataTab);
  if (!sheet) {
    Logger.log(`Data tab "${trainer.dataTab}" not found — skipping`);
    return;
  }

  const col    = colToLetter(getMonthCol(targetMonth));
  const amtCol = colToLetter(getMonthCol(targetMonth) + 1);
  Logger.log(`  Writing to ${trainer.dataTab} column ${col}/${amtCol}`);

  // Always clear all 6 week blocks first to avoid stale data from previous months
  for (let weekNum = 1; weekNum <= 6; weekNum++) {
    const baseRow = trainer.weekStartRow + (weekNum - 1) * trainer.weekStride;
    for (let offset = 0; offset <= 5; offset++) {
      sheet.getRange(`${col}${baseRow + offset}`).setValue(0);
      sheet.getRange(`${amtCol}${baseRow + offset}`).setValue(0);
    }
  }

  // Write actual data per week
  for (const [weekNumStr, weekData] of Object.entries(result.byWeek)) {
    const weekNum = parseInt(weekNumStr);
    const baseRow = trainer.weekStartRow + (weekNum - 1) * trainer.weekStride;

    const writes = [
      { offset: 0, hours: weekData.normal[1],  price: prices.normal[1]  },
      { offset: 1, hours: weekData.normal[2],  price: prices.normal[2]  },
      { offset: 2, hours: weekData.normal[3],  price: prices.normal[3]  },
      { offset: 3, hours: weekData.private[1], price: prices.private[1] },
      { offset: 4, hours: weekData.private[2], price: prices.private[2] },
      { offset: 5, hours: weekData.private[3], price: prices.private[3] }
    ];

    for (const w of writes) {
      const row = baseRow + w.offset;
      sheet.getRange(`${col}${row}`).setValue(w.hours || 0);
      sheet.getRange(`${amtCol}${row}`).setValue((w.hours || 0) * w.price);
    }
  }

  Logger.log(`  Data written for ${trainer.name}`);
}

// ── WRITE INVOICE ─────────────────────────────────────────────

function writeInvoice(ss, trainer, result, targetMonth, targetYear, prices) {
  const sheet = ss.getSheetByName(trainer.invoiceTab);
  if (!sheet) {
    Logger.log(`Invoice tab "${trainer.invoiceTab}" not found — skipping`);
    return 0;
  }

  // Increment invoice number
  const seaded         = ss.getSheetByName('Seaded') || ss.getSheetByName('seaded');
  const invoiceNumCell = seaded.getRange('B1');
  const currentNum     = parseInt(invoiceNumCell.getValue().toString()) || 543;
  const newNum         = currentNum + 1;
  invoiceNumCell.setValue(String(newNum).padStart(4, '0'));
  const invoiceNumStr  = String(newNum).padStart(4, '0');

  // Dates
  const today   = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 7);
  const fmtDate = d =>
    `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear().toString().slice(-2)}`;

  // Write invoice number and dates — clear the H column duplicates first
  sheet.getRange('G3').setValue(invoiceNumStr);
  sheet.getRange('H3').clearContent();
  sheet.getRange('G8').setValue(fmtDate(today));
  sheet.getRange('H8').clearContent();
  sheet.getRange('G9').setValue(fmtDate(dueDate));
  sheet.getRange('H9').clearContent();

  // Build line items
  const lineItems = [];
  const addLine = (desc, hours, pricePerHour) => {
    if (hours > 0) lineItems.push({ desc, hours, price: pricePerHour, total: hours * pricePerHour });
  };

  addLine('Personaaltrennid 1 klient',         result.normal[1],  prices.normal[1]);
  addLine('Personaaltrennid 2 klienti',         result.normal[2],  prices.normal[2]);
  addLine('Personaaltrennid 3 klienti',         result.normal[3],  prices.normal[3]);
  addLine('Privaatne trenn 1 klient',           result.private[1], prices.private[1]);
  addLine('Privaatne trenn 2 klienti',          result.private[2], prices.private[2]);
  addLine('Privaatne trenn 3 klienti',          result.private[3], prices.private[3]);
  if (result.group.normal  > 0) addLine('Grupp trenn',            result.group.normal,  prices.group);
  if (result.group.private > 0) addLine('Grupp trenn privaatne',  result.group.private, prices.group);

  // Clear only line item data cells — preserve any labels outside this range
  // Columns: B=description, E=qty, F=unit, G=price, H=total
  for (let r = 18; r <= 24; r++) {
    sheet.getRange(`B${r}`).clearContent();
    sheet.getRange(`E${r}`).clearContent();
    sheet.getRange(`F${r}`).clearContent();
    sheet.getRange(`G${r}`).clearContent();
    sheet.getRange(`H${r}`).clearContent();
  }

  // Write line items — no row insertion, fixed template rows 18-24 (max 7 line types)
  const startRow = 18;
  let grandTotal = 0;

  for (let i = 0; i < lineItems.length; i++) {
    const r    = startRow + i;
    const item = lineItems[i];
    sheet.getRange(`B${r}`).setValue(item.desc);
    sheet.getRange(`E${r}`).setValue(item.hours);
    sheet.getRange(`F${r}`).setValue('h');
    sheet.getRange(`G${r}`).setValue(item.price);
    sheet.getRange(`H${r}`).setValue(item.total);
    grandTotal += item.total;
  }

  // Write totals — H26 = Summa kokku, D28 = TASUMISELE KUULUB (plain value cells, no formulas)
  sheet.getRange('H26').setValue('€' + grandTotal.toFixed(2));
  sheet.getRange('D28').setValue('€' + grandTotal.toFixed(2));

  Logger.log(`  Invoice written for ${trainer.name}: €${grandTotal.toFixed(2)}, invoice #${invoiceNumStr}`);
  return grandTotal;
}

// ── SEND INVOICE EMAIL ────────────────────────────────────────

function sendInvoiceEmail(ss, trainer, targetMonth, targetYear, total) {
  const sheet = ss.getSheetByName(trainer.invoiceTab);
  if (!sheet) return;

  const recipientEmail = sheet.getRange('C13').getValue().toString().trim();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    Logger.log(`  No valid email in C13 for ${trainer.name} — skipping email`);
    return;
  }

  // Use trainer's first name for greeting
  const firstName  = trainer.name;
  const monthName  = getMonthName(targetMonth);
  const invoiceNum = sheet.getRange('G3').getValue();  // G3 has the current invoice number

  // Subject: Stuudio Üksus arve Month Year - invoiceNum
  const subject = `Stuudio Üksus arve ${monthName} ${targetYear} - ${invoiceNum}`;

  const signature = `------------------------------------------
Erik Epistoletto
juhataja, treener
Kehakultuuri stuudio Üksus
Erika 14-201, Tallinn, Arsenali Keskus
Tel: +37256667684
[www.stuudioyksus.ee](https://www.stuudioyksus.ee)`;

  const body = `Tere ${firstName}!

Manusest leiad ${monthName} ${targetYear} arve.

Arve nr: ${invoiceNum}
Summa: €${total.toFixed(2)}
Maksetähtaeg: 7 päeva

Aitäh!

${signature}`;

  const pdfBlob = exportSheetAsPdf(ss, trainer.invoiceTab);

  GmailApp.sendEmail(recipientEmail, subject, body, {
    attachments: pdfBlob ? [pdfBlob] : [],
    name: 'Üksus Stuudio'
  });

  Logger.log(`  Email sent to ${recipientEmail} for ${trainer.name}`);
}

// ── EXPORT SHEET AS PDF ───────────────────────────────────────

function exportSheetAsPdf(ss, sheetName) {
  try {
    const sheet   = ss.getSheetByName(sheetName);
    const sheetId = sheet.getSheetId();
    const ssId    = ss.getId();

    // Set print area to rows 1-40 to avoid exporting empty space below the invoice
    // r1=0&c1=0 = start row/col (0-indexed), r2=40&c2=8 = end row/col
    const url = `https://docs.google.com/spreadsheets/d/${ssId}/export` +
      `?format=pdf&gid=${sheetId}` +
      `&size=A4&portrait=true&fitw=true&gridlines=false` +
      `&top_margin=0.25&bottom_margin=0.25&left_margin=0.25&right_margin=0.25` +
      `&r1=0&c1=0&r2=40&c2=8`;

    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }
    });

    return response.getBlob().setName(`Arve_${sheetName}.pdf`);
  } catch (e) {
    Logger.log(`  PDF export failed: ${e.message}`);
    return null;
  }
}

// ── OWNER REPORT EMAIL ────────────────────────────────────────

function sendOwnerReport(reportText, targetMonth, targetYear) {
  const subject = `[Üksus] Kuuaruanne — ${getMonthName(targetMonth)} ${targetYear}`;
  GmailApp.sendEmail(SENDER_EMAIL, subject, reportText, { name: 'Üksus Billing Bot' });
  Logger.log('Owner report sent.');
}

// ── HELPERS ───────────────────────────────────────────────────

function getMonthName(monthIdx) {
  return ['Jaanuar','Veebruar','Märts','Aprill','Mai','Juuni',
          'Juuli','August','September','Oktoober','November','Detsember'][monthIdx];
}

// ── DIAGNOSTIC: list all tabs ─────────────────────────────────

function listTabs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('=== SETTINGS sheet tabs ===');
  ss.getSheets().forEach(s => Logger.log(`  "${s.getName()}"`));
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  Logger.log('=== BOOKING sheet tabs ===');
  bss.getSheets().forEach(s => Logger.log(`  "${s.getName()}"`));
}

// ── PROCESS GROUP TRAINER ────────────────────────────────────

/**
 * Counts sessions for a group trainer (Kadi/Villem).
 * Consecutive matching rows logic:
 *   1 lone row    = 0.5 session
 *   2-3 in a row  = 1 session
 *   4 in a row    = 2 sessions
 *   5 in a row    = 2.5 sessions
 *   General: Math.floor(count/2) + (count%2 === 1 ? 0.5 : 0) but
 *   actually: every 2-3 consecutive = 1, so we chunk runs:
 *   chunk of 1 = 0.5, chunk of 2 = 1, chunk of 3 = 1, chunk of 4 = 2, chunk of 5 = 2.5
 *   Formula: pieces = Math.floor(count / 2) + (count % 2 === 1 ? 0.5 : 0)
 *   BUT 3 consecutive = 1 not 1.5, so: pieces = Math.ceil(count / 2) when count<=3, else recurse
 *   Simplest correct rule per spec:
 *     1 → 0.5
 *     2 → 1
 *     3 → 1
 *     4 → 2
 *     5 → 2.5
 *     6 → 3 (two groups of 2-3)
 *   Pattern: Math.floor((count + 1) / 2) * 0.5... no.
 *   Let's just implement the spec directly with chunking:
 *   Split run into chunks of max 3: [3,3,3...] remainder 1→0.5, 2→1, 3→1
 */
function countSessionsFromRun(runLength) {
  if (runLength <= 0) return 0;
  let pieces = 0;
  let remaining = runLength;
  while (remaining > 0) {
    if (remaining === 1) { pieces += 0.5; remaining = 0; }
    else if (remaining === 2) { pieces += 1; remaining = 0; }
    else if (remaining === 3) { pieces += 1; remaining = 0; }
    else { pieces += 1; remaining -= 3; } // take a chunk of 3
  }
  return pieces;
}

function matchesGroupTrainer(cellA, cellB, gTrainer) {
  const a = (cellA || '').toString().toLowerCase();
  const b = (cellB || '').toString().toLowerCase();
  const aMatch = a.includes(gTrainer.colA);
  const bMatch = gTrainer.colB.some(kw => b.includes(kw));
  return aMatch && bMatch;
}

function processGroupTrainer(gTrainer, tabs, targetMonth, targetYear) {
  const result = { pieces: 0, byWeek: {} };
  let weekCounter = 0;

  for (const tab of tabs) {
    const tabName = tab.getName();
    const allData = tab.getDataRange().getValues();
    const headerRow = allData[HEADER_ROW - 1] || [];

    // Find all days in target month in this tab
    const dayStructures = [];
    for (const block of DAY_BLOCKS) {
      const cell = headerRow[block.dateCol];
      const date = parseDateHeader(cell, targetYear);
      if (date && date.getMonth() === targetMonth) {
        dayStructures.push({ date, clientA: block.clientA, clientB: block.clientB });
      }
    }

    if (dayStructures.length === 0) continue;

    weekCounter++;
    const weekNum = weekCounter;
    if (!result.byWeek[weekNum]) result.byWeek[weekNum] = 0;

    // For each day column, scan rows and count consecutive matching runs
    for (const day of dayStructures) {
      let runLength = 0;

      for (let r = DATA_START_ROW - 1; r < allData.length; r++) {
        const row = allData[r];
        const cellA = (row[day.clientA] || '').toString().trim();
        const cellB = (row[day.clientB] || '').toString().trim();

        if (matchesGroupTrainer(cellA, cellB, gTrainer)) {
          runLength++;
        } else {
          if (runLength > 0) {
            const sessions = countSessionsFromRun(runLength);
            result.pieces += sessions;
            result.byWeek[weekNum] += sessions;
            runLength = 0;
          }
        }
      }
      // End of column — flush remaining run
      if (runLength > 0) {
        const sessions = countSessionsFromRun(runLength);
        result.pieces += sessions;
        result.byWeek[weekNum] += sessions;
      }
    }
  }

  Logger.log(`  Group result for ${gTrainer.name}: ${result.pieces} sessions`);
  return result;
}

// ── WRITE GROUP TRAINER DATA TAB ──────────────────────────────

function writeGroupToDataTab(ss, gTrainer, gResult, targetMonth) {
  const sheet = ss.getSheetByName(gTrainer.dataTab);
  if (!sheet) {
    Logger.log(`Data tab "${gTrainer.dataTab}" not found — skipping`);
    return;
  }

  const colIdx = getGroupMonthCol(targetMonth);
  const col    = colToLetter(colIdx);
  Logger.log(`  Writing ${gTrainer.name} pieces to ${col}${gTrainer.piecesRow}`);

  // Always overwrite — replaces any previous data, manual entries, or old script values
  sheet.getRange(`${col}${gTrainer.piecesRow}`).setValue(gResult.pieces || 0);
}

// ── WRITE GROUP INVOICE ───────────────────────────────────────

function writeGroupInvoice(ss, gTrainer, gResult, targetMonth, targetYear) {
  const sheet = ss.getSheetByName(gTrainer.invoiceTab);
  if (!sheet) {
    Logger.log(`Invoice tab "${gTrainer.invoiceTab}" not found — skipping`);
    return 0;
  }

  // Increment invoice number
  const seaded         = ss.getSheetByName('Seaded') || ss.getSheetByName('seaded');
  const invoiceNumCell = seaded.getRange('B1');
  const currentNum     = parseInt(invoiceNumCell.getValue().toString()) || 543;
  const newNum         = currentNum + 1;
  invoiceNumCell.setValue(String(newNum).padStart(4, '0'));
  const invoiceNumStr  = String(newNum).padStart(4, '0');

  const today   = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 7);
  const fmtDate = d =>
    `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear().toString().slice(-2)}`;

  sheet.getRange('G3').setValue(invoiceNumStr);
  sheet.getRange('H3').clearContent();
  sheet.getRange('G8').setValue(fmtDate(today));
  sheet.getRange('H8').clearContent();
  sheet.getRange('G9').setValue(fmtDate(dueDate));
  sheet.getRange('H9').clearContent();

  // Clear line item area
  for (let r = 18; r <= 24; r++) {
    sheet.getRange(`B${r}`).clearContent();
    sheet.getRange(`E${r}`).clearContent();
    sheet.getRange(`F${r}`).clearContent();
    sheet.getRange(`G${r}`).clearContent();
    sheet.getRange(`H${r}`).clearContent();
  }

  const grandTotal = gResult.pieces * gTrainer.pricePerSession;

  // Single line item
  sheet.getRange('B18').setValue(gTrainer.invoiceItemName);
  sheet.getRange('E18').setValue(gResult.pieces);
  sheet.getRange('F18').setValue('h');
  sheet.getRange('G18').setValue(gTrainer.pricePerSession);
  sheet.getRange('H18').setValue(grandTotal);

  sheet.getRange('H26').setValue('€' + grandTotal.toFixed(2));
  sheet.getRange('D28').setValue('€' + grandTotal.toFixed(2));

  Logger.log(`  Group invoice written for ${gTrainer.name}: €${grandTotal.toFixed(2)}, invoice #${invoiceNumStr}`);
  return grandTotal;
}

// ── SEND GROUP INVOICE EMAIL ──────────────────────────────────

function sendGroupInvoiceEmail(ss, gTrainer, targetMonth, targetYear, total) {
  const sheet = ss.getSheetByName(gTrainer.invoiceTab);
  if (!sheet) return;

  const recipientEmail = sheet.getRange('C13').getValue().toString().trim();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    Logger.log(`  No valid email in C13 for ${gTrainer.name} — skipping email`);
    return;
  }

  const firstName  = gTrainer.name;
  const monthName  = getMonthName(targetMonth);
  const invoiceNum = sheet.getRange('G3').getValue();
  const subject    = `Stuudio Üksus arve ${monthName} ${targetYear} - ${invoiceNum}`;

  const signature = `------------------------------------------
Erik Epistoletto
juhataja, treener
Kehakultuuri stuudio Üksus
Erika 14-201, Tallinn, Arsenali Keskus
Tel: +37256667684
[www.stuudioyksus.ee](https://www.stuudioyksus.ee)`;

  const body = `Tere ${firstName}!

Manusest leiad ${monthName} ${targetYear} arve.

Arve nr: ${invoiceNum}
Summa: €${total.toFixed(2)}
Maksetähtaeg: 7 päeva

Aitäh!

${signature}`;

  const pdfBlob = exportSheetAsPdf(ss, gTrainer.invoiceTab);

  GmailApp.sendEmail(recipientEmail, subject, body, {
    attachments: pdfBlob ? [pdfBlob] : [],
    name: 'Üksus Stuudio'
  });

  Logger.log(`  Email sent to ${recipientEmail} for ${gTrainer.name}`);
}

// ── TEST: Kadi group trainer ──────────────────────────────────

function testKadi() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;
  const targetYear  = 2026;

  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);
  const gTrainer      = GROUP_TRAINERS.find(t => t.name === 'Kadi');

  const gResult = processGroupTrainer(gTrainer, targetTabs, targetMonth, targetYear);
  Logger.log(`Kadi sessions: ${gResult.pieces}`);
  Logger.log(`By week: ${JSON.stringify(gResult.byWeek)}`);

  writeGroupToDataTab(ss, gTrainer, gResult, targetMonth);
  const total = writeGroupInvoice(ss, gTrainer, gResult, targetMonth, targetYear);
  sendGroupInvoiceEmail(ss, gTrainer, targetMonth, targetYear, total);

  Logger.log(`\n✅ Kadi test complete. Total: €${total.toFixed(2)}`);
}

// ── TEST: Villem group trainer ────────────────────────────────

function testVillem() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;
  const targetYear  = 2026;

  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);
  const gTrainer      = GROUP_TRAINERS.find(t => t.name === 'Villem');

  const gResult = processGroupTrainer(gTrainer, targetTabs, targetMonth, targetYear);
  Logger.log(`Villem sessions: ${gResult.pieces}`);
  Logger.log(`By week: ${JSON.stringify(gResult.byWeek)}`);

  writeGroupToDataTab(ss, gTrainer, gResult, targetMonth);
  const total = writeGroupInvoice(ss, gTrainer, gResult, targetMonth, targetYear);
  sendGroupInvoiceEmail(ss, gTrainer, targetMonth, targetYear, total);

  Logger.log(`\n✅ Villem test complete. Total: €${total.toFixed(2)}`);
}

// ── FULL TEST RUN (forces June 2026) ─────────────────────────

function testFullRun() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;  // June
  const targetYear  = 2026;

  Logger.log(`Test full run for: ${targetYear}-${targetMonth + 1}`);

  const prices        = readPrices(ss);
  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);

  if (targetTabs.length === 0) {
    Logger.log('No booking tabs found. Aborting.');
    return;
  }

  const reportLines = [];
  reportLines.push(`=== ÜKSUS Billing Report — ${getMonthName(targetMonth)} ${targetYear} ===\n`);
  let grandReportTotal = 0;

  for (const trainer of TRAINERS) {
    Logger.log(`\nProcessing trainer: ${trainer.name}`);
    const result = processTrainer(trainer, targetTabs, targetMonth, targetYear, prices);
    writeToDataTab(ss, trainer, result, targetMonth, prices);

    let preTotal = 0;
    for (let c = 1; c <= 3; c++) {
      preTotal += (result.normal[c]  || 0) * (prices.normal[c]  || 0);
      preTotal += (result.private[c] || 0) * (prices.private[c] || 0);
    }
    preTotal += result.group.normal  * prices.group;
    preTotal += result.group.private * prices.group;

    if (preTotal === 0) {
      Logger.log(`  No billable sessions for ${trainer.name} — skipping`);
      reportLines.push(`Trainer: ${trainer.name}`);
      reportLines.push(`  No sessions this month — no invoice sent.\n`);
      continue;
    }

    const invoiceTotal = writeInvoice(ss, trainer, result, targetMonth, targetYear, prices);
    sendInvoiceEmail(ss, trainer, targetMonth, targetYear, invoiceTotal);
    reportLines.push(`Trainer: ${trainer.name}`);
    reportLines.push(`  TOTAL: €${invoiceTotal.toFixed(2)}\n`);
    grandReportTotal += invoiceTotal;
  }

  for (const gTrainer of GROUP_TRAINERS) {
    Logger.log(`\nProcessing group trainer: ${gTrainer.name}`);
    const gResult = processGroupTrainer(gTrainer, targetTabs, targetMonth, targetYear);
    writeGroupToDataTab(ss, gTrainer, gResult, targetMonth);

    if (gResult.pieces === 0) {
      Logger.log(`  No sessions for ${gTrainer.name} — skipping`);
      reportLines.push(`Trainer: ${gTrainer.name}`);
      reportLines.push(`  No sessions this month — no invoice sent.\n`);
      continue;
    }

    const gTotal = writeGroupInvoice(ss, gTrainer, gResult, targetMonth, targetYear);
    sendGroupInvoiceEmail(ss, gTrainer, targetMonth, targetYear, gTotal);
    grandReportTotal += gTotal;
    reportLines.push(`Trainer: ${gTrainer.name}`);
    reportLines.push(`  TOTAL: €${gTotal.toFixed(2)}\n`);
  }

  // Alex
  const aTotal = writeAlexInvoice(ss, targetMonth, targetYear);
  reportLines.push(`Trainer: ${ALEX.name}`);
  if (aTotal > 0) {
    sendInvoiceEmail(ss, ALEX, targetMonth, targetYear, aTotal);
    grandReportTotal += aTotal;
    reportLines.push(`  TOTAL: €${aTotal.toFixed(2)}\n`);
  } else {
    reportLines.push(`  No sessions this month — no invoice sent.\n`);
  }

  reportLines.push(`─────────────────────`);
  reportLines.push(`KOKKU: €${grandReportTotal.toFixed(2)}`);

  sendOwnerReport(reportLines.join('\n'), targetMonth, targetYear);
  Logger.log('\n✅ Test full run complete.');
}

// ── DRY RUN ───────────────────────────────────────────────────

function dryRun() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;
  const targetYear  = 2026;

  const prices        = readPrices(ss);
  Logger.log('Prices: ' + JSON.stringify(prices));

  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);
  Logger.log(`Found ${targetTabs.length} tabs: ${targetTabs.map(s => s.getName()).join(', ')}`);

  for (const trainer of TRAINERS) {
    const result = processTrainer(trainer, targetTabs, targetMonth, targetYear, prices);
    Logger.log(`\n=== ${trainer.name} ===`);
    Logger.log('Normal (hours): '  + JSON.stringify(result.normal));
    Logger.log('Private (hours): ' + JSON.stringify(result.private));
    Logger.log('Group: '           + JSON.stringify(result.group));
    Logger.log('Proov (free): '    + result.proov);
    Logger.log('By week: '         + JSON.stringify(result.byWeek));

    let total = 0;
    for (let c = 1; c <= 3; c++) {
      total += (result.normal[c]  || 0) * (prices.normal[c]  || 0);
      total += (result.private[c] || 0) * (prices.private[c] || 0);
    }
    total += result.group.normal  * prices.group;
    total += result.group.private * prices.group;
    Logger.log(`TOTAL: €${total.toFixed(2)}`);
  }

  // Group trainers
  for (const gTrainer of GROUP_TRAINERS) {
    const gResult = processGroupTrainer(gTrainer, targetTabs, targetMonth, targetYear);
    Logger.log(`\n=== ${gTrainer.name} (group) ===`);
    Logger.log(`Sessions: ${gResult.pieces}`);
    Logger.log(`By week: ${JSON.stringify(gResult.byWeek)}`);
    Logger.log(`TOTAL: €${(gResult.pieces * gTrainer.pricePerSession).toFixed(2)}`);
  }

  // Alex
  Logger.log(`\n=== ${ALEX.name} (from Alex tab) ===`);
  readAlexLines(ss, targetMonth).forEach(l => Logger.log(`${l.desc}: ${l.qty} x €${l.price} = €${l.total}`));

  Logger.log('\n✅ Dry run complete — no data was written or emails sent.');
}

// ── TEST: single trainer, writes data + invoice, sends email ──

function testKatrin() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;
  const targetYear  = 2026;

  const prices        = readPrices(ss);
  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);
  const trainer       = TRAINERS.find(t => t.name === 'Katrin');

  const result = processTrainer(trainer, targetTabs, targetMonth, targetYear, prices);
  writeToDataTab(ss, trainer, result, targetMonth, prices);
  const total  = writeInvoice(ss, trainer, result, targetMonth, targetYear, prices);
  sendInvoiceEmail(ss, trainer, targetMonth, targetYear, total);

  Logger.log(`\n✅ Katrin test complete. Total: €${total.toFixed(2)}`);
}

// ── TEST: Kadri only + owner report with both trainers ────────

function testKadri() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  const bss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const targetMonth = 5;
  const targetYear  = 2026;

  const prices        = readPrices(ss);
  const validPrefixes = readValidTabPrefixes(ss, targetYear);
  const targetTabs    = getTargetTabs(bss, validPrefixes, targetMonth, targetYear);

  // Process and send Kadri invoice
  const kadri       = TRAINERS.find(t => t.name === 'Kadri');
  const kadriResult = processTrainer(kadri, targetTabs, targetMonth, targetYear, prices);
  writeToDataTab(ss, kadri, kadriResult, targetMonth, prices);
  const kadriTotal  = writeInvoice(ss, kadri, kadriResult, targetMonth, targetYear, prices);
  sendInvoiceEmail(ss, kadri, targetMonth, targetYear, kadriTotal);
  Logger.log(`Kadri invoice sent. Total: €${kadriTotal.toFixed(2)}`);

  // Also get Katrin total from her invoice tab (already written in testKatrin)
  const katrinSheet = ss.getSheetByName('Katrin_arve');
  const katrinTotal = parseFloat(ss.getSheetByName('Katrin_arve').getRange('H26').getValue().toString().replace('€','')) || 0;

  // Get Kadi and Villem totals from their invoice tabs if already written
  const kadiSheet   = ss.getSheetByName('Kadi_arve');
  const villemSheet = ss.getSheetByName('Villem_arve');
  const kadiTotal   = kadiSheet   ? parseFloat((kadiSheet.getRange('H26').getValue()  || '0').toString().replace('€','')) || 0 : 0;
  const villemTotal = villemSheet ? parseFloat((villemSheet.getRange('H26').getValue() || '0').toString().replace('€','')) || 0 : 0;

  // Send owner report with all 4 trainers
  const monthName = getMonthName(targetMonth);
  const grandTotal = katrinTotal + kadriTotal + kadiTotal + villemTotal;
  const reportText = `=== Üksus Stuudio — ${monthName} ${targetYear} kokkuvõte ===

Katrin: €${katrinTotal.toFixed(2)}
Kadri:  €${kadriTotal.toFixed(2)}
Kadi:   €${kadiTotal.toFixed(2)}
Villem: €${villemTotal.toFixed(2)}
─────────────────────
KOKKU:  €${grandTotal.toFixed(2)}

Arved on saadetud.`;

  const subject = `[Üksus] ${monthName} ${targetYear} kokkuvõte`;
  GmailApp.sendEmail(SENDER_EMAIL, subject, reportText, { name: 'Üksus Billing Bot' });
  Logger.log(`Owner report sent.\n${reportText}`);

  Logger.log(`\n✅ Kadri test complete. Total: €${kadriTotal.toFixed(2)}`);
}

// ── DIAGNOSTIC: inspect raw sheet structure ───────────────────

function debugSheet() {
  const bss   = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  const sheet = bss.getSheetByName('June_1');
  if (!sheet) { Logger.log('June_1 not found!'); return; }

  Logger.log('=== Rows 14-20, columns A-U ===');
  const data = sheet.getRange(14, 1, 8, 22).getValues();
  data.forEach((row, i) => {
    const nonEmpty = row.map((v,j) => v !== '' ? `[col${j+1}]="${v}"` : null).filter(Boolean);
    if (nonEmpty.length > 0) Logger.log(`Row ${14+i}: ${nonEmpty.join(' | ')}`);
  });

  Logger.log('\n=== Sample data rows 19-25 ===');
  const sample = sheet.getRange(19, 1, 7, 22).getValues();
  sample.forEach((row, i) => {
    const nonEmpty = row.map((v,j) => v !== '' ? `[col${j+1}]="${v}"` : null).filter(Boolean);
    if (nonEmpty.length > 0) Logger.log(`Row ${19+i}: ${nonEmpty.join(' | ')}`);
  });
}

// ── HOW TO SET UP THE MONTHLY TRIGGER ─────────────────────────
// 1. In Apps Script editor: click ⏰ Triggers (left sidebar)
// 2. Add Trigger → function: runMonthlyBilling
// 3. Event source: Time-driven → Month timer → Day of month: 1 → Hour: 8-9am

// ── DIAGNOSTIC: dump Katrin_arve cell values and formulas ─────

function dumpInvoiceSheet() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Katrin_arve');
  if (!sheet) { Logger.log('Katrin_arve not found!'); return; }

  const cells = [
    'F3','G3','H3',
    'F8','G8','H8',
    'F9','G9','H9',
    'B18','E18','F18','G18','H18',
    'B19','E19','F19','G19','H19',
    'A25','B25','C25','D25','E25','F25','G25','H25',
    'A26','B26','C26','D26','E26','F26','G26','H26',
    'A27','B27','C27','D27','E27','F27','G27','H27',
    'A28','B28','C28','D28','E28','F28','G28','H28',
    'A29','B29','C29','D29','E29','F29','G29','H29'
  ];

  Logger.log('=== Katrin_arve cell dump ===');
  cells.forEach(addr => {
    const cell    = sheet.getRange(addr);
    const val     = cell.getValue();
    const formula = cell.getFormula();
    Logger.log(`${addr}: value="${val}"  formula="${formula}"`);
  });
}

// ============================================================
// ── ALEX ──────────────────────────────────────────────────────
// ============================================================

// Reads Alex's lines for the month from the Alex tab
function readAlexLines(ss, targetMonth) {
  const data = ss.getSheetByName(ALEX.dataTab);
  if (!data) { Logger.log(`Data tab "${ALEX.dataTab}" not found`); return []; }
  const col = colToLetter(getAlexMonthCol(targetMonth));

  const lines = [];
  for (const key of ['tbp', 'muu', 'pass']) {
    const r     = ALEX.rows[key];
    const qty   = parseFloat(data.getRange(`${col}${r}`).getValue()) || 0;
    const price = parseFloat(data.getRange(`${ALEX.priceCol}${r}`).getValue().toString().replace('€','').replace(',','.')) || 0;
    if (qty > 0) lines.push({ desc: ALEX.invoiceNames[key], qty, price, total: qty * price });
  }
  return lines;
}

/**
 * Writes the Alex_arve invoice from the Alex tab numbers.
 * Returns the total, 0 if there is nothing to bill.
 */
function writeAlexInvoice(ss, targetMonth, targetYear) {
  const lines = readAlexLines(ss, targetMonth);
  if (lines.length === 0) {
    Logger.log('  Nothing in the Alex tab for this month — skipping invoice');
    return 0;
  }

  const sheet = ss.getSheetByName(ALEX.invoiceTab);
  if (!sheet) { Logger.log(`Invoice tab "${ALEX.invoiceTab}" not found — skipping`); return 0; }

  const seaded         = ss.getSheetByName('Seaded') || ss.getSheetByName('seaded');
  const invoiceNumCell = seaded.getRange('B1');
  const newNum         = (parseInt(invoiceNumCell.getValue().toString()) || 543) + 1;
  const invoiceNumStr  = String(newNum).padStart(4, '0');
  invoiceNumCell.setValue(invoiceNumStr);

  const today   = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 7);
  const fmtDate = d =>
    `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear().toString().slice(-2)}`;

  sheet.getRange('G3').setValue(invoiceNumStr);
  sheet.getRange('H3').clearContent();
  sheet.getRange('G8').setValue(fmtDate(today));
  sheet.getRange('H8').clearContent();
  sheet.getRange('G9').setValue(fmtDate(dueDate));
  sheet.getRange('H9').clearContent();

  for (let r = 18; r <= 24; r++) {
    ['B','E','F','G','H'].forEach(c => sheet.getRange(`${c}${r}`).clearContent());
  }

  let grandTotal = 0;
  lines.forEach((item, i) => {
    const r = 18 + i;
    sheet.getRange(`B${r}`).setValue(item.desc);
    sheet.getRange(`E${r}`).setValue(item.qty);
    sheet.getRange(`F${r}`).setValue('h');
    sheet.getRange(`G${r}`).setValue(item.price);
    sheet.getRange(`H${r}`).setValue(item.total);
    grandTotal += item.total;
  });

  sheet.getRange('H26').setValue('€' + grandTotal.toFixed(2));
  sheet.getRange('D28').setValue('€' + grandTotal.toFixed(2));
  SpreadsheetApp.flush();

  Logger.log(`  Alex invoice written: €${grandTotal.toFixed(2)}, invoice #${invoiceNumStr}`);
  return grandTotal;
}

// ── TEST: Alex, LOG ONLY (writes nothing, sends nothing) ──────
// Change the month to check: 0 = January ... 9 = October

function dryRunAlex() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const targetMonth = 9;   // October
  const lines = readAlexLines(ss, targetMonth);
  Logger.log(`=== Alex ${getMonthName(targetMonth)} ===`);
  let total = 0;
  lines.forEach(l => { Logger.log(`${l.desc}: ${l.qty} x €${l.price} = €${l.total}`); total += l.total; });
  Logger.log(`TOTAL: €${total.toFixed(2)}`);
  Logger.log('✅ Alex dry run complete — nothing written, no email sent.');
}

// ── TEST: Alex for real (writes Alex_arve, SENDS email) ───────

function testAlex() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const targetMonth = 10;  // November (October was already sent by hand)
  const targetYear  = 2026;
  const total = writeAlexInvoice(ss, targetMonth, targetYear);
  if (total > 0) sendInvoiceEmail(ss, ALEX, targetMonth, targetYear, total);
  Logger.log(`✅ Alex test complete. Total: €${total.toFixed(2)}`);
}

// ================================================================ ARVELDUSE LÕPP
