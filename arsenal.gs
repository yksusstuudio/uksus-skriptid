/*************************************************************************************
 *  ARSENAL + TELIA ARVED → BILANS 2026
 *  - Read leitakse SILDI järgi veerust A (Rent / Kommunaalid / Telia) -> ridade
 *    nihkumine ei riku enam andmeid.
 *  - Igakuine käivitus saadab meili AINULT KUI MIDAGI ON VALES (puuduv kuu või
 *    kahtlane number). Kui kõik korras -> VAIKUS = töötas.
 *  - Arve märgitakse "loetuks" AINULT kui see ka päriselt kirjutati -> vale lahtri
 *    parandamiseks piisab lahtri kustutamisest, järgmine käivitus täidab õigesti.
 *  - Puuduvaks loetakse kuu AINULT siis, kui arve on tavalisest ajast hiljaks jäänud
 *    (vt AR.due). Arvet, mis pole veel saabuda saanudki, ei nimetata puuduvaks.
 *
 *  Käivita: beatbeatinc@gmail.com kontolt.
 *  Seadista ÜKS KORD: menüü -> ⏰ Seadista igakuine käivitus. Edasi ära tee midagi.
 *************************************************************************************/

var AR = {
  fileId: "__ARSENAL_BILANSS_ID__",
  tab: "Bilans 2026",
  year: 2026,
  firstMonth: 1,
  startMonth: 3,        // kirjuta AINULT märtsist (jaan/veebr on käsitsi täidetud)
  firstCol: 2,          // B (Jaan=B ... Dets=M; col = month + 1)
  senderDomain: "arsenalkeskus.ee",
  senderTelia: "telia.ee",
  query: '(from:arsenalkeskus.ee OR from:telia.ee) has:attachment after:2026/02/28',
  seenKey: "ARSENAL_SEEN",
  seenKeepDays: 800,
  tz: "Europe/Tallinn",
  notifyEmail: "",      // tühi = saada kontole, kust skript jookseb
  // Millal arve hiljemalt kohal peaks olema (Erik 2.11): kuu M arve.
  //   next: 0 = samal kuul, 1 = järgmisel kuul; day = kuupäev. Puuduvaks loetakse alates järgmisest päevast.
  //   Rent tuleb 1.–4. samal kuul, Telia 2.–3. järgmisel kuul, kommunaalid ~14. järgmisel kuul.
  due: {
    rent:  { next: 0, day: 7 },
    util:  { next: 1, day: 20 },
    phone: { next: 1, day: 7 }
  }
};

var ROW_FINDERS = {
  RENT:  function (a) { return a === "rent"; },
  UTIL:  function (a) { return a.indexOf("kommunaal") !== -1; },
  PHONE: function (a) { return a.indexOf("telia") !== -1; }
};

/* ============================ MENÜÜ ============================ */
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu("🏢 Arsenal + Telia")
      .addItem("▶ Loe Arsenali arved nüüd (test)", "arsenalRunNow")
      .addItem("✉ Saada kontrollmeil kohe (test)", "arsenalSendCheckEmail")
      .addItem("⏰ Seadista igakuine käivitus (3. kp ~7:00)", "arsenalSetupTrigger")
      .addSeparator()
      .addItem("🔎 Näita jaotust (breakdown)", "arsenalBreakdown")
      .addItem("📋 Kontrolli ridade silte", "arsenalVerifyRows")
      .addSeparator()
      .addItem("🧹 Tühjenda 'loetud' mälu (test)", "arsenalClearSeen")
      .addToUi();
  } catch (e) {
    Logger.log("onOpen: UI pole saadaval (redaktorist jooksutatud) – menüüd ei loo. " + e);
  }
}

