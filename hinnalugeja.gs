/*************************************************************************************
 *  ÜKSUS – Arhiiv & tähtajad & TASUD  (v14)
 *  -----------------------------------------------------------------------------
 *  UUS v14: iga trennigrupi (kalisteenika, swed, alfa kolmik, lapsed) lõppu võib
 *  panna kolmanda ploki "Ühekordsed" (pealkiri veerus B, nt pärast "1x nädalas"
 *  nimekirja). See on AINULT nimekiri ühekordsete piletitega püsikülastajatest:
 *  A = number (tekib ise), B = nimi, C = kehtib ("1x"), D = kommentaar.
 *  Skript EI tee nende ridadega mitte midagi: ei logi makseid, ei pane "Tasuda
 *  tuleb" ega "1x pääsmed" ritta, ei arhiveeri, ei värvi, ei saada meile, ei pane
 *  linnukest, Rühmavahetus / Pikenda tasuta / Suvepaus ei näe neid.
 *  Plokk kestab kuni järgmise grupi pealkirjani (või "nädalas" reani).
 *  Skript loob plokid ise üks kord (tabeli avamisel või ▶ Run ajal): iga grupi viimase
 *  nime alla tuleb pealkiri "Ühekordsed | kehtib | kommentaar" ("1x nädalas" rea
 *  kujundusega) ja 3 tühja rida. Kui plokk on grupis juba olemas, seda ei tehta.
 *  v14: lahtris F2 = kõigi klientide arv kõigist gruppidest kokku (2x, 1x ja
 *  Ühekordsed). Uueneb kohe, kui lisad/kustutad nime veerus B, ja igal ▶ Run / öösel.
 *  UUS v13: lapsevanemate KORDUSMEELDETULETUS. Veerg H (linnuke) laste ridadel:
 *  kui linnuke on peal ja pääse on lõppenud (C kuupäeva pole uuendatud), saadetakse
 *  järgmisel esmaspäeva hommikul üks kordusmeeldetuletus Stebby linkidega.
 *  "Tasuda tuleb": uueneb kohe ka siis, kui muudad kuupäeva grupi-real või
 *  kasutad 🔀 Rühmavahetus / 🎟 Pikenda tasuta.
 *  🔀 Rühmavahetus: liiguta klient teise trennirühma või 1x <-> 2x (asendab "Vaheta sagedust").
 *  Tasu: täiskuud (sama kuupäev järgmisel kuul) = 70/45 €, lisapäevad päevade järgi
 *  (päevad * määr / 30): 11 p 2x -> 26 €, 40 p 2x -> 93 €.
 *  Linnuke tekib kohe, kui lisad lapse nime veergu B (ja öise käivituse / ▶ Run ajal).
 *  v12: topeltmaksete kaitse. Kui skript ei tunne klienti eelmisest käivitusest
 *  ära (liigutatud 1x <-> 2x, nimi muudetud, kuupäev vahepeal tühi, rida vahepeal
 *  skaneeritavast alast väljas), aga samal kliendil on samas grupis viimase
 *  25 päeva jooksul juba kuumakse logis, siis uut makset EI logita. Logisse
 *  tuleb 0 € rida tüübiga "kuumakse (kordus, vahele jäetud)", et oleks näha.
 *  Nime parandus veerus B (nt kirjaviga) = sama klient, võlts-makset ei teki.
 *  Lapsevanemate meeldetuletus: 2 päeva enne lõppu, Stebby linkidega.
 *  v11: menüü "🔀 Vaheta sagedust (1x ↔ 2x)" – liigutab kliendi 1x <-> 2x
 *  nädalas sektsiooni ilma et bilanss läheks paigast.
 *  v10: kiire üksik-rea muutus Tasuda tuleb nimekirjas; "1x" veergu C;
 *  "1x pääsmed:" koondrida; vabam ühekordsete parser (€, vaba järjekord).
 *  -----------------------------------------------------------------------------
 *  KÕIK toimub PÕHILEHEL. Sildid (sina kirjutad veergu B):
 *     "Rühmatrennide pääsmed"  – pealkiri
 *     "Ühekordsed:"            – selle ALL olevasse lahtrisse kirjuta nimi -> logib
 *                                ühekordse 15 € makse (või "Mari 20" -> 20 €). Telefonis ka.
 *     "Tasuda Tuleb:"          – selle ALLA ehitatakse maksmata nimekiri (1..20 üle)
 *
 *  TASU = KALENDRIKUU. Makse 01.06, kehtib kuni 01.07 = 1 kuu.
 *     Tasu = kuupäeva edasiliikumine kuudes * määr. 1x = 45, 2x = 70 €/kuu.
 *     Logi -> 'seaded' (J:N). Kokkuvõte (E:H) täitub ise. 1. käivitus = nullpunkt.
 *
 *  ARHIIV: 21+ üle -> alla arhiivi (D = grupp(alajaotus), aastaga kuupäev).
 *************************************************************************************/

var CONFIG = {
  tabName: "",
  settingsTab: "seaded",
  colA: 1, colB: 2, colC: 3, colD: 4,
  colE: 5, colF: 6, colG: 7,   // E=meeldetuletaja(email), F=keel, G=lapsevanema nimi
  colH: 8,                     // v13: H=kordusmeeldetuletuse linnuke (ainult lapsed)
  countCell: "F2",             // v14: kõigi klientide arv kokku
  topListStartRow: 4,          // varuvariant, kui silti "Tasuda Tuleb" ei leitud
  labels: { dropIn: "ühekordsed", dueList: "tasuda tuleb" },
  scanLimit: 15,
  archiveDays: 21,
  red: "#ff0000",
  white: "#ffffff",
  inputBg: "#fff2cc",
  archiveDateFormat: "dd.MM.yy",
  rates: { 1: 45, 2: 70 },
  dropInPrice: 15,
  classAliases: {
    "kalisteenika": "kalisteenika", "kali": "kalisteenika",
    "swed": "swed", "lapsed": "lapsed",
    "alfa kolmik": "alfa kolmik", "alpha kolmik": "alfa kolmik",
    "alfa triple": "alfa kolmik", "alpha triple": "alfa kolmik",
    "alfa": "alfa kolmik", "alpha": "alfa kolmik"
  },
  monthSnap: 0.12,
  dupGuardDays: 25,            // v12: topeltmaksete kaitse aken (päevades)
  logCols: { date: 10, name: 11, group: 12, amount: 13, type: 14 },
  balance: {
    fileId: "__BILANSS_FAILI_ID__",
    tab: "Bilans 2026",
    year: 2026,
    firstMonth: 6,     // Juuni
    firstCol: 7,       // G
    lastMonth: 12,     // Detsember (M)
    rows: { "kalisteenika": 80, "swed": 81, "lapsed": 82, "alfa kolmik": 83, "total": 88 }
  },
  kadriSync: {
    fileId: "__BILANSS_FAILI_ID__",
    srcTab: "Kadri", srcRow: 62, srcFirstCol: 14, srcStep: 2,   // N, P, R … Z (iga teine veerg)
    dstTab: "Bilans 2026", dstRow: 13, dstFirstCol: 7,          // G … M
    firstMonth: 6, lastMonth: 12, year: 2026
  },
  tz: "Europe/Tallinn",
  reminder: {
    fromName: "Stuudio Üksus",
    subjectEst: "Stuudio Üksus meeldetuletus - täna on pääsme viimane päev",
    subjectEng: "Stuudio Üksus reminder - today is last valid training day",
    lapsedGroup: "lapsed",   // selle grupi puhul -> lapsevanema versioon (nimi veerust G)
    lapsedDaysBefore: 2,     // lapsevanematele saadetakse X päeva ENNE viimast kehtivuspäeva
    subjectLapsedEst: "Stuudio Üksus meeldetuletus - lapse pääse lõpeb 2 päeva pärast",
    subjectLapsedEng: "Stuudio Üksus reminder - your child's pass expires in 2 days",
    subjectReEst: "Stuudio Üksus – lapse pääse on lõppenud",
    subjectReEng: "Stuudio Üksus – your child's pass has expired",
    stebby2x: "https://app.stebby.eu/pos/stuudio.yksus/ticket/95078?serviceId=23322",
    stebby1x: "https://app.stebby.eu/pos/stuudio.yksus/ticket/95141?serviceId=23322",
    hour: 9,                 // saatmise kellaaeg (umbkaudne)
    keepDays: 60             // "juba saadetud" mälu puhastus
  }
};

var COMMA_FORMULA =
  '=MAP(INDIRECT("B"&ROW()&":B"), SCAN(0, INDIRECT("B"&ROW()&":B"), ' +
  'LAMBDA(count, name, IF(OR(name="", EXACT(name, UPPER(name)), ' +
  'ISNUMBER(SEARCH("nädalas", name)), LOWER(TRIM(name))="ühekordsed", ' +
  'LOWER(TRIM(name))="ühekordsed:"), 0, count+1))), ' +
  'LAMBDA(name, val, IF(OR(name="", val=0), "", val)))';
var SEMI_FORMULA =
  '=MAP(INDIRECT("B"&ROW()&":B"); SCAN(0; INDIRECT("B"&ROW()&":B"); ' +
  'LAMBDA(count; name; IF(OR(name=""; EXACT(name; UPPER(name)); ' +
  'ISNUMBER(SEARCH("nädalas"; name)); LOWER(TRIM(name))="ühekordsed"; ' +
  'LOWER(TRIM(name))="ühekordsed:"); 0; count+1))); ' +
  'LAMBDA(name; val; IF(OR(name=""; val=0); ""; val)))';

/* ============================ MENÜÜ + AVAMISE TEADE ============================ */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("⚙ Arhiiv & tähtajad")
    .addItem("▶ Run archive & due list", "runArchiveAndDueList")
    .addItem("⛔ STOP! (peata)", "stopScript")
    .addItem("✅ Jätka (resume)", "resumeScript")
    .addSeparator()
    .addItem("➕ Lisa ühekordne (15€)", "addDropIn")
    .addItem("➕ Lisa muu makse…", "addCustomPayment")
    .addItem("🔁 Backfill: logi selle kuu maksed", "backfillCurrentMonth")
    .addItem("📤 Saada Bilanssi", "sendToBalance")
    .addSeparator()
    .addItem("🔀 Rühmavahetus", "groupSwitch")
    .addItem("🏖 Suvepaus: nihuta kõik kuupäevad edasi", "summerBreakShift")
    .addItem("🎟 Pikenda tasuta (üksik klient)", "freeExtendClient")
    .addSeparator()
    .addItem("✉️ Saada meeldetuletused (test)", "runRemindersNow")
    .addSeparator()
    .addItem("⏰ Seadista öine käivitus", "setupNightlyTrigger")
    .addItem("⏰ Seadista meeldetuletused (9:00)", "setupReminderTrigger")
    .addToUi();
  var p = PropertiesService.getDocumentProperties();
  // v14: üks kord – loo "Ühekordsed" plokid ja uuenda nummerduse valem
  if (p.getProperty("ONEOFF_BLOCKS_DONE") !== "yes") {
    try {
      var shO = getSheet_();
      ensureOneOffBlocks_(shO);
      restoreNumberFormula_(shO);
      updateClientCount_(shO);
    } catch (eO) {}
  }
  if (p.getProperty("ARCHIVE_PENDING") === "yes") {
    SpreadsheetApp.getActiveSpreadsheet()
      .toast(p.getProperty("ARCHIVE_NAMES") || "", "Need kliendid on arhiveeritud:", 20);
    p.deleteProperty("ARCHIVE_PENDING");
  }
}

/* ===== onEdit: (1) ühekordse sisestus  (2) kuupäeva muutus üleval nimekirjas ===== */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sh = e.range.getSheet();
    if (sh.getName().toLowerCase().trim() === CONFIG.settingsTab.toLowerCase().trim()) return;
    if (CONFIG.tabName && sh.getName() !== CONFIG.tabName) return;

    // v13: uus laps veerus B (kirjutatud või kleebitud) -> linnuke veergu H kohe
    if (e.range.getColumn() <= CONFIG.colB && e.range.getLastColumn() >= CONFIG.colB) {
      try {
        if (e.range.getLastRow() >= findFirstGroupRow_(sh)) {
          ensureReminderCheckboxes_(sh);
          try { updateClientCount_(sh); } catch (errCnt) {}   // v14: F2 klientide arv
        }
      } catch (errCb) {}
    }

    if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;

    var row = e.range.getRow(), col = e.range.getColumn();

    // (1) ÜHEKORDNE: lahter kohe "Ühekordsed:" sildi all, veerus B
    var uRow = findLabelRow_(sh, CONFIG.labels.dropIn);
    if (uRow && col === CONFIG.colB && row === uRow + 1) {
      var lock0 = LockService.getDocumentLock();
      if (lock0.tryLock(3000)) { try { handleDropIn_(e.range); } finally { lock0.releaseLock(); } }
      return;
    }

    // (1b) v12: NIME PARANDUS grupi-sektsioonis -> sama klient (võlts-makset ei teki)
    if (col === CONFIG.colB) {
      var oldNm = e.oldValue, newNm = e.value;
      if (oldNm == null || newNm == null || String(oldNm).trim() === "" || String(newNm).trim() === "") return;
      if (isTitle_(oldNm) || isTitle_(newNm)) return;
      if (row < findFirstGroupRow_(sh)) return;
      if (isOneOffHeader_(oldNm) || isOneOffHeader_(newNm) || inOneOff_(sh, row)) return; // v14
      var lockN = LockService.getDocumentLock();
      if (lockN.tryLock(3000)) { try { carryNameInSnapshot_(sh, row, oldNm, newNm); } finally { lockN.releaseLock(); } }
      return;
    }

    // (2) KUUPÄEV (või "1x") ülemises "Tasuda tuleb" nimekirjas
    if (col !== CONFIG.colC) return;
    var kr = findFirstGroupRow_(sh);
    var start = topListStart_(sh);

    // (2b) KUUPÄEV muudetud OTSE grupi-sektsioonis (allpool nimekirja):
    //      kui uus kuupäev ei ole enam üle tähtaja (või on "1x"/tühi), eemalda punane.
    if (row >= kr) {
      if (inOneOff_(sh, row)) return;   // v14: "Ühekordsed" plokk – ei midagi
      var val2b = e.range.getValue();
      var tz2b = Session.getScriptTimeZone();
      var today2b = new Date();
      if (is1xMarker_(val2b) || val2b === "" || val2b === null) {
        e.range.setBackground(null);   // "1x" või tühi -> pole tähtaega -> punane maha
      } else {
        var due2b = parseDueDate_(val2b, today2b);
        if (due2b) {
          var od2b = daysOverdue_(due2b, today2b);
          if (od2b >= 1) e.range.setBackground(CONFIG.red);  // ENDISELT üle tähtaja -> punane
          else e.range.setBackground(null);                   // korras -> punane maha
        }
      }
      // v13: hoia "Tasuda tuleb" nimekiri kooskõlas (eemalda või uuenda sama kliendi rida)
      var lock2b = LockService.getDocumentLock();
      if (lock2b.tryLock(1500)) {
        try { syncTopListFromSource_(sh, row, val2b, today2b); } catch (err2b) {}
        finally { lock2b.releaseLock(); }
      }
      return;
    }

    if (row < start || row > kr - 2) return;
    var name = sh.getRange(row, CONFIG.colB).getValue();
    var grp = groupPartOf_(sh.getRange(row, CONFIG.colD).getValue());
    if (!name || !grp || currentGroupTags_(sh).indexOf(grp) === -1) return;
    var newVal = e.range.getValue();
    // kirjuta uus väärtus (kuupäev VÕI "1x") kliendi grupi-reale allpool
    if (!writeDateToSource_(sh, name, grp, newVal)) {
      toast("Klienti '" + name + "' ei leitud grupist '" + grp + "'. Muuda kuupäev grupis all.");
      return;
    }

    // Kas uus kuupäev on ENDISELT üle tähtaja? Kui jah -> klient JÄÄB nimekirja
    // ja jääb punaseks. Ainult siis kui tähtaeg on korras (või "1x"), eemaldame rea.
    var todayFx = new Date();
    var stillOverdue = false;
    if (!is1xMarker_(newVal) && newVal !== "" && newVal !== null) {
      var dueFx = parseDueDate_(newVal, todayFx);
      if (dueFx && daysOverdue_(dueFx, todayFx) >= 1) stillOverdue = true;
    }
    if (stillOverdue) {
      // jäta nimekirja alles, hoia punane nii nimekirjas kui grupi-real
      e.range.setBackground(CONFIG.red);
      setSourceBackground_(sh, name, grp, CONFIG.red);
      return;
    }

    // KIIRE tee: tähtaeg korras -> eemalda AINULT see rida nimekirjast; ülejäänud
    // kontrakteeruvad ise. Täielik ümberjärjestus järgmisel öisel/käsitsi "▶ Run".
    var lockF = LockService.getDocumentLock();
    if (lockF.tryLock(1500)) {
      try {
        sh.deleteRow(row);
        renumberTopList_(sh);
      } catch (err) {}
      finally { lockF.releaseLock(); }
    }
  } catch (err) { /* vaikne */ }
}

/* v13: ehita "Tasuda tuleb" nimekiri kohe uuesti (pärast menüütööriistu) */
function refreshTopList_(sh) {
  try { removeTopList_(sh); buildTopList_(sh, midnight_(new Date())); } catch (e) {}
}
/* v13: kuupäev muudeti grupi-real -> sama klient "Tasuda tuleb" nimekirjas:
 * kui enam üle tähtaja pole (või "1x"/tühi) -> rida ära; muidu uuenda kuupäev. */
function syncTopListFromSource_(sh, row, value, today) {
  var name = String(sh.getRange(row, CONFIG.colB).getValue()).trim();
  if (!name || isTitle_(name)) return;
  var b = sh.getRange(1, CONFIG.colB, row, 1).getValues();
  if (oneOffMask_(b)[row - 1]) return;   // v14
  var grp = "";
  for (var r = row - 1; r >= 1; r--) if (isGroupHeader_(b[r - 1][0])) { grp = String(b[r - 1][0]).toLowerCase().trim(); break; }
  if (!grp) return;
  var start = topListStart_(sh), kr = findFirstGroupRow_(sh);
  if (kr - 2 < start) return;
  var top = sh.getRange(start, CONFIG.colB, kr - 1 - start, 3).getValues(); // B..D
  var stillOverdue = false;
  if (!is1xMarker_(value) && value !== "" && value !== null) {
    var due = parseDueDate_(value, today);
    stillOverdue = !!due && daysOverdue_(due, today) >= 1;
  }
  for (var i = top.length - 1; i >= 0; i--) {
    if (String(top[i][0]).trim() !== name || groupPartOf_(top[i][2]) !== grp) continue;
    if (stillOverdue) sh.getRange(start + i, CONFIG.colC).setValue(value);
    else sh.deleteRow(start + i);
  }
  if (!stillOverdue) renumberTopList_(sh);
}

/* Sea kliendi grupi-rea C-lahtri taustavärv (nt punane tagasi, kui veel üle tähtaja) */
function setSourceBackground_(sh, name, grp, color) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var gStart = -1, gEnd = n;
  for (var r = 1; r <= n; r++)
    if (isGroupHeader_(b[r - 1][0]) && String(b[r - 1][0]).toLowerCase().trim() === grp) { gStart = r; break; }
  if (gStart < 0) return;
  for (r = gStart + 1; r <= n; r++) if (isGroupHeader_(b[r - 1][0])) { gEnd = r - 1; break; }
  var oo = oneOffMask_(b);   // v14
  for (r = gStart + 1; r <= gEnd; r++)
    if (!oo[r - 1] && String(b[r - 1][0]) === String(name)) { sh.getRange(r, CONFIG.colC).setBackground(color); return; }
}

/* Nummerdab "Tasuda tuleb" nimekirja read uuesti (A veerus 1,2,3…),
 * pärast seda kui üksik rida on eemaldatud. Kiire, ei ehita midagi ümber. */
function renumberTopList_(sh) {
  var start = topListStart_(sh);
  var kr = findFirstGroupRow_(sh);
  var to = kr - 1;
  if (to < start) return;
  var tags = currentGroupTags_(sh);
  var n = to - start + 1;
  var vals = sh.getRange(start, CONFIG.colB, n, 3).getValues(); // B..D
  var num = 0, out = [];
  for (var i = 0; i < n; i++) {
    var b = vals[i][0], d = vals[i][2];
    var isRow = (b !== "" && b !== null && tags.indexOf(groupPartOf_(d)) !== -1);
    out.push([isRow ? (++num) : ""]);
  }
  sh.getRange(start, CONFIG.colA, n, 1).setValues(out);
}

function handleDropIn_(inputRange) {
  var raw = String(inputRange.getValue()).trim();
  if (!raw) return;
  var p = parseDropIn_(raw);
  // TÜHJENDA KOHE ja renderda ära, ENNE aeglast logimist/summeerimist –
  // nii kaob sisestatud tekst silmapilkselt, mitte alles pärast arvutusi.
  inputRange.clearContent();
  SpreadsheetApp.flush();
  var seaded = settingsSheet_();
  if (!seaded) { toast("'" + CONFIG.settingsTab + "' lehte ei leitud – makse logimata."); return; }
  appendToLog_(seaded, [[new Date(), p.name, p.group, p.amt, "ühekordne"]]);
  try { refreshSummary_(seaded); } catch (e) {}
  toast("Ühekordne: " + p.amt + " € – " + p.name + (p.group ? (" → " + p.group) : " (kokku)"));
}

// "Mari swed 15" / "Mari 15 swed" / "Mari kali" / "Mari" -> {amt, name, group}
function classFromTokens_(tokens) {
  var a = CONFIG.classAliases;
  for (var i = 0; i < tokens.length - 1; i++) {
    var two = (tokens[i] + " " + tokens[i + 1]).toLowerCase();
    if (a[two]) return { canonical: a[two], used: [i, i + 1] };
  }
  for (var j = 0; j < tokens.length; j++) {
    var one = String(tokens[j]).toLowerCase();
    if (a[one]) return { canonical: a[one], used: [j] };
  }
  return null;
}
function parseDropIn_(raw) {
  var tokens = String(raw).trim().split(/\s+/).filter(function (t) { return t !== ""; });
  var amt = null, ai = -1;
  for (var i = 0; i < tokens.length; i++) {
    // eemalda euro-märk (€30, 30€, 30eur) ja teisenda koma punktiks
    var t = tokens[i].replace(/€/g, "").replace(/eur/ig, "").replace(",", ".").trim();
    if (/^[0-9]+(\.[0-9]+)?$/.test(t)) { amt = parseFloat(t); ai = i; break; }
  }
  var rest = tokens.filter(function (_, idx) { return idx !== ai; });
  // eemalda üksik "€" märk (nt sisestus "€ 30" -> "€" jääks nime sisse)
  rest = rest.filter(function (t) { return t.replace(/€/g, "").replace(/eur/ig, "").trim() !== ""; });
  var cls = classFromTokens_(rest), group = "";
  if (cls) { group = cls.canonical; rest = rest.filter(function (_, idx) { return cls.used.indexOf(idx) === -1; }); }
  var name = rest.join(" ").trim() || "Ühekordne";
  if (amt === null) amt = CONFIG.dropInPrice;
  return { amt: amt, name: name, group: group };
}

function writeDateToSource_(sh, name, grp, value) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var gStart = 0, r;
  for (r = 1; r <= n; r++)
    if (isGroupHeader_(b[r - 1][0]) && String(b[r - 1][0]).toLowerCase().trim() === grp) { gStart = r; break; }
  if (!gStart) return false;
  var gEnd = n;
  for (r = gStart + 1; r <= n; r++) if (isGroupHeader_(b[r - 1][0])) { gEnd = r - 1; break; }
  var oo = oneOffMask_(b);   // v14
  for (r = gStart + 1; r <= gEnd; r++)
    if (!oo[r - 1] && String(b[r - 1][0]) === String(name)) {
      var cell = sh.getRange(r, CONFIG.colC);
      cell.setValue(value);
      cell.setBackground(null);   // vaikimisi punane maha; kutsuja paneb tagasi kui veel üle tähtaja
      return true;
    }
  return false;
}