/* ============================ KÄIVITAJAD ============================ */
function arsenalSetupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "arsenalMonthly") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("arsenalMonthly").timeBased().onMonthDay(3).atHour(7).create();
  toastAR_("⏰ Valmis. Jookseb iga kuu 3. kp. Meil tuleb AINULT kui midagi on vales. Vaikus = töötas.");
}
function arsenalMonthly() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return;
  try { arsenalCore_(false, "PROBLEM_ONLY"); } finally { lock.releaseLock(); }
}
function arsenalRunNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) { toastAR_("Juba töötab, oota hetk."); return; }
  try { arsenalCore_(true, "NONE"); } finally { lock.releaseLock(); }
}
function arsenalClearSeen() {
  PropertiesService.getScriptProperties().deleteProperty(AR.seenKey);
  toastAR_("Arsenali 'loetud' mälu tühjendatud.");
}
function arsenalSendCheckEmail() {
  var sh = SpreadsheetApp.openById(AR.fileId).getSheetByName(AR.tab);
  if (!sh) { toastAR_("Tabi '" + AR.tab + "' ei leitud."); return; }
  var rows = findAllRows_(sh);
  var health = buildHealth_(sh, rows, null);
  sendReport_(health.text);        // käsitsi test: saada alati
  toastAR_(health.hasProblem ? "Kontrollmeil saadetud (leidus probleeme)." : "Kontrollmeil saadetud (kõik korras).");
}

function findRow_(sh, which) {
  var test = ROW_FINDERS[which];
  var last = sh.getLastRow();
  var labels = sh.getRange(1, 1, last, 1).getValues();
  for (var i = 0; i < labels.length; i++) {
    var a = String(labels[i][0]).trim().toLowerCase();
    if (a && test(a)) return i + 1;
  }
  return null;
}
function findAllRows_(sh) {
  return { rent: findRow_(sh, "RENT"), util: findRow_(sh, "UTIL"), phone: findRow_(sh, "PHONE") };
}

/* ============================ PÕHILOOGIKA ============================
 * emailMode: "PROBLEM_ONLY" = meil ainult kui probleem; "NONE" = ära saada. */