/* ============================ NUPUD / KÄIVITAJAD ============================ */
function runArchiveAndDueList() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(2000)) { toast("Skript juba töötab, oota hetk."); return; }
  try {
    PropertiesService.getScriptProperties().deleteProperty("ABORT");
    main_(false, true);
  } catch (e) {
    if (String(e.message).indexOf("ABORT") !== -1) toast("Skript peatatud (STOP).");
    else { toast("Viga: " + e.message); throw e; }
  } finally { lock.releaseLock(); }
}
function nightly() {
  var sp = PropertiesService.getScriptProperties();
  if (sp.getProperty("PAUSED") === "yes") return;
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(2000)) return;
  try { sp.deleteProperty("ABORT"); main_(false, true); }
  catch (e) { if (String(e.message).indexOf("ABORT") === -1) throw e; }
  finally { lock.releaseLock(); }
}
function stopScript() {
  var sp = PropertiesService.getScriptProperties();
  sp.setProperty("PAUSED", "yes"); sp.setProperty("ABORT", "yes");
  toast("⛔ STOP – skript peatatud. Vajuta 'Jätka', et taastada.");
}
function resumeScript() {
  var sp = PropertiesService.getScriptProperties();
  sp.deleteProperty("PAUSED"); sp.deleteProperty("ABORT");
  toast("✅ Skript taastatud.");
}
function setupNightlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "nightly") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("nightly").timeBased().atHour(0).everyDays(1).create();
  toast("⏰ Öine käivitus seadistatud (kell 00:00–01:00 vahel).");
}

/* ===== TASUDE NUPUD (arvutis) ===== */
function addDropIn() { logManual_("Ühekordne", "", CONFIG.dropInPrice, "ühekordne"); }
function addCustomPayment() {
  var ui = SpreadsheetApp.getUi();
  var rn = ui.prompt("Muu makse", "Nimi (võib tühjaks jätta):", ui.ButtonSet.OK_CANCEL);
  if (rn.getSelectedButton() !== ui.Button.OK) return;
  var nm = String(rn.getResponseText() || "").trim();
  var toks = nm ? nm.split(/\s+/) : [];
  var cls = classFromTokens_(toks), group = "";
  if (cls) { group = cls.canonical; toks = toks.filter(function (_, i) { return cls.used.indexOf(i) === -1; }); }
  // v13: küsi trenni, kui nimes seda polnud
  while (!group) {
    var rc = ui.prompt("Muu makse", "Trenn: kalisteenika / swed / lapsed / alfa (võib tühjaks jätta):", ui.ButtonSet.OK_CANCEL);
    if (rc.getSelectedButton() !== ui.Button.OK) return;
    var ct = String(rc.getResponseText() || "").trim();
    if (!ct) break;
    var c2 = classFromTokens_(ct.split(/\s+/));
    if (c2) group = c2.canonical;
    else ui.alert("Tundmatu trenn: \"" + ct + "\". Kirjuta kalisteenika, swed, lapsed või alfa.");
  }
  var ra = ui.prompt("Muu makse", "Summa eurodes (nt 70 või 87.5):", ui.ButtonSet.OK_CANCEL);
  if (ra.getSelectedButton() !== ui.Button.OK) return;
  var amt = parseFloat(String(ra.getResponseText()).replace(",", "."));
  if (isNaN(amt)) { toast("Vigane summa."); return; }
  logManual_(toks.join(" ") || "Muu", group, amt, "muu");
}
function logManual_(name, tag, amount, type) {
  var seaded = settingsSheet_();
  if (!seaded) { toast("'" + CONFIG.settingsTab + "' lehte ei leitud."); return; }
  appendToLog_(seaded, [[new Date(), name, tag, amount, type]]);
  try { refreshSummary_(seaded); } catch (e) {}
  toast("Makse lisatud: " + amount + " € (" + type + ").");
}

/* ===== ÜHEKORDNE BACKFILL: tuletab selle kuu kuumaksed praegustest kuupäevadest =====
 *  Eeldus: makse = kehtib − 1 kuu. Nt kehtib 02.07 -> makstud juunis.
 *  Logib ainult KUUMAKSED (kuupäevaga kliendid). Ühekordseid/2-kuu makseid ei taasta. */
function backfillCurrentMonth() {
  var ui = SpreadsheetApp.getUi();
  var today = midnight_(new Date());
  var ty = today.getFullYear(), tm = today.getMonth();
  var resp = ui.alert("Backfill – " + (tm + 1) + "/" + ty,
    "Login kõik selle kuu (" + (tm + 1) + "/" + ty + ") tehtud KUUMAKSED, tuletatuna " +
    "praegustest 'kehtib' kuupäevadest (kehtib − 1 kuu). Kordamisel asendab varasemad backfill-read. Jätkan?",
    ui.ButtonSet.OK_CANCEL);
  if (resp !== ui.Button.OK) return;

  var sh = getSheet_();
  var seaded = settingsSheet_();
  if (!seaded) { ui.alert("'" + CONFIG.settingsTab + "' lehte ei leitud."); return; }

  var cur = scanActiveClients_(sh, today);
  var rows = [];
  for (var key in cur) {
    var c = cur[key];
    if (c.dateMs == null || c.rate <= 0) continue;
    var due = new Date(c.dateMs);
    var pay = new Date(due.getFullYear(), due.getMonth() - 1, due.getDate()); // kehtib − 1 kuu
    if (pay.getFullYear() === ty && pay.getMonth() === tm)
      rows.push([pay, c.name, c.tag, c.rate, "kuumakse (backfill)"]);
  }
  removeBackfillForMonth_(seaded, ty, tm);
  if (rows.length) appendToLog_(seaded, rows);
  try { refreshSummary_(seaded); } catch (e) {}

  var total = 0; for (var i = 0; i < rows.length; i++) total += rows[i][3];
  ui.alert("Backfill valmis",
    rows.length + " kuumakset, kokku " + total + " €.\n\n" +
    "NB: kui kokkuvõttes on " + (tm + 1) + "/" + ty + " lahter käsitsi sisestatud (nt 1050), " +
    "siis SUMIFS seda üle ei kirjuta. Et näha automaatset summat, kustuta see lahter tühjaks " +
    "ja käivita '▶ Run' uuesti.",
    ui.ButtonSet.OK);
}
// kustutab (tühjendab) varasemad sama kuu backfill-read, et kordamine ei topelda
function removeBackfillForMonth_(seaded, ty, tm) {
  var c = CONFIG.logCols;
  var n = seaded.getLastRow();
  if (n < 2) return;
  var data = seaded.getRange(2, c.date, n - 1, 5).getValues();
  for (var i = 0; i < data.length; i++) {
    var d = data[i][0], type = String(data[i][4]);
    if (type.indexOf("backfill") !== -1 && Object.prototype.toString.call(d) === "[object Date]" &&
        d.getFullYear() === ty && d.getMonth() === tm) {
      seaded.getRange(2 + i, c.date, 1, 5).clearContent();
    }
  }
}

/* ============================ ABIFUNKTSIOONID ============================ */
function toast(m) { SpreadsheetApp.getActiveSpreadsheet().toast(m, "Arhiiv & tähtajad", 6); }
function abortCheck_() {
  if (PropertiesService.getScriptProperties().getProperty("ABORT") === "yes") throw new Error("ABORT");
}
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = CONFIG.tabName ? ss.getSheetByName(CONFIG.tabName) : ss.getSheets()[0];
  if (!sh) throw new Error("Lehte '" + CONFIG.tabName + "' ei leitud.");
  return sh;
}
function settingsSheet_() {
  var shs = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < shs.length; i++)
    if (shs[i].getName().toLowerCase().trim() === CONFIG.settingsTab.toLowerCase().trim()) return shs[i];
  return null;
}

/* ===== BILANSS: saadab seaded kokkuvõtte arvud teise faili ===== */
function detectSeadedTables_(seaded) {
  var n = Math.max(seaded.getLastRow(), 2);
  var e = seaded.getRange(1, 5, n, 1).getValues(); // veerg E
  var out = {};
  for (var r = 1; r <= n; r++) {
    if (String(e[r - 1][0]).toLowerCase().trim() !== "kuu") continue;
    var title = (r >= 2) ? String(e[r - 2][0]).toLowerCase().trim() : "";
    var key = (title.indexOf("kokku") !== -1 || title.indexOf("rühmatrennide") !== -1) ? "total" : title;
    if (key) out[key] = r; // yearRow
  }
  return out;
}
function findYearCol_(seaded, yearRow, year) {
  var hdr = seaded.getRange(yearRow, 6, 1, 12).getValues()[0];
  for (var i = 0; i < hdr.length; i++) if (parseInt(hdr[i], 10) === year) return 6 + i;
  return 6;
}
function syncBalance_(seaded, today) {
  var cfg = CONFIG.balance;
  if (!cfg || !cfg.fileId) return;
  if (today.getFullYear() !== cfg.year) return; // ainult selle aasta bilanss
  var ss = SpreadsheetApp.openById(cfg.fileId);
  var sh = ss.getSheetByName(cfg.tab);
  if (!sh) { toast("Bilansi tabi '" + cfg.tab + "' ei leitud."); return; }

  var tables = detectSeadedTables_(seaded);
  var effLast = Math.min(cfg.lastMonth, today.getMonth() + 1); // ainult kuni jooksva kuuni
  if (effLast < cfg.firstMonth) return;
  var count = effLast - cfg.firstMonth + 1;

  for (var key in cfg.rows) {
    var yearRow = tables[key];
    if (!yearRow) continue;
    var yc = findYearCol_(seaded, yearRow, cfg.year);
    var vals = seaded.getRange(yearRow + cfg.firstMonth, yc, count, 1).getValues();
    var rowVals = vals.map(function (v) { var x = v[0]; return (typeof x === "number") ? x : 0; });
    sh.getRange(cfg.rows[key], cfg.firstCol, 1, count).setValues([rowVals]);
  }
  SpreadsheetApp.flush();
}
function sendToBalance() {
  var seaded = settingsSheet_();
  if (!seaded) { toast("'" + CONFIG.settingsTab + "' lehte ei leitud."); return; }
  try { refreshSummary_(seaded); } catch (e) {}
  var today = midnight_(new Date());
  try { syncBalance_(seaded, today); } catch (e) { toast("Bilanssi (grupid) viga: " + e.message); }
  try { syncKadri_(today); } catch (e) { toast("Bilanssi (Kadri) viga: " + e.message); }
  toast("Bilanssi saadetud.");
}

/* ===== KADRI rida -> Bilans 2026 (sama fail) ===== */
function syncKadri_(today) {
  var cfg = CONFIG.kadriSync;
  if (!cfg || !cfg.fileId) return;
  if (today.getFullYear() !== cfg.year) return;
  var ss = SpreadsheetApp.openById(cfg.fileId);
  var src = ss.getSheetByName(cfg.srcTab);
  var dst = ss.getSheetByName(cfg.dstTab);
  if (!src) { toast("Tabi '" + cfg.srcTab + "' ei leitud."); return; }
  if (!dst) { toast("Tabi '" + cfg.dstTab + "' ei leitud."); return; }

  var effLast = Math.min(cfg.lastMonth, today.getMonth() + 1); // ainult kuni jooksva kuuni
  if (effLast < cfg.firstMonth) return;
  var count = effLast - cfg.firstMonth + 1;

  var width = (cfg.lastMonth - cfg.firstMonth) * cfg.srcStep + 1; // N..Z laius
  var row = src.getRange(cfg.srcRow, cfg.srcFirstCol, 1, width).getValues()[0];
  var out = [];
  for (var m = 0; m < count; m++) {
    var v = row[m * cfg.srcStep];
    out.push((typeof v === "number") ? v : 0);
  }
  dst.getRange(cfg.dstRow, cfg.dstFirstCol, 1, count).setValues([out]);
  SpreadsheetApp.flush();
}
function midnight_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function colLetter_(col) { var s = ""; while (col > 0) { var m = (col - 1) % 26; s = String.fromCharCode(65 + m) + s; col = Math.floor((col - 1) / 26); } return s; }

function isTitle_(name) {
  if (name === null || name === undefined) return false;
  var s = String(name).trim();
  if (s === "") return false;
  if (isOneOffHeader_(s)) return false;   // v14: "Ühekordsed" ploki pealkiri ei ole grupp/alapealkiri
  if (s.toLowerCase().indexOf("nädalas") !== -1) return true;
  if (s === s.toUpperCase() && s !== s.toLowerCase()) return true;
  return false;
}
function isSubtitle_(name) { return name && String(name).toLowerCase().indexOf("nädalas") !== -1; }
function isGroupHeader_(name) { return isTitle_(name) && !isSubtitle_(name); }
/* v14: "Ühekordsed" ploki pealkiri grupi sees (suur- või väiketähtedega, koolon lubatud) */
function isOneOffHeader_(name) {
  if (name === null || name === undefined) return false;
  return String(name).trim().toLowerCase().replace(/\s*:\s*$/, "") === "ühekordsed";
}
/* v14: mask (indeks = rida-1) – true "Ühekordsed" pealkirjal ja selle all olevatel ridadel
 * kuni järgmise grupi pealkirja või "nädalas" reani. Ülemine "Ühekordsed:" silt (enne
 * esimest gruppi) ei loe. Need read jäetakse KÕIGIS skaneerimistes vahele. */
function oneOffMask_(b) {
  var mask = [], seenGroup = false, on = false;
  for (var i = 0; i < b.length; i++) {
    var v = b[i][0];
    if (isGroupHeader_(v)) { seenGroup = true; on = false; }
    else if (isSubtitle_(v)) { on = false; }
    else if (seenGroup && isOneOffHeader_(v)) { on = true; }
    mask.push(on);
  }
  return mask;
}
function inOneOff_(sh, row) {
  if (row < 1) return false;
  var b = sh.getRange(1, CONFIG.colB, row, 1).getValues();
  return oneOffMask_(b)[row - 1] === true;
}
function clientTag_(grp, sub) { return sub ? (grp + " (" + String(sub).trim() + ")") : grp; }
function groupPartOf_(tag) { return String(tag).toLowerCase().split("(")[0].trim(); }
function freqOf_(sub) { var m = String(sub).toLowerCase().match(/(\d+)\s*x/); return m ? parseInt(m[1], 10) : 0; }

// sildi rida (veerus B), KALISTEENIKA kohal
function findLabelRow_(sh, labelLower) {
  var kr; try { kr = findFirstGroupRow_(sh); } catch (e) { kr = sh.getLastRow(); }
  var lim = Math.max(kr - 1, 1);
  var ab = sh.getRange(1, CONFIG.colA, lim, 2).getValues(); // veerud A ja B
  for (var r = 1; r <= lim; r++) {
    var a = String(ab[r - 1][0]).toLowerCase().trim();
    var b = String(ab[r - 1][1]).toLowerCase().trim();
    if (a.indexOf(labelLower) === 0 || b.indexOf(labelLower) === 0) return r;
  }
  return 0;
}
function topListStart_(sh) {
  var t = findLabelRow_(sh, CONFIG.labels.dueList);
  if (t) return t + 1;
  var u = findLabelRow_(sh, CONFIG.labels.dropIn);
  if (u) return Math.max(CONFIG.topListStartRow, u + 2); // kaitse ühekordse lahtrit
  return CONFIG.topListStartRow;
}

function daysInMonth_(y, m) { return new Date(y, m + 1, 0).getDate(); }
function monthsBetween_(o, n) {
  var base = (n.getFullYear() - o.getFullYear()) * 12 + (n.getMonth() - o.getMonth());
  var frac = (n.getDate() - o.getDate()) / daysInMonth_(n.getFullYear(), n.getMonth());
  return base + frac;
}
function feeForDates_(oldD, newD, rate) {
  if (rate <= 0) return 0;
  // v13: täiskuud (sama kuupäev järgmisel kuul) = täismäär 70/45 €;
  // ülejäänud päevad = päevad * määr / 30, täiseurodeks (nt 11 p 2x -> 26 €, 40 p -> 93 €).
  var o = midnight_(oldD), nd = midnight_(newD);
  if (nd <= o) return 0;
  var months = 0;
  while (addMonths_(o, months + 1) <= nd) months++;
  var days = Math.round((nd - addMonths_(o, months)) / 86400000);
  return months * rate + Math.round(days * rate / 30);
}
// kuupäev + k kuud (kuu lõpu kaitse: 31.01 + 1 kuu = 28.02)
function addMonths_(d, k) {
  var y = d.getFullYear(), m = d.getMonth() + k;
  var yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
  return new Date(yy, mm, Math.min(d.getDate(), daysInMonth_(yy, mm)));
}

function parseDueDate_(value, today) {
  if (value === "" || value === null || value === undefined) return null;
  if (Object.prototype.toString.call(value) === "[object Date]")
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  var s = String(value).trim();
  var m = s.match(/^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?[.\/-]?$/);
  if (!m) return null;
  var day = parseInt(m[1], 10), mon = parseInt(m[2], 10), yr;
  if (m[3]) { yr = parseInt(m[3], 10); if (yr < 100) yr += 2000; }
  else { yr = today.getFullYear(); }
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  var d = new Date(yr, mon - 1, day);
  if (d.getMonth() !== mon - 1) return null;
  if (!m[3]) {
    var diff = Math.round((d - today) / 86400000);
    if (diff > 182) d = new Date(yr - 1, mon - 1, day);
    else if (diff < -182) d = new Date(yr + 1, mon - 1, day);
  }
  return d;
}
function daysOverdue_(due, today) { return Math.round((today - due) / 86400000); }

function findFirstGroupRow_(sh) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  for (var r = 1; r <= n; r++) if (isGroupHeader_(b[r - 1][0])) return r;
  throw new Error("Ei leidnud ühtegi grupi-pealkirja (nt KALISTEENIKA).");
}
function currentGroupTags_(sh) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var tags = [];
  for (var r = 1; r <= n; r++) if (isGroupHeader_(b[r - 1][0])) tags.push(String(b[r - 1][0]).toLowerCase().trim());
  return tags;
}

/* ============================ PÕHILOOGIKA ============================ */
function main_(quiet, doLog) {
  var sh = getSheet_();
  var today = midnight_(new Date());

  try { ensureOneOffBlocks_(sh); } catch (eOO) {}   // v14: üks kord
  abortCheck_(); removeTopList_(sh);
  if (doLog) { abortCheck_(); try { logPaymentsFromDateDiff_(sh, today); } catch (e) { toast("Tasude logimise viga: " + e.message); } }
  abortCheck_(); var archived = doArchive_(sh, today);
  abortCheck_(); buildTopList_(sh, today);
  abortCheck_(); colorOverdue_(sh, today);
  abortCheck_(); repairTitleColors_(sh);
  abortCheck_(); restoreNumberFormula_(sh);
  abortCheck_(); ensureDropInVisual_(sh);
  abortCheck_(); try { ensureReminderCheckboxes_(sh); } catch (eCb) {}
  try { updateClientCount_(sh); } catch (eCnt) {}   // v14: F2 klientide arv
  if (doLog) { abortCheck_(); var seaded = settingsSheet_(); if (seaded) { try { refreshSummary_(seaded); } catch (e) {} try { syncBalance_(seaded, today); } catch (e2) { toast("Bilanssi saatmine ebaõnnestus: " + e2.message); } try { syncKadri_(today); } catch (e3) { toast("Kadri bilanssi viga: " + e3.message); } } }

  if (archived.length) {
    var p = PropertiesService.getDocumentProperties();
    p.setProperty("ARCHIVE_PENDING", "yes");
    p.setProperty("ARCHIVE_NAMES", archived.join(", "));
    SpreadsheetApp.getActiveSpreadsheet().toast(archived.join(", "), "Need kliendid on arhiveeritud:", 20);
    try {
      SpreadsheetApp.getUi().alert("Need kliendid on arhiveeritud:",
        archived.join("\n"), SpreadsheetApp.getUi().ButtonSet.OK);
    } catch (e) {}
  } else if (!quiet) {
    toast("Valmis. Arhiveeritavaid kliente ei olnud.");
  }
}

/* v14: F2 = kõigi klientide arv kõigist gruppidest (2x, 1x ja Ühekordsed plokid).
 * Loeb sama ala mis muu loogika (esimesest grupist kuni scanLimit rida pärast viimast
 * pealkirja) + viimase grupi "Ühekordsed" ploki järjestikused read. Pealkirju, "Nimi"
 * ridu ja ülemist "Tasuda tuleb" nimekirja ei loe. Kui F2-s on muu tekst, ei kirjuta üle. */
function countClients_(sh) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var kr = findFirstGroupRow_(sh);
  var oo = oneOffMask_(b);
  var isClient = function (v) {
    return !!v && String(v).trim() !== "" && !isTitle_(v) && !isOneOffHeader_(v) &&
           String(v).trim().toLowerCase() !== "nimi";
  };
  var count = 0;
  for (r = kr; r <= scanBottom; r++) if (isClient(b[r - 1][0])) count++;
  // viimase grupi "Ühekordsed" plokk võib ulatuda skaneeritavast alast välja
  for (r = scanBottom + 1; r <= n && oo[r - 1] && isClient(b[r - 1][0]); r++) count++;
  return count;
}
/* v14: loob igasse trennigruppi (kalisteenika, swed, alfa kolmik, lapsed) "Ühekordsed"
 * ploki, kui seda veel pole. Tehakse AINULT ÜKS kord (mälu: ONEOFF_BLOCKS_DONE), et
 * kustutatud plokk tagasi ei tuleks. Pealkirja rida saab "1x nädalas" rea kujunduse. */
function ensureOneOffBlocks_(sh) {
  var props = PropertiesService.getDocumentProperties();
  if (props.getProperty("ONEOFF_BLOCKS_DONE") === "yes") return;
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var kr = findFirstGroupRow_(sh);
  var groups = [], g = null;
  for (r = kr; r <= scanBottom; r++) {
    var v = b[r - 1][0];
    if (isGroupHeader_(v)) {
      g = { name: String(v).toLowerCase().trim(), head: r, sub: 0, last: r, has: false };
      groups.push(g);
      continue;
    }
    if (!g) continue;
    if (isOneOffHeader_(v)) { g.has = true; continue; }
    if (isSubtitle_(v)) g.sub = r;                        // viimane alapealkiri (nt "1x nädalas")
    if (v !== "" && v !== null) g.last = r;              // grupi viimane täidetud rida
  }
  var w = CONFIG.colG - CONFIG.colB + 1;                // B..G (H linnukesi ei kopeeri)
  // alt üles, et ülemiste gruppide reanumbrid ei nihkuks
  for (var i = groups.length - 1; i >= 0; i--) {
    g = groups[i];
    if (g.has || !classFromTokens_(g.name.split(/\s+/))) continue;   // ainult päris trennirühmad
    var after = g.last;
    if (after + 1 <= sh.getMaxRows()) {
      var nb = sh.getRange(after + 1, CONFIG.colB).getValue();
      if (nb === "" || nb === null) after++;               // jäta olemasolev tühi vaherida alles
    }
    sh.insertRowsAfter(after, 4);
    var hr = after + 1;
    sh.getRange(hr, CONFIG.colB, 4, w).clearContent().clearFormat();
    if (g.sub) sh.getRange(g.sub, CONFIG.colB, 1, w).copyTo(sh.getRange(hr, CONFIG.colB, 1, w), { formatOnly: true });
    sh.getRange(hr, CONFIG.colB, 1, 3).setValues([["Ühekordsed", "kehtib", "kommentaar"]]);
    if (g.sub) {   // tühjad read nagu "1x nädalas" nimede read
      var src = Math.min(g.sub + 1, g.last);
      for (var k = 1; k <= 3; k++)
        sh.getRange(src, CONFIG.colB, 1, w).copyTo(sh.getRange(hr + k, CONFIG.colB, 1, w), { formatOnly: true });
      sh.getRange(hr + 1, CONFIG.colC, 3, 1).setBackground(null);   // ära päri punast
    }
  }
  props.setProperty("ONEOFF_BLOCKS_DONE", "yes");
  SpreadsheetApp.flush();
}
function updateClientCount_(sh) {
  var cell = sh.getRange(CONFIG.countCell);
  var cur = cell.getValue();
  if (cur !== "" && cur !== null && typeof cur !== "number") return;   // võõras sisu -> ei puutu
  var cnt = countClients_(sh);
  if (cur !== cnt) cell.setValue(cnt);
  if (!cell.getNote()) cell.setNote("Kliente kokku kõigis gruppides (2x, 1x, Ühekordsed). Uueneb ise.");
}

function ensureDropInVisual_(sh) {
  var u = findLabelRow_(sh, CONFIG.labels.dropIn);
  if (!u) return;
  var cell = sh.getRange(u + 1, CONFIG.colB);
  cell.setBackground(CONFIG.inputBg)
      .setNote("Kirjuta siia nimi (või 'Mari 20') ja Enter -> ühekordne makse (vaikimisi 15 €). Töötab telefonis ka.");
}