function arsenalCore_(verbose, emailMode) {
  var sh = SpreadsheetApp.openById(AR.fileId).getSheetByName(AR.tab);
  if (!sh) { toastAR_("Tabi '" + AR.tab + "' ei leitud."); return; }

  var rows = findAllRows_(sh);
  if (!rows.rent || !rows.util || !rows.phone) {
    var msg = "⚠ Ridu ei leitud (Rent=" + rows.rent + ", Kommunaalid=" + rows.util +
      ", Telia=" + rows.phone + "). Kontrolli silte veerus A – EI kirjutatud midagi.";
    toastAR_(msg);
    if (emailMode === "PROBLEM_ONLY") sendReport_(msg);
    return;
  }
  if (verbose) Logger.log("Read: Rent=" + rows.rent + " Kommunaalid=" + rows.util + " Telia=" + rows.phone);

  var seen = readSeenAR_();
  var nowMs = Date.now();
  var threads = GmailApp.search(AR.query, 0, 200);
  var writes = [];

  for (var t = 0; t < threads.length; t++) {
    var msgs = threads[t].getMessages();
    for (var m = 0; m < msgs.length; m++) {
      var mg = msgs[m];
      var from = String(mg.getFrom()).toLowerCase();
      var isArsenal = from.indexOf(AR.senderDomain) !== -1;
      var isTelia = from.indexOf(AR.senderTelia) !== -1;
      if (!isArsenal && !isTelia) continue;

      var atts = mg.getAttachments();
      for (var a = 0; a < atts.length; a++) {
        var att = atts[a];
        if (String(att.getContentType()).toLowerCase().indexOf("pdf") === -1 &&
            String(att.getName()).toLowerCase().indexOf(".pdf") === -1) continue;

        var text = pdfToText_(att);
        if (!text) { if (verbose) Logger.log("✗ PDF teksti ei saanud: " + att.getName()); continue; }

        var inv = isTelia ? parseTelia_(text) : parseInvoice_(text);
        if (!inv.invNo) inv.invNo = att.getName();
        var key = inv.invNo + "|" + (inv.type || "TELIA");
        if (seen[key]) continue;

        if (!inv.amount || !inv.month || inv.year !== AR.year) {
          if (verbose) Logger.log("✗ ei parsinud (summa/kuu/aasta): " + att.getName() + " | " + JSON.stringify(inv));
          continue;
        }
        if (inv.month < AR.startMonth) {
          if (verbose) Logger.log("⏭ enne märtsi (käsitsi täidetud): " + monthNameAR_(inv.month) + " | " + att.getName());
          continue;
        }
        if (isTelia)                  writes.push({ row: rows.phone, month: inv.month, amount: inv.amount, invNo: inv.invNo, type: "Telefon",     key: key });
        else if (inv.type === "RENT") writes.push({ row: rows.rent,  month: inv.month, amount: inv.amount, invNo: inv.invNo, type: "Üür",         key: key });
        else if (inv.type === "UTIL") writes.push({ row: rows.util,  month: inv.month, amount: inv.amount, invNo: inv.invNo, type: "Kõrvalkulud", key: key });
        else { if (verbose) Logger.log("✗ tüüp tundmatu: " + att.getName()); continue; }
      }
    }
  }

  var written = [];
  for (var w = 0; w < writes.length; w++) {
    var x = writes[w];
    var col = AR.firstCol + (x.month - AR.firstMonth);
    var cell = sh.getRange(x.row, col);
    var existing = cell.getValue();
    if (existing === "" || existing === null) {
      cell.setValue(x.amount);
      seen[x.key] = nowMs;   // MÄRGI LOETUKS AINULT KUI KIRJUTASIME
      written.push(x.type + " " + monthNameAR_(x.month) + "=" + x.amount.toFixed(2) + "€");
      if (verbose) Logger.log("OK " + x.type + " | arve " + x.invNo + " | " +
        monthNameAR_(x.month) + " (" + colLetterAR_(col) + x.row + ") = " + x.amount);
    } else {
      // EI märgi loetuks – kui kustutad vale lahtri, järgmine käivitus täidab õigesti
      if (verbose) Logger.log("⏭ " + x.type + " " + monthNameAR_(x.month) + " juba täidetud (" + existing + ").");
    }
  }
  if (written.length) SpreadsheetApp.flush();

  pruneSeenAR_(seen, nowMs);
  writeSeenAR_(seen);

  var summary = written.length ? ("Lisatud: " + written.join(", ")) : "Uusi Arsenali arveid ei leitud.";
  if (verbose) Logger.log(summary);
  toastAR_(summary);

  // MEIL AINULT KUI PROBLEEM
  if (emailMode === "PROBLEM_ONLY") {
    var health = buildHealth_(sh, rows, written);
    if (health.hasProblem) sendReport_(health.text);
    else Logger.log("Kõik korras – meili ei saadetud.");
  }
}

/* ============================ TERVISEKONTROLL ============================
 * Tagastab { hasProblem: bool, text: string }. Probleem = hilinenud (puuduv) kuu VÕI kahtlane number.
 * Kuu loetakse puuduvaks alles siis, kui tema arve tähtaeg (AR.due) on möödas. */