/* ===== TASUD: kuupäeva-vahe (kalendrikuud) ===== */
function scanActiveClients_(sh, today) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = lastTitle + CONFIG.scanLimit;
  var kr = findFirstGroupRow_(sh);
  var out = {}, grp = "", sub = "", oo = oneOffMask_(b);
  for (r = kr; r <= Math.min(scanBottom, n); r++) {
    var name = b[r - 1][0];
    if (isGroupHeader_(name)) { grp = String(name).toLowerCase().trim(); sub = ""; }
    else if (isSubtitle_(name)) { sub = String(name).trim(); }
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" plokk
    if (!name || isTitle_(name)) continue;
    var freq = freqOf_(sub);
    var due = parseDueDate_(c[r - 1][0], today);
    var key = grp + "||" + freq + "||" + String(name).toLowerCase().trim();
    out[key] = { dateMs: due ? due.getTime() : null, rate: CONFIG.rates[freq] || 0, name: name, tag: clientTag_(grp, sub) };
  }
  return out;
}

/* ===== RÜHMAVAHETUS: liigutab kliendi teise trennirühma ja/või sagedusse =====
 *  Küsib nime, näitab kõik rühmad (nt kalisteenika 1x, swed 2x, lapsed 1x) ja
 *  liigutab rea (koos värvide/e-posti/keelega) valitud rühma lõppu. Bilanss jääb
 *  õigeks (võlts-makset EI teki).
 *  "JAH" = klient maksis uue kuu ette -> logib uue rühma määra (45/70) ja pikendab +1 kuu. */
function switchFrequency() { groupSwitch(); }   // vana nimi, et vanad nupud töötaks
function groupSwitch() {
  var ui = SpreadsheetApp.getUi();
  var sh = getSheet_();
  var today = new Date();
  var title = "🔀 Rühmavahetus";

  var rName = ui.prompt(title, "Kliendi NIMI (täpselt nagu tabelis):", ui.ButtonSet.OK_CANCEL);
  if (rName.getSelectedButton() !== ui.Button.OK) return;
  var wanted = String(rName.getResponseText()).trim().toLowerCase();
  if (!wanted) { ui.alert("Nimi puudus."); return; }

  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var kr = findFirstGroupRow_(sh);
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var isNimi = function (v) { return String(v).trim().toLowerCase() === "nimi"; };

  // 1) kõik rühmad (grupp + alajaotus) ja klient(ed)
  var sections = [], matches = [], grp = "", sub = "", cur = null, oo = oneOffMask_(b);
  for (r = kr; r <= scanBottom; r++) {
    var nm = b[r - 1][0];
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" plokk – ei ole rühm ega klient
    if (isGroupHeader_(nm) && !isNimi(nm)) {
      grp = String(nm).toLowerCase().trim(); sub = "";
      cur = { group: grp, sub: "", freq: 0, head: r, last: r };
      sections.push(cur);
      continue;
    }
    if (isSubtitle_(nm)) {
      sub = String(nm).trim();
      if (cur && cur.group === grp && !cur.sub && cur.last === cur.head) sections.pop(); // tühi grupi-päis
      cur = { group: grp, sub: sub, freq: freqOf_(sub), head: r, last: r };
      sections.push(cur);
      continue;
    }
    if (!nm || isTitle_(nm) || isNimi(nm)) continue;
    if (cur) cur.last = r;
    if (String(nm).trim().toLowerCase() === wanted)
      matches.push({ row: r, name: String(nm).trim(), group: grp, sub: sub, freq: freqOf_(sub), cur: c[r - 1][0], sec: cur });
  }
  if (!matches.length) { ui.alert("Klienti '" + rName.getResponseText() + "' ei leitud."); return; }
  var label = function (sec) { return sec.group + (sec.sub ? " – " + sec.sub : ""); };

  var chosen = matches[0];
  if (matches.length > 1) {
    var lst = matches.map(function (m, i) {
      return (i + 1) + ") " + m.name + " – " + label(m.sec) + " (rida " + m.row + ")";
    }).join("\n");
    var rPick = ui.prompt("Mitu sama nimega klienti", "Kumba liigutada? Sisesta number:\n\n" + lst, ui.ButtonSet.OK_CANCEL);
    if (rPick.getSelectedButton() !== ui.Button.OK) return;
    var idx = parseInt(String(rPick.getResponseText()).trim(), 10);
    if (isNaN(idx) || idx < 1 || idx > matches.length) { ui.alert("Vigane number."); return; }
    chosen = matches[idx - 1];
  }

  // 2) siht-rühm
  // ainult päris trennirühmad (kalisteenika, swed, lapsed, alfa) – mitte arhiiv jms
  var targets = sections.filter(function (s) {
    return s !== chosen.sec && !!classFromTokens_(s.group.split(/\s+/));
  });
  if (!targets.length) { ui.alert("Teisi rühmi ei leitud."); return; }
  var tl = targets.map(function (s, i) { return (i + 1) + ") " + label(s); }).join("\n");
  var rT = ui.prompt(title, chosen.name + " on praegu: " + label(chosen.sec) +
    "\n\nKuhu liigutada? Sisesta number:\n\n" + tl, ui.ButtonSet.OK_CANCEL);
  if (rT.getSelectedButton() !== ui.Button.OK) return;
  var ti = parseInt(String(rT.getResponseText()).trim(), 10);
  if (isNaN(ti) || ti < 1 || ti > targets.length) { ui.alert("Vigane number."); return; }
  var tSec = targets[ti - 1];

  // sama nimi juba siht-rühmas -> ei liiguta (muidu läheks bilanss segi)
  for (r = tSec.head + 1; r <= tSec.last; r++) {
    if (!oo[r - 1] && String(b[r - 1][0]).trim().toLowerCase() === wanted) {
      ui.alert("'" + chosen.name + "' on juba rühmas " + label(tSec) + " (rida " + r + "). Muuda enne nime.");
      return;
    }
  }
  var dest = tSec.last + 1;

  // 3) kinnitus (+ kas maksis)
  var due = is1xMarker_(chosen.cur) ? null : parseDueDate_(chosen.cur, today);
  var rate = CONFIG.rates[tSec.freq] || 0;
  var msg = chosen.name + ": " + label(chosen.sec) + " → " + label(tSec) + "\n\n";
  var pay = false;
  if (due && rate) {
    var resp = ui.alert(title, msg + "Kas klient maksis nüüd uue kuu ette (" + rate + " €)?\n\n" +
      "JAH = logi " + rate + " € ja pikenda kuupäeva +1 kuu\n" +
      "EI = ainult liiguta, makset ei logita", ui.ButtonSet.YES_NO_CANCEL);
    if (resp === ui.Button.CANCEL) return;
    pay = (resp === ui.Button.YES);
  } else {
    if (ui.alert(title, msg + "Makset ei logita.", ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(3000)) { ui.alert("Skript on hõivatud, proovi hetke pärast."); return; }
  try {
    // a) logi enne kõik ootel maksed VANADE võtmetega (et miski ei läheks kaduma)
    try { logPaymentsFromDateDiff_(sh, midnight_(today)); } catch (e) {}

    // b) liiguta kogu rida (värvid, e-post, keel jne. lähevad kaasa)
    sh.moveRows(sh.getRange(chosen.row, 1, 1, 1), dest);
    var newRow = chosen.row < dest ? dest - 1 : dest;
    SpreadsheetApp.flush();

    // c) valikuline makse
    var paidTxt = "makset ei logitud";
    if (pay && String(sh.getRange(newRow, CONFIG.colB).getValue()).trim() === chosen.name) {
      var y = due.getFullYear(), m = due.getMonth() + 1;
      var nd = new Date(y, m, Math.min(due.getDate(), daysInMonth_(y, m)));
      var cell = sh.getRange(newRow, CONFIG.colC);
      cell.setValue(nd);
      cell.setBackground(daysOverdue_(nd, today) >= 1 ? CONFIG.red : null);
      var seaded = settingsSheet_();
      if (seaded) {
        appendToLog_(seaded, [[new Date(), chosen.name, clientTag_(tSec.group, tSec.sub), rate, "kuumakse"]]);
        try { refreshSummary_(seaded); } catch (e) {}
        paidTxt = rate + " € logitud, uus kuupäev " + Utilities.formatDate(nd, CONFIG.tz, "dd.MM.yy");
      } else paidTxt = "'" + CONFIG.settingsTab + "' lehte ei leitud – makse logimata";
    }

    // d) uus baas -> öine käivitus ei näe muutust ega logi võlts-makset
    SpreadsheetApp.flush();
    writeSnapshotFromCur_(scanActiveClients_(sh, new Date()));
    refreshTopList_(sh);                                    // "Tasuda tuleb" uue rühmaga
    try { ensureReminderCheckboxes_(sh); } catch (e) {}     // lastele linnuke juurde / teistelt maha

    ui.alert("✅ " + chosen.name + ": " + label(chosen.sec) + " → " + label(tSec) + "\n• " + paidTxt);
  } finally { lock.releaseLock(); }
}

/* ===== PIKENDA TASUTA (üksik klient) – nihuta ühe kliendi kuupäev edasi,
 *       EI logi maksena. Nimekaitse: mitme sama nimega kliendi puhul küsib, kumb. ===== */
function freeExtendClient() {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.getActive().getActiveSheet();
  var today = new Date();

  // 1) küsi nimi
  var rName = ui.prompt("🎟 Pikenda tasuta – klient",
    "Sisesta kliendi NIMI (täpselt nagu tabelis):", ui.ButtonSet.OK_CANCEL);
  if (rName.getSelectedButton() !== ui.Button.OK) return;
  var wanted = String(rName.getResponseText()).trim();
  if (!wanted) { ui.alert("Nimi puudus."); return; }

  // 2) leia KÕIK selle nimega kliendid grupi-sektsioonides (dateeritud, mitte "1x")
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var kr = findFirstGroupRow_(sh);
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);

  var matches = [], grp = "", oo = oneOffMask_(b);
  for (r = kr; r <= scanBottom; r++) {
    var nm = b[r - 1][0];
    if (isGroupHeader_(nm)) { grp = String(nm).trim(); }
    if (oo[r - 1]) continue;   // v14
    if (!nm || isTitle_(nm)) continue;
    if (String(nm).trim().toLowerCase() !== wanted.toLowerCase()) continue;
    matches.push({ row: r, name: String(nm).trim(), group: grp, cur: c[r - 1][0] });
  }

  if (!matches.length) { ui.alert("Klienti '" + wanted + "' ei leitud grupi-sektsioonist."); return; }

  // 3) NIMEKAITSE: kui mitu, lase valida numbriga
  var chosen;
  if (matches.length === 1) {
    chosen = matches[0];
  } else {
    var lst = matches.map(function (m, i) {
      var dtxt = is1xMarker_(m.cur) ? "1x" :
        (m.cur instanceof Date ? Utilities.formatDate(m.cur, CONFIG.tz, "dd.MM.yy") : String(m.cur));
      return (i + 1) + ") " + m.name + " – " + (m.group || "?") + " – " + dtxt + " (rida " + m.row + ")";
    }).join("\n");
    var rPick = ui.prompt("Mitu klienti nimega '" + wanted + "'",
      "Kumba pikendada? Sisesta number:\n\n" + lst, ui.ButtonSet.OK_CANCEL);
    if (rPick.getSelectedButton() !== ui.Button.OK) return;
    var idx = parseInt(String(rPick.getResponseText()).trim(), 10);
    if (isNaN(idx) || idx < 1 || idx > matches.length) { ui.alert("Vigane number."); return; }
    chosen = matches[idx - 1];
  }

  if (is1xMarker_(chosen.cur)) { ui.alert("'" + chosen.name + "' on \"1x\" klient – pole kuupäeva, mida pikendada."); return; }
  var due = parseDueDate_(chosen.cur, today);
  if (!due) { ui.alert("'" + chosen.name + "' real pole kehtivat kuupäeva."); return; }

  // 4) küsi mitu päeva edasi
  var rDays = ui.prompt("Mitu päeva edasi?",
    chosen.name + " (" + chosen.group + "), praegu " +
    Utilities.formatDate(due, CONFIG.tz, "dd.MM.yy") + ".\nMitu PÄEVA edasi nihutada (nt 30)?",
    ui.ButtonSet.OK_CANCEL);
  if (rDays.getSelectedButton() !== ui.Button.OK) return;
  var days = parseInt(String(rDays.getResponseText()).trim(), 10);
  if (isNaN(days) || days <= 0) { ui.alert("Sisesta positiivne päevade arv."); return; }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(3000)) { ui.alert("Skript on hõivatud, proovi hetke pärast."); return; }
  try {
    var nd = new Date(due.getFullYear(), due.getMonth(), due.getDate() + days);
    var cell = sh.getRange(chosen.row, CONFIG.colC);
    cell.setValue(nd);
    // uus kuupäev tulevikus -> pole üle tähtaja -> eemalda punane
    if (daysOverdue_(nd, today) < 1) cell.setBackground(null);
    SpreadsheetApp.flush();

    // KRIITILINE: uuenda snapshot -> date-diff ei näe muutust -> makset EI logita
    var cur = scanActiveClients_(sh, new Date());
    writeSnapshotFromCur_(cur);
    refreshTopList_(sh);   // v13: eemalda "Tasuda tuleb" nimekirjast, kui enam üle tähtaja pole

    ui.alert("🎟 Tasuta pikendus tehtud:\n" +
      "• " + chosen.name + " (" + chosen.group + ")\n" +
      "• " + Utilities.formatDate(due, CONFIG.tz, "dd.MM.yy") + " → " +
      Utilities.formatDate(nd, CONFIG.tz, "dd.MM.yy") + " (+" + days + " päeva)\n" +
      "• Makset EI logitud. Meeldetuletus järgib uut kuupäeva.");
  } finally { lock.releaseLock(); }
}

/* ===== SUVEPAUS: nihuta kõik kuupäevad edasi (EI logi makseks) ===== */
function summerBreakShift() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt(
    "🏖 Suvepaus – nihuta kuupäevad edasi",
    "Mitu PÄEVA edasi nihutada kõik aktiivsete klientide kuupäevad?\n" +
    "(nt 30). \"1x\" kliente ei puudutata. Seda EI logita maksena.",
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  var raw = String(resp.getResponseText()).trim().replace(",", ".");
  var days = parseInt(raw, 10);
  if (isNaN(days) || days <= 0) { ui.alert("Sisesta positiivne päevade arv (nt 30)."); return; }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(3000)) { ui.alert("Skript on hõivatud, proovi hetke pärast uuesti."); return; }
  try {
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getActiveSheet();       // jooksval (aktiivsel) lehel
    var today = new Date();
    var n = sh.getLastRow();
    var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
    var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();

    // sama haardega nagu mujal: viimasest tiitlist scanLimit rida allapoole
    var lastTitle = 0;
    for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
    var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
    var kr = findFirstGroupRow_(sh);

    var shifted = 0, skipped1x = 0, oo = oneOffMask_(b);
    for (r = kr; r <= scanBottom; r++) {
      var name = b[r - 1][0];
      if (oo[r - 1]) continue;                        // v14: "Ühekordsed" plokk
      if (!name || isTitle_(name)) continue;         // tiitlid/alapealkirjad vahele
      var val = c[r - 1][0];
      if (is1xMarker_(val)) { skipped1x++; continue; } // "1x" -> jäta puutumata
      var due = parseDueDate_(val, today);
      if (!due) continue;                             // pole kuupäev -> vahele
      var nd = new Date(due.getFullYear(), due.getMonth(), due.getDate() + days);
      sh.getRange(r, CONFIG.colC).setValue(nd);
      shifted++;
    }
    SpreadsheetApp.flush();

    // KRIITILINE: uuenda snapshot NII, et nihe EI registreeruks maksena.
    // scanActiveClients_ loeb uued (nihutatud) kuupäevad -> writeSnapshotFromCur_
    // salvestab need baasjooneks -> öine date-diff ei näe muutust -> makset ei logita.
    var cur = scanActiveClients_(sh, new Date());
    writeSnapshotFromCur_(cur);

    // lükka ka meeldetuletuste "juba saadetud" mälu edasi (ära saada juhuslikke),
    // ja tühjenda vana mälu, et vanade kuupäevade järgi ei saadetaks.
    PropertiesService.getDocumentProperties().deleteProperty("REMINDER_SENT");

    ui.alert("🏖 Suvepaus tehtud:\n" +
      "• Nihutatud " + shifted + " kuupäeva +" + days + " päeva\n" +
      "• \"1x\" kliente vahele jäetud: " + skipped1x + "\n" +
      "• Makseid EI logitud (snapshot uuendatud)\n" +
      "• Meeldetuletuste mälu lähtestatud (juhuslikke ei saadeta)");
  } finally { lock.releaseLock(); }
}

function readSnapshot_() {
  var s = PropertiesService.getDocumentProperties().getProperty("DUE_SNAPSHOT");
  if (!s) return null;
  try { return JSON.parse(s); } catch (e) { return null; }
}
function writeSnapshotFromCur_(cur) {
  var snap = {}; for (var k in cur) snap[k] = cur[k].dateMs;
  PropertiesService.getDocumentProperties().setProperty("DUE_SNAPSHOT", JSON.stringify(snap));
}
function logPaymentsFromDateDiff_(sh, today) {
  var cur = scanActiveClients_(sh, today);
  var snap = readSnapshot_();
  if (snap === null) { writeSnapshotFromCur_(cur); return; }
  var recent = recentMonthlyPays_(settingsSheet_(), today, CONFIG.dupGuardDays);
  var pays = [], skipped = [];
  for (var key in cur) {
    var c = cur[key];
    if (c.dateMs == null) continue;
    var oldMs = snap.hasOwnProperty(key) ? snap[key] : null;
    var oldD = (oldMs == null) ? today : new Date(oldMs);
    var newD = new Date(c.dateMs);
    if (newD.getTime() > oldD.getTime()) {
      var fee = feeForDates_(oldD, newD, c.rate);
      if (fee <= 0) continue;
      // v12: klient "uus" (pole eelmises snapshotis) -> kas tal on hiljuti juba kuumakse?
      var pk = payKey_(c.name, c.tag);
      if (oldMs == null && recent[pk] != null) {
        pays.push([new Date(), c.name, c.tag, 0, "kuumakse (kordus, vahele jäetud)"]);
        skipped.push(c.name);
        continue;
      }
      pays.push([new Date(), c.name, c.tag, fee, "kuumakse"]);
      recent[pk] = today.getTime();   // sama nimi kahes sektsioonis samal käivitusel -> 1 makse
    }
  }
  if (pays.length) {
    var seaded = settingsSheet_();
    if (seaded) appendToLog_(seaded, pays);
    else toast("'" + CONFIG.settingsTab + "' lehte ei leitud – tasud logimata.");
  }
  if (skipped.length) toast("Topeltmakse vahele jäetud: " + skipped.join(", "));
  writeSnapshotFromCur_(cur);
}
/* v12: NIME PARANDUS veerus B (grupi-sektsioonis) -> sama klient edasi.
 * Tõstab skripti mälus kuupäeva vana nime alt uue nime alla, et võlts-makset ei tekiks. */
function carryNameInSnapshot_(sh, row, oldName, newName) {
  var b = sh.getRange(1, CONFIG.colB, row, 1).getValues();
  if (oneOffMask_(b)[row - 1]) return;   // v14
  var grp = "", sub = "";
  for (var r = row - 1; r >= 1; r--) {
    var t = b[r - 1][0];
    if (!sub && isSubtitle_(t)) sub = String(t).trim();
    if (isGroupHeader_(t)) { grp = String(t).toLowerCase().trim(); break; }
  }
  if (!grp) return;
  var snap = readSnapshot_();
  if (!snap) return;
  var freq = freqOf_(sub);
  var oldKey = grp + "||" + freq + "||" + String(oldName).toLowerCase().trim();
  var newKey = grp + "||" + freq + "||" + String(newName).toLowerCase().trim();
  if (oldKey === newKey || !snap.hasOwnProperty(oldKey)) return;
  snap[newKey] = snap[oldKey];
  delete snap[oldKey];
  PropertiesService.getDocumentProperties().setProperty("DUE_SNAPSHOT", JSON.stringify(snap));
}
// v12: "nimi||grupp" (nt "säsil vaher||lapsed"), sagedus (1x/2x) ei loe
function payKey_(name, tag) {
  return String(name).toLowerCase().trim() + "||" + groupPartOf_(tag);
}
// v12: kaart payKey_ -> viimase kuumakse aeg (ms), ainult viimase `days` päeva kuumaksed
function recentMonthlyPays_(seaded, today, days) {
  var map = {};
  if (!seaded) return map;
  var col = CONFIG.logCols;
  var n = seaded.getLastRow();
  if (n < 2) return map;
  var from = today.getTime() - days * 86400000;
  var data = seaded.getRange(2, col.date, n - 1, 5).getValues(); // J:N
  for (var i = 0; i < data.length; i++) {
    var d = data[i][0], amt = data[i][3], type = String(data[i][4]).toLowerCase();
    if (type.indexOf("kuumakse") === -1 || type.indexOf("kordus") !== -1) continue;
    if (!(typeof amt === "number" && amt > 0)) continue;
    if (Object.prototype.toString.call(d) !== "[object Date]") continue;
    var ms = midnight_(d).getTime();
    if (ms < from) continue;
    var k = payKey_(data[i][1], data[i][2]);
    if (map[k] == null || ms > map[k]) map[k] = ms;
  }
  return map;
}

/* ===== TASUD: logi + kokkuvõte 'seaded' lehel ===== */
function ensureLogHeader_(seaded) {
  var c = CONFIG.logCols;
  if (seaded.getRange(1, c.date).getValue() === "") {
    seaded.getRange(1, c.date, 1, 5)
      .setValues([["Kuupäev", "Nimi", "Grupp", "Summa", "Tüüp"]]).setFontWeight("bold");
  }
}
function appendToLog_(seaded, rows) {
  ensureLogHeader_(seaded);
  var c = CONFIG.logCols;
  var n = Math.max(seaded.getLastRow(), 1);
  var jv = seaded.getRange(1, c.date, n, 1).getValues();
  var last = 1;
  for (var r = n; r >= 1; r--) { if (jv[r - 1][0] !== "" && jv[r - 1][0] !== null) { last = r; break; } }
  var start = last + 1;
  seaded.getRange(start, c.date, rows.length, 5).setValues(rows);
  seaded.getRange(start, c.date, rows.length, 1).setNumberFormat("dd.MM.yyyy");
  seaded.getRange(start, c.amount, rows.length, 1).setNumberFormat('0.00" €"');
}
function pickSep_(seaded) {
  var cell = seaded.getRange(1, 26);
  try {
    cell.setFormula("=SUM(1,2)"); SpreadsheetApp.flush();
    if (cell.getValue() === 3) { cell.clearContent(); return ","; }
    cell.setFormula("=SUM(1;2)"); SpreadsheetApp.flush();
    cell.clearContent(); return ";";
  } catch (e) { try { cell.clearContent(); } catch (e2) {} return ","; }
}
function refreshSummary_(seaded) {
  var n = Math.max(seaded.getLastRow(), 2);
  var eVals = seaded.getRange(1, 5, n, 1).getValues(); // veerg E (pealkirjad + "Kuu")
  var s = pickSep_(seaded);
  for (var hr = 1; hr <= n; hr++) {
    if (String(eVals[hr - 1][0]).toLowerCase().trim() !== "kuu") continue;
    var yearRow = hr;
    // tabeli pealkiri ühe rea võrra ülal -> kas KOKKU (total) või grupi nimi
    var titleLower = (yearRow >= 2) ? String(eVals[yearRow - 2][0]).toLowerCase().trim() : "";
    var groupFilter = (titleLower && titleLower.indexOf("kokku") === -1 &&
                       titleLower.indexOf("rühmatrennide") === -1) ? titleLower : "";
    var header = seaded.getRange(yearRow, 6, 1, 12).getValues()[0]; // F..Q aastad
    for (var i = 0; i < header.length; i++) {
      var y = parseInt(header[i], 10);
      if (!(y >= 2000 && y < 2100)) continue;
      var col = 6 + i, L = colLetter_(col);
      var blk = seaded.getRange(yearRow + 1, col, 13, 1);
      var vv = blk.getValues(), ff = blk.getFormulas();
      for (var m = 1; m <= 13; m++) {
        var v = vv[m - 1][0], fexist = ff[m - 1][0];
        if (fexist === "" && typeof v === "number" && v !== 0) continue; // käsitsi arv -> jäta
        var f;
        if (m <= 12) {
          f = '=SUMIFS($M:$M' + s + '$J:$J' + s + '">="&DATE(' + L + '$' + yearRow + s + 'ROW()-' + yearRow + s + '1)' + s +
              '$J:$J' + s + '"<"&DATE(' + L + '$' + yearRow + s + 'ROW()-' + yearRow + '+1' + s + '1)';
          if (groupFilter) f += s + '$L:$L' + s + '"' + groupFilter + '*"';
          f += ')';
        } else {
          f = '=SUM(' + L + (yearRow + 1) + ':' + L + (yearRow + 12) + ')';
        }
        seaded.getRange(yearRow + m, col).setFormula(f);
      }
    }
  }
}