function overdueAR_(mo, due, now) {
  var deadline = new Date(AR.year, mo - 1 + due.next, due.day + 1);   // järgmise päeva algus
  return now.getTime() >= deadline.getTime();
}
function buildHealth_(sh, rows, written) {
  var now = new Date();
  var rentV = sh.getRange(rows.rent,  AR.firstCol, 1, 12).getValues()[0];
  var utilV = sh.getRange(rows.util,  AR.firstCol, 1, 12).getValues()[0];
  var telV  = sh.getRange(rows.phone, AR.firstCol, 1, 12).getValues()[0];

  var telFilled = telV.filter(function (v) { return typeof v === "number" && v > 0; });
  var telTypical = telFilled.length ? Math.min.apply(null, telFilled) : null;

  var gaps = [], warns = [];
  for (var mo = AR.startMonth; mo <= 12; mo++) {
    var i = mo - 1;
    if (rentV[i] === "" && overdueAR_(mo, AR.due.rent, now))  gaps.push("Rent " + monthNameAR_(mo));
    if (utilV[i] === "" && overdueAR_(mo, AR.due.util, now))  gaps.push("Kommunaalid " + monthNameAR_(mo));
    if (telV[i]  === "" && overdueAR_(mo, AR.due.phone, now)) gaps.push("Telia " + monthNameAR_(mo));
    if (typeof telV[i] === "number" && telV[i] > 0) {
      if (utilV[i] !== "" && utilV[i] === telV[i])
        warns.push("Telia " + monthNameAR_(mo) + "=" + telV[i] + " (VÕRDNE Kommunaalidega – tõenäoliselt vale, kustuta see lahter)");
      else if (telTypical && telV[i] > telTypical * 3)
        warns.push("Telia " + monthNameAR_(mo) + "=" + telV[i] + " (tavaline ~" + telTypical + "€ – kontrolli, vajadusel kustuta lahter)");
    }
  }

  var hasProblem = (gaps.length > 0 || warns.length > 0);
  var L = [];
  L.push("ARSENAL / TELIA – Bilans 2026");
  L.push(Utilities.formatDate(new Date(), AR.tz, "dd.MM.yyyy HH:mm"));
  L.push("");
  if (written && written.length) L.push("Sel korral lisatud: " + written.join(", "));
  if (hasProblem) {
    L.push("");
    L.push("⚠ MIDAGI VAJAB TÄHELEPANU:");
    if (gaps.length)  L.push("• Hilinenud arved (tähtaeg möödas, lahter tühi): " + gaps.join(", "));
    if (warns.length) L.push("• Kahtlased numbrid: " + warns.join("; "));
    L.push("");
    L.push("PARANDUS: kustuta vale/puuduv lahter Bilans-failis. Kui arve on Gmailis, täidab järgmine käivitus õige summa; kui ei ole, kirjuta ise.");
  } else {
    L.push("Kõik korras – midagi ei vaja tegemist. (See meil saadeti ainult käsitsi testina.)");
  }
  return { hasProblem: hasProblem, text: L.join("\n") };
}
function sendReport_(text) {
  var to = AR.notifyEmail || Session.getEffectiveUser().getEmail();
  try {
    MailApp.sendEmail(to, "⚠ Arsenal/Telia – midagi vajab tähelepanu (Bilans 2026)", text);
    Logger.log("Raport saadetud: " + to);
  } catch (e) {
    Logger.log("Raporti saatmine ebaõnnestus: " + e);
  }
}

/* ============================ PDF -> TEKST (Drive) ============================ */
function pdfToText_(att) {
  for (var attempt = 1; attempt <= 3; attempt++) {
    var tempId = null;
    try {
      var blob = att.copyBlob();
      var file;
      if (Drive.Files && typeof Drive.Files.create === "function") {
        file = Drive.Files.create(
          { name: "tmp_arsenal_" + Date.now(), mimeType: "application/vnd.google-apps.document" },
          blob, { ocrLanguage: "et" });
      } else if (Drive.Files && typeof Drive.Files.insert === "function") {
        file = Drive.Files.insert(
          { title: "tmp_arsenal_" + Date.now(), mimeType: "application/vnd.google-apps.document" },
          blob, { ocr: true, ocrLanguage: "et", convert: true });
      } else {
        Logger.log("Drive teenus pole lubatud."); return null;
      }
      tempId = file.id;
      var text = DocumentApp.openById(tempId).getBody().getText();
      cleanupTemp_(tempId); tempId = null;
      return text;
    } catch (e) {
      if (tempId) cleanupTemp_(tempId);
      Logger.log("pdfToText_ katse " + attempt + " viga: " + e);
      if (attempt < 3) Utilities.sleep(1500 * attempt);
    }
  }
  return null;
}
function cleanupTemp_(tempId) {
  try {
    if (Drive.Files && typeof Drive.Files.remove === "function") Drive.Files.remove(tempId);
    else if (Drive.Files && typeof Drive.Files.del === "function") Drive.Files.del(tempId);
    else DriveApp.getFileById(tempId).setTrashed(true);
  } catch (e) {}
}