/* ===== ARHIIV / NIMEKIRI / VÄRVID / VALEM ===== */
function removeTopList_(sh) {
  var kr = findFirstGroupRow_(sh);
  var from = topListStart_(sh), to = kr - 1;
  if (to < from) return;
  var tags = currentGroupTags_(sh);
  var vals = sh.getRange(from, CONFIG.colA, to - from + 1, 4).getValues();
  for (var i = 0; i < vals.length; i++) {
    var a = vals[i][0], b = vals[i][1], c = vals[i][2], d = vals[i][3];
    var empty = (a === "" && b === "" && c === "" && d === "");
    var generated = (b !== "" && tags.indexOf(groupPartOf_(d)) !== -1);
    var isOneXRow = (typeof b === "string" && b.toLowerCase().indexOf("1x pääsmed") === 0);
    if (!empty && !generated && !isOneXRow)
      throw new Error("Read " + from + "–" + to + " sisaldavad ootamatut sisu. " +
        "Ohutuse mõttes ei muudetud midagi – tühjenda need read ja proovi uuesti.");
  }
  sh.deleteRows(from, to - from + 1);
}

/* ===== 1x KLIENDID (ühekordsete piletitega) =====
 *  Veerus C tekst "1x" -> klient maksab ühekordsete piletitega.
 *  Arhiveeritakse, kui viimasest (grupiga kattuvast) ühekordsest on 21+ päeva.
 *  Esimene tsükkel algab alles esimesest maksest – ilma makseta ei arhiveerita. */
function is1xMarker_(v) {
  if (v === null || v === undefined) return false;
  return /^\s*1\s*x\s*$/i.test(String(v));
}
// kaart: "nimi||grupp" -> viimase ühekordse makse kuupäev (ms, keskööks)
function buildLastDropInMap_(seaded) {
  var map = {};
  if (!seaded) return map;
  var col = CONFIG.logCols;
  var n = seaded.getLastRow();
  if (n < 2) return map;
  var data = seaded.getRange(2, col.date, n - 1, 5).getValues(); // J:N
  for (var i = 0; i < data.length; i++) {
    var d = data[i][0], nm = data[i][1], grp = data[i][2], type = String(data[i][4]).toLowerCase();
    if (type.indexOf("ühekordne") === -1) continue;                       // ainult ühekordsed
    if (Object.prototype.toString.call(d) !== "[object Date]") continue;
    var key = String(nm).toLowerCase().trim() + "||" + String(grp).toLowerCase().trim();
    var ms = midnight_(d).getTime();
    if (!map[key] || ms > map[key]) map[key] = ms;
  }
  return map;
}

function doArchive_(sh, today) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = lastTitle + CONFIG.scanLimit;
  var kr = findFirstGroupRow_(sh);
  var lastPay = buildLastDropInMap_(settingsSheet_());   // 1x klientide viimased maksed

  var picks = [], grp = "", sub = "", oo = oneOffMask_(b);
  for (r = kr; r <= Math.min(scanBottom, n); r++) {
    abortCheck_();
    var name = b[r - 1][0];
    if (isGroupHeader_(name)) { grp = String(name).toLowerCase().trim(); sub = ""; }
    else if (isSubtitle_(name)) { sub = String(name).trim(); }
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" plokki ei arhiveerita
    if (!name || isTitle_(name)) continue;
    var cval = c[r - 1][0];

    // 1x klient: arhiveeri, kui viimasest (grupiga) ühekordsest 21+ päeva
    if (is1xMarker_(cval)) {
      var k1 = String(name).toLowerCase().trim() + "||" + grp;
      var lastMs = lastPay[k1];
      if (lastMs != null) {                                  // ilma makseta ei arhiveeri
        var daysSince = Math.round((today.getTime() - lastMs) / 86400000);
        if (daysSince >= CONFIG.archiveDays)
          picks.push({ row: r, name: name, isOneX: true, lastMs: lastMs, tag: clientTag_(grp, sub) });
      }
      continue;
    }

    var due = parseDueDate_(cval, today);
    if (!due) continue;
    if (daysOverdue_(due, today) >= CONFIG.archiveDays)
      picks.push({ row: r, name: name, due: due, tag: clientTag_(grp, sub) });
  }
  if (!picks.length) return [];

  var ordered = picks.slice().sort(function (a, b2) { return a.row - b2.row; });
  var data = ordered.map(function (x) {
    if (x.isOneX) {
      var ds = Utilities.formatDate(new Date(x.lastMs), CONFIG.tz, "dd.MM.");
      return [x.name, "last paid " + ds + " -1x", x.tag];   // C = tekst, mitte kuupäev
    }
    return [x.name, x.due, x.tag];
  });
  var names = ordered.map(function (x) { return x.name; });

  picks.sort(function (a, b2) { return b2.row - a.row; });
  picks.forEach(function (x) { abortCheck_(); sh.deleteRows(x.row, 1); });

  var n2 = sh.getLastRow();
  var b2 = sh.getRange(1, CONFIG.colB, n2, 1).getValues();
  var lastTitle2 = 0, lastDataB = 0;
  for (r = 1; r <= n2; r++) {
    if (isTitle_(b2[r - 1][0])) lastTitle2 = r;
    if (b2[r - 1][0] !== "" && b2[r - 1][0] !== null) lastDataB = r;
  }
  var landing = Math.max(lastTitle2 + CONFIG.scanLimit + 1, lastDataB + 1);
  var need = landing + data.length - 1;
  if (need > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows());

  sh.getRange(landing, CONFIG.colA, data.length, 7).clearFormat();
  sh.getRange(landing, CONFIG.colB, data.length, 3).setValues(data);
  sh.getRange(landing, CONFIG.colC, data.length, 1).setNumberFormat(CONFIG.archiveDateFormat);
  return names;
}

function buildTopList_(sh, today) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var cf = sh.getRange(1, CONFIG.colC, n, 1).getNumberFormats();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = lastTitle + CONFIG.scanLimit;
  var kr = findFirstGroupRow_(sh);

  var list = [], oneXNames = [], grp = "", sub = "", oo = oneOffMask_(b);
  for (r = kr; r <= Math.min(scanBottom, n); r++) {
    var name = b[r - 1][0];
    if (isGroupHeader_(name)) { grp = String(name).toLowerCase().trim(); sub = ""; }
    else if (isSubtitle_(name)) { sub = String(name).trim(); }
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" plokk ei lähe nimekirja ega "1x pääsmed" ritta
    if (!name || isTitle_(name)) continue;
    // KOGU 1x kliendid (kõik grupid) – "1x pääsmed:" rea jaoks
    if (is1xMarker_(c[r - 1][0])) { oneXNames.push(String(name).trim()); continue; }
    var due = parseDueDate_(c[r - 1][0], today);
    if (!due) continue;
    var od = daysOverdue_(due, today);
    if (od >= 1 && od <= CONFIG.archiveDays - 1)
      list.push({ name: name, c: c[r - 1][0], fmt: cf[r - 1][0], tag: clientTag_(grp, sub), od: od });
  }
  list.sort(function (a, b2) { return b2.od - a.od; });

  kr = findFirstGroupRow_(sh);
  var k = list.length;
  var extra = oneXNames.length ? 1 : 0;                 // "1x pääsmed:" rida (kui on 1x kliente)
  sh.insertRowsBefore(kr, k + extra + 1);
  sh.getRange(kr, CONFIG.colA, k + extra + 1, 7).clearFormat();   // A..G – pühi päritud taustavärv

  if (k) {
    var aV = [], bcd = [], fmt = [], bg = [];
    for (var i = 0; i < k; i++) {
      aV.push([i + 1]);
      bcd.push([list[i].name, list[i].c, list[i].tag]);
      fmt.push([list[i].fmt]);
      bg.push([CONFIG.red]);
    }
    sh.getRange(kr, CONFIG.colA, k, 1).setValues(aV);
    sh.getRange(kr, CONFIG.colB, k, 3).setValues(bcd);
    sh.getRange(kr, CONFIG.colC, k, 1).setNumberFormats(fmt);
    sh.getRange(kr, CONFIG.colC, k, 1).setBackgrounds(bg);
  }
  // "1x pääsmed: nimi, nimi, …" rida top-listi LÕPPU (kohe gruppide kohal)
  if (extra) {
    var oneXRow = kr + k;
    sh.getRange(oneXRow, CONFIG.colB).setValue("1x pääsmed: " + oneXNames.join(", "));
  }
}

function colorOverdue_(sh, today) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var kr = findFirstGroupRow_(sh);
  if (scanBottom < kr) return;
  var rng = sh.getRange(kr, CONFIG.colC, scanBottom - kr + 1, 1);
  var bg = rng.getBackgrounds(), oo = oneOffMask_(b);
  for (r = kr; r <= scanBottom; r++) {
    var name = b[r - 1][0];
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" ploki värve ei muudeta
    if (name && !isTitle_(name)) {
      var due = parseDueDate_(c[r - 1][0], today);
      bg[r - kr][0] = (due && daysOverdue_(due, today) >= 1) ? CONFIG.red : CONFIG.white;
    }
  }
  rng.setBackgrounds(bg);
}

function repairTitleColors_(sh) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var bottom = Math.min(lastTitle, n);
  for (r = 1; r <= bottom; r++) {
    if (!isTitle_(b[r - 1][0])) continue;
    var col = sh.getRange(r, CONFIG.colB).getBackground();
    sh.getRange(r, CONFIG.colA, 1, 4).setBackground(col);
  }
}

function restoreNumberFormula_(sh) {
  var kr = findFirstGroupRow_(sh);
  var bNimi = sh.getRange(kr + 1, CONFIG.colB).getValue();
  var anchor = (String(bNimi).trim().toLowerCase() === "nimi") ? kr + 2 : kr + 1;
  var max = sh.getMaxRows();
  sh.getRange(anchor, CONFIG.colA, max - anchor + 1, 1).clearContent();
  var cell = sh.getRange(anchor, CONFIG.colA);
  if (!trySetFormula_(cell, COMMA_FORMULA) && !trySetFormula_(cell, SEMI_FORMULA)) {
    cell.clearContent();
    toast("HOIATUS: numbri-valemit ei saanud taastada. Kleebi see käsitsi lahtrisse A" + anchor + ".");
  }
}
function trySetFormula_(cell, f) {
  try {
    cell.clearContent();
    cell.setFormula(f);
    SpreadsheetApp.flush();
    var v = cell.getValue();
    if (typeof v === "string" && v.charAt(0) === "#") return false;
    return true;
  } catch (e) { return false; }
}

/* ============================================================================
 *  MEELDETULETUSED – e-kiri kliendile pääsme VIIMASEL kehtivuspäeval (~9:00)
 *  --------------------------------------------------------------------------
 *  Saadab, kui veerus E on korralik e-post JA veeru C kuupäev = TÄNA.
 *  Keel veerust F: EST/est/tühi -> eesti; ENG/eng -> inglise.
 *  Grupp "lapsed" -> lapsevanema versioon (nimi veerust G).
 *  Skaneerib SAMA ala mis muu loogika: esimesest grupist kuni 15 rida
 *  pärast viimast pealkirja (dünaamiline – kasvab nimekirjaga kaasa).
 *  Iga klient saab sama kuupäeva kohta kirja AINULT ÜKS kord.
 * ========================================================================== */

function setupReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sendDueReminders") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sendDueReminders")
    .timeBased().atHour(CONFIG.reminder.hour).everyDays(1).create();
  toast("⏰ Meeldetuletused seadistatud (kell " + CONFIG.reminder.hour + " paiku).");
}

// päästik kutsub seda (9:00 paiku)
function sendDueReminders() {
  var sp = PropertiesService.getScriptProperties();
  if (sp.getProperty("PAUSED") === "yes") return;          // STOP! peatab ka meeldetuletused
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(2000)) return;
  try { sendRemindersCore_(false); } finally { lock.releaseLock(); }
}

// menüüst käsitsi (näitab teate mitu saadeti)
function runRemindersNow() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(2000)) { toast("Skript juba töötab, oota hetk."); return; }
  try { sendRemindersCore_(true); } finally { lock.releaseLock(); }
}

function sendRemindersCore_(verbose) {
  var sh = getSheet_();
  var today = midnight_(new Date());
  var todayMs = today.getTime();
  var n = sh.getLastRow();

  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var c = sh.getRange(1, CONFIG.colC, n, 1).getValues();
  var e = sh.getRange(1, CONFIG.colE, n, 1).getValues();
  var f = sh.getRange(1, CONFIG.colF, n, 1).getValues();
  var g = sh.getRange(1, CONFIG.colG, n, 1).getValues();
  var h = sh.getRange(1, CONFIG.colH, n, 1).getValues();
  var isMonday = (today.getDay() === 1);

  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var kr = findFirstGroupRow_(sh);

  var sent = readReminderSent_();
  var grp = "", sentCount = 0, skippedNoTab = 0, oo = oneOffMask_(b);

  for (r = kr; r <= scanBottom; r++) {
    var name = b[r - 1][0];
    if (isGroupHeader_(name)) { grp = String(name).toLowerCase().trim(); continue; }
    if (oo[r - 1]) continue;   // v14: "Ühekordsed" plokile meile ei saadeta
    if (!name || isTitle_(name)) continue;

    var email = String(e[r - 1][0]).trim();
    if (!isValidEmail_(email)) continue;                    // pole posti -> ei midagi

    var isLapsed = (grp === CONFIG.reminder.lapsedGroup);
    var due = parseDueDate_(c[r - 1][0], today);
    // täiskasvanud: VIIMASEL päeval; lapsed: X päeva enne viimast päeva
    var sendDue = isLapsed
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + CONFIG.reminder.lapsedDaysBefore).getTime()
      : todayMs;
    // v13: KORDUSMEELDETULETUS – lapsed, linnuke H-s, esmaspäev, pääse lõppes viimase 7 päeva jooksul
    if (isLapsed && isMonday && h[r - 1][0] === true && due &&
        due.getTime() < todayMs && due.getTime() >= todayMs - 7 * 86400000) {
      var reIso = Utilities.formatDate(due, CONFIG.tz, "yyyy-MM-dd");
      var reKey = "re||" + String(name).toLowerCase().trim() + "||" + email.toLowerCase() + "||" + reIso;
      if (!sent[reKey]) {
        var reLang = String(f[r - 1][0]).trim().toLowerCase();
        var reEng = (reLang === "eng" || reLang === "en" || reLang === "english" || reLang === "inglise");
        var reName = String(g[r - 1][0]).trim() || String(name).trim();
        var reMsg = reReminderMessage_(reName, Utilities.formatDate(due, CONFIG.tz, "dd.MM.yy"), reEng);
        try {
          GmailApp.sendEmail(email, reMsg.subject, reMsg.body + "\n\n" + signaturePlain_(), {
            htmlBody: messageToHtml_(reMsg.body) + signatureHtml_(),
            name: CONFIG.reminder.fromName
          });
          sent[reKey] = todayMs;
          sentCount++;
        } catch (errRe) {
          if (verbose) toast("Saatmine ebaõnnestus (" + email + "): " + errRe.message);
        }
      }
      continue;
    }

    if (!due || due.getTime() !== sendDue) continue;

    var dueIso = Utilities.formatDate(due, CONFIG.tz, "yyyy-MM-dd");
    var key = String(name).toLowerCase().trim() + "||" + email.toLowerCase() + "||" + dueIso;
    if (sent[key]) continue;                                // juba saadetud sama kuupäeva eest (sama nimi+post+kuupäev)

    var lang = String(f[r - 1][0]).trim().toLowerCase();
    var isEng = (lang === "eng" || lang === "en" || lang === "english" || lang === "inglise");
    var dateStr = Utilities.formatDate(due, CONFIG.tz, "dd.MM.yy");

    var displayName, subject, message;
    if (isLapsed) {
      displayName = String(g[r - 1][0]).trim() || String(name).trim();  // lapsevanema nimi (varuks lapse oma)
      if (isEng) {
        subject = CONFIG.reminder.subjectLapsedEng;
        message =
          "Hello " + displayName + "!\n\n" +
          "This is a reminder that the last valid day of your child's calisthenics class pass is " + dateStr + " (in 2 days). After that date, you'll need to get a new pass for your child.\n" +
          "You can pay in cash at the studio or through Stebby.\n\n" +
          "Stebby monthly pass, 2x a week: " + CONFIG.reminder.stebby2x + "\n\n" +
          "Stebby monthly pass, 1x a week: " + CONFIG.reminder.stebby1x + "\n\n" +
          "Stebby adds a service fee of 4.5% + VAT to the ticket price.\n\n" +
          "For Stebby purchases, I need the ticket code to activate the pass. Please email it to me.\n\n" +
          "All the best!\n" +
          "This email was sent automatically.";
      } else {
        subject = CONFIG.reminder.subjectLapsedEst;
        message =
          "Tere " + displayName + "!\n\n" +
          "Tuletan sulle meelde, et laste kalisteenika pääsme viimane kehtivuspäev on " + dateStr + " (2 päeva pärast). Pärast seda kuupäeva peaksid soetama lapsele uue pileti.\n" +
          "Tasuda saab sularahas kohapeal või läbi Stebby.\n\n" +
          "Stebby kuupääse 2x nädalas: " + CONFIG.reminder.stebby2x + "\n\n" +
          "Stebby kuupääse 1x nädalas: " + CONFIG.reminder.stebby1x + "\n\n" +
          "Stebby piletitele lisandub Stebby teenustasu 4,5% + km.\n\n" +
          "Stebby ostude puhul vajan pileti koodi, et pääse aktiveerida. Palun saada see mulle meiliga.\n\n" +
          "Kõike head!\n" +
          "See e-kiri on saadetud automaatselt.";
      }
    } else {
      displayName = String(name).trim();
      if (isEng) {
        subject = CONFIG.reminder.subjectEng;
        message =
          "Hi " + displayName + "!\n" +
          "This is a reminder that today, " + dateStr + ", is the last valid day of your training pass. Starting tomorrow, you'll need to get a new pass.\n" +
          "See you in training soon!\n" +
          "This email was sent automatically.";
      } else {
        subject = CONFIG.reminder.subjectEst;
        message =
          "Hei " + displayName + "!\n" +
          "Tuletan sulle meelde, et täna " + dateStr + " on sinu trenni pääsme viimane kehtivuspäev. Alates homsest peaksid sa soetama uue pileti.\n" +
          "Näeme juba varsti trennis!\n" +
          "See e-kiri on saadetud automaatselt.";
      }
    }

    try {
      GmailApp.sendEmail(email, subject, message + "\n\n" + signaturePlain_(), {
        htmlBody: messageToHtml_(message) + signatureHtml_(),
        name: CONFIG.reminder.fromName
      });
      sent[key] = todayMs;
      sentCount++;
    } catch (err) {
      if (verbose) toast("Saatmine ebaõnnestus (" + email + "): " + err.message);
    }
  }

  pruneReminderSent_(sent, todayMs);
  writeReminderSent_(sent);
  if (verbose) toast(sentCount ? (sentCount + " meeldetuletust saadetud.") : "Täna polnud kellelegi saata.");
}

/* v13: kordusmeeldetuletuse tekst (lapsevanemale) */
function reReminderMessage_(displayName, dateStr, isEng) {
  var R = CONFIG.reminder;
  if (isEng) return {
    subject: R.subjectReEng,
    body:
      "Hello " + displayName + "!\n\n" +
      "This is a reminder that your child's calisthenics class pass expired on " + dateStr + " and a new pass hasn't been bought yet.\n" +
      "You can pay in cash at the studio or through Stebby.\n\n" +
      "Stebby monthly pass, 2x a week: " + R.stebby2x + "\n\n" +
      "Stebby monthly pass, 1x a week: " + R.stebby1x + "\n\n" +
      "Stebby adds a service fee of 4.5% + VAT to the ticket price.\n\n" +
      "For Stebby purchases, I need the ticket code to activate the pass. Please email it to me.\n" +
      "If you have already paid, please let me know.\n\n" +
      "All the best!\n" +
      "This email was sent automatically."
  };
  return {
    subject: R.subjectReEst,
    body:
      "Tere " + displayName + "!\n\n" +
      "Tuletan meelde, et lapse kalisteenika pääse lõppes " + dateStr + " ja uut pääset ei ole veel ostetud.\n" +
      "Tasuda saab sularahas kohapeal või läbi Stebby.\n\n" +
      "Stebby kuupääse 2x nädalas: " + R.stebby2x + "\n\n" +
      "Stebby kuupääse 1x nädalas: " + R.stebby1x + "\n\n" +
      "Stebby piletitele lisandub Stebby teenustasu 4,5% + km.\n\n" +
      "Stebby ostude puhul vajan pileti koodi, et pääse aktiveerida. Palun saada see mulle meiliga.\n" +
      "Kui oled juba tasunud, anna mulle palun teada.\n\n" +
      "Kõike head!\n" +
      "See e-kiri on saadetud automaatselt."
  };
}
/* v13: lisa veergu H linnuke igale lapse reale, kus H on tühi (olemasolevaid ei muuda);
 * kui lapse nimi on kustutatud, eemalda sealt linnuke */
function ensureReminderCheckboxes_(sh) {
  var n = sh.getLastRow();
  var b = sh.getRange(1, CONFIG.colB, n, 1).getValues();
  var hv = sh.getRange(1, CONFIG.colH, n, 1).getValues();
  var lastTitle = 0;
  for (var r = 1; r <= n; r++) if (isTitle_(b[r - 1][0])) lastTitle = r;
  var scanBottom = Math.min(lastTitle + CONFIG.scanLimit, n);
  var grp = "", oo = oneOffMask_(b);
  for (r = findFirstGroupRow_(sh); r <= scanBottom; r++) {
    var name = b[r - 1][0];
    if (isGroupHeader_(name)) { grp = String(name).toLowerCase().trim(); continue; }
    if (grp !== CONFIG.reminder.lapsedGroup) continue;
    var isKid = !oo[r - 1] && !!name && !isTitle_(name) && String(name).trim().toLowerCase() !== "nimi";
    var hval = hv[r - 1][0];
    if (isKid && (hval === "" || hval === null)) sh.getRange(r, CONFIG.colH).insertCheckboxes();
    else if (!isKid && typeof hval === "boolean") sh.getRange(r, CONFIG.colH).removeCheckboxes();  // laps kustutatud -> linnuke ära
  }
}

/* ----- "juba saadetud" mälu (DocumentProperties) ----- */
function readReminderSent_() {
  var s = PropertiesService.getDocumentProperties().getProperty("REMINDER_SENT");
  if (!s) return {};
  try { return JSON.parse(s); } catch (e) { return {}; }
}
function writeReminderSent_(obj) {
  PropertiesService.getDocumentProperties().setProperty("REMINDER_SENT", JSON.stringify(obj));
}
function pruneReminderSent_(obj, todayMs) {
  var cutoff = todayMs - CONFIG.reminder.keepDays * 86400000;
  for (var k in obj) if (typeof obj[k] === "number" && obj[k] < cutoff) delete obj[k];
}

function isValidEmail_(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

/* ----- kirja keha + allkiri ----- */
function messageToHtml_(msg) {
  var safe = String(msg).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;line-height:1.5;">' +
         safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, "<br>") + '</div>';
}
function signatureHtml_() {
  var orange = "#E8820C", gray = "#595959", link = "#1155cc";
  return '' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:' + gray + ';font-weight:bold;line-height:1.45;margin-top:18px;">' +
      '<div style="color:' + orange + ';font-weight:bold;letter-spacing:1px;">-------------------------------------------</div>' +
      '<div>Erik Epistoletto</div>' +
      '<div>juhataja, treener</div>' +
      '<div>Kehakultuuri stuudio Üksus</div>' +
      '<div>Erika 14-201, Tallinn, Arsenali Keskus</div>' +
      '<div>Tel: +37256667684</div>' +
      '<div><a href="https://www.stuudioyksus.fit" style="color:' + link + ';text-decoration:underline;">www.stuudioyksus.fit</a></div>' +
    '</div>';
}
function signaturePlain_() {
  return "-------------------------------------------\n" +
         "Erik Epistoletto\n" +
         "juhataja, treener\n" +
         "Kehakultuuri stuudio Üksus\n" +
         "Erika 14-201, Tallinn, Arsenali Keskus\n" +
         "Tel: +37256667684\n" +
         "www.stuudioyksus.fit";
}

// ================================================================ HINNALUGEJA LÕPP