/* ============================ PARSING ============================ */
function parseInvoice_(text) {
  var out = { month: null, year: null, amount: null, type: null, invNo: null };
  var inv = text.match(/Arve\s*nr\.?:?\s*([0-9]+)/i);
  if (inv) out.invNo = inv[1];
  var per = text.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
  if (per) { out.month = parseInt(per[5], 10); out.year = parseInt(per[6], 10); }
  var tail = text;
  var eurIdx = text.lastIndexOf("EUR");
  if (eurIdx === -1) eurIdx = text.toLowerCase().lastIndexOf("kokku");
  if (eurIdx !== -1) tail = text.substring(eurIdx);
  var nums = [];
  var re = /(\d{1,3}(?:\s\d{3})*,\d{2})(?!\d)/g, m;
  while ((m = re.exec(tail)) !== null) { var v = toNum_(m[1]); if (v != null) nums.push(v); }
  if (!nums.length) {
    re = /(\d{1,3}(?:\s\d{3})*,\d{2})(?!\d)/g;
    while ((m = re.exec(text)) !== null) { var v2 = toNum_(m[1]); if (v2 != null) nums.push(v2); }
  }
  if (nums.length) out.amount = Math.max.apply(null, nums);
  var low = text.toLowerCase();
  var hasUtil = (low.indexOf("kõrvalkulud") !== -1) || (low.indexOf("vesi") !== -1) ||
                (low.indexOf("elekter") !== -1) || (low.indexOf("kaugküte") !== -1) ||
                (low.indexOf("prügivedu") !== -1);
  var hasRentWord = /(^|[^i])üür([^i]|$)/i.test(low.replace(/üürileping/g, "xxx"));
  if (hasUtil) out.type = "UTIL";
  else if (hasRentWord) out.type = "RENT";
  return out;
}
function toNum_(s) {
  var raw = String(s).replace(/\s/g, "");
  raw = raw.replace(/\./g, "").replace(",", ".");
  var n = parseFloat(raw);
  return isNaN(n) ? null : n;
}
function parseTelia_(text) {
  var out = { month: null, year: null, amount: null, invNo: null, type: "TELIA" };
  var inv = text.match(/Arve\s+(\d{10,})/i); if (inv) out.invNo = inv[1];
  var kp = text.match(/Kuupäev\s+(\d{2})\.(\d{2})\.(\d{4})/i);
  if (kp) { out.month = parseInt(kp[2], 10); out.year = parseInt(kp[3], 10); }
  var m = text.match(/Käesoleva\s+arve\s+summa[^\n]*?maksetähtaeg\s+\d{2}\.\d{2}\.\d{4}\s+(\d{1,3}(?:\s\d{3})*,\d{2})/i);
  if (m) { out.amount = toNum_(m[1]); }
  else {
    var idx = text.toLowerCase().indexOf("käesoleva arve summa");
    if (idx !== -1) {
      var nl = text.indexOf("\n", idx); if (nl === -1) nl = idx + 120;
      var seg = text.substring(idx, nl).replace(/\d{2}\.\d{2}\.\d{4}/, "");
      var a = seg.match(/(\d{1,3}(?:\s\d{3})*,\d{2})/);
      if (a) out.amount = toNum_(a[1]);
    }
  }
  return out;
}

/* ============================ MÄLU ============================ */
function readSeenAR_() {
  var s = PropertiesService.getScriptProperties().getProperty(AR.seenKey);
  if (!s) return {};
  try { return JSON.parse(s); } catch (e) { return {}; }
}
function writeSeenAR_(o) { PropertiesService.getScriptProperties().setProperty(AR.seenKey, JSON.stringify(o)); }
function pruneSeenAR_(o, nowMs) {
  var cutoff = nowMs - AR.seenKeepDays * 86400000;
  for (var k in o) if (typeof o[k] === "number" && o[k] < cutoff) delete o[k];
}

/* ============================ ABI ============================ */
function toastAR_(m) {
  Logger.log("[Arsenal] " + m);
  try { SpreadsheetApp.getActiveSpreadsheet().toast(m, "Arsenal arved", 6); } catch (e) {}
}
function colLetterAR_(c) { var s = ""; while (c > 0) { var x = (c - 1) % 26; s = String.fromCharCode(65 + x) + s; c = Math.floor((c - 1) / 26); } return s; }
function monthNameAR_(mo) {
  return ["", "Jaanuar","Veebruar","Märts","Aprill","Mai","Juuni",
          "Juuli","August","September","Oktoober","November","Detsember"][mo] || ("kuu " + mo);
}

/* ============================ DIAGNOSTIKA ============================ */
function arsenalBreakdown() {
  var sh = SpreadsheetApp.openById(AR.fileId).getSheetByName(AR.tab);
  var rows = findAllRows_(sh);
  Logger.log("Read: Rent=" + rows.rent + " Kommunaalid=" + rows.util + " Telia=" + rows.phone);
  var threads = GmailApp.search(AR.query, 0, 200);
  Logger.log("Arsenal+Telia kirju (manustega): threade=" + threads.length);
  for (var t = 0; t < threads.length; t++) {
    var msgs = threads[t].getMessages();
    for (var m = 0; m < msgs.length; m++) {
      var mg = msgs[m];
      var from = String(mg.getFrom()).toLowerCase();
      var isArsenal = from.indexOf(AR.senderDomain) !== -1;
      var isTelia = from.indexOf(AR.senderTelia) !== -1;
      if (!isArsenal && !isTelia) continue;
      var atts = mg.getAttachments();
      for (var a = 0; a < atts.length; a++) {
        var att = atts[a];
        if (String(att.getContentType()).toLowerCase().indexOf("pdf") === -1 &&
            String(att.getName()).toLowerCase().indexOf(".pdf") === -1) continue;
        var text = pdfToText_(att);
        if (!text) { Logger.log("✗ teksti ei saanud: " + att.getName()); continue; }
        var inv = isTelia ? parseTelia_(text) : parseInvoice_(text);
        var rowTxt = isTelia ? ("rida" + rows.phone + "(Telefon)") :
          (inv.type === "RENT" ? ("rida" + rows.rent + "(Üür)") :
          (inv.type === "UTIL" ? ("rida" + rows.util + "(Kõrvalkulud)") : "tüüp=?"));
        Logger.log("• " + Utilities.formatDate(mg.getDate(), AR.tz, "dd.MM.yy") +
          " | arve " + inv.invNo + " | " + rowTxt +
          " | kuu=" + (inv.month ? monthNameAR_(inv.month) : "?") +
          " | summa=" + inv.amount + " | manus=" + att.getName());
      }
    }
  }
}
function arsenalDumpRawText() {
  var threads = GmailApp.search(AR.query, 0, 200);
  var shown = 0;
  for (var t = 0; t < threads.length && shown < 2; t++) {
    var msgs = threads[t].getMessages();
    for (var m = 0; m < msgs.length && shown < 2; m++) {
      var mg = msgs[m];
      if (String(mg.getFrom()).toLowerCase().indexOf(AR.senderDomain) === -1 && String(mg.getFrom()).toLowerCase().indexOf(AR.senderTelia) === -1) continue;
      var atts = mg.getAttachments();
      for (var a = 0; a < atts.length && shown < 2; a++) {
        var att = atts[a];
        if (String(att.getName()).toLowerCase().indexOf(".pdf") === -1) continue;
        var text = pdfToText_(att);
        Logger.log("========== " + att.getName() + " ==========");
        Logger.log(text ? text : "(tekst puudub)");
        Logger.log("========== /LÕPP ==========");
        shown++;
      }
    }
  }
}
function arsenalVerifyRows() {
  var sh = SpreadsheetApp.openById(AR.fileId).getSheetByName(AR.tab);
  var rows = findAllRows_(sh);
  Logger.log("LEITUD read -> Rent=" + rows.rent + " Kommunaalid=" + rows.util + " Telia=" + rows.phone);
  for (var r = 45; r <= 56; r++) {
    var label = sh.getRange(r, 1).getValue();
    var vals = sh.getRange(r, 2, 1, 12).getValues()[0];
    Logger.log("rida " + r + " | A=[" + label + "] | B..M=[" + vals.join(", ") + "]");
  }
}

// ================================================================ ARSENALI LÕPP
