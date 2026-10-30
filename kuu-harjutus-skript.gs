/**
 * KUU HARJUTUS · skript
 *
 * See skript elab sinu privaatses tabelis (seal, kus on vahekaart „Kuuharjutus“) ja teeb kõik ise:
 *  • loob ühise tabeli, mida osalejad täidavad, ja jagab selle lingiga;
 *  • lisab nimekirja kirjutatud inimese igale kuu vahekaardile ja paneb X-id päevadele enne liitumist;
 *  • tõstab pausil olija uuelt kuult välja ja tagasi, kui ta valib uuesti „Osalen“;
 *  • „Eemalda“ + „Kinnitan eemaldamise“ kustutab inimese ja tema tulemused kõigilt vahekaartidelt;
 *  • hoiab keelevaliku kõigil vahekaartidel ühesugusena;
 *  • teeb reeglitest Google'i dokumendi ja paneb lingi vahekaardile „Reeglid“;
 *  • paneb tagasi nime, millel on selle kuu kirjeid, kui keegi selle kustutab või ära tõstab;
 *  • lukustab taseme pärast esimest nädalat ja vanad päevad;
 *  • teeb 20. kuupäeval järgmise kuu vahekaardi (kui harjutus on plaanis kirjas);
 *  • kuu lõppedes paneb tulemused lukku ja peidab vana kuu vahekaardi;
 *  • saadab sulle e-kirjaga valmis WhatsAppi postitused;
 *  • „Lisa uus grupp“: teine grupp saab oma ühise tabeli ja plaani vahekaardi („Kuuharjutus · nimi“), mille harjutused
 *    tulevad põhiplaanist; lingi, loosi ja postitused teeb skript igale grupile eraldi.
 *
 * Skript elab oma failis (näiteks „Kuu harjutus.gs“) ega sega sama tabeli teisi skripte:
 * tal pole funktsiooni onOpen, oma menüü lisab ta eraldi päästikuga ja kustutab ainult oma päästikud.
 *
 * PAIGALDUS JA UUENDAMINE (arvutis)
 *  1. Ava oma privaatne tabel → Laiendused → Apps Script.
 *  2. Ava fail „Kuu harjutus.gs“ (kui seda pole: + → Skript). Teisi faile ära puutu.
 *     Tühjenda see fail, kleebi see skript sinna ja vajuta Salvesta (💾).
 *     Skripti viimane rida on „SKRIPTI LÕPP“: kui seda pole, jäi kleepimine poolikuks.
 *  3. Vali ülal nupu „Käivita“ (Run) kõrval funktsioon kuuHarjutusSeadista ja vajuta „Käivita“.
 *     Google küsib luba ja hoiatab, et rakendus pole kontrollitud. See on sinu enda skript:
 *     vali oma konto → Täpsemalt (Advanced) → Ava … (Go to …) → Luba (Allow).
 *  4. Mine tabelisse ja laadi leht uuesti. Menüüribale tuleb „Kuu harjutus“ (ja teiste skriptide menüüd jäävad alles).
 *  5. Lõpus näitab skript ühise tabeli linki. Pane see WhatsAppi grupi kirjeldusse.
 *  Uuendamisel jäävad ühine tabel, link ja kõik kirjed samaks: skript uuendab vahekaardid ise.
 *  Plaanileht „Kuuharjutus“ tehakse uuendamisel uueks; sinu plaan, e-post ja linnukesed tulevad sinna üle.
 */

// Kõik on ühe nime (KuuHarjutus) all, et nimed ei läheks teiste skriptidega segi.
var KuuHarjutus = (function () {

// ---------------------------------------------------------------- seaded (ära muuda)
var TZ = 'Europe/Tallinn';
var VER = 'KH10';                                    // plaani vahekaardi tunnus (lahter T1)
var POSTID = '3';                                    // postituste (uus harjutus, nädala seis) valemite versioon; muutub, kui nende tekst muutub
var PUB_NAME = 'Kuu harjutus | Monthly challenge';
var DOC_NAME = 'Kuu harjutus · Reeglid | Rules';  // ühise tabeli nimi Drive'is
var T_GUIDE = 'Juhend | Guide', T_ROSTER = 'Nimekiri | Roster', T_BOARD = 'Ülevaade | Board',
    T_FAME = 'Autahvel | Fame', T_RULES = 'Reeglid | Rules', T_PLAN = 'Kuuharjutus';
var LANG = "'" + T_GUIDE + "'!$C$3";
var ET_M = ['Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni', 'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'];
var ET_G = ['jaanuari', 'veebruari', 'märtsi', 'aprilli', 'mai', 'juuni', 'juuli', 'augusti', 'septembri', 'oktoobri', 'novembri', 'detsembri'];
var EN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var IN = 'Osalen · In', PAUSE = 'Paus · Pause', REMOVE = 'Eemalda · Remove', CONFIRM = 'Kinnitan eemaldamise · Confirm removal';
var PUB_VER = 9;                                    // ühise tabeli kujunduse versioon
var LANG_LABEL = 'Keel / Language';
var KEEL = [[T_GUIDE, 'C3'], [T_ROSTER, 'D2'], [T_BOARD, 'C3'], [T_FAME, 'B3'], [T_RULES, 'C3']];   // kuu vahekaartidel C1
var CUR_LABEL = '▶ Praegune kuu · This month';
var N = 100;          // osalejate kohti (kuni v8 oli 50: vanem tabel saab read juurde, vt laienda_)
var N_VANA = 50;
var R0 = 5;           // kuu vahekaardil esimene osaleja (read 5–104)
var RR0 = 4;          // nimekirjas esimene nimi (read 4–103); kuu vahekaardi rida = nimekirja rida + 1
var FD = 4;           // veerg D = kuu 1. päev
var AW = 49;          // veerg AW: kuu vahekaardi seaded (read 1–20)
var FAME0 = 5, FAMEN = 36, FAME_GID = 29;   // Autahvel: kuude nimed A5:A40, vahekaardi gid veerus AC
var PL0 = 3, PLN = 24;                      // plaani read 3–26
var O_JUHIS = '2x päevad: kirjuta siia ainult päevade numbrid komaga, näiteks 7, 21. Tühi lahter tähendab, et sel kuul topeltpäevi pole. Kuu vahekaardi 2x-rida muutub kohe samaks ja lahtri märkusesse tuleb kinnitus. Kuu vahekaardil 2x-i lisada ei saa, skript võtab päevad alati siit.';
var C_LINK = 'C29', C_EMAIL = 'C30', C_PREVIEW = 'C31', C_LOOS_ARV = 'C32', C_LOOS = 'D32', C_LOOS_TULEMUS = 'E32', POST0 = 37;
var C_KUU = 'D33', C_KUU_TULEMUS = 'E33', C_PROOV = 'D34', C_PROOV_TULEMUS = 'E34', POST0_VANA = 35;   // KH5–KH8: postitused read 35–38 (KH9: 37–40 nagu praegu)
var PL_2X = 15;       // plaani tulp O: topeltpäevad (näiteks „7, 21“)
var PILETID = 40;      // kuu vahekaardi veerg AN: loosipiletid
var FAME_WIN = 10;    // Autahvli veerg J: loosivõitjad
var SEERIA = 50, KOHT = 51, KUU_TULPI = 51;   // kuu vahekaardi AX (päevi järjest) ja AY (koht edetabelis)
var EKS = 'Endine osaleja';                  // eemaldatu nimi lõppenud kuudes
var T_LOGI = 'Kuu harjutuse muudatused', VARU = 'Kuu harjutuse varukoopiad';   // privaatse tabeli logi, varukoopiate kaust
var ORANZ = ['#FFD9B3', '#9A4A0C'], VANA_KOLLANE = '#fff1c2';   // alla eesmärgi (v9; enne kollane)
var POSTS = ['Uus harjutus', 'Start', 'Nädala seis', 'Tulemused', 'Eesmärk täis'];
var NPOST = POSTS.length;     // postituste read POST0 … POST0+NPOST-1 (Eesmärk täis lisandus 27.10)
var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Vana (v4) plaani eeltäidetud väärtused: need ei kirjuta uut plaani üle.
var V4 = {
  '2026-10': ['Kätekõverdused', 'Push-ups', 30, 50, 100, 'kätekõverdust', 'põlvedelt või käed laual', '100 või 30 kitsast', 'push-ups', 'on knees or hands on a table', '100 or 30 diamond'],
  '2026-11': ['Plank', 'Plank', 60, 120, 60, 'sekundit', '3 × 20 s', '60 s pingutatud plank', 'seconds', '3 × 20 s', '60 s RKC plank'],
  '2026-12': ['Püstolkükid', 'Pistol squats', 40, 50, 40, 'püstolkükki (mõlemad jalad kokku)', 'toolile', 'aeglaselt, toeta', 'pistol squats (both legs together)', 'to a chair', 'slow, no support']
};

// ================================================================ menüü

function menuu() {
  SpreadsheetApp.getUi().createMenu('Kuu harjutus')
    .addItem('Seadista', 'kuuHarjutusSeadista')
    .addItem('Ava ühine tabel', 'kuuHarjutusLink')
    .addSeparator()
    .addItem('Loo uus kuu vahekaart kohe', 'kuuHarjutusUusKuuleht')
    .addItem('Uuenda eelvaade', 'kuuHarjutusEelvaade')
    .addItem('Saada proov e-postiga', 'kuuHarjutusProov')
    .addSeparator()
    .addItem('Loosi võitjad', 'kuuHarjutusLoos')
    .addSeparator()
    .addItem('Lisa uus grupp', 'kuuHarjutusLisaGrupp')
    .addToUi();
}

// Selle skripti päästikud (ka vanade versioonide omad). Teiste skriptide päästikutesse ei puutu.
var MINU_PAASTIKUD = ['kuuHarjutusMenuu', 'kuuHarjutusOine', 'kuuHarjutusHommik', 'kuuHarjutusMuudatus', 'kuuHarjutusPlaan', 'kuuHarjutusYlevaade', 'kuuHarjutusNimekiri', 'kuuHarjutusVersioon', 'oine', 'hommik', 'muudatus'];

// Ühekordne seadistus. Võib käivitada ka mitu korda: olemasolevat ühist tabelit ta uuesti ei tee.
// Google peatab skripti 6 minuti pärast. Kui aega jääb väheks, jätab Seadista järgmise grupi tabeli uuenduse ja öise
// kontrolli pooleli. Järgmine Seadista jätkab sealt: selle koodiga (EHITUS) juba uuendatud tabeleid ta enam ei uuenda.
var AJAPIIR = 150000, HOOLDUSE_PIIR = 240000, SEADISTA_ALGUS = 0, JATKA = false;
function aegaOn_(piir) { return Date.now() - SEADISTA_ALGUS < piir; }
var POOLELI = 'Seadista jättis ajapuudusel osa tööd tegemata (Google lubab ühe käivituse jaoks 6 minutit). Vali „Kuu harjutus → Seadista“ veel kord, siis teeb see ülejäänu.';

// Ühise tabeli uuendus uue koodi järgi. Tagastab vea teksti või ''.
function uuendaPub_(pub) {
  var props = props_(), viga = '';
  if (JATKA && props.getProperty('EHITUS:' + pub.getId()) === EHITUS) return '';
  try { varukoopia_(pub); } catch (err) {}                   // vanad koopiad prügikasti
  var lukk = LockService.getScriptLock();
  if (!lukk.tryLock(120000)) throw new Error('Skript on praegu hõivatud. Proovi minuti pärast uuesti.');
  var uv;
  try {
    try { sobita_(pub, tana_(), true, true); } catch (err) {}  // ootel nimed ja puuduvad liitumiskuupäevad enne uuendust
    uv = uuenda_(pub);
  } finally { lukk.releaseLock(); }
  if (uv.length) viga = 'Osa uuendusi jäi tegemata, käivita Seadista uuesti. (' + uv.join('; ') + ')';
  else props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  return viga;
}

function seadista() {
  SEADISTA_ALGUS = Date.now();
  PropertiesService.getScriptProperties().setProperty('SEADISTA_KAIB', String(SEADISTA_ALGUS));
  try { return seadista1_(); } finally { PropertiesService.getScriptProperties().deleteProperty('SEADISTA_KAIB'); }
}

function seadista1_() {
  var priv = SpreadsheetApp.getActive();
  GRUPP_ = null; KUUD_ = null;
  var props = props_();
  JATKA = props.getProperty('SEADISTA_JATKA') === EHITUS;
  props.setProperty('PRIV_ID', priv.getId());
  tz_(priv);

  var plan = plaan_(priv), vana = null;
  if (!plan) {
    vana = priv.getSheetByName(T_PLAN);
    if (vana) vana.setName(vabaNimi_(priv, T_PLAN + ' (vana)'));
  }
  var pub = avalik_(), viga = '', vastTehtud = !pub;
  if (!pub) {
    pub = impordi_(pubNimi_(), kaust_(priv));
    props.setProperty('PUB_ID', pub.getId());
    props.setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
    props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  }
  tz_(pub);
  if (pub.getName() !== pubNimi_()) pub.rename(pubNimi_());
  if (!vastTehtud) viga = uuendaPub_(pub);                  // olemasolev tabel saab uue koodiga uued tekstid ja kujunduse

  var mall = pub.getSheetByName(T_PLAN);
  if (!plan) {
    var src = mall, ajutine = null;
    if (!src) { ajutine = impordi_(PUB_NAME + ' (ajutine)', null); src = ajutine.getSheetByName(T_PLAN); }
    plan = src.copyTo(priv).setName(vabaNimi_(priv, T_PLAN));
    if (ajutine) DriveApp.getFileById(ajutine.getId()).setTrashed(true);
    if (plan.isSheetHidden()) plan.showSheet();
    plan.hideColumns(20, 2);
    priv.setActiveSheet(plan);
    priv.moveActiveSheet(1);
    [C_LOOS, C_KUU, C_PROOV].forEach(function (a1) { plan.getRange(a1).insertCheckboxes().setValue(false); });
    var on = plan.getRange(POST0, 2, NPOST, 1), onV = on.getValues();
    on.insertCheckboxes();
    on.setValues(onV.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
    if (vana) migreeri_(vana, plan);
    if (vana && /^KH([5-9]|10)$/.test(String(vana.getRange('T1').getValue()))) priv.deleteSheet(vana);   // kõik on uuel vahekaardil
    try { plan.autoResizeRows(PL0, PLN); } catch (err) {}
    props.setProperty('POSTID', POSTID);                      // uus vahekaart tuli praegusest mallist
  }
  if (mall) pub.deleteSheet(mall);
  plan.getRange(PL0 - 1, PL_2X).setNote(O_JUHIS);                                                  // juhis tulba O pealkirjal, ka juba olemasoleval vahekaardil
  try { postiValemid_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Postituste tekste ei saanud uuendada: ' + (err && err.message ? err.message : err); }
  try { auhinnad_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Auhindade tabelit ei saanud teha: ' + (err && err.message ? err.message : err); }

  var jagatud = true;
  try {
    DriveApp.getFileById(pub.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  } catch (err) { jagatud = false; }
  plan.getRange(C_LINK).setValue(pub.getUrl());
  lingid_(pub);
  var dok = '';
  try { dok = reeglid_(pub); } catch (err) { viga = 'Reeglite dokumenti ei saanud teha: ' + (err && err.message ? err.message : err); }
  var teised = [];                                           // teised grupid: igaühel oma ühine tabel
  grupid_(priv).forEach(function (g) {
    if (!g || !grupiNimi_(g)) return;
    grupiga_(g, function () {
      try { var x = grupiSeadista_(priv, g); teised.push(x); if (x.viga) viga += (viga ? ' ' : '') + x.nimi + ': ' + x.viga; }
      catch (err) { viga += (viga ? ' ' : '') + grupiNimi_(g) + ': ' + (err && err.message ? err.message : err); }
    });
  });

  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (MINU_PAASTIKUD.indexOf(tr.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('kuuHarjutusMenuu').forSpreadsheet(priv.getId()).onOpen().create();
  ScriptApp.newTrigger('kuuHarjutusOine').timeBased().everyDays(1).atHour(0).inTimezone(TZ).create();
  ScriptApp.newTrigger('kuuHarjutusHommik').timeBased().everyDays(1).atHour(10).nearMinute(0).inTimezone(TZ).create();   // e-kirjad ja numbrid kell 10 (Erik 11.10)
  [pub].concat(teised.map(function (x) { return x.pub; })).forEach(function (p) {
    ScriptApp.newTrigger('kuuHarjutusMuudatus').forSpreadsheet(p.getId()).onEdit().create();
  });
  ScriptApp.newTrigger('kuuHarjutusPlaan').forSpreadsheet(priv.getId()).onEdit().create();
  ScriptApp.newTrigger('kuuHarjutusVersioon').timeBased().everyMinutes(1).create();       // uuendaja toodud uus kood seadistab end ise kohe (Erik 27.10)
  try { menuu(); } catch (err) {}

  var pooleli = teised.some(function (x) { return x.pooleli; });
  if (!pooleli && aegaOn_(HOOLDUSE_PIIR)) {
    try { hooldus_(); } catch (err) { viga += (viga ? ' ' : '') + String(err && err.message ? err.message : err); }
  } else pooleli = true;
  if (pooleli) { viga = POOLELI + (viga ? ' ' + viga : ''); props.setProperty('SEADISTA_JATKA', EHITUS); }
  else { props.deleteProperty('SEADISTA_JATKA'); PropertiesService.getScriptProperties().setProperty('SEADISTATUD', EHITUS); }

  var url = pub.getUrl();
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#2B241E">' +
    (pooleli ? '<p style="font-size:16px;color:#B00020"><b>Peaaegu valmis.</b> Vali „Kuu harjutus → Seadista“ veel kord, siis teeb see ülejäänu.</p>'
             : '<p style="font-size:16px"><b>Valmis!</b> Ühine tabel on olemas ja hoiab end ise korras.</p>') +
    '<p><a href="' + url + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 Ava ühine tabel</a></p>' +
    '<p>Link osalejatele (kopeeri ja pane WhatsAppi grupi kirjeldusse):<br>' +
    '<input value="' + url + '" readonly onclick="this.select()" style="width:100%;padding:6px;font-size:13px"></p>' +
    (jagatud ? '' : '<p style="color:#B00020">Jagamine ei õnnestunud. Ava ühine tabel → Jaga → Üldine juurdepääs: ' +
      '„Kõik, kellel on link“ ja roll „Redigeerija“.</p>') +
    teised.map(function (x) {
      return '<p><b>' + html_(x.nimi) + '</b>: <a href="' + x.pub.getUrl() + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 ava ühine tabel</a><br>' +
        '<input value="' + x.pub.getUrl() + '" readonly onclick="this.select()" style="width:100%;padding:6px;font-size:13px">' +
        (x.jagatud ? '' : '<br><span style="color:#B00020">Jagamine ei õnnestunud, jaga see tabel lingiga ise.</span>') + '</p>';
    }).join('') +
    '<p>Postitused tulevad sulle e-kirjaga: uus harjutus 20. kuupäeval, start 1. kuupäeval, nädala seis ' +
    'pühapäeviti ja tulemused 3. kuupäeval. Plaan on vahekaardil „Kuuharjutus“.</p>' +
    (dok ? '<p>Reeglid dokumendina (link on ka vahekaardil „Reeglid“): <a href="' + dok + '" target="_blank">ava</a></p>' : '') +
    (viga ? '<p style="color:#B00020">Märkus: ' + html_(viga) + '</p>' : '') + '</div>';
  try {
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(480).setHeight(360 + 90 * teised.length), 'Kuu harjutus');
  } catch (err) { Logger.log('Ühine tabel: ' + url + (viga ? '\n' + viga : '')); }
  return viga;
}

function naitaLinki() {
  var ui = SpreadsheetApp.getUi(), lingid = koigile_(null, function () {
    var pub = avalik_();
    return pub ? { nimi: GRUPP_ ? GRUPP_.nimi : '', url: pub.getUrl() } : null;
  }).filter(Boolean);
  if (!lingid.length) { ui.alert('Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.'); return; }
  ui.showModalDialog(HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">' + lingid.map(function (l) {
      return '<p><a href="' + l.url + '" target="_blank" style="font-weight:bold;color:#8B6B47">👉 Ava ' + (l.nimi ? html_(l.nimi) + ' grupi' : '') + ' ühine tabel</a><br>' +
        'Link osalejatele:<br><input value="' + l.url + '" readonly onclick="this.select()" style="width:100%;padding:6px"></p>';
    }).join('') + '</div>').setWidth(440).setHeight(60 + 110 * lingid.length), 'Kuu harjutus');
}

// Teeb puuduva kuu vahekaardi kohe: kõigepealt selle kuu oma, siis järgmise kuu oma.
function looUusKuuleht() {
  SpreadsheetApp.getUi().alert(looKuuKohe_().tekst);
}

function looKuuKohe_() {
  var pub = avalik_(), plan = plaan_();
  if (!pub || !plan) return { tekst: 'Vali enne „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = kuuLeht_(pub, d[0], d[1]) ? jargmine_(d[0], d[1]) : [d[0], d[1]];
  var nimi = ET_M[k[1] - 1] + ' ' + k[0];
  if (kuuLeht_(pub, k[0], k[1])) return { tekst: 'Vahekaart „' + lehenimi_(k[0], k[1]) + '“ on ühises tabelis juba olemas.' };
  var cfg = planRida_(plan, k[0], k[1]);
  if (!cfg) return { tekst: 'Kirjuta enne vahekaardile „Kuuharjutus“ kuu ' + nimi + ' harjutus ja numbrid (tulbad C–H).' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return { tekst: 'Skript on praegu hõivatud. Proovi minuti pärast uuesti.' };
  try { looKuu_(pub, k[0], k[1], cfg, t, topelt_(plan, k[0], k[1])); } finally { lock.releaseLock(); }
  return { tekst: 'Valmis: ühises tabelis on nüüd vahekaart „' + lehenimi_(k[0], k[1]) + '“. (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')' };
}

// Arvutab eelvaate numbrid lahtri C31 kuupäeva järgi.
function uuendaEelvaade() {
  var pub = avalik_(), plan = plaan_();
  if (!pub || !plan) { SpreadsheetApp.getUi().alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  var d0 = toSerial_(plan.getRange(C_PREVIEW).getValue());
  if (d0 === null) { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); d0 = tana_(); }
  statistika_(plan, pub, d0);
  SpreadsheetApp.flush();
  plan.getParent().toast('Eelvaade on uuendatud.', 'Kuu harjutus', 5);
}

// Saadab kõik sisse lülitatud postitused kohe sulle (eelvaate kuupäeva järgi).
function saadaProov() {
  var plan = plaan_();
  if (!plan || !avalik_()) { SpreadsheetApp.getUi().alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  SpreadsheetApp.getUi().alert(saadaProov_(plan).tekst);
}

function saadaProov_(plan) {
  var pub = avalik_();
  if (!pub) return { tekst: 'Vali enne „Kuu harjutus → Seadista“.' };
  var d0 = toSerial_(plan.getRange(C_PREVIEW).getValue());
  if (d0 === null) { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); d0 = tana_(); }
  statistika_(plan, pub, d0);
  SpreadsheetApp.flush();
  var rows = plan.getRange(POST0, 1, NPOST, 12).getValues(), to = saaja_(plan), saadetud = [], vahele = [];
  rows.forEach(function (r, i) {
    if (r[1] !== true) return;
    var et = String(r[4]), en = String(r[11]);
    if (!et || et.charAt(0) === '(') { vahele.push(POSTS[i] + ' ' + et); return; }
    saada_(to, POSTS[i], et, en, true, i === 3 ? kysitlus_(eelmine_.apply(null, ymd_(d0).slice(0, 2))) : null);
    saadetud.push(POSTS[i]);
  });
  return { tekst: (saadetud.length ? 'Saatsin aadressile ' + to + ': ' + saadetud.join(', ') + '.' : 'Ühtegi postitust ei saadetud.') +
    (vahele.length ? ' Vahele jäi: ' + vahele.join('; ') : '') + ' (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')' };
}

// ================================================================ päästikud

// Iga öö kell 0–1.
function oine() { hooldus_(); }

// Iga päev kell 10 (10.00–10.15): postitused ja meeldetuletused; numbrid arvutatakse sel ajal uuesti.
function hommik() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(120000)) throw new Error('Skript oli hõivatud.');
  try {
    var vead = [];
    koigile_(null, function () { try { hommik1_(); } catch (err) { vead.push(err && err.message ? err.message : String(err)); } });
    if (vead.length) throw new Error(vead.join(' | '));
  } finally { lock.releaseLock(); }
}

function hommik1_() {
  {
    var pub = avalik_(), plan = plaan_();
    if (!pub || !plan) return;
    var t = tana_(), d = ymd_(t), nx = jargmine_(d[0], d[1]), pv = eelmine_(d[0], d[1]);
    try { kommentaarid_(pub); } catch (err) {}                // vead tulevad öise hoolduse teatesse
    plan.getRange(C_PREVIEW).setFormula('=TODAY()');
    statistika_(plan, pub, t);
    SpreadsheetApp.flush();
    var props = props_(), to = saaja_(plan);
    var rows = plan.getRange(POST0, 1, NPOST, 12).getValues();
    var paev = new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay();   // 0 = pühapäev
    var todo = [];
    if (d[2] >= 20 && kuuLeht_(pub, nx[0], nx[1])) todo.push([0, 'uus:' + nx[0] + '-' + nx[1]]);
    if (d[2] <= 2 && kuuLeht_(pub, d[0], d[1])) todo.push([1, 'start:' + d[0] + '-' + d[1]]);
    if (paev === 0 && d[2] > 2 && kuuLeht_(pub, d[0], d[1])) todo.push([2, 'nadal:' + t]);
    if (d[2] >= 3 && d[2] <= 5 && kuuLeht_(pub, pv[0], pv[1])) todo.push([3, 'tulemused:' + pv[0] + '-' + pv[1]]);
    if (kuuLeht_(pub, d[0], d[1])) todo.push([4, 'eesmark:' + d[0] + '-' + d[1]]);   // kord kuus; tekst on „(…“, kuni eesmärk pole täis
    todo.forEach(function (x) {
      var r = rows[x[0]], et = String(r[4]), en = String(r[11]);
      if (props.getProperty(x[1]) || r[1] !== true || !et || et.charAt(0) === '(') return;
      saada_(to, POSTS[x[0]], et, en, false, x[0] === 3 ? kysitlus_(pv) : null);
      props.setProperty(x[1], new Date().toISOString());
    });
    var proovi = function (fn) { try { fn(); } catch (err) { Logger.log(err); } };
    proovi(function () { kaitseKoik_(pub, t); });                  // lukud ka siis, kui öine hooldus jäi pooleli
    if (!GRUPP_) proovi(function () { if (d[2] >= 28) jargmineKuu_(plan, d, props, to); });   // teise grupi plaan tuleb põhiplaanist
    if (paev === 0) proovi(function () { vaiksed_(pub, t, props, to); });
    proovi(function () { tervis_(props, t, to); });
    if (!GRUPP_) meeldetuleta_(pub, plan, t, props, to);
  }
}

// Kuu 28. päeval: kui järgmise kuu harjutus on plaanis kirjutamata, kopeerin selle kuu oma (tulbad C–N) ja annan teada.
function jargmineKuu_(plan, d, props, to) {
  var n = jargmine_(d[0], d[1]), key = 'autoplaan:' + n[0] + '-' + n[1];
  if (props.getProperty(key)) return;
  var i = planiRida_(plan, n[0], n[1]), j = planiRida_(plan, d[0], d[1]);
  if (i < 0 || j < 0 || str_(plan.getRange(PL0 + i, 3).getValue()) || !planRida_(plan, d[0], d[1])) return;
  plan.getRange(PL0 + i, 3, 1, 12).setValues(plan.getRange(PL0 + j, 3, 1, 12).getValues().map(function (r) { return r.map(txt_); }));
  props.setProperty(key, new Date().toISOString());
  var g = ET_G[n[1] - 1], ex = str_(plan.getRange(PL0 + j, 3).getValue());
  var tekst = g.charAt(0).toUpperCase() + g.slice(1) + ' harjutus oli plaanis kirjutamata, seepärast panin sinna sama harjutuse mis praegu (' + ex + ').' +
    '\n\nKui tahad teist harjutust, muuda vahekaardil „Kuuharjutus“ ' + g + ' rida. Uus kuu vahekaart tuleb ühisesse tabelisse järgmisel ööl.';
  kiri_({ to: to, subject: 'Kuu harjutus: ' + g + ' harjutus on sama mis praegu', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
}

// Pühapäeval: kes pole viimasel 3 päeval midagi kirja pannud (liitunud vähemalt 3 päeva tagasi). Ainult sulle.
function vaiksed_(pub, t, props, to) {
  var key = 'vaiksed:' + t;
  if (props.getProperty(key)) return;
  var m = kuulehed_(pub, true).filter(function (x) { return !x.frozen && x.start <= t - 3 && t <= x.end + 1; }).pop();
  if (!m) return;
  var liit = pub.getSheetByName(T_ROSTER).getRange(RR0, 4, N, 1).getValues();
  var v = m.sh.getRange(R0, 1, N, FD + 30).getValues(), a = t - 3 - m.start, nimed = [];
  v.forEach(function (r, k) {
    var nimi = str_(r[0]), j = toSerial_(liit[k][0]);
    if (!nimi || (j !== null && j > t - 3)) return;
    var tyhi = true;
    for (var c = a; c < a + 3 && c < m.days; c++) if (str_(r[FD - 1 + c]) !== '') tyhi = false;
    if (tyhi) nimed.push(nimi);
  });
  props.setProperty(key, new Date().toISOString());
  if (!nimed.length) return;
  var tekst = 'Viimasel 3 päeval pole kirja pannud (' + nimed.length + '):\n' + nimed.join('\n') +
    '\n\nVõib-olla tasub neile meelde tuletada. Seda kirja näed ainult sina.';
  kiri_({ to: to, subject: 'Kuu harjutus: ' + nimed.length + ' inimest on 3 päeva vaiksed', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
}

// Kui öine hooldus pole 30 tundi õnnestunud, saad kirja (kord päevas).
function tervis_(props, t, to) {
  var ok = Number(props.getProperty('OINE_OK')) || 0;
  if (!ok || Date.now() - ok < 30 * 3600 * 1000 || props.getProperty('TERVIS') === String(t)) return;
  var viga = props.getProperty('OINE_VIGA') || 'öine hooldus ei käivitunud';
  var tekst = 'Kuu harjutuse öine hooldus pole alates ' + Utilities.formatDate(new Date(ok), TZ, 'd.MM HH:mm') + ' õnnestunud.\n\nPõhjus: ' + viga +
    '\n\nAva oma tabel ja vali „Kuu harjutus → Seadista“. Kui see ei aita, saada see kiri edasi sellele, kes skripti tegi.';
  kiri_({ to: to, subject: 'Kuu harjutus: öine hooldus ei tööta', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
  props.setProperty('TERVIS', String(t));
}

// Tulemuste kirjale lisaks: küsimus, kuidas harjutus sobis (vasta emojiga).
function kysitlus_(k) {
  var g = ET_G[k[1] - 1], en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][k[1] - 1];
  return ['📊 Kuidas ' + g + ' harjutus sobis? Vasta emojiga:\n😴 liiga kerge\n👌 paras\n🥵 liiga raske',
          '📊 How was the ' + en + ' exercise? Reply with an emoji:\n😴 too easy\n👌 just right\n🥵 too hard'];
}

// Käivitub, kui keegi muudab ühist tabelit.
function muudatus(e) {
  if (!e || !e.range) return;
  var g = e.source ? PropertiesService.getScriptProperties().getProperty('GRUPP:' + e.source.getId()) : null;
  if (g) return grupiga_(g, function () { muudatus1_(e); kloonEdasi_(e); });
  GRUPP_ = null;
  muudatus1_(e);
  kloonEdasi_(e);
}

function muudatus1_(e) {
  var sh = e.range.getSheet(), nimi = sh.getName(), row = e.range.getRow(), col = e.range.getColumn();
  logi_(e);
  if (row <= 3) {                                            // keelevalik: kõik vahekaardid vahetavad keelt
    var a1 = keeleLahter_(sh);
    if (a1) {
      var c = sh.getRange(a1);
      if (row === c.getRow() && col === c.getColumn()) { keel_(e.source, str_(c.getValue())); return; }
    }
  }
  if (nimi === T_BOARD) {                                    // teise kuu ülevaade kehtib 5 minutit
    if (row === 4 && col === 3 && str_(sh.getRange('C4').getValue()) !== CUR_LABEL) ylevaateTaimer_();
    return;
  }
  if (nimi === T_ROSTER) {
    if (e.range.getLastColumn() < 2 || col > 3 || e.range.getLastRow() < RR0) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(25000)) { nimekiriTaimer_(); return; }   // Erik 3.10: nimi jäi ilma kuupäevata; proovi umbes minuti pärast uuesti, mitte alles öösel
    var teated = [];
    try { laienda_(e.source); teated = sobita_(e.source, tana_(), true); } finally { lock.releaseLock(); }
    teata_(e, teated);
    return;
  }
  if (row < R0 && e.range.getLastRow() >= 4 && row <= 4 && col < FD + 31 && e.range.getLastColumn() >= FD) topeltTagasi_(e, sh);
  if (row < R0 || sh.getMaxColumns() < AW || sh.getRange(1, AW).getValue() !== 'KUULEHT') return;   // edasi ainult kuu vahekaardid
  if (e.range.getLastColumn() >= FD && col < FD + 31) { puhastaPaevad_(e.range); if (col >= FD) return; }
  if (e.range.getNumRows() !== 1 || e.range.getLastColumn() !== col) return;
  if (col === 2) tase_(e, sh, tana_());
  else if (col === 3 && !tiim_(e, sh, tana_())) {            // tiimi nimi: liigsed tühikud ära, et sama tiim loeks samaks
    var v = e.range.getValue(), s = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v;
    if (s !== v) e.range.setValue(txt_(s));
  }
}

// Kuu vahekaardi 2x-rida muudab ainult plaan (tulp O). Käsitsi muudatus võetakse kohe tagasi.
function topeltTagasi_(e, sh) {
  var m = kuuInfo_(sh);
  if (!m) return;
  var plan = plaan_(), d = ymd_(m.start);
  if (!plan) return;
  if (topeltKuusse_(m, topelt_(plan, d[0], d[1])))
    teata_({ range: sh.getRange(4, FD), source: e.source }, ['2x päevi saab muuta ainult plaani vahekaardil (tulp O). Siin tehtud muudatus võeti tagasi.']);
}

// Eriku tulemused: põhigrupis tehtud muudatus läheb kohe samaks ka teiste gruppide tabelisse.
// Teises grupis Eriku rida (tase ja päevad) muuta ei saa, see võetakse põhigrupist tagasi. Tiim jääb igal grupil oma.
var KLOON = 'Erik';
function kloonEdasi_(e) {
  var r = e.range, sh = r.getSheet();
  if (r.getLastRow() < R0 || r.getRow() >= R0 + N || r.getLastColumn() < 2 || r.getColumn() >= FD + 31) return;
  if (r.getColumn() === 3 && r.getLastColumn() === 3) return;
  var m = kuuInfo_(sh);
  if (!m || m.frozen) return;
  var k = kloonRida_(e.source);
  if (k < 0 || R0 + k < r.getRow() || R0 + k > r.getLastRow()) return;
  var lock = LockService.getScriptLock(), muutus = false;
  if (!lock.tryLock(20000)) return;                          // öine hooldus teeb selle järgi
  try { muutus = kloon_(tana_(), m.start); } finally { lock.releaseLock(); }
  if (GRUPP_ && muutus) teata_({ range: sh.getRange(R0 + k, Math.max(r.getColumn(), 2)), source: e.source },
    [KLOON + ' kirjutab oma tulemused põhigrupi tabelisse ja need tulevad siia ise. Siin tehtud muudatus võeti tagasi. / ' +
     KLOON + '\'s results come from the main group\'s sheet, so this change was undone.']);
}

// Eriku koht nimekirjas (0 …), -1 kui teda pole.
function kloonRida_(pub) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro) return -1;
  var v = ro.getRange(RR0, 2, N, 1).getValues();
  for (var k = 0; k < N; k++) if (str_(v[k][0]).toLowerCase() === KLOON.toLowerCase()) return k;
  return -1;
}

// Kas kuu vahekaardi real k on Erik (pausi ajal on nimi tühi)?
function kloonKuus_(m, k) { return str_(m.sh.getRange(R0 + k, 1).getValue()).toLowerCase() === KLOON.toLowerCase(); }

// Kopeerib Eriku taseme ja päevad põhigrupi lukustamata kuudest (algus = ainult see kuu) teiste gruppide samadesse kuudesse.
// Kui teises grupis Erikut veel pole, lisab skript ta sealsesse nimekirja. Tagastab true, kui midagi muutus.
function kloon_(t, algus) {
  var priv = privaatne_(), teised = grupid_(priv).slice(1), muutus = false;
  if (!teised.length) return false;
  var allikas = grupiga_(null, function () {
    var pub = avalik_(), k = pub ? kloonRida_(pub) : -1;
    if (k < 0) return [];
    return kuulehed_(pub, true).filter(function (m) {
      return !m.frozen && t <= m.end + 1 && (!algus || m.start === algus) && kloonKuus_(m, k);
    }).map(function (m) {
      var r = m.sh.getRange(R0 + k, 2, 1, 33);
      return { start: m.start, v: r.getValues()[0], f: r.getNumberFormats()[0] };
    });
  });
  if (!allikas.length) return false;
  teised.forEach(function (g) {
    grupiga_(g, function () {
      var pub = avalik_();
      if (!pub) return;
      var k = kloonRida_(pub);
      if (k < 0) {
        var ro = pub.getSheetByName(T_ROSTER), v = ro ? ro.getRange(RR0, 2, N, 4).getValues() : [];
        for (var i = 0; i < v.length && k < 0; i++) if (!str_(v[i][0]) && !str_(v[i][3])) k = i;
        if (k < 0) return;                                   // nimekiri on täis
        ro.getRange(RR0 + k, 2).setValue(KLOON);
        sobita_(pub, t, true);
        k = kloonRida_(pub);
        if (k < 0) return;
        muutus = true;
      }
      allikas.forEach(function (a) {
        var m = kuulehed_(pub, true).filter(function (x) { return x.start === a.start && !x.frozen; })[0];
        if (!m || !kloonKuus_(m, k)) return;
        var r = m.sh.getRange(R0 + k, 2, 1, 33), v = r.getValues()[0], f = r.getNumberFormats()[0];
        var erinev = function (i) { return String(v[i]) !== String(a.v[i]) || f[i] !== a.f[i]; };
        if (erinev(0)) {
          m.sh.getRange(R0 + k, 2).setValue(txt_(a.v[0])).setNumberFormat(a.f[0]);
          muutus = true;
        }
        for (var j = 2; j < 33; j++) if (erinev(j)) {
          m.sh.getRange(R0 + k, FD, 1, 31).setNumberFormats([a.f.slice(2)]);
          reeglitaKirjuta_(m.sh.getRange(R0 + k, FD, 1, 31), function (x) { x.setValues([a.v.slice(2).map(txt_)]); });
          muutus = true;
          break;
        }
      });
    });
  });
  return muutus;
}

// Teade jääb lahtri märkusena näha (telefonis toasti ei näe). Öösel kustuvad.
function teata_(e, teated) {
  if (!teated || !teated.length) return;
  var tekst = teated.join('\n\n');
  try { e.range.getCell(1, 1).setNote('Kuu harjutus:\n' + tekst); } catch (err) {}
  try { e.source.toast(tekst, 'Kuu harjutus', 10); } catch (err) {}
}

// Päevade lahtrid: „j“ → „J“, tühikud ära, kellaaeg (1:30) → sekundid (90). Kleepimise kaitse (Erik 13.10): valem asendub oma
// väärtusega ja lahtrisse jääb ainult number 0–999, J (kuni 2 rea kohta), H või X (ainult enne liitumist), muu kustub.
// Kleepimine ei kontrolli lahtri reeglit ja toob kaasa allika reegli, seega pannakse päevade reegel ka tagasi.
function puhastaPaevad_(rng) {
  var sh = rng.getSheet(), m = kuuInfo_(sh);
  if (!m) return;
  var r0 = Math.max(rng.getRow(), R0), r1 = Math.min(rng.getLastRow(), R0 + N - 1), c0 = Math.max(rng.getColumn(), FD), c1 = Math.min(rng.getLastColumn(), FD + 30);
  if (r1 < r0 || c1 < c0) return;
  var r = sh.getRange(r0, c0, r1 - r0 + 1, c1 - c0 + 1);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;                            // öine hooldus teeb tüübikontrolli hiljem
  try {
    if (!paevadeKontroll_(m, r, true) && r.getNumRows() * r.getNumColumns() > 1) paevaReeglid_(sh);
  } finally { lock.releaseLock(); }
}

// Kontrollib päevalahtreid. ranged: ka J-piir ja X-reegel (muudatuse ajal); öösel ainult tüüp ja valemid.
// Tagastab true, kui midagi kirjutati (siis pandi ka reegel tagasi).
function paevadeKontroll_(m, r, ranged) {
  var sh = m.sh, v = r.getValues(), f = r.getFormulas(), d = null, muutus = false, vorm = [];
  var r0 = r.getRow(), c0 = r.getColumn(), liitus = null;
  var uus = v.map(function (row, i) {
    var jArv = null;
    return row.map(function (x, j) {
      var y = paevaVaartus_(x, function () { return (d = d || r.getDisplayValues())[i][j]; });
      if (typeof y === 'string' && /^\d+([.,]\d+)?$/.test(y)) y = Number(y.replace(',', '.'));
      var ok = y === '' || y === null || (typeof y === 'number' && isFinite(y) && y >= 0 && y < 1000 && (!m.plank || plankOk_(y))) || y === 'H' || y === 'J' || y === 'X';
      if (ok && ranged && y === 'X') {
        if (!liitus) { var ro = sh.getParent().getSheetByName(T_ROSTER); liitus = ro ? ro.getRange(RR0, 4, N, 1).getValues() : []; }
        var lj = liitus[r0 + i - R0] ? toSerial_(liitus[r0 + i - R0][0]) : null;
        ok = m.start + (c0 + j - FD) < Math.max(lj || 0, m.start);
      }
      if (ok && ranged && y === 'J') {
        if (jArv === null) {                                   // J-sid selles reas väljaspool kleebitud ala
          var rida = sh.getRange(r0 + i, FD, 1, 31).getValues()[0];
          jArv = rida.filter(function (z, k) { return k < c0 - FD || k >= c0 - FD + v[i].length ? String(z).trim().toUpperCase() === 'J' : false; }).length;
        }
        if (jArv >= 2) ok = false; else jArv++;
      }
      if (!ok) y = '';
      if (typeof y === 'number' && (f[i][j] || x instanceof Date)) vorm.push([i, j]);
      if (y !== x || f[i][j]) muutus = true;
      return y === null ? '' : y;
    });
  });
  if (!muutus) return false;
  reeglitaKirjuta_(r, function (x) { x.setValues(uus.map(function (row) { return row.map(txt_); })); });
  vorm.forEach(function (p) { r.getCell(p[0] + 1, p[1] + 1).setNumberFormat('0'); });
  return true;
}

function paevaVaartus_(x, kuva) {
  if (x instanceof Date) {
    var m = String(kuva()).trim().match(/^(\d+):(\d{2})(?::(\d{2}))?(?:\s*([AP])\.?M\.?)?$/i);   // ka „1:30:00 AM“
    if (!m) return x;
    if (m[4]) m[1] = String(Number(m[1]) % 12 + (/p/i.test(m[4]) ? 12 : 0));
    return Number(m[3] || 0) ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : Number(m[1]) * 60 + Number(m[2]);
  }
  if (typeof x !== 'string') return x;
  var s = x.replace(/\s+/g, ' ').trim();
  if (/^[jhx]$/i.test(s)) return s.toUpperCase();
  return s;
}

// Iga muudatus läheb privaatse tabeli vahekaardile „Muudatused“ (viimased 5000 rida).
function logi_(e) {
  try {
    var id = props_().getProperty('PRIV_ID');
    if (!id) return;
    var priv = SpreadsheetApp.openById(id), lg = priv.getSheetByName(T_LOGI);
    if (!lg) {
      lg = priv.insertSheet(T_LOGI);
      lg.getRange(1, 1, 1, 5).setValues([['Aeg', 'Vahekaart', 'Lahter', 'Oli', 'Sai']]).setFontWeight('bold');
      lg.setFrozenRows(1);
    }
    var r = e.range, n = r.getNumRows() * r.getNumColumns();
    var uus = e.value !== undefined ? e.value : n === 1 ? r.getValue() : '(' + n + ' lahtrit)';
    lg.appendRow([Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'), (GRUPP_ ? GRUPP_.nimi + ' · ' : '') + r.getSheet().getName(), r.getA1Notation(),
      txt_(e.oldValue === undefined ? '' : e.oldValue), txt_(uus === undefined ? '' : uus)]);
  } catch (err) {}
}

// Nimekirja muudatus jäi teise käivituse (näiteks Seadista või öise kontrolli) taha ootama: sama grupi kõik ootel nimed
// sobitatakse umbes minuti pärast. Viie nurjunud katse järel jääb see öise kontrolli hooleks.
function nimekiriTaimer_() {
  var tr = ScriptApp.getProjectTriggers().filter(function (x) { return x.getHandlerFunction() === 'kuuHarjutusNimekiri'; });
  if (tr.length) return;
  ScriptApp.newTrigger('kuuHarjutusNimekiri').timeBased().after(60 * 1000).create();
}

function nimekiri() {
  ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === 'kuuHarjutusNimekiri') ScriptApp.deleteTrigger(x); });
  var p = PropertiesService.getScriptProperties(), lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) {
    var n = Number(p.getProperty('NIMEKIRI_PROOVID')) || 0;
    if (n < 5) { p.setProperty('NIMEKIRI_PROOVID', String(n + 1)); nimekiriTaimer_(); }
    return;
  }
  try {
    p.deleteProperty('NIMEKIRI_PROOVID');
    koigile_(null, function () {
      var pub = avalik_();
      if (pub) { laienda_(pub); sobita_(pub, tana_(), true, true); }
    });
  } finally { lock.releaseLock(); }
}

function ylevaateTaimer_() {
  var props = props_(), vana = Number(props.getProperty('YLEVAADE')) || 0;
  props.setProperty('YLEVAADE', String(Date.now()));
  var tr = ScriptApp.getProjectTriggers().filter(function (x) { return x.getHandlerFunction() === 'kuuHarjutusYlevaade'; });
  if (tr.length && Date.now() - vana < 10 * 60 * 1000) return;
  tr.forEach(function (x) { ScriptApp.deleteTrigger(x); });   // vana päästik jäi kuidagi alles
  ScriptApp.newTrigger('kuuHarjutusYlevaade').timeBased().after(5 * 60 * 1000).create();
}

// 5 minutit pärast viimast valikut läheb Ülevaade tagasi praegusele kuule.
function ylevaade() {
  var aeg = Number(props_().getProperty('YLEVAADE')) || 0, jaanud = aeg + 5 * 60 * 1000 - Date.now();
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === 'kuuHarjutusYlevaade') ScriptApp.deleteTrigger(tr); });
  if (jaanud > 30000) { ScriptApp.newTrigger('kuuHarjutusYlevaade').timeBased().after(jaanud).create(); return; }
  koigile_(null, function () {
    var pub = avalik_(), b = pub && pub.getSheetByName(T_BOARD);
    if (b && str_(b.getRange('C4').getValue()) !== CUR_LABEL) b.getRange('C4').setValue(CUR_LABEL);
  });
}

// Öine hooldus: nimekiri, kuu lõpp, uus kuu, plaani muudatused, lukud, numbrid.
function hooldus_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(120000)) throw new Error('Skript oli hõivatud, proovin järgmisel ööl uuesti.');
  try {
    var vead = [];
    koigile_(null, function () {
      try { hooldus1_(); } catch (err) { vead.push(err && err.message ? err.message : String(err)); }
    });
    if (vead.length) throw new Error(vead.join(' | '));
  } finally { lock.releaseLock(); }
}

function hooldus1_() {
  {
    var pub = avalik_();
    if (!pub) throw new Error('Ühist tabelit' + (GRUPP_ ? ' (' + GRUPP_.nimi + ')' : '') + ' ei leitud. Vali privaatses tabelis „Kuu harjutus → Seadista“.');
    var priv = privaatne_(), plan = plaan_(priv), t = tana_(), vead = [];
    var samm = function (nimi, fn) {
      try { fn(); } catch (err) { vead.push(nimi + ': ' + (err && err.message ? err.message : err)); }
    };
    samm('ajavöönd', function () { tz_(pub); tz_(priv); });
    samm('vanad koopiad', function () { varukoopia_(pub); });
    samm('read', function () { laienda_(pub); });
    samm('keel', function () { keel_(pub, 'Eesti'); });           // igaüks valib keele ise, hommikul on see jälle eesti
    samm('lõppenud kuu', function () { kuulehed_(pub, true).forEach(function (m) { if (!m.frozen && t > m.end) staatiline_(m); }); });
    samm('nimekiri', function () { sobita_(pub, t, false); });
    samm('märkused', function () { markused_(pub); });
    samm('kommentaarid', function () { kommentaarid_(pub); });
    samm('pausile', function () {
      var nimed = eiTaitnud_(pub, t), to = plan ? saaja_(plan) : '';
      if (nimed.length && to) kiri_({ to: to, subject: 'Kuu harjutus: ' + nimed.length + ' pausile', body: 'Viimase 7 päeva jooksul polnud kirjeid, seepärast alustavad uut kuud pausil: ' + nimed.join(', ') +
        '.\nNad saavad tagasi, kui valivad nimekirjas „Osalen“.\n\nNo entries in the last 7 days, so these people start the new month paused: ' + nimed.join(', ') + '.\nThey can come back by picking “Osalen · In” on the roster.' });
    });
    samm('päevad', function () { kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) puhastaPaevad2_(m); }); });
    samm('tasemed', function () { tasemed_(pub, t); });
    samm('graafik', function () { graafik_(pub); });
    samm('loosivõitjad', function () { voitjadVaade_(pub, false); });
    if (plan) samm('auhinnad', function () { auhinnad_(plan); });
    samm('kuu lõpp', function () {
      kuulehed_(pub).forEach(function (m) { if (!m.frozen && t > m.end + 1) kylmuta_(pub, m); });
    });
    if (plan) samm('postituste tekstid', function () { postiValemid_(plan); });
    if (plan && GRUPP_) samm('grupi valemid', function () { var p = grupid_(priv)[0]; if (p) grupiValemid_(plan, p); });
    if (GRUPP_) samm('pealkiri', function () { pealkiri_(pub); });
    if (plan) {
      samm('uus kuu', function () { uuedKuud_(pub, plan, t); });
      samm('plaan', function () { synk_(pub, plan, t); });
    }
    samm('järjestus', function () { jarjesta_(pub, t); });
    if (!GRUPP_) samm(KLOON + ' teistesse gruppidesse', function () { kloon_(t); });
    samm('lukud', function () { kaitseKoik_(pub, t); });
    samm('autahvel', function () { var f = pub.getSheetByName(T_FAME); if (f) { autahvliKorgus_(f); koigiAegade_(pub); } });
    samm('logi', function () { logiLyhemaks_(priv); });
    samm('ülevaade', function () {
      var b = pub.getSheetByName(T_BOARD);
      if (b) b.getRange('C4').setValue(CUR_LABEL);
      ScriptApp.getProjectTriggers().forEach(function (x) { if (x.getHandlerFunction() === 'kuuHarjutusYlevaade') ScriptApp.deleteTrigger(x); });
    });
    if (plan) samm('numbrid', function () { plan.getRange(C_PREVIEW).setFormula('=TODAY()'); statistika_(plan, pub, t); });
    var props = props_();
    if (vead.length) {
      props.setProperty('OINE_VIGA', vead.join(' | ').slice(0, 2000));
      throw new Error('Kuu harjutus' + silt_() + ': ' + vead.join(' | '));
    }
    props.setProperty('OINE_OK', String(Date.now()));
    props.deleteProperty('OINE_VIGA');
  }
}

// Kes 7 päevaga taset ei valinud, saab Põhi (sama eesmärk arvestati tal ka seni). Tase on siis niikuinii lukus.
function tasemed_(pub, t) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro) return;
  var liit = ro.getRange(RR0, 4, N, 1).getValues();
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end || t <= m.start + 6) return;
    var a = m.sh.getRange(R0, 1, N, 2), v = a.getValues(), b = v.map(function (r) { return [r[1]]; }), muutus = false;
    v.forEach(function (r, k) {
      if (!str_(r[0]) || str_(r[1])) return;
      var j = toSerial_(liit[k][0]);
      if (t > Math.max(m.start, j === null ? m.start : j) + 6) { b[k][0] = TASEMED[1]; muutus = true; }
    });
    if (muutus) m.sh.getRange(R0, 2, N, 1).setValues(b);
  });
}

// Ülevaate graafiku abiandmed (tulbad Q–S) on peidus, graafik näitab neid ikka.
var GRAAFIK = 'Grupi korduste arv päevas / Group reps per day';
function graafik_(pub) {
  var b = pub.getSheetByName(T_BOARD);
  if (!b) return;
  var ch = b.getCharts()[0];
  if (!ch) return;
  try { if (ch.getOptions().get('title') !== GRAAFIK) { b.updateChart(ch.modify().setOption('title', GRAAFIK).build()); ch = b.getCharts()[0]; } }
  catch (err) { Logger.log('graafiku pealkiri: ' + err); }   // vanemas tabelis oli „Grupp kokku päevas“
  if (b.isColumnHiddenByUser(17)) return;
  try { b.updateChart(ch.modify().setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH).build()); }
  catch (err) { Logger.log('graafik: ' + err); return; }       // kui ei õnnestu, jäävad tulbad nähtavaks (graafik töötab ikka)
  b.hideColumns(17, 3);
}

// Erik 1.10: igaöised koopiad risustasid Sheetsi failide nimekirja, nii et koopiaid enam ei tehta. Turvavõrk on Google'i
// enda versiooniajalugu (ühine tabel → Fail → Versiooniajalugu), see hoiab iga muudatuse alles. Skripti varem tehtud
// koopiad lähevad prügikasti (sealt saab 30 päeva jooksul tagasi võtta), tühi kaust „Kuu harjutuse varukoopiad“ samuti.
function varukoopia_(pub) {
  var vanem = kaust_(pub), p = vanem ? DriveApp.getFolderById(vanem) : DriveApp.getRootFolder();
  var it = p.getFoldersByName(VARU);
  while (it.hasNext()) {
    var k = it.next();
    if (k.isTrashed()) continue;
    var fi = k.getFiles(), alles = 0;
    while (fi.hasNext()) {
      var f = fi.next();
      if (f.isTrashed()) continue;
      if (f.getName().indexOf(pubNimi_() + ' 2') === 0) f.setTrashed(true); else alles++;   // teise grupi koopiad koristab tema ise
    }
    if (!alles) k.setTrashed(true);
  }
}

// Päeva jooksul pandud teated (märkused) kustuvad öösel.
function markused_(pub) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) ro.getRange(RR0, 2, N, 2).clearNote();
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) m.sh.getRange(R0, 1, N, 3).clearNote(); });
}

// Öösel samad parandused päevade lahtritele kui muudatuse ajal (kui keegi kleepis palju korraga): tüüp ja valemid.
function puhastaPaevad2_(m) {
  paevadeKontroll_(m, m.sh.getRange(R0, FD, N, 31), false);
}

// Erik 20.10: osalejate märkusi päevade lahtrites ei taha. Sheets ei lase kommenteerimist välja lülitada ja Drive'i API lubab
// kommentaari kustutada ainult selle autoril (403). Märkused päevade lahtrites (märkuse autorit ei näe, ka omaniku märkus kaob) tühjendatakse öösel ja kell 10.
// Skripti enda märkused on veergudes A–C, nimekirjas ja 2x lahtris (rida 4), neid see ei puuduta.
// Erik 30.10: kustutada ei saa, aga lahendada (resolve) saab iga toimetaja. Lahendatud kommentaar kaob lahtrist (oranž nurk läheb ära),
// ajalugu jääb alles. Eriku enda (skripti omaniku) kommentaarid jäävad lahtisteks.
function kommentaarid_(pub) {
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) m.sh.getRange(R0, FD, N, 31).clearNote(); });
  var api = 'https://www.googleapis.com/drive/v3/files/' + pub.getId() + '/comments', pea = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  var leht = '', vead = [];
  do {
    var res = UrlFetchApp.fetch(api + '?pageSize=100&includeDeleted=false&fields=nextPageToken,comments(id,resolved,author(me))' + (leht ? '&pageToken=' + encodeURIComponent(leht) : ''),
      { method: 'get', headers: pea, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Kommentaarid (list): ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
    var j = JSON.parse(res.getContentText());
    (j.comments || []).forEach(function (c) {
      if (c.resolved || (c.author && c.author.me)) return;
      var r = UrlFetchApp.fetch(api + '/' + encodeURIComponent(c.id) + '/replies?fields=id', { method: 'post', contentType: 'application/json', headers: pea,
        payload: JSON.stringify({ action: 'resolve', content: 'Kommentaarid suletakse automaatselt. / Comments are closed automatically.' }), muteHttpExceptions: true });
      if (r.getResponseCode() !== 200 && vead.length < 3) vead.push(r.getResponseCode() + ' ' + r.getContentText().slice(0, 200));
    });
    leht = j.nextPageToken || '';
  } while (leht);
  if (vead.length) throw new Error('Kommentaarid (resolve): ' + vead.join(' | '));
}

// Erik 20.10: kes pole kuu viimase 7 päeva jooksul midagi kirja pannud (number, J või H), alustab uut kuud pausil, muidu loetakse
// lahkunuid ühisesse eesmärki ja protsenti. Erik 25.10: kes ei kirjutanud terve kuu jooksul ühtegi korda, jääb pausita (võis alustada poole pealt). Otsus tehakse kuu lõpetanud ööl 2. kuupäeval (siis on viimase päeva kirjed ka lisatud),
// üks kord kuus. Erik ise, juba pausil või eemaldamist ootavad, alles viimase 7 päeva sees liitunud ja need, kes on juba uuel kuul
// midagi kirja pannud, jäävad alles. Tagasi saab alati: nimekirjas „Osalen“. Tagastab pausile pandud nimed.
var PAUSI_PAEVI = 7;                                         // 0 = reegel väljas (testid)
function eiTaitnud_(pub, t) {
  if (!PAUSI_PAEVI) return [];
  var ro = pub.getSheetByName(T_ROSTER);
  if (!ro || nimekirjaKohti_(ro) < N) return [];
  var props = props_(), kuud = kuulehed_(pub);
  var vana = kuud.filter(function (m) {
    return t >= m.end + 2 && t <= m.end + 4 && !props.getProperty('eitaitnud:' + pub.getId() + ':' + m.start);
  }).pop();
  if (!vana) return [];
  props.setProperty('eitaitnud:' + pub.getId() + ':' + vana.start, String(t));
  var uus = kuud.filter(function (m) { return m.start === vana.end + 1; })[0];
  if (!uus) return [];
  var v = ro.getRange(RR0, 2, N, 5).getValues();
  var vp = vana.sh.getRange(R0, FD, N, vana.days).getValues(), up = uus.sh.getRange(R0, FD, N, uus.days).getValues();
  var kirje = function (x) { return typeof x === 'number' || /^[JH]$/i.test(str_(x)); };
  var nimed = [], elavad = kuud.filter(function (m) { return !m.frozen && m.start > vana.end; });
  v.forEach(function (r, k) {
    var nimi = str_(r[0]), liitus = toSerial_(r[2]);
    if (!nimi || nimi.toLowerCase() === KLOON.toLowerCase() || r[1] === PAUSE || r[1] === REMOVE || str_(r[4]) === REMOVE) return;
    if (liitus !== null && liitus > vana.end - PAUSI_PAEVI + 1) return;       // liitus viimase 7 päeva sees
    if (!vp[k].some(kirje)) return;                                           // terve kuu ilma kirjeta: ilmselt alustas poole pealt ega taha alustada (Erik 25.10)
    if (vp[k].slice(vana.days - PAUSI_PAEVI).some(kirje) || up[k].some(kirje)) return;
    ro.getRange(RR0 + k, 3).setValue(PAUSE).setNote('Kuu viimase 7 päeva jooksul polnud kirjeid, seepärast alustad uut kuud pausil. Tahad jätkata? Vali siin „Osalen“. / ' +
      'There were no entries in the last 7 days of the month, so you start the new month paused. Want to continue? Pick “Osalen · In” here.');
    ro.getRange(RR0 + k, 6).setValue(PAUSE);
    elavad.forEach(function (m) { tyhjenda_(m, k, false); });
    nimed.push(nimi);
  });
  return nimed;
}

function logiLyhemaks_(priv) {
  var lg = priv.getSheetByName(T_LOGI);
  if (lg && lg.getRange('A1').getValue() === 'Aeg' && lg.getLastRow() > 5001) lg.deleteRows(2, lg.getLastRow() - 5001);
}

// ================================================================ nimekiri

// Viib kuu vahekaardid nimekirjaga kooskõlla. Veerud E ja F (peidus) mäletavad eelmist nime ja olekut.
// naita = true: muudatus kohe (teated tagasi); false: öine hooldus, alles siis eemaldamised ja tühjade ridade kokkutõmbamine.
function sobita_(pub, t, naita, logist) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (nimekirjaKohti_(ro) < N) return [];                      // vana 50 kohaga tabel, laienda_ pole veel õnnestunud
  var v0 = ro.getRange(RR0, 2, N, 5).getValues();          // B nimi, C olek, D liitus, E eelmine nimi, F eelmine olek
  var v = v0.map(function (r) { return [str_(r[0]), str_(r[1]), toSerial_(r[2]), str_(r[3]), str_(r[4])]; });
  var algne = JSON.stringify(v);
  var kuud = null, teated = [];
  var elus = function () {                                  // lukustamata kuud (ka lõppenud kuu 1. kuupäeval)
    if (!kuud) kuud = kuulehed_(pub, true).filter(function (m) { return !m.frozen && t <= m.end + 1; });
    return kuud;
  };
  var kaivad = function () {                                // käimasolevad ja tulevased kuud: ainult neis liiguvad read
    return elus().filter(function (m) { return t <= m.end; });
  };

  // Keegi tõstis või sorteeris nimesid: kõik nimed lähevad oma kohale tagasi.
  var koht = {};
  v.forEach(function (r, k) { if (r[3]) koht[r[3]] = k; });
  var tostetud = v.some(function (r, k) { return r[0] && r[0] !== r[3] && koht.hasOwnProperty(r[0]) && koht[r[0]] !== k; });
  if (tostetud) {
    var uued = v.filter(function (r) { return r[0] && !koht.hasOwnProperty(r[0]); }).map(function (r) { return [r[0], r[1]]; });
    v.forEach(function (r) { r[0] = r[3]; r[1] = r[3] ? r[4] : r[1]; });
    uued.forEach(function (u) {
      for (var k = 0; k < N; k++) if (!v[k][0] && !v[k][3]) { v[k][0] = u[0]; v[k][1] = u[1]; return; }
    });
    teated.push('Nimede järjekorda muuta ei saa, panin need tagasi. / Names can\'t be moved, I put them back.');
  }

  // Kellegi teise nimi kirjutati üle (tal on selle kuu kirjeid, nimi täiesti teine): vana nimi tagasi, uus nimi esimesse vabasse ritta.
  for (var o = 0; o < N; o++) {
    var ov = v[o];
    if (!ov[0] || !ov[3] || ov[0] === ov[3] || sarnane_(ov[0], ov[3])) continue;
    if (!elus().some(function (m) { return kirjed_(m, o); })) continue;
    var uusNimi = ov[0];
    ov[0] = ov[3];
    teated.push('See rida on ' + ov[3] + ' oma ja tal on selle kuu tulemusi, panin nime tagasi. Kirjuta „' + uusNimi + '“ esimesse vabasse ritta. / ' +
      'This row is ' + ov[3] + '\'s and has results this month, so I put the name back. Type “' + uusNimi + '” in the first empty row.');
  }

  // Uus nimi kaugemal kui esimene vaba rida: tõstan selle esimesse vabasse ritta, et vahele ei jääks tühje ridu.
  for (var u = 0; u < N; u++) {
    if (!v[u][0] || v[u][3]) continue;
    for (var w = 0; w < u; w++) {
      if (v[w][0] || v[w][3]) continue;
      v[w] = v[u]; v[u] = ['', '', null, '', ''];
      teated.push(v[w][0] + ': panin nime esimesse vabasse ritta. / ' + v[w][0] + ': moved to the first empty row.');
      break;
    }
  }

  // „Kinnitan eemaldamise“: öösel kaob inimene käimasolevatelt kuudelt, järgmised nihkuvad üles (alt üles, et indeksid ei nihkuks).
  // Lõppenud kuudes jääb tema rida alles nimega „Endine osaleja“.
  var eemaldati = false;
  for (var q = N - 1; q >= 0; q--) {
    var x = v[q];
    if (x[1] !== CONFIRM) continue;
    if (x[3] && x[4] === REMOVE && naita) {
      teated.push(x[3] + ' eemaldatakse täna öösel. Eksisid? Vali „Osalen“. / ' + x[3] + ' will be removed tonight. Mistake? Pick “Osalen · In”.');
    } else if (x[3] && x[4] === REMOVE) {
      var nimed = [x[3], x[0]].filter(function (s) { return s; });
      kuulehed_(pub).forEach(function (m) { eemaldaKuust_(m, q, nimed, t); });
      v.splice(q, 1);
      v.push(['', '', null, '', '']);
      eemaldati = true;
      teated.push(x[3] + ' on eemaldatud. / ' + x[3] + ' was removed.');
    } else {
      x[1] = x[4] === PAUSE ? PAUSE : x[3] ? IN : '';
      if (x[3]) teated.push('Kinnitamiseks vali enne „Eemalda · Remove“ ja siis „Kinnitan eemaldamise“. / Pick “Eemalda · Remove” first, then “Kinnitan eemaldamise · Confirm removal”.');
    }
  }

  for (var k = 0; k < N; k++) {
    var r = v[k];
    if (!r[0] && !r[3]) { r[2] = null; r[4] = ''; continue; }            // tühi rida
    if (r[1] === CONFIRM && r[0] === r[3]) continue;                      // eemaldatakse öösel
    if (!r[0]) {                                                          // nimi kustutati
      var kirjas = elus().some(function (m) { return kirjed_(m, k); });
      if (kirjas) {
        r[0] = r[3];
        teated.push(r[3] + ': sellel nimel on selle kuu kirjeid, nii seda kustutada ei saa. Järgmisel kuul ei osale? Vali „Paus“. ' +
          'Lõpetad päriselt? Vali „Eemalda“ ja siis „Kinnitan eemaldamise“. / ' +
          r[3] + ' has entries this month and can\'t be deleted like this. Skipping next month? Pick “Paus · Pause”. ' +
          'Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”.');
      } else {
        kaivad().forEach(function (m) { tyhjenda_(m, k, true); });
        r[1] = ''; r[2] = null; r[3] = ''; r[4] = '';
      }
      continue;
    }
    if (!r[3]) {                                                          // uus nimi
      var st = r[1] === PAUSE ? PAUSE : IN;
      var lt = (!naita || logist) ? logiLiitumine_(r[0], t) : null;       // ootel nimi (lukk oli kinni): liitumise päev on see, mil nimi kirja pandi
      var lp = lt === null ? t : lt;
      r[1] = st; r[2] = lp; r[3] = r[0]; r[4] = st;
      kaivad().forEach(function (m) { liida_(m, k, lp); });
      if (st === PAUSE) kaivad().forEach(function (m) { paus_(m, k, lp); });
      continue;
    }
    if (r[2] === null && r[1] !== REMOVE) {                               // Erik 3.10: nimi on, liitumiskuupäev puudub
      var lii = liitumine_(pub, r[0], k, t);
      r[2] = lii;
      kaivad().forEach(function (m) { if (!onValem_(m, k)) liida_(m, k, lii); else xTaide_(m, k, lii); });
      teated.push(r[0] + ': liitumiskuupäev oli puudu, panin selle kirja. / ' + r[0] + ': the join date was missing, I filled it in.');
    }
    r[3] = r[0];                                                          // nimi võis muutuda: kuu vahekaardid võtavad selle ise
    if (r[1] === REMOVE) {                                                // ootab kinnitust: kuu vahekaardid jäävad nagu olid
      if (r[4] !== REMOVE) {
        r[4] = REMOVE;
        teated.push(r[0] + ': kinnitamiseks vali samas lahtris „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt vahekaardilt. Eksisid? Vali „Osalen“. / ' +
          r[0] + ': to confirm, pick “Kinnitan eemaldamise · Confirm removal” in the same cell. The name and all its results are then deleted from every tab. Mistake? Pick “Osalen · In”.');
      }
      continue;
    }
    var olek = r[1] === PAUSE ? PAUSE : IN;
    r[1] = olek;
    if (olek !== r[4]) {
      if (olek === PAUSE) {
        kaivad().forEach(function (m) { paus_(m, k, t); });
      } else {
        var hiljem = false;
        kaivad().forEach(function (m) { if (tagasi_(m, k, t)) hiljem = true; });
        if (hiljem) r[2] = t;                                             // tuli tagasi kuu keskel
      }
      r[4] = olek;
    }
  }

  // Öösel: tühjad read nimede vahel kaovad, allolevad nimed ja nende kuu read nihkuvad üles.
  for (var g = N - 2; g >= 0 && !naita; g--) {
    if (v[g][0] || v[g][3]) continue;
    var allpool = false;
    for (var h = g + 1; h < N; h++) if (v[h][0] || v[h][3]) { allpool = true; break; }
    if (!allpool) continue;
    kaivad().forEach(function (m) { eemaldaKuust_(m, g, [], t); });
    v.splice(g, 1);
    v.push(['', '', null, '', '']);
    eemaldati = true;
  }
  // Öösel: kuu vahekaardil ei jää ühtegi nime ega kirjet ridadele, mille nimekirjas pole kedagi.
  if (!naita) kaivad().forEach(function (m) {
    var ala = m.sh.getRange(R0, 1, N, 34), mv = ala.getValues(), mf = ala.getFormulas();
    for (var k2 = 0; k2 < N; k2++) {
      if (v[k2][0] || v[k2][3]) continue;
      var must = !mf[k2][0] && str_(mv[k2][0]) !== '';
      for (var c2 = 1; c2 < 34 && !must; c2++) if (str_(mv[k2][c2]) !== '') must = true;
      if (must) tyhjenda_(m, k2, true);
    }
  });

  if (eemaldati) {                                                        // palju ridu muutus: kirjuta korraga
    ro.getRange(RR0, 2, N, 5).setValues(v.map(function (r) { return [txt_(r[0]), txt_(r[1]), r[2] === null ? '' : r[2], txt_(r[3]), txt_(r[4])]; }));
    ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
  } else if (JSON.stringify(v) !== algne) {
    var ennem = JSON.parse(algne);
    for (var i = 0; i < N; i++) {                                         // üks rida korraga: olek, kuupäev ja eelmine nimi ei jää pooleli
      var nm = v[i][0] !== ennem[i][0], muutus = nm;
      for (var j = 1; j < 5 && !muutus; j++) if (v[i][j] !== ennem[i][j]) muutus = true;
      if (!muutus) continue;
      var rida = [txt_(v[i][0]), txt_(v[i][1]), v[i][2] === null ? '' : v[i][2], txt_(v[i][3]), txt_(v[i][4])].slice(nm ? 0 : 1);   // nime lahtrisse puutun ainult siis, kui see muutus
      ro.getRange(RR0 + i, nm ? 2 : 3, 1, rida.length).setValues([rida]);
      if (v[i][2] !== null) ro.getRange(RR0 + i, 4).setNumberFormat('d.mm.yyyy');
    }
  }
  return teated;
}

// Liitumiskuupäev, mis nimekirjast puudub (nimi kirjutati, aga kuupäeva kirjutamine jäi pooleli). Otsib kolmest kohast:
// 1) muudatuste logist: millal see nimi nimekirja kirjutati, 2) kuu vahekaardi X-idest (liitumise päevani on X), 3) täna.
function liitumine_(pub, nimi, k, t) {
  var d = logiLiitumine_(nimi, t);
  if (d !== null) return d;
  var m = kuulehed_(pub, true).filter(function (x) { return !x.frozen && x.start <= t && t <= x.end; })[0];
  if (m && onValem_(m, k)) {
    var v = m.sh.getRange(R0 + k, FD, 1, m.days).getValues()[0], c = 0;
    while (c < v.length && str_(v[c]).toUpperCase() === 'X') c++;
    return Math.min(t, m.start + c);
  }
  return t;
}

function logiLiitumine_(nimi, t) {
  try {
    var id = props_().getProperty('PRIV_ID');
    var lg = id ? SpreadsheetApp.openById(id).getSheetByName(T_LOGI) : null;
    if (!lg || lg.getLastRow() < 2) return null;
    var n = Math.min(lg.getLastRow() - 1, 5000), v = lg.getRange(lg.getLastRow() - n + 1, 1, n, 5).getValues();
    var tab = (GRUPP_ ? GRUPP_.nimi + ' · ' : '') + T_ROSTER, lc = nimi.toLowerCase(), parim = null, uus = false;
    for (var i = 0; i < v.length; i++) {                      // logi on ajajärjekorras: viimane tühja lahtrisse kirjutatud sama nimi, muidu viimane sama nimi
      if (String(v[i][1]) !== tab || !/^B\d+$/.test(String(v[i][2])) || str_(v[i][4]).toLowerCase() !== lc) continue;
      var a = v[i][0], d = a instanceof Date ? toSerial_(a) : null, tuhi = str_(v[i][3]) === '';
      if (d === null) { var q = String(a).slice(0, 10).split('-'); if (q.length === 3 && Number(q[0]) > 2000) d = serial_(Number(q[0]), Number(q[1]), Number(q[2])); }
      if (d === null || d > t || (uus && !tuhi)) continue;
      parim = d; uus = uus || tuhi;
    }
    return parim;
  } catch (err) { return null; }
}

// Sama inimese nimi: kirjaviga parandatud (lühikeses nimes 1, pikemas 2 tähte), perenimi või initsiaal lisatud (Mari → Mari T).
function sarnane_(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  var lyhem = Math.min(a.length, b.length);
  return erinevus_(a, b) <= (lyhem < 6 ? 1 : 2) || (lyhem >= 3 && (a.indexOf(b) === 0 || b.indexOf(a) === 0));
}

// Kahe nime erinevus tähtedes (Levenshtein): „Mari“ → „Mari K“ on 2, „Mari“ → „Jüri“ on 3.
function erinevus_(a, b) {
  var p = [];
  for (var j = 0; j <= b.length; j++) p.push(j);
  for (var i = 1; i <= a.length; i++) {
    var q = [i];
    for (var j2 = 1; j2 <= b.length; j2++) q.push(Math.min(p[j2] + 1, q[j2 - 1] + 1, p[j2 - 1] + (a.charAt(i - 1) === b.charAt(j2 - 1) ? 0 : 1)));
    p = q;
  }
  return p[b.length];
}

// Kuu alguses lähevad pausil olijad nimekirja lõppu, et kuu vahekaardi ülemised read oleksid osalejate omad.
// Tehakse üks kord kuus, kuu esimestel päevadel (öine hooldus). Kirjed liiguvad inimesega kaasa.
function jarjesta_(pub, t) {
  var kuu = kuulehed_(pub, true).filter(function (m) { return !m.frozen && m.start <= t && t <= m.end; })[0];
  if (!kuu) return;
  var props = props_(), key = 'järjestus:' + pub.getId() + ':' + kuu.start;
  if (props.getProperty(key)) return;
  if (t <= kuu.start + 2) pausidLoppu_(pub, t);
  props.setProperty(key, String(t));
}

function pausidLoppu_(pub, t) {
  var ro = pub.getSheetByName(T_ROSTER);
  if (nimekirjaKohti_(ro) < N) return false;
  var ala = ro.getRange(RR0, 2, N, 5), v = ala.getValues(), osaleb = [], paus = [], tyhi = [];
  v.forEach(function (r, k) { (!str_(r[0]) && !str_(r[3]) ? tyhi : str_(r[1]) === PAUSE ? paus : osaleb).push(k); });
  var p = osaleb.concat(paus, tyhi);
  if (p.every(function (k, i) { return k === i; })) return false;
  ala.setValues(p.map(function (k) { return v[k].map(function (x) { return x === null ? '' : txt_(x); }); }));
  ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;                      // lõppenud kuu nimed on juba paigas (staatiline_)
    var r = m.sh.getRange(R0, 1, N, 34), mv = r.getValues(), mf = r.getFormulas();
    var uus = p.map(function (k, i) {
      var row = [mf[k][0] ? nimeValem_(m.sh, R0 + i) : txt_(mv[k][0])];
      for (var c = 1; c < 34; c++) row.push(mv[k][c] === null ? '' : txt_(mv[k][c]));
      return row;
    });
    reeglitaKirjuta_(r, function (x) { x.setValues(uus); });
  });
  return true;
}

// Mitu nimerida on nimekirjas (tulp A on 1, 2, 3 …).
function nimekirjaKohti_(ro) {
  var n = Math.min(N, ro.getMaxRows() - RR0 + 1), a = n > 0 ? ro.getRange(RR0, 1, n, 1).getValues() : [], k = 0;
  while (k < a.length && Number(a[k][0]) === k + 1) k++;
  return k;
}

// Mitu osaleja rida on kuu vahekaardil: jalus („✓ eesmärk täis“) on kaks rida pärast viimast.
function kuuKohti_(sh) {
  var n = Math.min(sh.getMaxRows(), R0 + N + 5) - R0 + 1, f = sh.getRange(R0, 1, n, 1).getFormulas();
  for (var i = 0; i < n; i++) if (f[i][0].indexOf('hit target') >= 0) return i - 1;
  return -1;
}

// Vanem tabel oli 50 kohaga: nimekiri ja kuu vahekaardid saavad ridu juurde, nimed ja kirjed jäävad oma kohale.
function laienda_(pub) {
  var ro = pub.getSheetByName(T_ROSTER), muutus = false;
  if (!ro) return false;
  var o = nimekirjaKohti_(ro);
  if (o >= 10 && o < N) {
    var v = ro.getRange(RR0, 2, o, 5).getValues();
    ro.insertRowsBefore(RR0 + o - 1, N - o);                  // vahele lisatud read: kõik viited laienevad ise
    var uus = [];
    for (var k = 0; k < N; k++) uus.push(k < o ? v[k].map(function (x) { return x === null ? '' : txt_(x); }) : ['', '', '', '', '']);
    ro.getRange(RR0, 2, N, 5).setValues(uus);
    ro.getRange(RR0, 1, N, 1).setValues(uus.map(function (r, i) { return [i + 1]; }));
    ro.getRange(RR0, 4, N, 1).setNumberFormat('d.mm.yyyy');
    ro.setRowHeights(RR0, N, 24);
    nimekirjaVormid_(ro);
    muutus = true;
  }
  KUUD_ = null;
  kuulehed_(pub).forEach(function (m) { if (laiendaKuu_(m.sh)) muutus = true; });
  if (muutus) { viitedLaiendus_(pub); KUUD_ = null; }
  return muutus;
}

function laiendaKuu_(sh) {
  var o = kuuKohti_(sh);
  if (o < 10 || o >= N) return false;
  var ala = sh.getRange(R0, 1, o, 34), v = ala.getValues(), f = ala.getFormulas();
  var taust = sh.getRange(R0, 1, 2, 3).getBackgrounds();
  sh.insertRowsBefore(R0 + o - 1, N - o);
  var uus = [];
  for (var k = 0; k < N; k++) {
    var row = [k < o ? (f[k][0] ? nimeValem_(sh, R0 + k) : txt_(v[k][0])) : ''];
    for (var c = 1; c < 34; c++) row.push(k < o && v[k][c] !== null ? txt_(v[k][c]) : '');
    uus.push(row);
  }
  reeglitaKirjuta_(sh.getRange(R0, 1, N, 34), function (x) { x.setValues(uus); });
  var r1 = sh.getRange(R0, 35, 1, 13).getFormulasR1C1()[0];
  sh.getRange(R0, 35, N, 13).setFormulasR1C1(uus.map(function () { return r1; }));
  [2, FD].forEach(function (c) {
    var dv = sh.getRange(R0, c).getDataValidation();
    if (dv) sh.getRange(R0, c, N, c === FD ? 31 : 1).setDataValidation(dv);
  });
  sh.getRange(R0, 1, N, 3).setBackgrounds(uus.map(function (r, k) { return taust[k % 2]; }));
  sh.setRowHeights(R0, N, 21);
  return true;
}

// Ülevaate ja Autahvli valemid loevad kuu vahekaarti INDIRECT-iga (tekstina), need ei laiene ise.
function viitedLaiendus_(pub) {
  [T_BOARD, T_FAME].forEach(function (n) {
    var sh = pub.getSheetByName(n);
    if (!sh) return;
    var ala = sh.getRange(1, 1, Math.min(sh.getMaxRows(), 60), Math.min(sh.getMaxColumns(), 30)), f = ala.getFormulas();
    f.forEach(function (row, i) {
      row.forEach(function (x, j) {
        if (!x || x.indexOf('INDIRECT') < 0) return;
        var y = laiendaTekst_(x);
        if (y !== x) ala.getCell(i + 1, j + 1).setFormula(y);
      });
    });
  });
}

function laiendaTekst_(x) {
  var o = N_VANA, d = N - o;
  return x.replace(/!(\$?[A-Z]{1,3}\$?)(\d+):(\$?[A-Z]{1,3}\$?)(\d+)"/g, function (s, a, r1, b, r2) {
    return +r1 === R0 && +r2 === R0 + o - 1 ? '!' + a + r1 + ':' + b + (R0 + N - 1) + '"' : s;
  }).replace(/!(\$?[A-Z]{1,3}\$?)(\d+)"/g, function (s, a, r) {
    return +r === R0 + o + 1 || +r === R0 + o + 2 ? '!' + a + (+r + d) + '"' : s;
  });
}

// Uus inimene: kuu vahekaardil tuleb nimi nähtavale ja päevadele enne liitumist X.
function liida_(m, k, t) {
  if (t > m.end) return;                                  // lõppenud kuusse (1. kuupäev) uut nime ei lisa
  var a = m.sh.getRange(R0 + k, 1);
  if (a.getFormula() === '') a.setFormula(nimeValem_(m.sh, R0 + k));
  xTaide_(m, k, t);
}

// Paus: ainult tulevastest kuudest välja. Käimasolev kuu jätkub nagu enne.
function paus_(m, k, t) {
  if (m.start <= t) return;
  tyhjenda_(m, k, false);
}

// Tagasi: kuu vahekaardil tuleb nimi uuesti nähtavale. Tagastab true, kui kuu oli juba alanud.
function tagasi_(m, k, t) {
  if (t > m.end) return false;
  var a = m.sh.getRange(R0 + k, 1);
  if (a.getFormula() !== '') return false;
  a.setFormula(nimeValem_(m.sh, R0 + k));
  xTaide_(m, k, t);
  return t > m.start;
}

function tyhjenda_(m, k, jataValem) {
  m.sh.getRange(R0 + k, 2, 1, 33).clearContent();          // tase, paar, päevad
  var a = m.sh.getRange(R0 + k, 1);
  if (jataValem) { if (a.getFormula() === '') a.setFormula(nimeValem_(m.sh, R0 + k)); } else a.clearContent();
}

// Eemaldab inimese käimasolevalt kuu vahekaardilt: tema rida kaob ja allolevad read nihkuvad ühe võrra üles.
// Lõpetatud kuus jäävad tulemused alles (kuu summa ei muutu), nime asemele tuleb „Endine osaleja“.
function eemaldaKuust_(m, k, nimed, t) {
  var sh = m.sh, a = sh.getRange(R0, 1, N, 1), i = k;
  if (m.frozen || t > m.end) {
    staatiline_(m);
    var av = a.getValues().map(function (r) { return str_(r[0]); });
    for (var j = 0; j < N; j++) if (nimed.indexOf(av[j]) >= 0) sh.getRange(R0 + j, 1).setValue(EKS);
    return;
  }
  var n = N - i;
  var rng = sh.getRange(R0 + i, 1, n, 34), vals = rng.getValues(), fs = rng.getFormulas();
  var uus = [];
  for (var r = 0; r < n; r++) {
    var src = r + 1 < n ? r + 1 : -1, row = [];
    row.push(src < 0 || fs[src][0] !== '' ? nimeValem_(sh, R0 + i + r) : '');
    for (var c = 1; c < 34; c++) row.push(src < 0 ? '' : txt_(vals[src][c]));
    uus.push(row);
  }
  reeglitaKirjuta_(rng, function (x) { x.setValues(uus); });
}

// Lõppenud kuu nimed valemitest tekstiks, et nimekirja muudatused seda kuud enam ei nihutaks.
function staatiline_(m) {
  var a = m.sh.getRange(R0, 1, N, 1);
  if (!a.getFormulas().some(function (r) { return r[0]; })) return;
  a.setValues(a.getValues().map(function (r) { return [txt_(r[0])]; }));
}

// X kõigile tühjadele päevadele enne tänast.
function xTaide_(m, k, t) {
  var n = Math.min(m.days, t - m.start);
  if (n <= 0) return;
  var r = m.sh.getRange(R0 + k, FD, 1, n), v = r.getValues()[0], muutus = false;
  v = v.map(function (x) { if (x === '' || x === null) { muutus = true; return 'X'; } return x; });
  if (muutus) reeglitaKirjuta_(r, function (x) { x.setValues([v]); });
}

// Päevalahtri reegel ei lase skriptilgi X-i kirjutada, kui nimekirja liitumiskuupäev pole veel kirjas (nt uus nimi,
// mille kuupäev kirjutatakse alles pärast kuu vahekaarte). Skript paneb need X-id ise, seega reegel on kirjutamise ajaks maas.
function reeglitaKirjuta_(r, fn) {
  r.clearDataValidations();
  try { return fn(r); } finally { paevaReeglid_(r.getSheet()); }
}

// Kuu vahekaardi päevade ja taseme reegel, alati valmis kujul (mitte getDataValidations → setDataValidations: see nihutas
// suhtelisi viiteid ja kõik sissekanded muutusid kehtetuks, Erik 12.10 Swedis). Käib ka öösel, nii paraneb vigane reegel ise.
function paevaReeglid_(sh) {
  var piir = plank_(sh);
  sh.getRange(R0, FD, N, 31).setDataValidation(SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=' + KH_PATCH.day_rule)
    .setAllowInvalid(false).setHelpText(piir ? PLANK_ABI : KH_PATCH.day_help).build());
  sh.getRange(R0, 2, N, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(TASEMED, true)
    .setAllowInvalid(false).setHelpText(KH_PATCH.level_help).build());
  plankPais_(sh, piir);
}

// Plangu kuu (Erik 27.10): kirja saab panna ainult 60, 90, 120, 150 … sekundit. Päevareegel (KH_PATCH.day_rule) tunneb
// plangu ise ära harjutuse nime järgi (AW8/AW9), siin on abitekst, päise lisa ja kleepimise kontroll (paevadeKontroll_).
var PLANK_MIN = 60, PLANK_SAMM = 30;
var PLANK_ABI = 'Kirjuta oma reale tänasesse või eilsesse lahtrisse: aeg sekundites 30 kaupa, alates 60-st (60, 90, 120, 150 …), J (kuni 2 kuus) või H. / ' +
  "Use your row, today's or yesterday's cell: seconds in steps of 30, from 60 (60, 90, 120, 150 …), J (max 2 a month) or H.";
var PLANK_PAIS = '&IF(' + LANG + '="English","  ·  ⏱ Enter seconds in steps of 30, from 60: 60, 90, 120, 150 …",' +
  '"  ·  ⏱ Kirjuta aeg 30 sekundi kaupa, alates 60-st: 60, 90, 120, 150 …")';
function plank_(sh) { return /plank/i.test(str_(sh.getRange(8, AW).getValue()) + ' ' + str_(sh.getRange(9, AW).getValue())); }
function plankOk_(x) { return x >= PLANK_MIN && x % PLANK_SAMM === 0; }
function plankPais_(sh, piir) {
  var c = sh.getRange(1, FD), f = c.getFormula();
  if (!f) return;
  var i = f.indexOf('⏱'), alus = i < 0 ? f : f.slice(0, f.lastIndexOf('&IF(', i));   // vana lisa ära, ka kui Sheets kirjutas valemi veidi teisiti
  var uus = alus + (piir ? PLANK_PAIS : '');
  if (uus !== f) c.setFormula(uus);
}

function onValem_(m, k) { return m.sh.getRange(R0 + k, 1).getFormula() !== ''; }

// Kas real on selle kuu kirjeid (number, J või H)?
function kirjed_(m, k) {
  return m.sh.getRange(R0 + k, FD, 1, 31).getValues()[0].some(function (x) {
    return typeof x === 'number' || /^[JH]$/i.test(String(x).trim());
  });
}

// Tase: valida ja muuta saab kuu (või oma liitumise) esimese 7 päeva jooksul, siis on see kuu lõpuni lukus.
var TASEMED = ['Algaja · Starter', 'Põhi · Base', 'Pluss · Plus', 'Tipp · Beast'];
function tase_(e, sh, t) {
  return lukk7_(e, sh, t, 'Taset saab valida ja muuta ainult esimese 7 päeva jooksul, nüüd on see kuu lõpuni lukus. / ' +
    'You can pick or change your level only in your first 7 days, now it\'s locked until the month ends.');
}

// Erik 1.10: tiimi saab kirja panna ja muuta samuti ainult esimese 7 päeva jooksul, et keegi ei teeks kuu lõpus
// juba 100% peal olijatega kiiresti tiimi ainult lisapiletite pärast.
function tiim_(e, sh, t) {
  return lukk7_(e, sh, t, 'Tiimi saab kirja panna või muuta ainult esimese 7 päeva jooksul kuu algusest või oma liitumisest. ' +
    'Nüüd on tiim kuu lõpuni lukus, seepärast võeti sinu muudatus tagasi. Uue tiimi saad teha järgmisel kuul. / ' +
    'You can set or change your team only in your first 7 days of the month or after joining. Your team is now locked ' +
    'until the month ends, so your change was undone. You can make a new team next month.');
}

// Tase ja tiim: lubatud kuu algusest või liitumisest 7 päeva, hiljem võetakse muudatus tagasi. true = võeti tagasi.
function lukk7_(e, sh, t, teade) {
  var r = e.range, row = r.getRow();
  if (r.getNumRows() !== 1 || row < R0 || row >= R0 + N) return false;
  var s = sh.getRange(1, AW, 2, 1).getValues();
  if (s[0][0] !== 'KUULEHT') return false;
  var start = toSerial_(s[1][0]);
  if (start === null) return false;
  var liitus = toSerial_(e.source.getSheetByName(T_ROSTER).getRange(RR0 + row - R0, 4).getValue());
  if (t <= Math.max(start, liitus === null ? start : liitus) + 6) return false;
  if (e.value === undefined && str_(r.getValue()) !== '') return false;   // kleepimine: vana väärtust ei tea, jätan alles
  if (e.oldValue === undefined || e.oldValue === null || e.oldValue === '') r.clearContent(); else r.setValue(e.oldValue);
  teata_(e, [teade]);
  return true;
}

// ================================================================ kuu vahekaardid

// Kõik kuu vahekaardid alguse järjekorras. elusad = true jätab vahele lõpetatud (aastaga nimega) vahekaardid.
var KUUD_ = null;
function kuulehed_(pub, elusad) {
  if (!KUUD_) {
    KUUD_ = [];
    pub.getSheets().forEach(function (sh) {
      if ([T_GUIDE, T_ROSTER, T_BOARD, T_FAME, T_RULES, T_PLAN].indexOf(sh.getName()) >= 0) return;
      var m = kuuInfo_(sh);
      if (m) KUUD_.push(m);
    });
    KUUD_.sort(function (a, b) { return a.start - b.start; });
  }
  return KUUD_.filter(function (m) { return !elusad || !/\d{4}/.test(m.name); });
}

function kuuInfo_(sh) {
  if (sh.getMaxColumns() < AW) return null;
  var v;
  try { v = sh.getRange(1, AW, 20, 1).getValues(); } catch (err) { return null; }
  if (v[0][0] !== 'KUULEHT') return null;
  var start = toSerial_(v[1][0]), days = Number(v[2][0]);
  if (start === null || !days) return null;
  return { sh: sh, name: sh.getName(), start: start, days: days, end: start + days - 1, frozen: v[19][0] === 'lukus',
    plank: /plank/i.test(str_(v[7][0]) + ' ' + str_(v[8][0])) };
}

function kuuLeht_(pub, y, m) {
  var s = serial_(y, m, 1), k = kuulehed_(pub);
  for (var i = 0; i < k.length; i++) if (k[i].start === s) return k[i];
  return null;
}

function uuedKuud_(pub, plan, t) {
  var d = ymd_(t), n = jargmine_(d[0], d[1]), cfg;
  if (!kuuLeht_(pub, d[0], d[1]) && (cfg = planRida_(plan, d[0], d[1]))) looKuu_(pub, d[0], d[1], cfg, t, topelt_(plan, d[0], d[1]));
  if (d[2] >= 20 && !kuuLeht_(pub, n[0], n[1]) && (cfg = planRida_(plan, n[0], n[1]))) looKuu_(pub, n[0], n[1], cfg, t, topelt_(plan, n[0], n[1]));
}

// Uus kuu vahekaart: alati uusimast mallist (mitte eelmise kuu koopiast), seaded plaanist, nimed nimekirjast.
function looKuu_(pub, y, m, cfg, t, topelt) {
  var start = serial_(y, m, 1), days = paevi_(y, m), nimi = lehenimi_(y, m);
  var kuud = kuulehed_(pub);
  for (var i = 0; i < kuud.length; i++) if (kuud[i].start === start) return kuud[i].sh;
  var ees = pub.getSheetByName(nimi);
  if (ees) {                                                // sama nimega vana vahekaart jääb alles teise nimega
    ees.setName(vabaNimi_(pub, nimi + ' (vana)'));
    if (kuuInfo_(ees)) registreeri_(pub, ees, nimi);
  }
  var ajutine = impordi_(PUB_NAME + ' (ajutine)', null), sh;
  try {
    var src = ajutine.getSheets().filter(function (s) { return kuuInfo_(s); })[0];
    sh = src.copyTo(pub);
    viited_(sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()), sh.getName(), nimi);
    sh.setName(nimi);
  } finally { DriveApp.getFileById(ajutine.getId()).setTrashed(true); }
  try {
  if (sh.isSheetHidden()) sh.showSheet();
  var g = pub.getSheetByName(T_GUIDE);
  if (g) sh.getRange('C1').setValue(str_(g.getRange('C3').getValue()) === 'English' ? 'English' : 'Eesti');
  var parast = kuud.length ? kuud[kuud.length - 1].sh.getIndex() : pub.getSheetByName(T_ROSTER).getIndex();
  pub.setActiveSheet(sh);
  pub.moveActiveSheet(parast + 1);
  KUUD_ = null;

  sh.getRange(2, AW, 14, 1).setValues([[start], [days]].concat(cfg.map(function (x) { return [txt_(x)]; })));
  sh.getRange(2, AW).setNumberFormat('d.mm.yyyy');
  sh.getRange(20, AW).clearContent();
  sh.getRange(21, AW).setValue(Math.max(start, t)).setNumberFormat('d.mm.yyyy');   // X enne seda kuupäeva on lubatud
  sh.getRange(R0, 2, N, 33).clearContent();                 // tase, paar, päevad
  sh.getRange(4, FD, 1, 31).clearContent();                 // 2x
  sh.getRange(22, AW).clearContent();
  topeltKuusse_({ sh: sh, days: days }, topelt || []);
  paevaReeglid_(sh);                                        // plangu kuu reegel ja päis kohe, mitte alles öösel
  var ro = pub.getSheetByName(T_ROSTER).getRange(RR0, 2, N, 2).getValues();
  sh.getRange(R0, 1, N, 1).setValues(ro.map(function (r, k) { return [str_(r[1]) === PAUSE ? '' : nimeValem_(sh, R0 + k)]; }));
  sh.getRange('A3').setFormula(a3Valem_(sh));
  var kuu = { sh: sh, name: nimi, start: start, days: days, end: start + days - 1, frozen: false };
  if (t > start) ro.forEach(function (r, k) { if (str_(r[0]) && str_(r[1]) !== PAUSE) xTaide_(kuu, k, t); });
  registreeri_(pub, sh);
  kaitse_(sh, kuuAvatud_(kuu, t));
  } catch (err) {                                           // pooleli jäänud vahekaart ei jää osalejatele näha
    try { pub.deleteSheet(sh); } catch (e2) {}
    KUUD_ = null;
    throw err;
  }
  return sh;
}

// Kuu on läbi (ja 1. kuupäeva lisapäev ka): nimed jäävad paigale, vahekaart lukku ja peitu.
function kylmuta_(pub, m) {
  var a = m.sh.getRange(R0, 1, N, 1);
  a.setValues(a.getValues().map(function (r) { return [txt_(r[0])]; }));
  var goal = m.sh.getRange(16, AW);                         // ühine eesmärk ei muutu enam, kui nimekiri muutub
  goal.setValue(goal.getValue());
  m.sh.getRange(20, AW).setValue('lukus');
  var d = ymd_(m.start), uus = ET_M[d[1] - 1] + ' ' + d[0] + ' | ' + EN_S[d[1] - 1] + ' ' + d[0];
  if (m.sh.getName() !== uus && !pub.getSheetByName(uus)) {
    var vana = m.sh.getName();
    m.sh.setName(uus);
    m.name = uus;
    registreeri_(pub, m.sh, vana);
  }
  kaitse_(m.sh, []);
  if (!m.sh.isSheetHidden()) m.sh.hideSheet();
  m.frozen = true;
}

// Kui plaanis muudetakse kuud, mis pole veel alanud, jõuab muudatus kuu vahekaardile.
// Plaani 2x päevad (tulp O) jõuavad ka käimasolevasse kuusse: kuu 4. rida on alati täpselt plaani päevad.
function synk_(pub, plan, t) {
  kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;
    var d = ymd_(m.start);
    topeltKuusse_(m, topelt_(plan, d[0], d[1]));
    if (m.start < t) return;
    var cfg = planRida_(plan, d[0], d[1]);
    if (!cfg) return;
    var r = m.sh.getRange(4, AW, 12, 1), cur = r.getValues();
    if (cfg.some(function (x, i) { return String(x) !== String(cur[i][0]); })) r.setValues(cfg.map(function (x) { return [txt_(x)]; }));
  });
}

// Kuu vahekaardi 4. rida on alati täpselt plaani 2x päevad (topeltpäevi muudab ainult korraldaja plaanis).
var TOPELT_MARKUS = 'Täna tuleb teha kahekordselt - saad ka 2x pileteid. Tavaline kogus annab ikka 1 pileti ja loeb päeva tehtuks, aga lahter jääb oranžiks.\n\nDo double your target today and you get 2x tickets. The normal amount still gives 1 ticket and counts the day as done, but the cell stays orange.';
// Ühekordsed eripäevad (Erik 30.10): sama raam kui 2x päeval, reas 4 silt ja märkus. Kehtib kõigis gruppides.
// Eripäeval loeb iga tulemus (> 0) päeva tehtuks ja roheliseks (valemid: rea 4 silt, mis pole „2x“; mk_v5.py ERI).
var ERIPAEVAD = {
  '2026-10-31': { silt: 'NATO', link: 'https://shorturl.at/2ytSl',
    markus: 'NATO test: Tee nii palju kätekõverdusi kui suudad 2 min jooksul. Reeglid: https://shorturl.at/2ytSl (klikitav link on vasakul üleval lahtris A4)\nKirjuta lahtrisse oma tulemus. Täna loeb iga tulemus päeva tehtuks, ka siis, kui see jääb alla sinu päeva eesmärgi.\n\n' +
      'NATO test: Do as many push-ups as you can in 2 minutes. Rules: https://shorturl.at/2ytSl (clickable link at the top left, cell A4)\nWrite your result in the cell. Today any result counts the day as done, even if it is below your daily target.' }
};
function eripaev_(m, p) {
  if (p > m.days) return null;
  var d = ymd_(m.start);
  return ERIPAEVAD[d[0] + '-' + (d[1] < 10 ? '0' : '') + d[1] + '-' + (p < 10 ? '0' : '') + p] || null;
}
// Märkuses link ei ole klikitav ega kopeeritav (Erik 30.10), sildil peidaks link märkuse. Nii on eripäeva link lahtris A4
// (alati nähtaval, ka siis, kui veerud on paremale keritud). Tavakuus on A4 jälle malli valem „⚡ 2x = topeltpäev“.
var A4_VALEM = '=IF(\'' + T_GUIDE + '\'!$C$3="English","⚡ 2x = double day","⚡ 2x = topeltpäev")';
function eriLink_(m) {
  var eri = null, paev = 0;
  for (var p = 1; p <= 31 && !eri; p++) { var e = eripaev_(m, p); if (e && e.link) { eri = e; paev = p; } }
  var a4 = m.sh.getRange(4, 1);
  if (eri) {
    var tekst = '⚡ ' + eri.silt + ' ' + paev + '.' + ymd_(m.start)[1] + ':\n' + eri.link;
    if (!a4.getFormula() && str_(a4.getValue()) === tekst) return false;
    a4.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(tekst).setLinkUrl(eri.link).build()).setWrap(true);
    m.sh.setRowHeight(4, 30);
    return true;
  }
  if (a4.getFormula() || str_(a4.getValue()).indexOf('http') < 0) return false;
  a4.setFormula(A4_VALEM).setWrap(false);
  m.sh.setRowHeight(4, 16);
  return true;
}
function topeltKuusse_(m, paevad) {
  var r = m.sh.getRange(4, FD, 1, 31), v = r.getValues()[0], muutus = false;
  for (var p = 1; p <= 31; p++) {
    var eri = eripaev_(m, p);
    var uus = eri ? eri.silt : p <= m.days && paevad.indexOf(p) >= 0 ? '2x' : '';
    if (str_(v[p - 1]) !== uus) { v[p - 1] = uus; muutus = true; }
  }
  if (muutus) r.setValues([v]);
  var nt = r.getNotes()[0], viimane = R0 + N - 1;           // 2x päeval on kuldne raam kogu veeru ulatuses (rida 2 kuni viimane nimi) ja rea 4 lahtril seletus
  for (var q = 1; q <= 31; q++) {
    var eri = eripaev_(m, q), on = eri || str_(v[q - 1]) === '2x', c = FD + q - 1, markus = eri ? eri.markus : TOPELT_MARKUS;
    if (on) {
      if (nt[q - 1] !== markus) { m.sh.getRange(4, c).setNote(markus); muutus = true; }
      if (eri) m.sh.getRange(4, c).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(eri.silt).build())   // ilma lingita: link peidaks märkuse (Erik 30.10)
        .setBackground('#F2B531');                          // 2x kuldne taust tuleb tingimusvormingust, eripäeval paneme ise
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);   // hallid reajooned tagasi (v11y kustutas need)
      m.sh.getRange(2, c, viimane - 1, 1).setBorder(true, true, true, true, null, null, '#B7791F', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    } else if (nt[q - 1]) {
      m.sh.getRange(4, c).setNote('').setBackground(null);
      var veerg = m.sh.getRange(2, c, viimane - 1, 1);
      veerg.setBorder(false, false, false, false, false, false);
      m.sh.getRange(4, c, viimane - 3, 1).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
      muutus = true;
    }
  }
  if (eriLink_(m)) muutus = true;
  var mal = m.sh.getRange(22, AW);
  if (str_(mal.getValue())) mal.setValue('');                // v9b mäletas siin plaani päevi, enam pole vaja
  return muutus;
}

// Plaani tulp O: päevad, mis on 2x (näiteks „7, 21“).
function topelt_(plan, y, m) {
  var i = planiRida_(plan, y, m);
  if (i < 0) return [];
  var s = str_(plan.getRange(PL0 + i, PL_2X).getDisplayValue()), n = paevi_(y, m), out = [];
  (s.match(/\d+/g) || []).forEach(function (x) { var p = Number(x); if (p >= 1 && p <= n && out.indexOf(p) < 0) out.push(p); });
  return out;
}

// Plaani rea number (0 = rida 3) kuule y-m, -1 kui sellist rida pole.
function planiRida_(plan, y, m) {
  var b = plan.getRange(PL0, 2, PLN, 1).getValues();
  for (var i = 0; i < PLN; i++) {
    var s = toSerial_(b[i][0]);
    if (s === null) continue;
    var d = ymd_(s);
    if (d[0] === y && d[1] === m) return i;
  }
  return -1;
}

// Autahvli veerg A on kuude nimekiri (sealt loevad Ülevaade ja Autahvel), veerus AC vahekaardi gid.
function registreeri_(pub, sh, vanaNimi) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var a = f.getRange(FAME0, 1, FAMEN, 1).getValues(), g = f.getRange(FAME0, FAME_GID, FAMEN, 1).getValues();
  var nimi = sh.getName(), gid = sh.getSheetId(), i;
  for (i = 0; i < FAMEN; i++) {
    var v = String(a[i][0]);
    if (v === nimi || (vanaNimi && v === vanaNimi) || (v && Number(g[i][0]) === gid)) break;
  }
  if (i === FAMEN) {
    for (i = 0; i < FAMEN; i++) if (String(a[i][0]) === '') break;
    if (i === FAMEN) {                                      // täis: vanim kuu läheb välja
      var jv = f.getRange(FAME0, 10, FAMEN, 1).getValues();
      f.getRange(FAME0, 1, FAMEN - 1, 1).setValues(a.slice(1));
      f.getRange(FAME0, 10, FAMEN - 1, 1).setValues(jv.slice(1));
      f.getRange(FAME0, FAME_GID, FAMEN - 1, 1).setValues(g.slice(1));
      f.getRange(FAME0 + FAMEN - 1, 10).clearContent();
      i = FAMEN - 1;
    }
  }
  f.getRange(FAME0 + i, 1).setValue(nimi);
  f.getRange(FAME0 + i, FAME_GID).setValue(gid);
}

// Juhendi lingid (nimekiri ja käimasolev kuu) ja kuu vahekaartide „tänane päev“ link.
function lingid_(pub) {
  var g = pub.getSheetByName(T_GUIDE), ro = pub.getSheetByName(T_ROSTER);
  var c = g.getRange(1, 3, Math.min(80, g.getMaxRows()), 1).getValues(), kuuLink = null, nimekLink = null;
  c.forEach(function (r, i) {
    var s = String(r[0]);
    var k = s.indexOf('👉'); if (k < 0 || k > 20) return;          // „[VAJUTA SIIA] 👉 …“ (1.10), varem „👉 …“
    if (s.indexOf('Nimekiri') >= 0 && !nimekLink) nimekLink = i + 1; else if (!kuuLink) kuuLink = i + 1;
  });
  var P = 'IF($C$3="English","[TAP HERE] ","[VAJUTA SIIA] ")&';      // Erik 1.10: lingi ees selge käsk
  if (nimekLink) g.getRange(nimekLink, 3).setFormula('=HYPERLINK("#gid=' + ro.getSheetId() + '&range=B4",' + P + '"👉 ' + T_ROSTER + '")');
  var F = "'" + T_FAME + "'!";
  if (kuuLink) g.getRange(kuuLink, 3).setFormula('=IFERROR(HYPERLINK("#gid="&INDEX(' + F + '$AC$5:$AC$40,MATCH(' + F + '$AB$4,' +
    F + '$A$5:$A$40,0)),' + P + '"👉 "&' + F + '$AB$4),' + P + '"👉 "&' + F + '$AB$4)');
  kuulehed_(pub).forEach(function (m) {
    registreeri_(pub, m.sh);
    if (!m.frozen) { m.sh.getRange('A3').setFormula(a3Valem_(m.sh)); nimed_(m.sh); }
  });
}

// Enne kuu algust: „⏳ algab 1.11“; kuu ajal link tänasele päevale.
function a3Valem_(sh) {
  return '=IF(TODAY()<$AW$2,IF(' + LANG + '="English","⏳ starts "&TEXT($AW$2,"d.m"),"⏳ algab "&TEXT($AW$2,"d.m")),' +
    'IF($AW$18=0,IF(' + LANG + '="English","↓ find your name","↓ leia oma nimi"),HYPERLINK("#gid=' + sh.getSheetId() +
    '&range="&ADDRESS(5,3+$AW$18,4),IF(' + LANG + '="English","➜ go to today","➜ tänane päev"))))';
}

// Nimi nimekirjast; nimele vajutades viib link sama rea tänasele päevale.
function nimeValem_(sh, row) {
  var b = "'" + T_ROSTER + "'!B" + (row - 1);
  return '=IF(' + b + '="",,HYPERLINK("#gid=' + sh.getSheetId() + '&range="&ADDRESS(ROW(),3+MAX(1,$AW$18),4),' + b + '))';
}

// ================================================================ lukud

function kaitseKoik_(pub, t) {
  var g = pub.getSheetByName(T_GUIDE), ro = pub.getSheetByName(T_ROSTER), b = pub.getSheetByName(T_BOARD);
  var f = pub.getSheetByName(T_FAME), rl = pub.getSheetByName(T_RULES);
  if (g) kaitse_(g, [g.getRange('C3')]);
  if (ro) kaitse_(ro, [ro.getRange(RR0, 2, N, 2), ro.getRange('D2')]);
  if (b) kaitse_(b, [b.getRange('C3:E3'), b.getRange('C4:E4')]);
  if (f) kaitse_(f, [f.getRange('B3')]);
  if (rl) kaitse_(rl, [rl.getRange('C3')]);
  kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) { kaitse_(m.sh, kuuAvatud_(m, t)); paevaReeglid_(m.sh); } });
}

// Kuu vahekaardil on lahti keelevalik, tase, paar ja päevad eilsest ülehomseni (öö ja päeva vahetus mahub sisse).
// Mida täpselt kirjutada saab (ainult täna ja eile), otsustab lahtri reegel.
function kuuAvatud_(m, t) {
  var open = [m.sh.getRange('C1')];                         // keelevalik
  if (t <= m.end + 1) open.push(m.sh.getRange(R0, 2, N, 2));
  var a = Math.max(m.start, t - 1), b = Math.min(m.end, t + 2);
  if (a <= b) open.push(m.sh.getRange(R0, FD + a - m.start, N, b - a + 1));
  return open;
}

function kaitse_(sh, open) {
  var p = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0] || sh.protect();
  p.setDescription('Kuu harjutus');
  p.setUnprotectedRanges(open);
  p.addEditor(Session.getEffectiveUser());
  p.removeEditors(p.getEditors());
  if (p.canDomainEdit()) p.setDomainEdit(false);
}

// ================================================================ plaan ja numbrid

// Plaani rida kuule y-m: [Algaja, Põhi, Pluss, Tipp, harjutus, exercise, ühik, unit, Algaja märkus ×2, Tipp märkus ×2]
function planRida_(plan, y, m) {
  var rows = plan.getRange(PL0, 1, PLN, 14).getValues();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i], s = toSerial_(r[1]);
    if (s === null) continue;
    var d = ymd_(s);
    if (d[0] !== y || d[1] !== m) continue;
    var ex = str_(r[2]), a = num_(r[4]), po = num_(r[5]), p = num_(r[6]), tp = num_(r[7]);
    if (!ex || !(a > 0) || !(po > 0) || !(p > 0) || !(tp > 0)) return null;
    var uEt = str_(r[8]) || 'kordust', uEn = str_(r[9]) || (/^sek/i.test(uEt) ? 'seconds' : 'reps');
    return [a, po, p, tp, ex, str_(r[3]) || ex, uEt, uEn, str_(r[10]), str_(r[11]) || str_(r[10]), str_(r[12]), str_(r[13]) || str_(r[12])];
  }
  return null;
}

// Numbrid postituste jaoks (vahekaardi „Kuuharjutus“ peidetud veerg U).
function statistika_(plan, pub, d0) {
  var d = ymd_(d0), p = eelmine_(d[0], d[1]);
  var c = kuuLeht_(pub, d[0], d[1]), e = kuuLeht_(pub, p[0], p[1]);
  var sc = c ? kuuNumbrid_(c.sh, true) : kuuNumbrid_(null), se = e ? kuuNumbrid_(e.sh) : kuuNumbrid_(null);
  plan.getRange('U6:U10').setValues([[sc.kokku], [sc.eesmark], [sc.inimesi], [sc.p80], [sc.p100]]);
  plan.getRange('U12:U19').setValues([[se.kokku], [se.eesmark], [se.inimesi], [se.p80], [se.nimed100.join(', ')],
    [se.kuningas], [se.tagasi.join(', ')], [Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy HH:mm')]]);
  var sk = d[2] <= 2 ? [d[0], d[1]] : jargmine_(d[0], d[1]);          // Start: 1.–2. selle kuu, muidu järgmine start
  var s1 = sk[1] === d[1] ? sc : (function (k) { return k ? kuuNumbrid_(k.sh) : kuuNumbrid_(null); })(kuuLeht_(pub, sk[0], sk[1]));
  plan.getRange('U21:U22').setValues([[s1.eesmark], [s1.inimesi]]);
  var varem = c && sc.taisPaev ? c.days - sc.taisPaev : 0, jaanud = c ? c.end - d0 + 1 : 0;   // Erik 27.10: eesmärk täis enne kuu lõppu
  plan.getRange('U23:U24').setValues(varem > 0 && jaanud > 0 ? [[varem], [jaanud]] : [[''], ['']]);
}

// kaib: kuu käib alles, siis loeb tempo (TÄITMINE), ka enne 10 arvestatud päeva (Erik 4.10: nädalakirjas oli 0 inimest 100% peal).
function kuuNumbrid_(sh, kaib) {
  var o = { kokku: 0, eesmark: 0, inimesi: 0, p80: 0, p100: 0, nimed100: [], kuningas: '', tagasi: [], taisPaev: 0 };
  if (!sh) return o;
  o.eesmark = Number(sh.getRange(16, AW).getValue()) || 0;
  var parim = 0, paevas = [];                                      // paevas[k]: grupi kokku kuu (k+1). päeval
  sh.getRange(R0, 1, N, 47).getValues().forEach(function (r) {      // A … AU
    var nimi = str_(r[0]);
    if (!nimi) return;
    for (var k = 0; k < 31; k++) if (typeof r[FD - 1 + k] === 'number') paevas[k] = (paevas[k] || 0) + r[FD - 1 + k];
    var pct = r[36], lisa = Number(r[38]) || 0, embleem = str_(r[40]) !== '';   // embleem: vähemalt 10 arvestatud päeva
    o.inimesi++;
    o.kokku += Number(r[37]) || 0;
    if (typeof pct === 'number' && (embleem || kaib)) {
      if (pct >= 0.8) o.p80++;
      if (pct >= 1) { o.p100++; o.nimed100.push(nimi); }
      if (r[46] === 1 && pct >= 0.8 && embleem) o.tagasi.push(nimi);
    }
    if (lisa > parim) { parim = lisa; o.kuningas = nimi; }
  });
  for (var k = 0, sum = 0; k < paevas.length && o.eesmark > 0; k++) {   // päev, mil ühine eesmärk sai täis (0 = pole täis)
    sum += paevas[k] || 0;
    if (sum >= o.eesmark) { o.taisPaev = k + 1; break; }
  }
  return o;
}

// ================================================================ e-kirjad

function meeldetuleta_(pub, plan, t, props, to) {
  var key = 'meeldetuletus:' + t;
  if (props.getProperty(key)) return;
  var d = ymd_(t), n = jargmine_(d[0], d[1]), p = eelmine_(d[0], d[1]), viimane = paevi_(d[0], d[1]), k = null, selle = false;
  if (d[2] <= 3 && !kuuLeht_(pub, d[0], d[1]) && kuuLeht_(pub, p[0], p[1])) { k = d; selle = true; }
  else if ((d[2] === 20 || d[2] === 25 || d[2] === viimane) && kuuLeht_(pub, d[0], d[1]) &&
           !kuuLeht_(pub, n[0], n[1]) && !planRida_(plan, n[0], n[1])) k = n;
  if (!k) return;
  var g = ET_G[k[1] - 1], G = g.charAt(0).toUpperCase() + g.slice(1);
  var tekst = G + ' harjutus on plaanis veel kirjutamata' + (selle ? ', seepärast pole ühises tabelis selle kuu vahekaarti ja osalejad ei saa kirja panna.' : '.') +
    '\n\nAva oma tabelis vahekaart „Kuuharjutus“ ja täida ' + g + ' real harjutus ja numbrid (tulbad C–H).' +
    (selle ? '\n\nSiis vali menüüst „Kuu harjutus → Loo uus kuu vahekaart kohe“.'
           : '\n\nUus kuu vahekaart tuleb ühisesse tabelisse järgmisel ööl ise. Kohe saad selle teha menüüst „Kuu harjutus → Loo uus kuu vahekaart kohe“.');
  kiri_({ to: to, subject: 'Kuu harjutus: kirjuta ' + g + ' harjutus plaani', body: tekst,
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">' + html_(tekst) + '</div>', name: 'Kuu harjutus' });
  props.setProperty(key, new Date().toISOString());
}

function saada_(to, nimi, et, en, proov, lisa) {
  var plokk = function (pealkiri, tekst, silt) {
    return '<h3 style="margin:22px 0 8px">' + pealkiri + '</h3>' +
      '<a href="https://wa.me/?text=' + encodeURIComponent(tekst) + '" style="display:inline-block;background:#25D366;color:#fff;' +
      'padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">📲 ' + silt + '</a>' +
      '<div style="white-space:pre-wrap;background:#F6F1EA;border-radius:8px;padding:12px;margin-top:10px">' + html_(tekst) + '</div>';
  };
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#2B241E;max-width:560px">' +
    '<p>Postitus <b>' + html_(nimi) + '</b> on valmis. Vajuta nupule, vali WhatsAppis grupp ja saada.</p>' +
    plokk('Eesti keeles', et, 'Ava WhatsAppis') + plokk('In English', en, 'Open in WhatsApp') +
    (lisa ? '<p style="margin-top:28px">Soovi korral saada pärast tulemusi ka see küsimus:</p>' + plokk('Küsimus', lisa[0], 'Ava WhatsAppis') +
      plokk('Question', lisa[1], 'Open in WhatsApp') : '') + '</div>';
  var body = 'Postitus "' + nimi + '" on valmis.\n\nEESTI KEELES\n' + et + '\n\nAva WhatsAppis: https://wa.me/?text=' + encodeURIComponent(et) +
    '\n\n\nIN ENGLISH\n' + en + '\n\nOpen in WhatsApp: https://wa.me/?text=' + encodeURIComponent(en) +
    (lisa ? '\n\n\nKÜSIMUS\n' + lisa[0] + '\n\n' + lisa[1] : '');
  kiri_({ to: to, subject: (proov ? 'PROOV · ' : '') + 'Kuu harjutus: ' + nimi, body: body, htmlBody: html, name: 'Kuu harjutus' });
}

function saaja_(plan) {
  return str_(plan.getRange(C_EMAIL).getValue()) || Session.getEffectiveUser().getEmail();
}

// ================================================================ keel

function keeleLahter_(sh) {
  var n = sh.getName();
  for (var i = 0; i < KEEL.length; i++) if (KEEL[i][0] === n) return KEEL[i][1];
  return kuuInfo_(sh) ? 'C1' : null;
}

// Keel on lahtris Juhend!C3 (sealt loevad kõik valemid); teiste vahekaartide keelelahtrid näitavad sama.
function keel_(pub, lang) {
  if ((lang !== 'Eesti' && lang !== 'English') || !(Number(props_().getProperty('PUB_VER:' + pub.getId())) >= 6)) return;
  var sea = function (sh, a1) { var r = sh.getRange(a1); if (r.getValue() !== lang) r.setValue(lang); };
  KEEL.forEach(function (k) { var sh = pub.getSheetByName(k[0]); if (sh) sea(sh, k[1]); });
  kuulehed_(pub).forEach(function (m) { sea(m.sh, 'C1'); });
}

function keeleSilt_(r, tume, joondus) {
  r.setValue(LANG_LABEL).setFontFamily('Roboto').setFontSize(8).setFontWeight('bold').setFontColor(tume ? '#D9CEC0' : '#6E655B')
    .setHorizontalAlignment(joondus || 'center').setVerticalAlignment('middle').setWrap(true);
  if (tume) r.setBackground('#2B241E');
}

function keeleValik_(r, lang, suurus) {
  r.setValue(lang).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Eesti', 'English'], true).setAllowInvalid(false).build())
    .setBackground('#F2E8DA').setFontFamily('Oswald').setFontSize(suurus).setFontWeight('bold').setFontColor('#8B6B47')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
}

// ================================================================ vanema ühise tabeli uuendamine

function uus_(pub) {
  return Number(props_().getProperty('PUB_VER:' + pub.getId())) >= PUB_VER;
}

// Muutunud tekstid (leitakse vana valemi või teksti järgi). Kiire: käib ka kohe uue koodi järel, enne pikka Seadistat (Erik 30.10).
function tekstid_(pub) {
  var lehed = {}, kuud = kuulehed_(pub).map(function (m) { return m.sh; });   // muutunud tekstid (leitakse vana valemi järgi)
  KH_PATCH.cells.forEach(function (c) { (lehed[c[0]] = lehed[c[0]] || []).push(c); });
  Object.keys(lehed).forEach(function (nimi) {
    var shs = nimi === '*kuu*' ? kuud : [pub.getSheetByName(nimi)].filter(Boolean);
    shs.forEach(function (sh) {
      var n = Math.min(sh.getMaxRows(), 120), nc = Math.min(sh.getMaxColumns(), 50);
      var f = sh.getRange(1, 1, n, nc).getFormulas(), v = sh.getRange(1, 1, n, nc).getValues();
      lehed[nimi].forEach(function (c) {
        var vana = c[1].replace(/\s+/g, ''), valem = c[1].charAt(0) === '=';
        for (var i = 0; i < n; i++) for (var j = 0; j < nc; j++) {
          var cur = valem ? f[i][j] : (f[i][j] ? '' : String(v[i][j]));
          if (!cur || cur.replace(/\s+/g, '') !== vana) continue;
          var cell = sh.getRange(i + 1, j + 1);
          if (String(c[2]).charAt(0) === '=') cell.setFormula(c[2]); else cell.setValue(c[2]);
          f[i][j] = valem ? c[2] : ''; v[i][j] = c[2];
          if (c[3]) { sh.setRowHeight(i + 1, Math.round(c[3])); cell.setWrap(true); }
        }
      });
    });
  });
}

// v5 → v6: keelevalik igale vahekaardile, „Eemalda“, uued tekstid, uus reeglite vahekaart. Kirjed jäävad alles.
function uuenda_(pub) {
  var ver = Number(props_().getProperty('PUB_VER:' + pub.getId())) || 5;
  var g = pub.getSheetByName(T_GUIDE), lang = g && str_(g.getRange('C3').getValue()) === 'English' ? 'English' : 'Eesti';
  KUUD_ = null;
  var vead = [];
  var proovi = function (nimi, fn) {                             // üks ebaõnnestunud samm ei peata ülejäänut
    try { fn(); } catch (err) { vead.push(nimi + ': ' + (err && err.message ? err.message : err)); }
  };

  proovi('read', function () { laienda_(pub); viitedLaiendus_(pub); });
  proovi('tekstid', function () { tekstid_(pub); });
  if (ver < 6) uuenda6_(pub, g, lang);

  var ajutine = null;
  proovi('mall', function () { ajutine = impordi_(PUB_NAME + ' (ajutine)', null); });   // uusim kujundus, ilma kirjeteta
  if (ajutine) {
    try {
      proovi('reeglid ja juhend', function () {
        var uusR = ajutine.getSheetByName(T_RULES).copyTo(pub), vanaR = pub.getSheetByName(T_RULES);
        var koht = vanaR ? vanaR.getIndex() : pub.getSheets().length;
        if (vanaR) pub.deleteSheet(vanaR);
        uusR.setName(T_RULES);
        uusR.getRange('C3').setValue(lang);
        pub.setActiveSheet(uusR);
        pub.moveActiveSheet(koht);
        juhend_(pub, ajutine.getSheetByName(T_GUIDE), lang);
      });
      proovi('kuu vahekaardid', function () {
        var mall = ajutine.getSheets().filter(function (x) { return kuuInfo_(x); })[0];
        KUUD_ = null;
        kuulehed_(pub, true).forEach(function (m) { if (!m.frozen) kuuMall_(m.sh, mall); });
      });
      proovi('ülevaade', function () { valemid_(ajutine.getSheetByName(T_BOARD), pub.getSheetByName(T_BOARD)); });
      proovi('edetabel', function () { edetabel_(pub, ajutine.getSheetByName(T_BOARD)); });
      proovi('loosivõitjad', function () { voitjadVaade_(pub, true); });   // edetabel_ tühjendas ka selle ala
      proovi('autahvli valemid', function () {
        var mf = ajutine.getSheetByName(T_FAME), f = pub.getSheetByName(T_FAME);
        if (!mf || !f) return;
        var r1 = mf.getRange(FAME0, 2, 1, 8).getFormulasR1C1()[0];
        f.getRange(FAME0, 2, FAMEN, 8).setFormulasR1C1(Array.apply(null, Array(FAMEN)).map(function () { return r1; }));
      });
    } finally { DriveApp.getFileById(ajutine.getId()).setTrashed(true); }
  }

  if (ver < 7) proovi('värvid', function () { varvid_(pub); });
  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) proovi('nimekiri', function () { nimekirjaVormid_(ro); });
  proovi('autahvel', function () { autahvel_(pub); });
  proovi('päised', function () {
    [T_ROSTER, T_BOARD, T_FAME].forEach(function (n) {           // telefonis lõikas külmutatud ala kõrge päise pooleks
      var sh = pub.getSheetByName(n);
      if (sh && sh.getFrozenRows()) sh.setFrozenRows(0);
    });
  });

  KUUD_ = null;
  if (!vead.length) props_().setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
  return vead;
}

// Käimasolev kuu vahekaart saab uusima kujunduse: rea valemid, uued tulbad (AX järjest, AY koht), päised, värvid,
// tingimusvormingud, lahtri reeglid ja nimede lingid. Kirjed (A–AH) ja seaded (AV:AW) jäävad puutumata.
function kuuMall_(sh, mall) {
  if (!mall) return;
  if (sh.getMaxColumns() < KUU_TULPI) sh.insertColumnsAfter(sh.getMaxColumns(), KUU_TULPI - sh.getMaxColumns());
  sh.showColumns(SEERIA, 2);
  var o = kuuKohti_(sh);
  if (o !== N) return;                                       // vana suurus: laienda_ teeb enne ära
  [[35, 13], [SEERIA, 2]].forEach(function (p) {             // AI:AU ja AX:AY (AV:AW on seaded)
    var r1 = mall.getRange(R0, p[0], 1, p[1]).getFormulasR1C1()[0];
    sh.getRange(R0, p[0], N, p[1]).setFormulasR1C1(Array.apply(null, Array(N)).map(function () { return r1; }));
    var nf = mall.getRange(R0, p[0], 1, p[1]).getNumberFormats()[0];   // 1.10: LISA „+33%“ (vanal vahekaardil oli vorminguta 0,3333)
    sh.getRange(R0, p[0], N, p[1]).setNumberFormats(Array.apply(null, Array(N)).map(function () { return nf; }));
    var pea = mall.getRange(2, p[0], 2, p[1]), pf = pea.getFormulas(), pv = pea.getValues();
    sh.getRange(2, p[0], 2, p[1]).setValues(pf.map(function (r, i) { return r.map(function (x, j) { return x || txt_(pv[i][j]); }); }));
  });
  var jalus = mall.getRange(R0 + N + 1, FD, 1, 31).getFormulasR1C1();   // „✓ eesmärk täis“ päevade kaupa (30.10: eripäeval loeb iga tulemus)
  if (jalus[0][0]) sh.getRange(R0 + N + 1, FD, 1, 31).setFormulasR1C1(jalus);
  var viimane = R0 + N + 2, ala = mall.getRange(1, 1, viimane, KUU_TULPI), siht = sh.getRange(1, 1, viimane, KUU_TULPI);
  siht.setBackgrounds(ala.getBackgrounds());
  siht.setFontColors(ala.getFontColors());
  // Päise päevade rida (2) ja nädalapäevade rida (3) on alati samad; „täna“ kuldseks teeb ainult tingimusvorming.
  // Varasem Seadista võis eilse kulla lahtrisse kinni jätta, siis oli kuldne kaks päeva (Erik 3.10).
  sh.getRange(2, FD, 1, 31).setBackground('#2B241E').setFontColor('#FFFFFF');
  sh.getRange(3, FD, 1, 31).setBackground('#F6F1EA').setFontColor('#6E655B');
  var uusAla = sh.getRange(1, SEERIA, viimane, 2), mAla = mall.getRange(1, SEERIA, viimane, 2);
  uusAla.setFontWeights(mAla.getFontWeights()).setFontSizes(mAla.getFontSizes()).setHorizontalAlignments(mAla.getHorizontalAlignments())
    .setVerticalAlignments(mAla.getVerticalAlignments()).setNumberFormats(mAla.getNumberFormats());
  sh.getRange(R0, SEERIA, N, 2).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
  [1, SEERIA, KOHT, 35, 36, 37, 38, 39, 40, 41].forEach(function (c) { sh.setColumnWidth(c, mall.getColumnWidth(c)); });
  sh.setRowHeight(3, mall.getRowHeight(3));                  // 1.10: rea 3 vihjed (ühik, „üle eesmärgi“) mahuvad ära
  var r3 = mall.getRange(3, 1, 1, KUU_TULPI);
  sh.getRange(3, 1, 1, KUU_TULPI).setWraps(r3.getWraps()).setVerticalAlignments(r3.getVerticalAlignments());
  var gf = mall.getRange(16, AW).getFormula(), gc = sh.getRange(16, AW);   // ühine eesmärk: 1.10 iga inimese oma taseme eesmärk
  if (gf && gc.getFormula() && gc.getFormula() !== gf) gc.setFormula(gf);
  sh.setRowHeights(R0, N, mall.getRowHeight(R0));
  sh.setConditionalFormatRules(mall.getConditionalFormatRules().map(function (rule) {
    return rule.copy().setRanges(rule.getRanges().map(function (g) { return sh.getRange(g.getA1Notation()); })).build();
  }));
  paevaReeglid_(sh);
  sh.getRange(4, FD, 1, 31).clearDataValidations();          // 2x tuleb ainult plaanist
  sh.getRange(R0, 1, N, 1).setNumberFormats(Array.apply(null, Array(N)).map(function (x, k) { return ['"' + (k + 1) + '. "@']; }));   // järjekorranumber nime ees, nimi ise jääb samaks
  nimed_(sh);
}

// Nimede valemid (ka vanad, ilma lingita) uueks: nimi viib sama rea tänasele päevale.
function nimed_(sh) {
  var a = sh.getRange(R0, 1, N, 1), af = a.getFormulas(), av = a.getValues();
  if (af.every(function (r, k) { return !r[0] || r[0] === nimeValem_(sh, R0 + k); })) return;
  a.setValues(af.map(function (r, k) { return [r[0] ? nimeValem_(sh, R0 + k) : txt_(av[k][0])]; }));
}

// Mallis muutunud valemid (ainult lahtritesse, kus on praegu ka valem).
function valemid_(mall, sh) {
  if (!mall || !sh) return;
  var nr = Math.min(mall.getMaxRows(), sh.getMaxRows(), 80), nc = Math.min(mall.getMaxColumns(), sh.getMaxColumns(), 30);
  var mf = mall.getRange(1, 1, nr, nc).getFormulas(), ala = sh.getRange(1, 1, nr, nc), f = ala.getFormulas();
  for (var i = 0; i < nr; i++) for (var j = 0; j < nc; j++) {
    if (mf[i][j] && f[i][j] && mf[i][j] !== f[i][j]) ala.getCell(i + 1, j + 1).setFormula(mf[i][j].split("'" + mall.getName() + "'!").join("'" + sh.getName() + "'!"));
  }
}

// Edetabel (Erik 1.10): kõik osalejad (varem 20 esimest), võrdsed jagavad kohta, nimed ilma kuulehe järjekorranumbrita.
// Tõstab malli ülevaatest edetabeli ploki (pealkirjast alates) koos vormingu ja triibureeglitega üle.
function edetabel_(pub, mall) {
  var b = pub.getSheetByName(T_BOARD), r = KH_PATCH.board_rows;
  if (!b || !mall || !r) return;
  var n = r[1] - r[0] + 1, nc = 11;
  if (b.getMaxRows() < r[1]) b.insertRowsAfter(b.getMaxRows(), r[1] - b.getMaxRows());
  var uus = mall.copyTo(pub);
  try {
    var koht = b.getRange(r[0], 1, n, nc);
    b.getRange(r[0], 1, n, 12).breakApart();                 // fortuuna pealkiri on ühendatud G:L (30.10)
    koht.breakApart(); koht.clear();
    uus.getRange(r[0], 1, n, nc).copyTo(koht);
    viited_(koht, uus.getName(), b.getName());
    for (var i = r[0]; i <= r[1]; i++) b.setRowHeight(i, uus.getRowHeight(i));
  } finally { pub.deleteSheet(uus); }
  var reeglid = b.getConditionalFormatRules();                  // edetabeli vanad reeglid välja, malli omad asemele (mitte iga Seadistaga juurde)
  var mallR = mall.getConditionalFormatRules().filter(function (x) { return x.getRanges().some(function (g) { return g.getRow() >= r[0]; }); });
  if (mallR.length) b.setConditionalFormatRules(reeglid.filter(function (x) { return !x.getRanges().some(function (g) { return g.getRow() >= r[0] && g.getRow() <= r[1] && g.getColumn() <= 5; }); })
    .concat(mallR.map(function (x) { return x.copy().setRanges(x.getRanges().map(function (g) { return b.getRange(g.getA1Notation()); })).build(); })));
}

// Autahvel: iga nimi omal real (varem komadega ühes reas, paljud nimed ei mahtunud).
function autahvel_(pub) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var ala = f.getRange(FAME0, 1, FAMEN, FAME_WIN), fm = ala.getFormulas(), v = ala.getValues();
  for (var i = 0; i < FAMEN; i++) for (var j = 0; j < FAME_WIN; j++) {
    var x = fm[i][j];
    if (x && x.indexOf('TEXTJOIN(", ",') >= 0) ala.getCell(i + 1, j + 1).setFormula(x.split('TEXTJOIN(", ",').join('TEXTJOIN(CHAR(10),'));
    else if (!x && j === FAME_WIN - 1 && String(v[i][j]).indexOf(',') >= 0) ala.getCell(i + 1, j + 1).setValue(String(v[i][j]).split(/\s*,\s*/).join('\n'));
  }
  ala.setWrap(true);
  autahvliKorgus_(f);
}

// Autahvli all kõigi aegade tabel lõppenud kuudest: läbitud kuud (embleem), tehtud päevad, osaletud kuud.
var KA0 = 43;
function koigiAegade_(pub) {
  var f = pub.getSheetByName(T_FAME);
  if (!f) return;
  var koos = {};
  kuulehed_(pub).forEach(function (m) {
    if (!m.frozen) return;
    m.sh.getRange(R0, 1, N, 41).getValues().forEach(function (r) {
      var nimi = str_(r[0]);
      if (!nimi || nimi === EKS) return;
      var x = koos[nimi] = koos[nimi] || [nimi, 0, 0, 0];
      if (str_(r[40]) !== '') x[1]++;
      x[2] += Number(r[35]) || 0;
      x[3]++;
    });
  });
  var read = Object.keys(koos).map(function (k) { return koos[k]; });
  read.sort(function (a, b) { return b[1] - a[1] || b[2] - a[2] || b[3] - a[3] || (a[0] < b[0] ? -1 : 1); });
  var vaja = KA0 + 2 + Math.max(read.length, 1) + 1;
  if (f.getMaxRows() < vaja) f.insertRowsAfter(f.getMaxRows(), vaja - f.getMaxRows());
  var vanad = f.getMaxRows() - KA0 + 1;
  f.getRange(KA0, 1, vanad, 5).breakApart().clearContent().setBackground(null);
  var L = "'" + T_GUIDE + "'!$C$3=\"English\"";
  var tx = function (et, en) { return '=IF(' + L + ',"' + en + '","' + et + '")'; };
  f.getRange(KA0, 1, 1, 5).merge();
  f.getRange(KA0, 1).setFormula(tx('KÕIGI AEGADE TABEL · lõppenud kuud', 'ALL-TIME TABLE · finished months'))
    .setFontFamily('Oswald').setFontSize(13).setFontWeight('bold').setFontColor('#8B6B47').setVerticalAlignment('bottom').setHorizontalAlignment('left');
  f.setRowHeight(KA0, 34);
  f.getRange(KA0 + 1, 1, 1, 5).setFormulas([[tx('#', '#'), tx('NIMI', 'NAME'), tx('KUID LÄBITUD', 'MONTHS FINISHED'),
    tx('TEHTUD PÄEVI', 'DAYS DONE'), tx('KUID OSALENUD', 'MONTHS IN')]])
    .setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  f.setRowHeight(KA0 + 1, 30);
  if (!read.length) {
    f.getRange(KA0 + 2, 1, 1, 5).merge();
    f.getRange(KA0 + 2, 1).setFormula(tx('Täitub, kui esimene kuu on läbi.', 'Fills in when the first month ends.')).setFontColor('#6E655B').setFontWeight('normal');
    return;
  }
  var ala = f.getRange(KA0 + 2, 1, read.length, 5);
  ala.setValues(read.map(function (r, i) { return [i + 1, txt_(r[0]), r[1], r[2], r[3]]; }))
    .setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment('center').setNumberFormat('0');
  f.getRange(KA0 + 2, 2, read.length, 1).setHorizontalAlignment('left').setFontWeight('bold');
  f.getRange(KA0 + 2, 1, read.length, 5).setBackgrounds(read.map(function (r, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return [c, c, c, c, c]; }));
  f.setRowHeights(KA0 + 2, read.length, 22);
}

// Rea kõrgus nimede arvu järgi (autoResizeRows andis Google'is „tundmatu vea“).
function autahvliKorgus_(f) {
  var v = f.getRange(FAME0, 1, FAMEN, FAME_WIN).getDisplayValues();
  for (var i = 0; i < FAMEN; i++) {
    var read = 1;
    v[i].forEach(function (x) { read = Math.max(read, String(x).split('\n').length); });
    var h = Math.max(30, read * 16 + 10);
    if (f.getRowHeight(FAME0 + i) !== h) f.setRowHeight(FAME0 + i, h);
  }
}

// Nimekirja värvid ja nimelahtri reegel alati puhtaks: igaüks üks kord, kogu nimede alal, ilma käsitsi jäänud taustadeta.
function nimekirjaVormid_(ro) {
  var ala = ro.getRange(RR0, 1, N, 4), liik = {}, muud = [];
  ro.getConditionalFormatRules().forEach(function (rule) {
    var b = rule.getBooleanCondition(), f = b ? String((b.getCriteriaValues() || [''])[0]) : '';
    var k = f === '=' + KH_PATCH.roster_a2_rule ? '' :
      f.indexOf(REMOVE) >= 0 ? 'eemalda' : /\$C\d+="Paus/.test(f) ? 'paus' : /\$B\d+=""/.test(f) ? 'esimene' : '';
    if (!k) { muud.push(rule); return; }
    if (liik[k]) return;                                       // topelt või tükeldatud koopia: jääb ära
    var valem = k === 'eemalda' ? KH_PATCH.remove_rule : k === 'esimene' ? KH_PATCH.first_rule : '$C' + RR0 + '="' + PAUSE + '"';
    liik[k] = rule.copy().whenFormulaSatisfied('=' + valem).setRanges([ala]).build();
  });
  ro.setConditionalFormatRules(['eemalda', 'esimene', 'paus'].filter(function (k) { return liik[k]; })
    .map(function (k) { return liik[k]; }).concat(muud));
  ala.setBackground(null);
  ro.setColumnWidth(3, 190);                                 // olek mahub ära ka „Kinnitan eemaldamise · Confirm removal“
  ro.getRange(RR0, 3, N, 1).setHorizontalAlignment('left');
  ro.getRange(RR0, 2, N, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=AND(COUNTIF($B$' + RR0 + ':$B$' + (RR0 + N - 1) + ',B' + RR0 + ')<=1,B' + (RR0 - 1) + '<>"")')   // ülemine rida peab olema täidetud
    .setAllowInvalid(false).setHelpText(KH_PATCH.name_help).build());
}

// v6: keelevalik igal vahekaardil, Eemalda nimekirjas.
function uuenda6_(pub, g, lang) {
  if (g) { g.getRange('B3').setFontSize(8).setWrap(true); }

  var ro = pub.getSheetByName(T_ROSTER);
  if (ro) {
    ro.getRange('A1:D1').breakApart(); ro.getRange('A2:D2').breakApart();
    ro.getRange('A1:C1').merge(); ro.getRange('A2:C2').merge();
    keeleSilt_(ro.getRange('D1'), true);
    keeleValik_(ro.getRange('D2'), lang, 12);
    ro.getRange(RR0, 3, N, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(KH_PATCH.status, true)
      .setAllowInvalid(false).setHelpText(KH_PATCH.status_help).build());
    var cf = ro.getConditionalFormatRules();
    cf.unshift(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=' + KH_PATCH.remove_rule)
      .setBackground('#FDE2E1').setFontColor('#B42318').setBold(true).setRanges([ro.getRange(RR0, 1, N, 4)]).build());
    cf.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=' + KH_PATCH.roster_a2_rule)
      .setBackground('#FDE2E1').setFontColor('#8A1C12').setBold(true).setRanges([ro.getRange('A2')]).build());
    ro.setConditionalFormatRules(cf);
  }

  kuulehed_(pub).forEach(function (m) {                     // rida 1: B silt, C keel, D:AO pealkiri
    var sh = m.sh, f = sh.getRange('B1').getFormula();
    sh.getRange(1, 2, 1, 40).breakApart();
    sh.getRange(1, 4, 1, 38).merge();
    if (f) sh.getRange('D1').setFormula(f);
    sh.getRange('D1').setFontFamily('Roboto').setFontSize(10).setFontWeight('bold').setFontColor('#FFFFFF')
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    keeleSilt_(sh.getRange('B1'), true);
    keeleValik_(sh.getRange('C1'), lang, 11);
  });

  var b = pub.getSheetByName(T_BOARD);
  if (b) {
    b.getRange('A3:B3').merge(); b.getRange('C3:E3').merge();
    keeleSilt_(b.getRange('A3'), false, 'right');
    keeleValik_(b.getRange('C3'), lang, 12);
    b.setRowHeight(3, 30);
  }
  var f = pub.getSheetByName(T_FAME);
  if (f) {
    keeleSilt_(f.getRange('A3'), false, 'right');
    keeleValik_(f.getRange('B3'), lang, 12);
    f.setRowHeight(3, 28);
  }
}

// v7: sinised ja hallid toonid Üksuse beežide vastu (taust, tekst, tingimusvormingud, vahekaardi sakid).
// Juhend tuleb iga kord uus: tekstid, ridade kõrgused, värvid ja jooned. Vahekaart ise jääb alles,
// sest teised vahekaardid võtavad keele selle lahtrist C3.
function juhend_(pub, mall, lang) {
  var g = pub.getSheetByName(T_GUIDE);
  if (!g || !mall) return;
  var uus = mall.copyTo(pub);
  try {
    var nr = Math.min(uus.getMaxRows(), uus.getLastRow() + 3), nc = Math.min(uus.getMaxColumns(), Math.max(uus.getLastColumn(), 3) + 1);
    if (g.getMaxRows() < nr) g.insertRowsAfter(g.getMaxRows(), nr - g.getMaxRows());
    if (g.getMaxColumns() < nc) g.insertColumnsAfter(g.getMaxColumns(), nc - g.getMaxColumns());
    var koht = g.getRange(1, 1, Math.max(nr, g.getLastRow()), Math.max(nc, g.getLastColumn()));
    koht.breakApart(); koht.clearDataValidations(); koht.clear();
    uus.getRange(1, 1, nr, nc).copyTo(g.getRange(1, 1, nr, nc));
    viited_(g.getRange(1, 1, nr, nc), uus.getName(), g.getName());
    for (var r = 1; r <= nr; r++) g.setRowHeight(r, uus.getRowHeight(r));
    for (var c = 1; c <= nc; c++) g.setColumnWidth(c, uus.getColumnWidth(c));
    g.getRange('C3').setValue(lang);
    if (uus.getTabColor()) g.setTabColor(uus.getTabColor());
  } finally { pub.deleteSheet(uus); }
}

// Ajutise koopia valemid viitavad koopia nimele; suuna need päris vahekaardile.
function viited_(ala, vana, uus) {
  var q = function (n) { return "'" + n.replace(/'/g, "''") + "'!"; };
  var f = ala.getFormulas();
  for (var i = 0; i < f.length; i++) for (var j = 0; j < f[i].length; j++) {
    var x = f[i][j];
    if (!x) continue;
    var y = x.split(q(vana)).join(q(uus));
    if (/^[A-Za-z0-9_]+$/.test(vana)) y = y.split(vana + '!').join(q(uus));
    if (y !== x) ala.getCell(i + 1, j + 1).setFormula(y);
  }
}

function varvid_(pub) {
  var P = {};
  Object.keys(KH_PATCH.palette || {}).forEach(function (k) { P['#' + k.toLowerCase()] = '#' + KH_PATCH.palette[k]; });
  var uus = function (c) { var x = c ? P[String(c).toLowerCase()] : null; return x || null; };
  pub.getSheets().forEach(function (sh) {
    var nr = sh.getMaxRows(), nc = sh.getMaxColumns();
    if (!nr || !nc) return;
    var rng = sh.getRange(1, 1, nr, nc), muut = false;
    var bg = rng.getBackgrounds().map(function (r) { return r.map(function (c) { var x = uus(c); if (x) { muut = true; return x; } return c; }); });
    if (muut) rng.setBackgrounds(bg);
    muut = false;
    var fc = rng.getFontColors().map(function (r) { return r.map(function (c) { var x = uus(c); if (x) { muut = true; return x; } return c; }); });
    if (muut) rng.setFontColors(fc);
    var cf = sh.getConditionalFormatRules(), cfm = false;
    cf = cf.map(function (rule) {
      var b = rule.getBooleanCondition();
      if (!b) return rule;
      var nb = uus(b.getBackground()), nf = uus(b.getFontColor());
      if (!nb && !nf) return rule;
      cfm = true;
      var bld = rule.copy();
      if (nb) bld.setBackground(nb);
      if (nf) bld.setFontColor(nf);
      return bld.build();
    });
    if (cfm) sh.setConditionalFormatRules(cf);
    var tab = uus(sh.getTabColor());
    if (tab) sh.setTabColor(tab);
  });
}


// ================================================================ loos

// Plaanilehe linnukesed (töötavad ka telefonis): D32 loos, D33 uus kuu vahekaart, D34 proov e-postiga.
// Tulp O (2x päevad) jõuab kohe kuu vahekaardile.
function plaaniMuudatus(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (!onPlaan_(sh)) return;
  var o = e.range.getColumn() <= PL_2X && e.range.getLastColumn() >= PL_2X && e.range.getRow() < PL0 + PLN && e.range.getLastRow() >= PL0;
  grupiga_(sh, function () { plaaniMuudatus1_(e, sh); });
  if (o && !grupiNimi_(sh)) grupid_(sh.getParent()).forEach(function (g) {   // teiste gruppide plaan võtab 2x päevad siit
    if (g && grupiNimi_(g)) grupiga_(g, function () { topeltElus_(g); });
  });
}

// Grupi elavate kuude 2x-rida plaani järgi. Tagastab kuud kujul {'2026-10': m}.
function topeltElus_(plan) {
  var pub = avalik_(), t = tana_(), elus = {};
  if (pub) kuulehed_(pub, true).forEach(function (m) {
    if (m.frozen || t > m.end) return;
    var d = ymd_(m.start);
    topeltKuusse_(m, topelt_(plan, d[0], d[1]));
    elus[d[0] + '-' + d[1]] = m;
  });
  return elus;
}

function plaaniMuudatus1_(e, sh) {
  var a1 = e.range.getA1Notation(), row = e.range.getRow();
  if (e.range.getColumn() <= PL_2X && e.range.getLastColumn() >= PL_2X && row < PL0 + PLN && e.range.getLastRow() >= PL0) {
    var elus = topeltElus_(sh);
    var r0 = Math.max(PL0, row), r1 = Math.min(PL0 + PLN - 1, e.range.getLastRow());
    for (var r = r0; r <= r1; r++) {
      var lahter = sh.getRange(r, PL_2X), s0 = toSerial_(sh.getRange(r, 2).getValue());
      if (s0 === null) continue;
      var d0 = ymd_(s0), p = topelt_(sh, d0[0], d0[1]), m0 = elus[d0[0] + '-' + d0[1]], kuu = ET_M[d0[1] - 1].toLowerCase();
      var mark = str_(lahter.getDisplayValue()) && !p.length ? 'Ei leidnud päevi. Kirjuta päevade numbrid komaga, näiteks 7, 21.'
        : (p.length ? 'Topeltpäevad on ' + p.map(function (x) { return x + '.'; }).join(', ').replace(/, (\d+\.)$/, ' ja $1') + ' ' + kuu + '. ' : 'Sel kuul topeltpäevi pole. ') +
          (m0 ? 'Kuu vahekaardil on see nüüd nii.' : 'Kuu vahekaardile lähevad need, kui see tehakse.');
      lahter.setNote(mark + ' (' + Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm') + ')');
    }
    return;
  }
  var nupp = { }; nupp[C_LOOS] = C_LOOS_TULEMUS; nupp[C_KUU] = C_KUU_TULEMUS; nupp[C_PROOV] = C_PROOV_TULEMUS;
  if (!nupp[a1] || e.range.getValue() !== true) return;
  var tekst;
  try {
    tekst = a1 === C_LOOS ? loosi_(sh).tekst : a1 === C_KUU ? looKuuKohe_().tekst : saadaProov_(sh).tekst;
  } catch (err) { tekst = 'Ei õnnestunud: ' + (err && err.message ? err.message : err); }
  sh.getRange(nupp[a1]).setValue(txt_(tekst));
  e.range.setValue(false);
}

// Menüüst: sama loos, tulemus aknas.
function loosiMenuust() {
  var plan = plaan_(), r = loosi_(plan);
  if (plan) plan.getRange(C_LOOS_TULEMUS).setValue(txt_(r.tekst));
  SpreadsheetApp.getUi().alert('Loos', r.tekst, SpreadsheetApp.getUi().ButtonSet.OK);
}

// Erik 29.10: auhinnad ja nende arv on iga grupi plaani vahekaardil (tulbad V–X), võitjate arv tuleb sealt (C32 enam pole).
// Põhigrupi vahekaardil on ainult põhigrupi auhinnad, Swedi vahekaardil ainult Swedi omad.
var AUH_VEERG = 22, AUH0 = PL0, AUHN = 20;                    // V3:X22: auhind eesti k, inglise k, mitu
var AUH_PAIS = ['Auhind (eesti k)', 'Prize (inglise k)', 'Mitu loosime'];
var AUH_VAIKIMISI = {
  '': [['Üksuse kinkekaart 15€', 'Üksus gift card €15', 1], ['Üksuse kinkekaart 10€', 'Üksus gift card €10', 1],
       ['Üksuse kinkekaart 5€', 'Üksus gift card €5', 5], ['Kohviku kinkekaart „kuum jook“', 'Café gift card “hot drink”', 3]],
  'swed': [['Üksuse kinkekaart 15€', 'Üksus gift card €15', 1], ['Üksuse kinkekaart 10€', 'Üksus gift card €10', 1],
           ['Üksuse kinkekaart 5€', 'Üksus gift card €5', 1], ['Kohviku kinkekaart „kuum jook“', 'Café gift card “hot drink”', 2]]
};
var AUH_JUHIS = 'Kirjuta siia selle grupi auhinnad ja mitu tükki igat loosime. Linnuke D32 loosib nii mitu võitjat, kui palju auhindu siin kokku on. ' +
  'Iga võitja saab ühe auhinna ja selle, kumma, otsustab loos: piletite arv mõjutab ainult võiduvõimalust, mitte auhinda. Tühi rida või 0 tähendab, et seda auhinda ei loosita. ' +
  'Inglise keeles nimi pole kohustuslik, tühja lahtri asemel näidatakse eestikeelset.';
var LOOS_JUHIS = 'Uue kuu esimeses trennis tee lahtrisse D32 linnuke (käib ka telefonis). Tabel loosib lõppenud kuu piletite järgi välja kõik auhinnad paremal asuvast tabelist ' +
  '„Auhinnad“ (tulbad V–X) ja kirjutab võitjad ühise tabeli vahekaartidele „Ülevaade“ ja „Autahvel“. Üks inimene võidab kuus ühe auhinna, sina loosis ei osale.';
var LOOS_KASITSI = '7. Sinu käsitsi töö: kuu esimeses trennis õpeta tehnikat ja tee lahtrisse D32 linnuke: tabel loosib lõppenud kuu piletite järgi välja auhinnad tabelist „Auhinnad“ (tulbad V–X) ' +
  'ja kirjutab võitjad vahekaartidele „Ülevaade“ ja „Autahvel“. Piletid on kuu vahekaardi tulbas PILETID. Topeltpäevad kirjuta plaani tulpa O. Kui keegi lõpetab, vali tema real Nimekirjas „Paus“: ' +
  'uuel kuul teda enam pole. Kui ta tahab oma nime ja tulemused päriselt ära, vali „Eemalda“ ja siis „Kinnitan eemaldamise“. Ühise tabeli omanik oled sina, nii et kõiki lukustatud lahtreid saad vajadusel ise parandada.';

// Plaani vahekaardile auhindade tabel (kui seda veel pole) ja loosi juhised ilma võitjate arvuta. Käib Seadistas ja öösel.
function auhinnad_(plan) {
  if (!plan) return false;
  var c32 = plan.getRange(C_LOOS_ARV);
  if (c32.getDataValidation() || str_(c32.getValue())) { c32.setDataValidation(null); c32.setValue(''); }
  var juhis = plan.getRange(32, 9);
  if (str_(juhis.getValue()) !== LOOS_JUHIS) juhis.setValue(LOOS_JUHIS);
  var desc = plan.getMaxRows() > 42 ? plan.getRange(42, 1, Math.min(15, plan.getMaxRows() - 41), 1).getValues() : [];
  for (var i = 0; i < desc.length; i++) {
    var s = str_(desc[i][0]);
    if (/^7\. Sinu käsitsi töö/.test(s) && s !== LOOS_KASITSI) plan.getRange(42 + i, 1).setValue(LOOS_KASITSI);
  }
  if (plan.getMaxColumns() < AUH_VEERG + 3) plan.insertColumnsAfter(plan.getMaxColumns(), AUH_VEERG + 3 - plan.getMaxColumns());
  if (str_(plan.getRange(PL0 - 1, AUH_VEERG).getValue()) === AUH_PAIS[0]) return false;
  var kavand = plan.getRange('P2');                                   // Eriku enda visand (29.10) tulpades P–R
  if (/auhinn/i.test(str_(kavand.getValue()))) {
    var v = plan.getRange('P2:S30'); v.breakApart(); v.clear();
    plan.setColumnWidth(16, 12); plan.setColumnWidth(17, 12);
  }
  var vaik = AUH_VAIKIMISI[grupiNimi_(plan).toLowerCase()] || AUH_VAIKIMISI[''];
  var V = AUH_VEERG, ala = plan.getRange(AUH0, V, AUHN, 3);
  ala.breakApart(); ala.clear();
  plan.getRange(1, V, 1, 3).merge();
  plan.getRange(1, V).setValue('AUHINNAD').setFontFamily('Oswald').setFontSize(12).setFontWeight('bold').setFontColor('#8B6B47').setVerticalAlignment('middle');
  plan.getRange(PL0 - 1, V, 1, 3).setValues([AUH_PAIS]).setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(9).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  var read = [];
  for (var k = 0; k < AUHN; k++) read.push(vaik[k] ? vaik[k].map(txt_) : ['', '', '']);
  ala.setValues(read).setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setWrap(true)
    .setBackgrounds(read.map(function (r, k) { var c = k % 2 ? '#FBF8F3' : '#FFFFFF'; return [c, c, c]; }));
  plan.getRange(AUH0, V, AUHN, 1).setFontWeight('bold');
  plan.getRange(AUH0, V + 2, AUHN, 1).setHorizontalAlignment('center').setFontColor('#8B6B47').setFontWeight('bold').setNumberFormat('0')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(0, 50).setAllowInvalid(false).setHelpText('Mitu tükki seda auhinda loosime (0–50).').build());
  plan.getRange(AUH0, V, AUHN, 3).setBorder(null, null, true, null, null, true, '#E6DED3', SpreadsheetApp.BorderStyle.SOLID);
  plan.getRange(PL0 - 1, V).setNote(AUH_JUHIS);
  plan.getRange(AUH0 + AUHN, V, 4, 3).merge();
  plan.getRange(AUH0 + AUHN, V).setValue(AUH_JUHIS).setFontSize(9).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('top');
  plan.setColumnWidth(V, 200); plan.setColumnWidth(V + 1, 170); plan.setColumnWidth(V + 2, 80);
  return true;
}

// Auhinnad plaani järjekorras: [{et, en, n}]. Tühjad read ja 0 jäävad välja.
function auhinnaLoend_(plan) {
  if (!plan || plan.getMaxColumns() < AUH_VEERG + 2 || str_(plan.getRange(PL0 - 1, AUH_VEERG).getValue()) !== AUH_PAIS[0]) return [];
  return plan.getRange(AUH0, AUH_VEERG, AUHN, 3).getValues().map(function (r) {
    return { et: str_(r[0]), en: str_(r[1]) || str_(r[0]), n: Math.floor(Number(r[2]) || 0) };
  }).filter(function (a) { return a.et && a.n > 0; });
}

// Viimane loos (igal grupil oma): { kuu: '2026-10', aeg: '3.11.2026', voitjad: [{ nimi, p, et, en }] }.
function loosOlek_() {
  try { var o = JSON.parse(props_().getProperty('LOOS') || 'null'); return o && o.kuu && o.voitjad ? o : null; } catch (err) { return null; }
}
function kuuVoti_(y, m) { return y + '-' + (m < 10 ? '0' : '') + m; }
function piletit_(p) { return p + (p === 1 ? ' pilet' : ' piletit'); }

// Uue kuu esimeses trennis: loosib lõppenud (eelmise) kuu piletite järgi välja plaani tabeli „Auhinnad“ auhinnad.
// Rohkem pileteid = suurem võimalus võita. Auhinna väärtus võimalust ei mõjuta: auhinnad jagatakse võitjatele juhuslikult.
// Loosis on ainult need, kellel on vähemalt 1 pilet (reeglid 5.5). Korraldaja (KLOON) ja „Endine osaleja“ ei osale.
// Üks inimene võidab kuus ühe auhinna. Kui sama kuu loos on juba tehtud, loositakse ainult juurde lisatud auhinnad.
function loosi_(plan) {
  var pub = avalik_();
  if (!pub) return { tekst: 'Ühist tabelit veel pole. Vali „Kuu harjutus → Seadista“.' };
  KUUD_ = null;
  var t = tana_(), d = ymd_(t), k = eelmine_(d[0], d[1]);
  var m = kuuLeht_(pub, k[0], k[1]);
  if (!m) return { tekst: 'Eelmise kuu (' + ET_M[k[1] - 1].toLowerCase() + ') vahekaarti pole, loosida pole kelle vahel.' };
  var kn = ymd_(m.start)[1] - 1, kuus = ET_G[kn] + 's', Kuu = ET_G[kn].charAt(0).toUpperCase() + ET_G[kn].slice(1);
  var auh = auhinnaLoend_(plan);
  if (!auh.length) return { tekst: 'Auhindu pole kirjas. Kirjuta need sellel vahekaardil tabelisse „Auhinnad“ (tulbad V–X) ja tee siis linnuke uuesti.' };
  var voti = kuuVoti_(k[0], k[1]), olek = loosOlek_();
  if (!olek || olek.kuu !== voti) olek = { kuu: voti, aeg: '', voitjad: [] };
  var f = pub.getSheetByName(T_FAME), rida = -1, varem = olek.voitjad.map(function (w) { return w.nimi; });
  if (f) {
    var a = f.getRange(FAME0, 1, FAMEN, 1).getValues();
    for (var i = 0; i < FAMEN; i++) if (String(a[i][0]) === m.name) { rida = FAME0 + i; break; }
    if (rida > 0) str_(f.getRange(rida, FAME_WIN).getValue()).split(/\s*[,\n]\s*/).filter(String).forEach(function (x) { if (varem.indexOf(x) < 0) varem.push(x); });
  }
  var antud = {};
  olek.voitjad.forEach(function (w) { antud[w.et] = (antud[w.et] || 0) + 1; });
  var jaak = [];                                                     // auhinnad, mis on veel loosimata (üks kord iga tükk)
  auh.forEach(function (x) { for (var j = antud[x.et] || 0; j < x.n; j++) jaak.push(x); });
  var loetelu = function (ws) {
    return ws.map(function (w, i) { return (i + 1) + '. ' + w.nimi + ' (' + piletit_(w.p) + ') – ' + w.et; }).join('; ');
  };
  if (!jaak.length) return { tekst: Kuu + ' auhinnad on juba loositud (' + olek.aeg + '): ' + loetelu(jarjestaVoitjad_(olek.voitjad, auh)) +
    '. Kui lisad tabelisse „Auhinnad“ uusi auhindu, loosib linnuke ainult need juurde.' };
  var kloon = KLOON.toLowerCase();
  var nimed = m.sh.getRange(R0, 1, N, 1).getValues(), pil = m.sh.getRange(R0, PILETID, N, 1).getValues();
  var loos = [], kokku = 0;
  nimed.forEach(function (r, i) {
    var nimi = str_(r[0]), p = Math.floor(Number(pil[i][0]) || 0);
    if (!nimi || p <= 0 || nimi === EKS || nimi.toLowerCase() === kloon || varem.indexOf(nimi) >= 0) return;
    loos.push([nimi, p]); kokku += p;
  });
  if (!kokku) return { tekst: 'Loosis pole kedagi: ' + kuus + ' pole veel ühtegi piletit' + (varem.length ? ' (varem võitsid ' + varem.join(', ') + ')' : '') + '.' };
  for (var s = jaak.length - 1; s > 0; s--) { var r_ = Math.floor(Math.random() * (s + 1)), tmp = jaak[s]; jaak[s] = jaak[r_]; jaak[r_] = tmp; }
  var uued = [];
  while (uued.length < jaak.length && loos.length) {
    var x = Math.floor(Math.random() * kokku), v = loos.length - 1;
    for (var j = 0; j < loos.length; j++) { if (x < loos[j][1]) { v = j; break; } x -= loos[j][1]; }
    var pr = jaak[uued.length];
    uued.push({ nimi: loos[v][0], p: loos[v][1], et: pr.et, en: pr.en });
    kokku -= loos[v][1]; loos.splice(v, 1);
  }
  olek.voitjad = olek.voitjad.concat(uued);
  olek.aeg = Utilities.formatDate(new Date(), TZ, 'd.MM.yyyy');
  props_().setProperty('LOOS', JSON.stringify(olek));
  if (rida > 0) {
    var koik = varem.slice();
    uued.forEach(function (w) { koik.push(w.nimi); });
    f.getRange(rida, FAME_WIN).setValue(koik.join('\n')); autahvliKorgus_(f);
  }
  voitjadVaade_(pub, true);
  var aeg = Utilities.formatDate(new Date(), TZ, 'd.MM HH:mm'), jaab = jaak.length - uued.length;
  return { nimi: uued[0].nimi, nimed: uued.map(function (w) { return w.nimi; }),
    tekst: '🎉 ' + Kuu + ' loos on tehtud (' + aeg + '): ' + loetelu(jarjestaVoitjad_(uued, auh)) + '. ' +
      (jaab ? 'Piletiga osalejaid oli ainult ' + uued.length + ', seega jäi ' + jaab + (jaab === 1 ? ' auhind' : ' auhinda') + ' loosimata. ' : '') +
      'Võitjad on nüüd ühise tabeli vahekaartidel „Ülevaade“ ja „Autahvel“.' };
}

// Võitjad auhindade tabeli järjekorras (suurem auhind ülal, kui see on tabelis ülal), sama auhinna puhul loosi järjekorras.
function jarjestaVoitjad_(ws, auh) {
  var koht = {};
  auh.forEach(function (a, i) { if (!(a.et in koht)) koht[a.et] = i; });
  return ws.map(function (w, i) { return [w, i]; }).sort(function (a, b) {
    var x = a[0].et in koht ? koht[a[0].et] : 999, y = b[0].et in koht ? koht[b[0].et] : 999;
    return x - y || a[1] - b[1];
  }).map(function (x) { return x[0]; });
}

// Ülevaate vahekaardil graafiku „Grupi korduste arv päevas“ all (G19:J…): „<Kuu>kuu fortuuna soosis neid osalejaid“ ja viimase loosi võitjad.
// Uus loos (järgmise kuu alguses) asendab eelmise kuu võitjad, Autahvlile jäävad kõik alles. Enne esimest loosi on tabel tühi ja pealkirjas
// kuu, mille loos tuleb järgmisena. edetabel_ (Seadista) tühjendab read 19…121 tulpadeni K, seega joonistab Seadista selle pärast uuesti.
// Erik 30.10: pealkiri ja selgitus on tabeli päise kohal (read 20–21, mitte 19–20, sest edetabeli selgituse rida 20 on kõrge) ja nime järel tulp TIIM.
// Tulbad G H I J ja L: K on Ülevaate peidetud abitulp (edetabeli MATCH ja $K$4), seda ei puuduta. Peidetud K tõttu paistab tabel ühtne.
var VV0 = 20, VV_VEERG = 7, VV_MAX = 100, VV_TULBAD = [7, 8, 9, 10, 12];
function voitjadVaade_(pub, alati) {
  var b = pub.getSheetByName(T_BOARD);
  if (!b) return false;
  var olek = loosOlek_(), y, mm;
  if (olek) { y = Number(olek.kuu.slice(0, 4)); mm = Number(olek.kuu.slice(5)); }
  else {
    var d = ymd_(tana_()), k = eelmine_(d[0], d[1]), j = d[1] === 12 ? [d[0] + 1, 1] : [d[0], d[1] + 1];
    var v = [k, d, j].filter(function (x) { return kuuLeht_(pub, x[0], x[1]); })[0] || d;   // järgmisena loositav kuu
    y = v[0]; mm = v[1];
  }
  var voti = kuuVoti_(y, mm) + '|' + (olek ? olek.aeg + '|' + olek.voitjad.length : '-');
  if (!alati && props_().getProperty('LOOS_VAADE') === voti && /fortuuna/.test(b.getRange(VV0, VV_VEERG).getFormula())) return false;
  var plan = plaan_(), ws = olek ? jarjestaVoitjad_(olek.voitjad, auhinnaLoend_(plan)).slice(0, VV_MAX) : [];
  var L = "'" + T_GUIDE + "'!$C$3=\"English\"", q = function (s) { return String(s).replace(/"/g, '""'); };
  var tx = function (et, en) { return '=IF(' + L + ',"' + q(en) + '","' + q(et) + '")'; };
  var EN_K = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mm - 1];
  var G = ET_G[mm - 1], Kuu = G.charAt(0).toUpperCase() + G.slice(1);
  if (b.getMaxRows() < VV0 + 2 + VV_MAX) b.insertRowsAfter(b.getMaxRows(), VV0 + 2 + VV_MAX - b.getMaxRows());
  var C = VV_VEERG, T5 = VV_TULBAD;
  var plokk = function (r, n) { return [b.getRange(r, C, n, 4), b.getRange(r, 12, n, 1)]; };   // G:J ja L
  var ylal = b.getRange(VV0 - 1, C, 3, 6);                  // read 19–21 G:L (K on seal tühi), ka vana paigutuse rida 19
  ylal.breakApart(); ylal.clear();
  plokk(VV0 + 2, VV_MAX + 1).forEach(function (x) { x.breakApart(); x.clear(); });
  var rida = function (r, vals, fn) { b.getRange(r, C, 1, 4)[fn]([vals.slice(0, 4)]); b.getRange(r, 12)[fn === 'setValues' ? 'setValue' : 'setFormula'](vals[4]); };
  var yhine = function (r) { var g = b.getRange(r, C, 1, r < VV0 + 2 ? 6 : 4); g.merge(); return g; };   // allpool on K-s edetabeli valemid
  yhine(VV0);
  b.getRange(VV0, C).setFormula(tx(Kuu + 'kuu fortuuna soosis neid osalejaid', 'Fortune smiled on these participants in ' + EN_K))
    .setFontFamily('Oswald').setFontSize(14).setFontWeight('bold').setFontColor('#2B241E').setVerticalAlignment('bottom').setHorizontalAlignment('left').setWrap(false);
  yhine(VV0 + 1);
  b.getRange(VV0 + 1, C).setFormula(olek
      ? tx('Loosisime ' + olek.aeg + ' ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem oli võimalus võita. Kõik võitjad on ka vahekaardil „Autahvel“.',
           'Drawn on ' + olek.aeg + ' from the ' + EN_K + ' tickets. More tickets meant a better chance to win. All winners are also on the “Autahvel | Fame” tab.')
      : tx('Võitjad loosime uue kuu esimeses trennis ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem on võimalus võita.',
           'We draw the winners at the first training of the new month from the ' + EN_K + ' tickets. The more tickets, the better your chance to win.'))
    .setFontSize(8).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('left');
  rida(VV0 + 2, [tx('NR', '#'), tx('NIMI', 'NAME'), tx('TIIM', 'TEAM'), tx('LOOSIPILETITE ARV', 'RAFFLE TICKETS'), tx('AUHIND', 'PRIZE')], 'setFormulas');
  plokk(VV0 + 2, 1).forEach(function (x) {
    x.setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  });
  if (!ws.length) {
    yhine(VV0 + 3);
    b.getRange(VV0 + 3, C).setFormula(tx('Võitjad tulevad siia pärast loosi.', 'The winners appear here after the draw.'))
      .setFontSize(10).setFontColor('#6E655B').setHorizontalAlignment('center').setVerticalAlignment('middle');
  } else {
    var r0 = VV0 + 3, n = ws.length, tiim = tiimid_(pub, y, mm);
    b.getRange(r0, C, n, 4).setValues(ws.map(function (w, i) { return [i + 1, txt_(w.nimi), txt_(tiim[w.nimi] || ''), w.p]; }));
    b.getRange(r0, 12, n, 1).setFormulas(ws.map(function (w) { return [tx(w.et, w.en || w.et)]; }));
    plokk(r0, n).forEach(function (x, k) {
      x.setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment(k ? 'left' : 'center')
        .setBackgrounds(ws.map(function (w, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return k ? [c] : [c, c, c, c]; }));
    });
    b.getRange(r0, C, n, 1).setNumberFormat('0').setFontWeight('bold').setFontColor('#8B6B47');
    b.getRange(r0, C + 3, n, 1).setNumberFormat('0');
    b.getRange(r0, C + 1, n, 1).setHorizontalAlignment('left').setFontWeight('bold');
    b.getRange(r0, C + 2, n, 1).setHorizontalAlignment('left').setFontColor('#6E655B');
    b.getRange(r0, 12, n, 1).setWrap(true);
  }
  b.setColumnWidth(C, 40); b.setColumnWidth(C + 1, 130); b.setColumnWidth(C + 2, 120); b.setColumnWidth(C + 3, 110); b.setColumnWidth(12, 210);
  props_().setProperty('LOOS_VAADE', voti);
  return true;
}

// Loositud kuu tiimid nime järgi (tulp C). OTSIN/LOOKING ei ole tiim.
function tiimid_(pub, y, mm) {
  var m = kuuLeht_(pub, y, mm), out = {};
  if (!m) return out;
  m.sh.getRange(R0, 1, N, 3).getValues().forEach(function (r) {
    var nimi = str_(r[0]), t = str_(r[2]);
    if (nimi && t && !/^(OTSIN|LOOKING)$/i.test(t)) out[nimi] = t;
  });
  return out;
}


// ================================================================ reeglid dokumendina

// Teeb (või uuendab) Google'i dokumendi reeglitega, jagab selle lugemiseks ja paneb lingi vahekaardile „Reeglid“.
function reeglid_(pub) {
  if (KH_PATCH.doc_url && !GRUPP_) return KH_PATCH.doc_url;   // põhigrupi dokument on valmis tehtud; teine grupp saab oma              // reeglite dokument on valmis tehtud, lingid on juba mallis
  var props = props_(), id = props.getProperty('DOC_ID'), doc = null;
  if (id) {
    try { if (!DriveApp.getFileById(id).isTrashed()) doc = DocumentApp.openById(id); } catch (err) { doc = null; }
  }
  var sisu = JSON.stringify(KH_PATCH.rules) + (GRUPP_ ? taisnimi_() : ''), h = 0;   // grupi nime muutus kirjutab dokumendi uuesti
  for (var i = 0; i < sisu.length; i++) h = (h * 31 + sisu.charCodeAt(i)) | 0;
  var sig = sisu.length + ':' + h;
  if (!doc) {
    doc = DocumentApp.create(DOC_NAME + silt_());
    props.setProperty('DOC_ID', doc.getId());
    props.deleteProperty('DOC_SISU');
    var kaust = kaust_(pub);
    if (kaust) { try { DriveApp.getFileById(doc.getId()).moveTo(DriveApp.getFolderById(kaust)); } catch (err) {} }
  }
  var docId = doc.getId(), url = doc.getUrl();
  try { if (doc.getName() !== DOC_NAME + silt_()) doc.setName(DOC_NAME + silt_()); } catch (err) {}              // enne sulgemist: suletud dokumendilt neid enam ei saa
  if (props.getProperty('DOC_SISU') !== sig) {
    kirjutaReeglid_(doc);
    props.setProperty('DOC_SISU', sig);
  }
  try { DriveApp.getFileById(docId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  var rl = pub.getSheetByName(T_RULES);
  if (rl) rl.getRange('C4').setRichTextValue(SpreadsheetApp.newRichTextValue()
    .setText('📄 Ava reeglid dokumendina · Open the rules as a document').setLinkUrl(url).build());
  var g = pub.getSheetByName(T_GUIDE);                        // Juhendi lõpus: „Loe kõiki reegleid siit“
  if (g) {
    var n = Math.min(g.getMaxRows(), 120), f = g.getRange(1, 3, n, 1).getFormulas();
    for (var i = 0; i < n; i++) {
      if (f[i][0].indexOf('Loe kõiki reegleid siit') < 0) continue;
      var sisu = f[i][0].indexOf('=HYPERLINK("') === 0 ? f[i][0].replace(/^=HYPERLINK\("[^"]*",/, '').replace(/\)$/, '') : f[i][0].slice(1);
      g.getRange(i + 1, 3).setFormula('=HYPERLINK("' + url + '",' + sisu + ')');
    }
  }
  return url;
}

function kirjutaReeglid_(doc) {
  var body = doc.getBody(), H = DocumentApp.ParagraphHeading;
  body.clear();
  var p = body.getParagraphs()[0];
  p.setText('Kuu harjutus · Reeglid');                      // setText ei tagasta midagi (null), seepärast eraldi
  p.setHeading(H.TITLE);
  body.appendParagraph(taisnimi_() + ' · Üksus. English version below.').setHeading(H.NORMAL).editAsText().setBold(false);
  [1, 2].forEach(function (L) {
    if (L === 2) body.appendParagraph('Monthly challenge · Rules').setHeading(H.TITLE);
    KH_PATCH.rules.forEach(function (sek) {
      body.appendParagraph(sek[0][L - 1]).setHeading(H.HEADING2);
      sek[1].forEach(function (it) {
        if (it[0]) {
          var t = body.appendParagraph(it[0] + '  ' + grupiTekst_(it[L])).setHeading(H.NORMAL).editAsText();
          t.setBold(false); t.setBold(0, it[0].length - 1, true);
        } else {
          body.appendListItem(grupiTekst_(it[L])).setGlyphType(DocumentApp.GlyphType.BULLET).editAsText().setBold(false);
        }
      });
    });
  });
  doc.saveAndClose();
}

// ================================================================ seadistuse abid

// Vanast (v4) plaanist tuleb üle see, mida oled ise muutnud, ja e-post ning postituste linnukesed.
function migreeri_(vana, plan) {
  var tunnus = vana.getMaxColumns() >= 20 ? String(vana.getRange('T1').getValue()) : '';
  if (/^KH[5-9]$/.test(tunnus)) { migreeriKH5_(vana, plan, tunnus !== 'KH5', tunnus === 'KH7', tunnus === 'KH8' || tunnus === 'KH9', tunnus === 'KH9'); return; }
  if (str_(vana.getRange('K2').getValue()) !== 'Algus') return;
  var old = vana.getRange(3, 1, 13, 15).getValues();
  var rng = plan.getRange(PL0, 1, PLN, 14), nv = rng.getValues(), muutus = false;
  var OI = [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14], NI = [2, 3, 4, 6, 7, 8, 10, 12, 9, 11, 13];
  old.forEach(function (r) {
    var s = toSerial_(r[10]);
    if (s === null) return;
    var d = ymd_(s), pre = V4[d[0] + '-' + d[1]] || [];
    nv.forEach(function (row) {
      var ns = toSerial_(row[1]);
      if (ns === null) return;
      var nd = ymd_(ns);
      if (nd[0] !== d[0] || nd[1] !== d[1]) return;
      OI.forEach(function (oi, j) {
        var val = r[oi] === null ? '' : r[oi], eel = pre[j] === undefined ? '' : pre[j];
        if (String(val).trim() === String(eel).trim()) return;
        row[NI[j]] = val;
        if (NI[j] === 4) row[5] = val;                     // v4-s tegid Algaja ja Põhi sama arvu
        muutus = true;
      });
    });
  });
  if (muutus) plan.getRange(PL0, 3, PLN, 12).setValues(nv.map(function (r) { return r.slice(2, 14).map(txt_); }));
  var mail = str_(vana.getRange('C19').getValue());
  if (mail.indexOf('@') > 0) plan.getRange(C_EMAIL).setValue(mail);
  var on = vana.getRange('B24:B27').getValues();
  plan.getRange(POST0, 2, 4, 1).setValues(on.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
}

// Eelmise versiooni (KH5–KH9) plaanist tuleb üle kõik: plaan kuude kaupa, e-post ja postituste linnukesed.
// KH5-s oli üks veerg „Algaja ja Põhi“ (E); nüüd on Algaja (E) ja Põhi (F) eraldi, alguses sama arvuga.
// KH9-s olid juba 2x päevad (tulp O) ja postitused samadel ridadel.
function migreeriKH5_(vana, plan, kh6, kh7, kh8, kh9) {
  var old = vana.getRange(PL0, 1, PLN, kh6 ? 14 : 13).getValues(), o2x = kh9 ? vana.getRange(PL0, PL_2X, PLN, 1).getDisplayValues() : null;
  var n2x = plan.getRange(PL0, PL_2X, PLN, 1).getValues(), on2x = false;
  var rng = plan.getRange(PL0, 1, PLN, 14), nv = rng.getValues();
  old.forEach(function (r) {
    var s = toSerial_(r[1]);
    if (s === null) return;
    var d = ymd_(s);
    nv.forEach(function (row) {
      var ns = toSerial_(row[1]);
      if (ns === null) return;
      var nd = ymd_(ns);
      if (nd[0] !== d[0] || nd[1] !== d[1]) return;
      var v = r.map(function (x) { return x === null ? '' : x; });
      if (o2x) { n2x[nv.indexOf(row)][0] = o2x[old.indexOf(r)][0]; on2x = true; }
      for (var i = 2; i < 14; i++) row[i] = kh6 ? v[i] : '';
      if (kh6) return;
      row[2] = v[2]; row[3] = v[3]; row[4] = v[4]; row[5] = v[4]; row[6] = v[5]; row[7] = v[6];
      row[8] = v[7]; row[9] = v[8]; row[10] = v[9]; row[11] = v[10]; row[12] = v[11]; row[13] = v[12];
    });
  });
  plan.getRange(PL0, 3, PLN, 12).setValues(nv.map(function (r) { return r.slice(2, 14).map(txt_); }));
  if (on2x) plan.getRange(PL0, PL_2X, PLN, 1).setValues(n2x.map(function (r) { return [txt_(str_(r[0]))]; }));
  plan.getRange(C_EMAIL).setValue(str_(vana.getRange(C_EMAIL).getValue()));
  var d0 = vana.getRange(C_PREVIEW), f0 = d0.getFormula();
  if (!f0 && toSerial_(d0.getValue()) !== null) plan.getRange(C_PREVIEW).setValue(d0.getValue());
  var on = vana.getRange(kh9 ? POST0 : POST0_VANA, 2, 4, 1).getValues();
  plan.getRange(POST0, 2, 4, 1).setValues(on.map(function (r) { return [r[0] !== false && String(r[0]).toUpperCase() !== 'FALSE']; }));
  if (kh7) plan.getRange(C_LOOS_TULEMUS).setValue(vana.getRange('D32').getValue());   // KH7-s oli tulemus D32-s
  if (kh8) {
    plan.getRange(C_LOOS_TULEMUS).setValue(txt_(vana.getRange(C_LOOS_TULEMUS).getValue()));
  }
}

// Teeb manustatud xlsx-failist Google'i tabeli (Drive'i kaudu, sinu kontole).
function impordi_(nimi, kaust) {
  var bytes = Utilities.base64Decode(KH_XLSX.join(''));
  var meta = { name: nimi, mimeType: 'application/vnd.google-apps.spreadsheet' };
  if (kaust) meta.parents = [kaust];
  var piir = 'kuuharjutus' + Date.now();
  var pea = '--' + piir + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
    '\r\n--' + piir + '\r\nContent-Type: ' + MIME_XLSX + '\r\n\r\n';
  var saba = '\r\n--' + piir + '--';
  var payload = Utilities.newBlob(pea).getBytes().concat(bytes).concat(Utilities.newBlob(saba).getBytes());
  var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'post', contentType: 'multipart/related; boundary=' + piir, payload: payload,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Tabeli loomine ebaõnnestus (' + res.getResponseCode() + '): ' + res.getContentText());
  return SpreadsheetApp.openById(JSON.parse(res.getContentText()).id);
}

function kaust_(ss) {
  try {
    var it = DriveApp.getFileById(ss.getId()).getParents();
    return it.hasNext() ? it.next().getId() : null;
  } catch (err) { return null; }
}

function avalik_() {
  var props = props_(), id = props.getProperty('PUB_ID');
  if (!id) {
    var plan = plaan_(), m = plan ? String(plan.getRange(C_LINK).getValue()).match(/\/d\/([\w-]{20,})/) : null;
    if (m) id = m[1];
  }
  if (!id) return null;
  try {
    if (DriveApp.getFileById(id).isTrashed()) return null;
    return SpreadsheetApp.openById(id);
  } catch (err) { return null; }
}

function privaatne_() {
  var id = props_().getProperty('PRIV_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function plaan_(priv) {
  if (GRUPP_) {
    if (!GRUPP_.plan) GRUPP_.plan = grupid_(priv).filter(function (x) { return x && grupiNimi_(x) === GRUPP_.nimi; })[0] || null;
    return GRUPP_.plan;
  }
  priv = priv || privaatne_();
  var s = priv.getSheets();
  for (var i = 0; i < s.length; i++) if (onPlaan_(s[i]) && !grupiNimi_(s[i])) return s[i];
  return null;
}

// ================================================================ grupid

// Iga grupp = oma plaani vahekaart privaatses tabelis ja oma ühine tabel. Põhigrupi vahekaart on „Kuuharjutus“ (U1 tühi),
// teise grupi oma näiteks „Kuuharjutus · Swed“ (U1 = grupi nimi). Teise grupi plaan võtab harjutused põhiplaanist (valemid),
// üle kirjutatud lahter jääb grupile omaks. Link, loos, postitused ja skripti mälu (props_) on igal grupil oma.
var GRUPP_ = null;                                           // null = põhigrupp
var POHIGRUPP = 'Algajad ja Kalisteenika grupp';             // põhigrupi nimi reeglites (teises grupis tuleb selle asemele grupi nimi)

// Postituste eelvaate valemid (uus harjutus, nädala seis; eesti ja inglise keeles) elavad plaani vahekaardil, nii et uus tekst
// (Erik 20.10: nädalakiri näitas „7 inimest 100% peal ja 10 vähemalt 80%“, uue kuu teade sai uue sõnastuse) ei jõua olemasolevale
// vahekaardile ise. Kui versioon on vana, võetakse valemid mallist (kopeerimine säilitab valemi igas lokaadis). Käib korra.
function postiValemid_(plan) {
  var props = props_();
  if (props.getProperty('POSTID') === POSTID) return false;
  var priv = plan.getParent(), aj = impordi_(PUB_NAME + ' (ajutine)', null), tmp = null;
  try {
    tmp = aj.getSheetByName(T_PLAN).copyTo(priv);
    var uus = POST0 + 4;                                            // „Eesmärk täis“ (27.10): vanal vahekaardil seda rida pole
    if (!str_(plan.getRange(uus, 3).getValue())) {
      tmp.getRange(uus, 1, 1, 18).copyTo(plan.getRange(uus, 1, 1, 18));
      plan.setRowHeight(uus, tmp.getRowHeight(uus));
      plan.getRange(uus, 5, 1, 6).merge(); plan.getRange(uus, 12, 1, 6).merge();
      plan.getRange(uus, 2).insertCheckboxes().setValue(true);
      tmp.getRange('T23:T24').copyTo(plan.getRange('T23:T24'));
    }
    [POST0, POST0 + 2, uus].forEach(function (rida) {
      [5, 12].forEach(function (veerg) {
        tmp.getRange(rida, veerg).copyTo(plan.getRange(rida, veerg), SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
      });
    });
  } finally {
    if (tmp) priv.deleteSheet(tmp);
    DriveApp.getFileById(aj.getId()).setTrashed(true);
  }
  props.setProperty('POSTID', POSTID);
  return true;
}

function onPlaan_(sh) { return !!sh && sh.getMaxColumns() >= 21 && sh.getRange('T1').getValue() === VER; }
function grupiNimi_(plan) { return plan ? str_(plan.getRange('U1').getValue()) : ''; }

// Kõik grupid: põhigrupp (tema vahekaart või null, kui seda veel pole) ja teised.
function grupid_(priv) {
  var s = (priv || privaatne_()).getSheets().filter(onPlaan_);
  return [s.filter(function (x) { return !grupiNimi_(x); })[0] || null].concat(s.filter(function (x) { return grupiNimi_(x); }));
}

// Käivitab fn grupi kontekstis (plaani vahekaart, null = põhigrupp, või grupi nimi).
function grupiga_(plan, fn) {
  var vana = GRUPP_, nimi = typeof plan === 'string' ? plan : grupiNimi_(plan);
  GRUPP_ = nimi ? { nimi: nimi, plan: typeof plan === 'string' ? null : plan } : null;
  KUUD_ = null;
  try { return fn(); } finally { GRUPP_ = vana; KUUD_ = null; }
}
function koigile_(priv, fn) { return grupid_(priv).map(function (g) { return grupiga_(g, fn); }); }

// Menüüst: tegevus käib selle grupi kohta, mille vahekaart on lahti (muidu põhigrupp).
function aktiivsele_(fn) {
  var sh = null;
  try { sh = SpreadsheetApp.getActiveSheet(); } catch (err) {}
  return grupiga_(onPlaan_(sh) ? sh : null, fn);
}

function silt_() { return GRUPP_ ? ' · ' + GRUPP_.nimi : ''; }
function pubNimi_() { return GRUPP_ ? 'Kuu harjutus · ' + GRUPP_.nimi + ' | Monthly challenge' : PUB_NAME; }
function grupiTekst_(s) { return GRUPP_ ? String(s).split(POHIGRUPP).join(taisnimi_()) : s; }
// Grupi nimi reeglites („kalisteenikagrupi (Swedpank grupp)“). Kui grupp siin kirjas pole, on see „<nimi> grupp“.
var GRUPI_NIMED = { 'swed': 'Swedpank grupp' };
function taisnimi_() {
  if (!GRUPP_) return POHIGRUPP;
  var n = GRUPP_.nimi;
  return GRUPI_NIMED[n.toLowerCase()] || (/grupp$/i.test(n) ? n : n + ' grupp');
}

// Skripti mälu: teise grupi võtmetel on lõpus @grupp. Ühised võtmed jäävad samaks.
function props_() {
  var p = PropertiesService.getScriptProperties();
  if (!GRUPP_) return p;
  var k = function (x) { return /^(PRIV_ID$|PUB_VER:|GRUPP:|YLEVAADE$)/.test(x) ? x : x + '@' + GRUPP_.nimi; };
  return { getProperty: function (x) { return p.getProperty(k(x)); },
           setProperty: function (x, v) { p.setProperty(k(x), v); return this; },
           deleteProperty: function (x) { p.deleteProperty(k(x)); return this; } };
}

// E-kirja pealkirjas on teise grupi nimi: „Kuu harjutus · Swed: Start“.
function kiri_(o) {
  o.subject = String(o.subject).replace('Kuu harjutus', 'Kuu harjutus' + silt_());
  MailApp.sendEmail(o);
}

// Menüüst „Lisa uus grupp“: uus plaani vahekaart (harjutused tulevad põhiplaanist) ja Seadista teeb grupile ühise tabeli.
function lisaGrupp() {
  var ui = SpreadsheetApp.getUi(), priv = SpreadsheetApp.getActive();
  GRUPP_ = null;
  var pohi = plaan_(priv);
  if (!pohi) { ui.alert('Vali enne „Kuu harjutus → Seadista“.'); return; }
  var v = ui.prompt('Lisa uus grupp', 'Kirjuta grupi nimi, näiteks Swed. See tuleb ühise tabeli ja vahekaardi nimesse.', ui.ButtonSet.OK_CANCEL);
  if (v.getSelectedButton() !== ui.Button.OK) return;
  var nimi = str_(v.getResponseText()).replace(/['"|@:!]/g, '').replace(/\s+/g, ' ').trim();
  if (!nimi) { ui.alert('Grupi nimi jäi tühjaks.'); return; }
  if (grupid_(priv).some(function (g) { return g && grupiNimi_(g).toLowerCase() === nimi.toLowerCase(); }) || priv.getSheetByName(T_PLAN + ' · ' + nimi)) {
    ui.alert('Grupp „' + nimi + '“ on juba olemas.'); return;
  }
  looGrupp_(priv, pohi, nimi);
  seadista();
}

function looGrupp_(priv, pohi, nimi) {
  var g = pohi.copyTo(priv).setName(T_PLAN + ' · ' + nimi), P = viide_(pohi);
  g.getRange('U1').setValue(nimi);
  g.getRange('A1').setValue('KUUHARJUTUS · ' + nimi + ' · korraldaja vahekaart (ainult sulle)');
  var f = [];
  for (var r = PL0; r < PL0 + PLN; r++) {
    var rida = [];
    for (var c = 3; c <= PL_2X; c++) { var a = P + String.fromCharCode(64 + c) + r; rida.push('=' + a); }
    f.push(rida);
  }
  var ala = g.getRange(PL0, 3, PLN, PL_2X - 2), vorm = ala.getNumberFormats();
  ala.clearNote().setNumberFormat('General').setFormulas(f).setNumberFormats(vorm);   // tulp O on tekst („7, 21“): valem enne, vorming siis tagasi
  g.getRange(C_LINK).setValue('');
  g.getRange(C_EMAIL).setFormula('=' + P + C_EMAIL);
  g.getRange(C_PREVIEW).setFormula('=TODAY()');
  [C_LOOS, C_KUU, C_PROOV].forEach(function (a) { g.getRange(a).setValue(false); });
  [C_LOOS_TULEMUS, C_KUU_TULEMUS, C_PROOV_TULEMUS].forEach(function (a) { g.getRange(a).setValue(''); });
  g.getRange(PL0 - 1, 3).setNote('Harjutused, numbrid ja 2x päevad tulevad vahekaardilt „' + T_PLAN + '“. Kui ' + nimi +
    ' grupil on mõnel kuul midagi teisiti, kirjuta see lahter siin üle. Link, loos, linnukesed ja postitused on sellel vahekaardil ainult ' + nimi + ' grupi omad.');
  g.hideColumns(20, 2);
  priv.setActiveSheet(g);
  priv.moveActiveSheet(priv.getSheets().indexOf(pohi) + 2);
  return g;
}

// Valemid grupi vahekaardil on lihtsad viited põhiplaanile (='Kuuharjutus'!C3). Koma ega semikoolonit neis pole,
// sest Eesti lokaadiga tabelis ei saa skripti kirjutatud komaga valemist aru (#ERROR!). Tühi lahter jääb tühjaks.
function viide_(pohi) { return "'" + pohi.getName().replace(/'/g, "''") + "'!"; }

// v11 kirjutas grupi vahekaardile =IF('Kuuharjutus'!C3="","",…): Eesti lokaadis #ERROR!. Need lahtrid saavad uue valemi,
// üle kirjutatud lahtrid jäävad nagu on. Käivitub Seadista ja öise hoolduse ajal.
function grupiValemid_(g, pohi) {
  var P = viide_(pohi), vana = /^=IF\('(?:[^']|'')*'!\$?([A-Z]+)\$?(\d+)\s*=\s*""\s*[,;]\s*""\s*[,;]/;
  [g.getRange(PL0, 3, PLN, PL_2X - 2), g.getRange(C_EMAIL)].forEach(function (ala) {
    var f = ala.getFormulas(), n = 0, koik = true;
    var uus = f.map(function (row) {
      return row.map(function (x) { var m = x.match(vana); if (m) { n++; return '=' + P + m[1] + m[2]; } koik = false; return x; });
    });
    if (!n) return;
    var vorm = ala.getNumberFormats();
    if (koik) { ala.setNumberFormat('General').setFormulas(uus).setNumberFormats(vorm); return; }
    uus.forEach(function (row, i) {
      row.forEach(function (x, j) {
        if (x !== f[i][j]) ala.getCell(i + 1, j + 1).setNumberFormat('General').setFormula(x).setNumberFormat(vorm[i][j]);
      });
    });
  });
}

// Teise grupi juhendi pealkiri: „ÜKSUSE KUU HARJUTUS ● SWED GRUPP“. Font on nii väike, et pealkiri mahub ühele reale.
function pealkiri_(pub) {
  var g = pub.getSheetByName(T_GUIDE);
  if (!g) return;
  var c = g.getRange('A1'), f = c.getFormula(), n = GRUPP_.nimi.toUpperCase();
  var et = 'ÜKSUSE KUU HARJUTUS', en = 'ÜKSUS MONTHLY CHALLENGE', et2 = et + ' ● ' + n + ' GRUPP', en2 = en + ' ● ' + n + ' GROUP';
  if (f.indexOf('"' + et + '"') < 0 || f.indexOf('"' + en + '"') < 0) return;   // juba tehtud
  c.setFormula(f.split('"' + et + '"').join('"' + et2 + '"').split('"' + en + '"').join('"' + en2 + '"'));
  c.setFontSize(Math.max(11, Math.min(20, Math.floor(20 * 24 / Math.max(et2.length, en2.length)))));
}

// Teise grupi ühine tabel: loob või uuendab, jagab lingiga, paneb lingi grupi plaani ja reeglid oma dokumenti.
function grupiSeadista_(priv, plan) {
  var pohi = grupid_(priv)[0];
  if (pohi) grupiValemid_(plan, pohi);
  var props = props_(), viga = '', pub = avalik_(), uus = !pub;
  try { postiValemid_(plan); } catch (err) { viga = 'Postituste tekste ei saanud uuendada: ' + (err && err.message ? err.message : err); }
  try { auhinnad_(plan); } catch (err) { viga += (viga ? ' ' : '') + 'Auhindade tabelit ei saanud teha: ' + (err && err.message ? err.message : err); }
  if (!pub) {
    pub = impordi_(pubNimi_(), kaust_(priv));
    props.setProperty('PUB_ID', pub.getId());
    props.setProperty('PUB_VER:' + pub.getId(), String(PUB_VER));
  }
  props.setProperty('GRUPP:' + pub.getId(), GRUPP_.nimi);
  tz_(pub);
  if (pub.getName() !== pubNimi_()) pub.rename(pubNimi_());
  var pooleli = false;
  if (uus) props.setProperty('EHITUS:' + pub.getId(), EHITUS);
  else if (!(JATKA && props.getProperty('EHITUS:' + pub.getId()) === EHITUS) && !aegaOn_(AJAPIIR)) pooleli = true;   // järgmine Seadista
  else viga = uuendaPub_(pub);
  var mall = pub.getSheetByName(T_PLAN);
  if (mall) pub.deleteSheet(mall);
  [false, true].forEach(function (v) { pub.createTextFinder(POHIGRUPP).matchFormulaText(v).replaceAllWith(taisnimi_()); });
  pealkiri_(pub);
  var jagatud = true;
  try { DriveApp.getFileById(pub.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT); } catch (err) { jagatud = false; }
  plan.getRange(C_LINK).setValue(pub.getUrl());
  lingid_(pub);
  var dok = '';
  try { dok = reeglid_(pub); } catch (err) { viga = 'Reeglite dokumenti ei saanud teha: ' + (err && err.message ? err.message : err); }
  return { nimi: GRUPP_.nimi, pub: pub, jagatud: jagatud, dok: dok, viga: viga, pooleli: pooleli };
}

function tz_(ss) { if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ); }

function vabaNimi_(ss, nimi) {
  if (!ss.getSheetByName(nimi)) return nimi;
  for (var i = 2; ; i++) if (!ss.getSheetByName(nimi + ' ' + i)) return nimi + ' ' + i;
}

// ================================================================ kuupäevad ja tekst

// Kuupäevad on seerianumbrid nagu tabelis (1 = 31.12.1899), et ajavööndid sassi ei läheks.
function serial_(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5); }
function ymd_(s) { var x = new Date(Date.UTC(1899, 11, 30) + s * 864e5); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; }
function paevi_(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
function jargmine_(y, m) { return m === 12 ? [y + 1, 1] : [y, m + 1]; }
function eelmine_(y, m) { return m === 1 ? [y - 1, 12] : [y, m - 1]; }
function lehenimi_(y, m) { return ET_M[m - 1] + ' | ' + EN_S[m - 1]; }
function tana_() { return toSerial_(new Date()); }
function toSerial_(v) {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    var p = Utilities.formatDate(v, TZ, 'yyyy-MM-dd').split('-');
    return serial_(Number(p[0]), Number(p[1]), Number(p[2]));
  }
  if (typeof v === 'number' && isFinite(v)) return Math.floor(v);
  return null;
}
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function num_(v) { return typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim() || NaN); }
function txt_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
function html_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ================================================================ automaatne Seadista uue koodi järel
// Eraldi skript „Kuu harjutuse uuendaja“ vahetab selle koodi ise välja. Uus kood märkab, et teda pole veel seadistatud,
// ja käivitab Seadista ise: kui 6 minutist ei piisa, jätkab minuti pärast uuesti, kuni kõik on tehtud (kõige rohkem AUTO_MAX korda).
var AUTO_MAX = 6, AUTO_PAASTIK = 'kuuHarjutusAutoSeadista';

// Kiire kontroll iga päästiku alguses. Ei viska kunagi viga.
function versioon(kiire) {
  try {
    var p = PropertiesService.getScriptProperties();
    if (!p.getProperty('PRIV_ID') || p.getProperty('SEADISTATUD') === EHITUS || p.getProperty('AUTO_OOTEL') === EHITUS) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(3000)) return;                          // proovin järgmisel korral
    try {
      if (p.getProperty('AUTO_OOTEL') === EHITUS) return;
      p.setProperty('AUTO_OOTEL', EHITUS);
      p.setProperty('AUTO_KORD', '0');
      autoJargmine_(60 * 1000);
    } finally { lock.releaseLock(); }
    if (kiire) kiire_();                                     // ainult minutipäästikust, mitte osaleja muudatusest
  } catch (err) { Logger.log('Versiooni kontroll: ' + (err && err.message ? err.message : err)); }
}

// Kohe uue koodi järel (Erik 30.10: 15 minutit on liiga kaua): ainult tekstid ja 2x/eripäevad kõigis gruppides.
// Täis-Seadista (mall, valemid, kaitsed) tuleb minut hiljem nagu enne.
function kiire_() {
  var priv = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('PRIV_ID'));
  grupid_(priv).forEach(function (g) {
    if (!g) return;
    try {
      grupiga_(g, function () {
        KUUD_ = null;
        var pub = avalik_();
        if (!pub) return;
        tekstid_(pub);
        topeltElus_(g);
      });
    } catch (err) { Logger.log('Kiire uuendus: ' + (err && err.message ? err.message : err)); }
  });
  KUUD_ = null;
}

function autoJargmine_(ms) {
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  ScriptApp.newTrigger(AUTO_PAASTIK).timeBased().after(ms).create();
}

function autoSeadista() {
  var p = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function (tr) { if (tr.getHandlerFunction() === AUTO_PAASTIK) ScriptApp.deleteTrigger(tr); });
  if (p.getProperty('SEADISTATUD') === EHITUS) { p.deleteProperty('AUTO_OOTEL'); return; }
  var kaib = Number(p.getProperty('SEADISTA_KAIB') || 0);
  if (kaib && Date.now() - kaib < 7 * 60 * 1000) { autoJargmine_(2 * 60 * 1000); return; }   // keegi käivitas Seadista ise, ootan
  var kord = Number(p.getProperty('AUTO_KORD') || 0) + 1;
  p.setProperty('AUTO_KORD', String(kord));
  var viga = '';
  try { viga = seadista() || ''; } catch (err) { viga = String(err && err.message ? err.message : err); }
  var to = Session.getEffectiveUser().getEmail();
  if (p.getProperty('SEADISTATUD') === EHITUS) {
    p.deleteProperty('AUTO_OOTEL');
    if (!viga) return;                                      // õnnestunud uuendusest kirja ei tule (Erik 27.10: risustab postkasti)
    MailApp.sendEmail({ to: to, name: 'Kuu harjutus', subject: 'Kuu harjutus: uus versioon on paigas',
      body: 'Skripti uus versioon on sees ja Seadista tegi kõik ise ära' + (kord > 1 ? ' (' + kord + ' korraga, sest kood on mahukas)' : '') +
        '. Sinult pole midagi vaja teha.' + (viga ? '\n\nMärkus: ' + viga : '') });
    return;
  }
  if (kord < AUTO_MAX) { autoJargmine_(60 * 1000); return; }
  MailApp.sendEmail({ to: to, name: 'Kuu harjutus', subject: 'Kuu harjutus: Seadista jäi pooleli',
    body: 'Skripti uus versioon on sees, aga Seadista ei jõudnud ' + AUTO_MAX + ' korraga lõpuni. ' +
      'Ava oma tabel ja vali „Kuu harjutus → Seadista“.' + (viga ? '\n\nViimane teade: ' + viga : '') });
}

return {
  versioon: versioon, autoSeadista: autoSeadista,
  menuu: menuu, seadista: seadista, naitaLinki: naitaLinki, looUusKuuleht: looUusKuuleht, uuendaEelvaade: uuendaEelvaade,
  saadaProov: saadaProov, lisaGrupp: lisaGrupp, aktiivsele: aktiivsele_, oine: oine, hommik: hommik, muudatus: muudatus, plaaniMuudatus: plaaniMuudatus, loosiMenuust: loosiMenuust, ylevaade: ylevaade, nimekiri: nimekiri,
  _: function (x) { return eval(x); }                       // ainult testimiseks
};
})();

// ================================================================ menüü ja päästikud (ainult need nimed on väljas)
function kuuHarjutusMenuu() { KuuHarjutus.versioon(); KuuHarjutus.menuu(); }
function kuuHarjutusSeadista() { KuuHarjutus.seadista(); }
function kuuHarjutusLink() { KuuHarjutus.naitaLinki(); }
function kuuHarjutusUusKuuleht() { KuuHarjutus.aktiivsele(KuuHarjutus.looUusKuuleht); }
function kuuHarjutusEelvaade() { KuuHarjutus.aktiivsele(KuuHarjutus.uuendaEelvaade); }
function kuuHarjutusProov() { KuuHarjutus.aktiivsele(KuuHarjutus.saadaProov); }
function kuuHarjutusLisaGrupp() { KuuHarjutus.lisaGrupp(); }
function kuuHarjutusOine() { KuuHarjutus.versioon(); KuuHarjutus.oine(); }
function kuuHarjutusHommik() { KuuHarjutus.versioon(); KuuHarjutus.hommik(); }
function kuuHarjutusMuudatus(e) { KuuHarjutus.versioon(); KuuHarjutus.muudatus(e); }
function kuuHarjutusPlaan(e) { KuuHarjutus.versioon(); KuuHarjutus.plaaniMuudatus(e); }
function kuuHarjutusLoos() { KuuHarjutus.aktiivsele(KuuHarjutus.loosiMenuust); }
function kuuHarjutusYlevaade() { KuuHarjutus.ylevaade(); }
function kuuHarjutusNimekiri() { KuuHarjutus.nimekiri(); }
function kuuHarjutusVersioon() { KuuHarjutus.versioon(true); }
function kuuHarjutusAutoSeadista() { KuuHarjutus.autoSeadista(); }

// ================================================================ uuenduse andmed ja ühise tabeli fail (xlsx, base64)
var KH_PATCH = {
"cells": [
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"MONTHLY CHALLENGE\",\"KUU HARJUTUS\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"ÜKSUS MONTHLY CHALLENGE\",\"ÜKSUSE KUU HARJUTUS\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Language\",\"Keel\")",
"Keel / Language",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. The whole sheet switches.\",\"Vajuta lahtrile ja vali English. Kogu tabel vahetab keelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga vahekaardi ülaservas, kogu tabel vahetab keelt.\")",
30
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Below your target? Type it anyway. Every rep goes into the group total.\",\"Jäi alla eesmärgi? Kirjuta ikka. Iga kordus läheb ühisesse summasse.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Below your target? Type it anyway. Every rep you do at home goes into the group total we compete for.\",\"Jäid alla eesmärgi? Kirjuta ikka. Iga kodus tehtud kordus läheb ühisesse korduste summasse, mille nimel ka võistleme.\")",
75.19999999999999
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Joker, a day off. You get 2 a month and they count as done.\",\"Jokker ehk vaba päev. Kuus on 2 ja need loevad tehtuks.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Couldn't do it today? Type “J” in the cell. You can use a Joker 2 times a month. Joker days count as done.\",\"Täna ei saanud teha? Kirjuta lahtrisse „J“. 2 korda kuus võid kasutada Jokkerit. Jokkeri päevad loetakse tehtuks.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Forgot? You can still fill in yesterday's cell today. Older days are locked.\",\"Unustasid? Eilset lahtrit saad täita veel täna. Vanemaid päevi muuta ei saa.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Forgot to log it? You can still fill in yesterday's cell today. Older days are locked.\",\"Unustasid märkida? Eilset lahtrit saad täita veel täna. Vanemaid päevi muuta ei saa.\")",
61.4
],
[
"Juhend | Guide",
"=IFERROR(IF('Juhend | Guide'!$C$3=\"English\",CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\")&\": \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW9\")),CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"Jaanuar\",\"Veebruar\",\"Märts\",\"Aprill\",\"Mai\",\"Juuni\",\"Juuli\",\"August\",\"September\",\"Oktoober\",\"November\",\"Detsember\")&\": \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW8\"))),\"\")",
"=IFERROR(IF('Juhend | Guide'!$C$3=\"English\",CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"January\",\"February\",\"March\",\"April\",\"May\",\"June\",\"July\",\"August\",\"September\",\"October\",\"November\",\"December\")&\" exercise: \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW9\")),CHOOSE(MONTH(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW2\")),\"Jaanuari\",\"Veebruari\",\"Märtsi\",\"Aprilli\",\"Mai\",\"Juuni\",\"Juuli\",\"Augusti\",\"Septembri\",\"Oktoobri\",\"Novembri\",\"Detsembri\")&\" harjutus: \"&UPPER(INDIRECT(\"'\"&'Autahvel | Fame'!$AB$4&\"'!AW8\"))),\"\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick it in the LEVEL column of the month tab. You can change it during your first week. All levels count the same.\",\"Taseme valid kuulehel veerus TASE. Muuta saad oma esimese nädala jooksul. Kõik tasemed loevad võrdselt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You can pick and change your level during the first 7 days from the start of the month or from when you joined. Then it's locked until the month ends. If you don't pick one, your level is Base. Try a harder level next month. All levels count the same.\",\"Taset saad valida ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest. Siis on tase kuu lõpuni lukus. Kui sa taset ei vali, on sinu tase Põhi. Raskemat taset saad proovida järgmisel kuul. Kõiki tasemeid loeme võrdsena.\")",
80.52
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback (missed 3+ days in a row but still finished), 💥 Volume champ (most reps above your daily target). All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek (vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud), 💥 Mahukuningas (kõige rohkem kordusi üle oma päeva eesmärgi). Kõik on vahekaardil Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest % above your daily target\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige rohkem protsente üle oma päeva eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
171.79999999999998
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback, 💥 Volume champ. All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek, 💥 Mahukuningas. Kõik on lehel Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest % above your daily target\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige rohkem protsente üle oma päeva eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
171.79999999999998
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Every day you reach your target is one raffle ticket. Jokers and H give no ticket, and your % or level doesn't matter in the draw. See your tickets in the TICKETS column. We draw at the last training of the month.\",\"Iga päev, mil jõuad oma eesmärgini, on üks loosipilet. Jokker ja H pileteid ei anna, protsent ja tase loosis ei loe. Oma pileteid näed kuu vahekaardi tulbas PILETID. Loosime kuu viimases trennis.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Every done day is one raffle ticket. We draw at the last training of the month.\",\"Iga tehtud päev on üks loosipilet. Loosime kuu viimases trennis.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If a day shows 2x and you do double your target that day, you get an extra ticket.\",\"Kui päeva kohal on 2x ja teed sel päeval kaks korda oma eesmärgi, saad lisapileti.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If the organiser marks a day with 2x and you do double your target that day, you get an extra ticket.\",\"Kui korraldaja määrab trennipäeva kohale 2x ja teed sel päeval kaks korda oma eesmärgi, saad lisapileti.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAUSE\",\"PAUS\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAUSE AND LEAVING\",\"PAUS JA LAHKUMINE\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali lehel Nimekiri oma nime kõrval „Paus“. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt vahekaardilt.\")",
104.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali lehel „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt lehelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”, then “Kinnitan eemaldamise · Confirm removal”: your name and results are deleted from every tab.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“: sinu nimi ja tulemused kustuvad igalt vahekaardilt.\")",
104.6
],
[
"Nimekiri | Roster",
"=IF('Juhend | Guide'!$C$3=\"English\",\"ROSTER\",\"NIMEKIRI\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PARTICIPANTS\",\"OSALEJATE NIMEKIRI\")",
null
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. That name and all its results are then deleted from every tab and the names below move up. Picked it by mistake? Pick “Osalen · In” again.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt vahekaardilt ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Nimekiri | Roster",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Can't join next month? Pick “Paus · Pause” next to your name. When you're back, pick “Osalen · In”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei saa osaleda? Vali oma nime kõrval „Paus“. Tagasi tulles vali „Osalen“.\")",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. That name and all its results are then deleted from every tab and the names below move up. Picked it by mistake? Pick “Osalen · In” again.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Siis kustuvad see nimi ja kõik selle tulemused igalt lehelt ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
78
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Group progress and leaderboard. Everything updates by itself.\",\"Grupi seis ja edetabel. Kõik uueneb ise.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Group progress and leaderboard. All numbers update by themselves.\",\"Siin näed grupi seisu ja edetabelit. Kõik numbrid uuenevad ise.\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Order: completion, then done days, then extra reps.\",\"Järjestus: täitmine, siis tehtud päevad, siis lisakordused.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Higher result ranks first. With equal results, more days at your target ranks first. If that's equal too, more reps above your target decide.\",\"Eespool on see, kelle tulemus on kõrgem. Võrdse tulemuse korral on eespool see, kes on rohkem päevi oma eesmärgini jõudnud. Kui ka need on võrdsed, otsustab see, kes on teinud rohkem kordusi üle oma eesmärgi.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Ahead are those who reached their target on a bigger share of the days they took part (COMPLETION %). If that % is equal, more days done in total ranks first. If that's equal too, whoever went more above their own target ranks first.\",\"Eespool on need osalejad, kes jõudsid suuremal osal oma osalemise päevadest oma eesmärgini (TULEMUS %). Kui see protsent on võrdne, on eespool see, kellel on kokku rohkem tehtud päevi. Kui ka need on võrdsed, on eespool see, kes tegi oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Ahead are the athletes who reached their target on more of the days they took part (COMPLETION %). If that is equal, those with more done days overall rank ahead. If that's equal too, those who went more above their target rank ahead: the more above, the higher.\",\"Eespool on need atleedid, kes jõudsid rohkem nendest päevadest, kus nad osa võtsid, oma seatud eesmärgini (TULEMUS %). Kui see on võrdne, jäävad eespoole need, kellel on üldse rohkem tehtud päevi. Kui ka need on võrdsed, jäävad eespoole need, kes tegid oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Above are the athletes who achieved their goals on more of the days they participated (COMPLETION %). If that is equal, those with more done days overall rank ahead. If that's equal too, those who went more above their target rank ahead: the more above, the higher.\",\"Eespool on need atleedid, kes jõudsid rohkem nendest päevadest, kus nad osa võtsid, oma seatud eesmärgini (TULEMUS %). Kui see on võrdne, jäävad eespoole need, kellel on üldse rohkem tehtud päevi. Kui ka need on võrdsed, jäävad eespoole need, kes tegid oma eesmärgist rohkem üle: mida rohkem üle, seda eespool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"The athletes ranked highest are those who achieved their set goals on the highest percentage of the days they participated in (column COMPLETION %).\n\nIf two or more athletes have the same COMPLETION %, those who completed more days overall are ranked higher (column DONE).\n\nIf the number of completed days is also equal, those who exceeded their targets by a greater margin are ranked higher. The more they exceeded their targets, the higher their ranking.\",\"Eespool on need atleedid, kes saavutasid oma eesmärgi suuremal osal päevadest, mil nad tegid kaasa (tulp TULEMUS %).\n\nKui TULEMUS % tulp on võrdne, on eespool osalejad, kes on kokku läbinud rohkem treeningpäevi (tulp TEHTUD).\n\nKui ka läbitud päevade arv on võrdne, on eespool atleedid, kes ületasid oma seatud eesmärki rohkem. Mida suurem oli eesmärgi ületamine, seda kõrgem on koht pingereas.\")",
110
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"PAIR\",\"PAAR\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TEAM\",\"TIIM\")",
null
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"name or LOOKING\",\"nimi või OTSIN\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"team or LOOKING\",\"tiim või OTSIN\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"LOOKING FOR A PARTNER\",\"OTSIVAD PAARILIST\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"LOOKING FOR A TEAM\",\"OTSIVAD TIIMI\")",
null
],
[
"Autahvel | Fame",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Fills in by itself when a month ends. The organiser adds the raffle winners.\",\"Täitub ise, kui kuu on läbi. Loosivõitjad kirjutab korraldaja.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Fills in by itself when a month ends. Raffle winners appear here after the draw.\",\"Täitub ise, kui kuu on läbi. Loosivõitjad tulevad siia ise pärast loosi.\")",
null
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga lehe ülaservas, kogu tabel vahetab keelt.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Tap the cell and pick Eesti to switch back. You can also switch at the top of every tab, the whole sheet switches.\",\"Vajuta lahtrile ja vali English. Keelt saad vahetada ka iga vahekaardi ülaservas, kogu tabel vahetab keelt.\")",
30.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Add your name on the Roster tab\",\"Kirjuta oma nimi lehele „Nimekiri“\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Add your name on the Roster tab\",\"Kirjuta oma nimi vahekaardile „Nimekiri“\")",
21.18
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"In the first empty row (it's yellow). You only do this once: your name appears on every month tab by itself.\",\"Kirjuta esimesse vabasse ritta (see on kollane). Seda teed ainult üks kord: sinu nimi ilmub ise igale kuulehele.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"In the first empty row (it's yellow). You only do this once: your name appears on every month tab by itself.\",\"Kirjuta esimesse vabasse ritta (see on kollane). Seda teed ainult üks kord: sinu nimi ilmub ise igale kuu vahekaardile.\")",
47.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Open the month tab and pick your level\",\"Ava kuu leht ja vali oma tase\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Open the month tab and pick your level\",\"Ava kuu vahekaart ja vali oma tase\")",
21.18
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find your name and pick what suits you in the LEVEL column. The level descriptions are below.\",\"Leia oma nimi ja vali veerus TASE, mis sulle sobib. Tasemete kirjeldused on allpool.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find your name and pick what suits you in the LEVEL column. The level descriptions are below.\",\"Leia oma nimi ja vali tulbas TASE, mis sulle sobib. Tasemete kirjeldused on allpool.\")",
47.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick this if you want a real challenge.\",\"Vali, kui tahad endale päris väljakutset.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick this if you want a real challenge.\",\"Vali, kui tahad endale suurt väljakutset.\")",
33.8
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Done at least 80% of your days? You've finished the month. See your % in the COMPLETION column of the month tab.\",\"Kui said vähemalt 80% päevadest tehtud, oled kuu läbinud. Oma protsenti näed kuulehe veerus TÄITMINE.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Done at least 80% of your days? You've finished the month. See your % in the COMPLETION column of the month tab.\",\"Kui said vähemalt 80% päevadest tehtud, oled kuu läbinud. Oma protsenti näed kuu vahekaardi tulbas TULEMUS.\")",
61.4
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuulehe veerus PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. See your tickets in the TICKETS column of the month tab. At the start of every month we draw prizes for the tickets!\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Oma pileteid näed kuu vahekaardi tulbas PILETID. Iga kuu alguses loosime piletite eest välja auhindu!\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find a partner or even a trio and make a team (2–3 people). Each of you types the team name (for example Bears) in the TEAM column on the month tab, next to your own name. No team? Type LOOKING.\",\"Leia paariline või suisa kolmik ja looge tiim (2–3 inimest). Kirjutage tiimi nimi (näiteks Karud) kuu vahekaardil veergu TIIM, igaüks oma nime taha. Tiimi pole? Kirjuta OTSIN.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Find a partner or even a trio and make a team (2–3 people). Each of you types the team name (for example Bears) in the TEAM column on the month tab, next to your own name. No team? Type LOOKING.\",\"Leia paariline või suisa kolmik ja looge tiim (2–3 inimest). Kirjutage tiimi nimi (näiteks Karud) kuu vahekaardil tulpa TIIM, igaüks oma nime taha. Tiimi pole? Kirjuta OTSIN.\")",
89.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Everyone's reps go into one pot. See the progress on the Board tab.\",\"Kõigi kordused lähevad ühte potti. Seisu näed lehel „Ülevaade“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Everyone's reps go into one pot. See the progress on the Board tab.\",\"Kõigi kordused lähevad ühte potti. Seisu näed vahekaardil „Ülevaade“.\")",
47.59999999999999
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. You finish the current month as usual. At the start of the new month your name moves to the end of the list. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali lehel „Nimekiri“ oma nime kõrval „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt. Uue kuu alguses liigub sinu nimi nimekirja lõppu. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Can't join next month? On the Roster tab pick “Paus · Pause” next to your name. You finish the current month as usual. At the start of the new month your name moves to the end of the list. When you're back, pick “Osalen · In” there. Don't delete your name.\",\"Järgmisel kuul ei saa osaleda? Vali vahekaardil „Nimekiri“ oma nime kõrval „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt. Uue kuu alguses liigub sinu nimi nimekirja lõppu. Tagasi tulles vali seal „Osalen“. Oma nime ära kustuta.\")",
116.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TABS\",\"LEHED\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"TABS\",\"VAHEKAARDID\")",
28.0
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Month\",\"Kuuleht\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Month\",\"Kuu vahekaart\")",
116.6
],
[
"Nimekiri | Roster",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuulehele. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
"=IF(COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0,IF('Juhend | Guide'!$C$3=\"English\",\"⚠️ Confirm the removal: on the red row pick “Kinnitan eemaldamise · Confirm removal”. The next night that name and this month's results are deleted and the names below move up. Picked it by mistake? Pick “Osalen · In” again before the night.\",\"⚠️ Kinnita eemaldamine: vali punasel real „Kinnitan eemaldamise“. Järgmisel ööl kustuvad see nimi ja selle kuu tulemused ning järgmised nimed nihkuvad ülespoole. Eksisid? Vali enne ööd uuesti „Osalen“.\"),IF('Juhend | Guide'!$C$3=\"English\",\"Type your name in the first empty row (yellow). It appears on every month tab by itself. Skipping next month? Pick “Paus · Pause” next to your name, and “Osalen · In” when you're back. Leaving for good? Pick “Eemalda · Remove”.\",\"Kirjuta oma nimi esimesse vabasse ritta (kollane). See ilmub ise igale kuu vahekaardile. Järgmisel kuul ei osale? Vali oma nime kõrval „Paus“, tagasi tulles „Osalen“. Lõpetad päriselt? Vali „Eemalda“.\"))",
null
],
[
"*kuu*",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TÄITMINE\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TULEMUS\")",
null
],
[
"Ülevaade | Board",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TÄITMINE\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"COMPLETION\",\"TULEMUS\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick the level that suits you in the LEVEL column of the month tab.\",\"Vali endale sobiv tase kuu vahekaardi veerus TASE.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Pick the level that suits you in the LEVEL column of the month tab.\",\"Vali endale sobiv tase kuu vahekaardi tulbas TASE.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month.\",\"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi veerus TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month.\",\"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi tulbas TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi veerus PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab.\",\"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name.\",\"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval veerus JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name.\",\"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval tulbas JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone.\",\"Kui lõpetad päriselt, vali samas veerus „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone.\",\"Kui lõpetad päriselt, vali samas tulbas „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”.\",\"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha veergu TIIM sama tiimi nimi, näiteks „Karud“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”.\",\"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha tulpa TIIM sama tiimi nimi, näiteks „Karud“.\")",
null
],
[
"Reeglid | Rules",
"=IF('Juhend | Guide'!$C$3=\"English\",\"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board.\",\"Tiimikaaslast pole? Kirjuta veergu TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board.\",\"Tiimikaaslast pole? Kirjuta tulpa TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.\")",
null
]
],
"roster_a2_rule": "COUNTIF($C$4:$C$103,\"Eemalda · Remove\")>0",
"status": [
"Osalen · In",
"Paus · Pause",
"Eemalda · Remove",
"Kinnitan eemaldamise · Confirm removal"
],
"status_help": "Paus = järgmisel kuul ei osale. Osalen = olen tagasi. Eemalda = kustutab nime ja tulemused, kinnita siis „Kinnitan eemaldamise“. / Paus = skip next month. Osalen = I'm back. Eemalda = deletes name and results, then confirm.",
"name_help": "Kirjuta oma nimi esimesse vabasse ritta. Sama nime ei saa kaks korda kirjutada, siis lisa initsiaal, näiteks Mari K. / Type your name in the first empty row. A name can't be used twice, so add an initial, e.g. Mari K.",
"first_rule": "AND($B4=\"\",$B3<>\"\")",
"remove_rule": "OR($C4=\"Eemalda · Remove\",$C4=\"Kinnitan eemaldamise · Confirm removal\")",
"day_rule": "AND($A5<>\"\",D$2<=$AW$3,$AW$2+D$2-1<=TODAY(),OR(AND(ISNUMBER(D5),D5>=0,D5<1000,OR(ISERROR(SEARCH(\"plank\",$AW$8&$AW$9)),AND(N(D5)>0,N(D5)<1),AND(N(D5)>=60,MOD(N(D5),30)=0))),AND(UPPER(TRIM(D5))=\"J\",SUMPRODUCT(--(UPPER(TRIM($D5:$AH5))=\"J\"))<=2),UPPER(TRIM(D5))=\"H\",AND(UPPER(TRIM(D5))=\"X\",$AW$2+D$2-1<MAX(N(INDIRECT(\"'Nimekiri | Roster'!D\"&(ROW()-1))),$AW$21))))",
"day_help": "Kirjuta oma reale tänasesse või eilsesse lahtrisse: number, J (kuni 2 kuus) või H. / Use your row, today's or yesterday's cell: a number, J (max 2 a month) or H.",
"level_help": "Vali ja muuda esimese 7 päeva jooksul, siis on tase kuu lõpuni lukus. Kui ei vali, oled Põhi. / Pick or change it in your first 7 days, then it's locked until the month ends. No pick means Base.",
"board_rows": [
19,
121
],
"plan": {},
"rules": [
[
[
"1. Mis see on?",
"1. What is this?"
],
[
[
"1.1",
"Kuu harjutus on meie kalisteenikagrupi (Algajad ja Kalisteenika grupp) kodune väljakutse. Igal kuul on üks harjutus: teed seda kodus iga päev natuke ja paned tulemuse ühisesse tabelisse kirja.",
"The monthly challenge is our calisthenics group's (Algajad ja Kalisteenika grupp) home challenge. Each month has one exercise: do a little of it at home every day and log it in the shared sheet."
],
[
"1.2",
"Peamine eesmärk on järjepidevus, mitte maksimaalne sooritus. Algajal ja tugevaimal on täpselt sama suur võimalus kuu läbida ja auhind võita.",
"The main goal is consistency, not maximum performance. A beginner and the strongest athlete have exactly the same chance to finish the month and win a prize."
],
[
"1.3",
"Esimene kuu on oktoober 2026 ja teeme kätekõverdusi.",
"The first month is October 2026 and we do push-ups."
],
[
"1.4",
"Kaasa võivad teha kõik grupi liikmed, ka need, kes saali ei jõua. Kirjuta oma nimi tabeli vahekaardile „Nimekiri“ või anna korraldajale teada. Tabeli link on WhatsAppi grupi kirjelduses.",
"Every group member can join, including those who can't make it to the studio. Add your name on the “Nimekiri | Roster” tab or tell the organiser. The sheet link is in the WhatsApp group description."
]
]
],
[
[
"2. Harjutus ja tase",
"2. Exercise and level"
],
[
[
"2.1",
"Uue kuu harjutusest anname WhatsAppis teada eelmise kuu 20. kuupäeval. Samal päeval tuleb tabelisse uue kuu vahekaart: seal saad kohe valida taseme, tulemusi saad kirjutada alates 1. kuupäevast.",
"We announce the next exercise in WhatsApp on the 20th of the month before. The new month tab appears in the sheet the same day: you can pick your level right away and log results from the 1st."
],
[
"2.2",
"Vali endale sobiv tase kuu vahekaardi tulbas TASE.",
"Pick the level that suits you in the LEVEL column of the month tab."
],
[
"",
"Algaja: kui alles alustad, teed sama arvu kordusi lihtsamas variandis. Näiteks oktoobris on see 30 kätekõverdust põlvedelt või kätega laua najal.",
"Starter: just starting? Same number of reps, easier version. For example, in October 30 push-ups on your knees or hands on a table."
],
[
"",
"Põhi: sobib enamikule. Näiteks oktoobris on see 30 kätekõverdust.",
"Base: suits most people. For example, in October 30 push-ups."
],
[
"",
"Pluss: vali see, kui oled juba tugevam. Näiteks oktoobris on see 50 kätekõverdust.",
"Plus: pick this if you're stronger. For example, in October 50 push-ups."
],
[
"",
"Tipp: vali see, kui tahad endale suurt väljakutset. Näiteks oktoobris on see 100 kätekõverdust.",
"Beast: pick this if you want a big challenge. For example, in October 100 push-ups."
],
[
"2.3",
"Kõiki tasemeid loeme võrdsena. Taset saad valida ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest. Seejärel on tase kuu lõpuni lukus. Kui tunned, et jaksad rohkem, vali järgmisel kuul raskem tase.",
"All levels count the same. You can pick and change your level during the first 7 days from the start of the month or from when you joined. Then it's locked until the month ends. If you feel you can do more, pick a harder level next month."
],
[
"2.4",
"Kordused võid teha korraga või mitmes jaos, arvesse läheb päeva kogusumma. Plangu ja teiste hoidmiste puhul liida sekundid kokku, ühe jala harjutuste puhul mõlema jala kordused (20 + 20 = 40).",
"Do your reps at once or in several sets, the day's total counts. For planks and other holds add up the seconds, for single-leg exercises add both legs (20 + 20 = 40)."
],
[
"2.5",
"Arvesse lähevad ainult korralikult tehtud kordused. Õige tehnika õpetame selgeks kuu esimeses trennis.",
"Only clean reps count. We teach the technique at the first training of the month."
],
[
"2.6",
"Kuu harjutus on mõeldud igapäevase rutiini ehitamiseks ja seetõttu kõik harjutused mis me teeme ühiselt trennis arvesse ei lähe.",
"The monthly challenge is meant for building a daily routine, so any exercises we do together at training do not count."
]
]
],
[
[
"3. Kirja panemine",
"3. Logging"
],
[
[
"3.1",
"Kirjuta iga päev oma reale tänase kuupäeva lahtrisse number (mitu kordust või sekundit tegid), J (jokker ehk vaba päev, neid on kuus 2) või H (haige või vigastatud; pohmell siia ei loe, et sa teaks). Telefonis kasuta Google Sheetsi rakendust ja logi sisse, sest telefoni brauseris tabelisse kirjutada ei saa.",
"Every day type in today's cell on your row: a number (reps or seconds), J (joker, a free day, 2 a month) or H (sick or injured; a hangover doesn't count, just so you know). On a phone, use the Google Sheets app and sign in, because a phone browser can't edit the sheet."
],
[
"3.2",
"Tühi lahter tähendab, et päev jäi vahele. Päevadele enne sinu liitumist paneb tabel ise X-i.",
"An empty cell means a missed day. The sheet puts X on days before you joined."
],
[
"3.3",
"Tegid vähem kui eesmärk? Kirjuta ikka. Iga kodus tehtud kordus läheb ühisesse korduste summasse, mille nimel ka võistleme.",
"Did fewer than your target? Log it anyway. Every rep you do at home goes into the group total we compete for."
],
[
"3.4",
"Kirjuta ainult oma reale ja ainult seda, mida ise tegid. Kui telefon on tühi või oled maal netivaakumis, võid paluda tiimikaaslasel enda eest kirja panna.",
"Only log on your own row and only what you did yourself. If your phone is dead or you're somewhere without internet, you can ask a teammate to log it for you."
]
]
],
[
[
"4. Kui päev jääb vahele",
"4. Missed a day"
],
[
[
"4.1",
"Pole hullu. Eilse päeva saad täna järele teha: tee mõlema päeva kordused ja pane mõlemad kirja. Vanemaid päevi tabel muuta ei lase.",
"No problem. You can make up yesterday today: do both days' reps and log both. The sheet won't let you change older days."
],
[
"4.2",
"Kuus on kasutada 2 jokkerit (siin on pohmell lubatud). Kirjuta J ja loeme päeva tehtuks.",
"You have 2 jokers a month (a hangover is fine here). Type J and the day counts as done."
],
[
"4.3",
"Haige või lihased valutavad? Ära tee trenni, vaid kirjuta H. Need päevad sinu tulemust ei vähenda.",
"Sick or your muscles hurt? Don't train, type H. Those days don't lower your result."
]
]
],
[
[
"5. Kuu lõpp, embleemid ja loos",
"5. Month end, badges and raffle"
],
[
[
"5.1",
"Päev on tehtud, kui jõuad oma taseme eesmärgini. Siis muutub lahter roheliseks.",
"A day is done when you reach your level's target. The cell turns green."
],
[
"5.2",
"Kuu on läbitud, kui oled teinud vähemalt 80% päevadest. Oma protsenti näed kuu vahekaardi tulbas TULEMUS. Jokkeriga päev loeb tehtuks, H- ja X-päevi ei arvestata. Embleemi saamiseks peab sul kuus olema vähemalt 10 arvestatud päeva.",
"You finish the month if you completed at least 80% of your days. See your % in the COMPLETION column. Joker days count as done, H and X days are left out. To get a badge you need at least 10 counted days in the month."
],
[
"5.3",
"Kuu lõpus annab Üksus sulle embleemi: Läbitud (vähemalt 80%), Raudne (100%, jokkerid on lubatud) või Täiuslik (iga päev tehtud, ilma jokkeri ja H-ta). Lisaks on kaks eriembleemi:",
"At month end you get a badge from Üksus: Finisher (at least 80%), Iron (100%, jokers allowed) or Perfect (every day, no joker or H). There are also two special badges:"
],
[
"",
"🔁 Tagasitulek: sul jäi vahele 3 või rohkem päeva järjest, aga tulid tagasi ja läbisid kuu ikkagi (vähemalt 80%). See embleem tunnustab, et vahepealne paus ei lõpetanud sinu kuud.",
"🔁 Comeback: you missed 3 or more days in a row, but came back and still finished the month (at least 80%). It celebrates not letting a break end your month."
],
[
"",
"💥 Mahukuningas: selle saab see, kes tegi kuu jooksul oma päevasest eesmärgist protsentides kõige rohkem üle. Näiteks kui su eesmärk on 30 ja teed 45, on see päev 50% üle eesmärgi. Kuu jooksul need protsendid liituvad. Nii ei mängi tase rolli. Igal kuul saab selle embleemi üks inimene.",
"💥 Volume champ: whoever went the most percent over their own daily target during the month. For example, with a target of 30, doing 45 is 50% over target that day. The percentages add up over the month, so your level doesn't matter. One person gets it each month."
],
[
"5.4",
"Kõik embleemid ilmuvad ise vahekaardile „Autahvel“.",
"All badges appear on the “Autahvel | Fame” tab automatically."
],
[
"5.5",
"Iga trennipäeva eest, mil jõuad oma eesmärgini, saad 1 loosipileti. Jokkeri ja haiguspäeva eest piletit ei saa, aga kuu protsenti need ei vähenda. Lisapileteid saad topeltpäeval (7.3) ja tiimiga (8.4). Oma pileteid näed kuu vahekaardi tulbas PILETID. Mida rohkem pileteid, seda suurem on võimalus auhind võita. Loosis loeb ainult piletite arv, sinu tase võiduvõimalust ei mõjuta. Korraldaja loosib auhinnad välja uue kuu esimeses trennis, kui kõik kuu piletid on koos. Loosis on kõik, kellel on vähemalt üks pilet, korraldaja ise loosis ei osale. Auhinna väärtus võiduvõimalust ei mõjuta, sest kes võidab, saab auhinna juhuslikult. Üks inimene saab kuus võita ühe auhinna. Võitjad ilmuvad vahekaardile „Ülevaade“ graafiku alla ja vahekaardile „Autahvel“.",
"For every day you reach your target you get 1 raffle ticket. Joker and sick days give no ticket, but they don't lower your monthly %. You get extra tickets on a double day (7.3) and with your team (8.4). See your tickets in the TICKETS column. The more tickets, the better your chance to win. Only the number of tickets counts, your level doesn't change your chance. The organiser draws the prizes at the first training of the new month, when all of the month's tickets are in. Everyone with at least one ticket is in the draw, the organiser isn't. The prize's value doesn't change your chance: each winner gets a random prize. One prize per person per month. Winners appear under the chart on the “Ülevaade | Board” tab and on the “Autahvel | Fame” tab."
],
[
"5.6",
"Kuu viimase päeva saad kirja panna veel järgmise kuu 1. kuupäeval. Seejärel vahekaart lukustub ja uus kuu algab kohe.",
"You can still log the last day on the 1st of the next month. Then the tab locks and the new month starts right away."
]
]
],
[
[
"6. Liitumine ja paus",
"6. Joining and pausing"
],
[
[
"6.1",
"Liituda saab ka kuu keskel: kirjuta oma nimi vahekaardile „Nimekiri“. Varasematele päevadele tuleb ise X ja neid ei arvestata.",
"You can join mid-month: add your name on the “Nimekiri | Roster” tab. Earlier days get X automatically and don't count."
],
[
"6.2",
"Näiteks 8. oktoobril liitudes arvestatakse 24 päeva. Kui neist 20 on tehtud, on tulemus 83% ja kuu on läbitud.",
"For example, joining on 8 October counts 24 days. With 20 of them done you're at 83% and have finished the month."
],
[
"6.3",
"Kui sa järgmisel kuul kaasa ei tee, vali vahekaardil „Nimekiri“ oma nime kõrval tulbas JÄRGMISEL KUUL „Paus“. Käimasoleva kuu teed lõpuni nagu tavaliselt, uuel kuul sinu rida ei ilmu ja uue kuu alguses liigub su nimi nimekirja lõppu. Tagasi tulles vali samas kohas „Osalen“ ja sinu rida ilmub kohe tagasi. Oma nime ära kustuta.",
"Skipping next month? On the “Nimekiri | Roster” tab pick “Paus · Pause” in the NEXT MONTH column next to your name. You finish the current month as usual, your row won't appear on the new month and your name moves to the end of the list when the new month starts. When you're back, pick “Osalen · In” there and your row comes right back. Don't delete your name."
],
[
"6.4",
"Kui lõpetad päriselt, vali samas tulbas „Eemalda“ ja kinnituseks „Kinnitan eemaldamise“. Järgmisel ööl kustuvad sinu nimi ja käimasoleva kuu tulemused ning järgmised nimed nihkuvad ülespoole. Lõppenud kuudes jäävad numbrid alles nime „Endine osaleja“ all. Kuni ööni saad veel „Osalen“ valida, hiljem seda tagasi võtta ei saa.",
"If you're leaving for good, pick “Eemalda · Remove” in the same column and confirm with “Kinnitan eemaldamise · Confirm removal”. The next night your name and this month's results are deleted and the names below move up. In finished months the numbers stay under the name “Endine osaleja” (former member). Until that night you can still pick “Osalen · In”; after that it can't be undone."
],
[
"6.5",
"Kui sa ei ole kuu viimase 7 päeva jooksul midagi kirja pannud (ei numbrit, J-d ega H-d), alustad uut kuud pausil: skript paneb su 2. kuupäeva öösel nimekirjas pausile ja uue kuu rida kaob. Nii ei jää lahkunud inimesed ühisesse eesmärki ega protsentidesse. Kui sa pole terve kuu jooksul ühtegi korda kirjutanud, jääd pausita (võib-olla alustasid poole pealt). Samamoodi jääd alles, kui oled uuel kuul juba midagi kirja pannud või liitusid alles viimase 7 päeva jooksul. Tagasi tulles vali nimekirjas oma nime kõrval „Osalen“.",
"If you haven't logged anything (no number, J or H) in the last 7 days of the month, you start the new month paused: on the night of the 2nd the script puts you on pause on the roster and your row on the new month disappears. This way people who have left don't stay in the group goal and percentages. If you didn't log anything at all during the month, you are not paused (maybe you started halfway). You also stay in if you've already logged something in the new month or joined within the last 7 days of the month. When you're back, pick “Osalen · In” next to your name on the roster."
]
]
],
[
[
"7. Ühine eesmärk ja topeltpäev",
"7. Group goal and double day"
],
[
[
"7.1",
"Kõigi kordused lähevad ühte potti. Ühine eesmärk on kõigi 1. kuupäevaks nimekirjas olevate inimeste päevaeesmärkide summa terve kuu peale. Iga inimese päevaeesmärk sõltub tema tasemest (kui taset pole valitud, arvestame põhitaset). Näiteks kui 8 inimese päevaeesmärgid on kokku 420 kordust, on ühine eesmärk 420 × 31 päeva = 13 020 kordust. Hiljem liitujad aitavad meil sinna kiiremini jõuda. Seisu näed vahekaardil „Ülevaade“.",
"Everyone's reps go into one pot. The group goal is the sum of the daily targets of everyone on the roster on the 1st, for the whole month. Each person's daily target depends on their level (if no level is picked, we count Base). For example, if 8 people's daily targets add up to 420 reps, the group goal is 420 × 31 days = 13,020 reps. Later joiners help us get there faster. See progress on the “Ülevaade | Board” tab."
],
[
"7.2",
"Kui jõuame eesmärgini, tähistame seda koos grupipildi või mõne muu laheda tegevusega!",
"When we reach the goal, we celebrate with a group photo or something fun!"
],
[
"7.3",
"Vahel teeme topeltpäeva: korraldaja märgib trennipäeva kohale 2x. Kes teeb sel päeval oma eesmärgi kaks korda, saab lisapileti. Päev loeb tehtuks ka tavalise eesmärgiga.",
"Sometimes we have a double day: the organiser marks a training day with 2x. Do double your target that day and you get an extra ticket. Your normal target still counts as done."
]
]
],
[
[
"8. Tiimid",
"8. Teams"
],
[
[
"8.1",
"Koos on lihtsam. Leia tiimikaaslane või suisa kaks ja looge tiim (2–3 inimest). Kirjutage kõik kuu vahekaardil oma nime taha tulpa TIIM sama tiimi nimi, näiteks „Karud“.",
"It's easier together. Find a teammate or two and make a team (2–3 people). Each of you types the same team name in the TEAM column next to your name, for example “Bears”."
],
[
"8.2",
"Tiimikaaslast pole? Kirjuta tulpa TIIM sõna OTSIN. Kõik otsijad on näha vahekaardil „Ülevaade“.",
"No team? Type LOOKING in the TEAM column. Everyone looking is shown on the Board."
],
[
"8.3",
"Tiimikaaslased utsitavad üksteist. Kui tiimikaaslase lahter on õhtul veel tühi, saada talle sõnum „Kas täna juba tehtud?“. Suures grupis me kedagi nimeliselt välja ei too.",
"Teammates nudge each other. If a teammate's cell is still empty in the evening, message them: “Done today?”. Never call anyone out in the big group."
],
[
"8.4",
"Kui tiimi kõik liikmed teevad kuu 100% täis, saab iga tiimiliige 4 lisapiletit. Jokkerid (kuni 2) ja haiguspäevad ei võta tiimi lisapileteid ära, nii et igaüks võib kaks päeva Jokkeriga vahele jätta. Kui keegi tiimist jääb alla 100%, ei saa neid lisapileteid keegi. Lisapiletid tulevad tulpa PILETID kuu lõpus, kui tulemus on selge. Lisapiletid käivad 2- ja 3-liikmelisele tiimile.",
"If every team member completes the month at 100%, each of them gets 4 extra tickets. Jokers (up to 2) and sick days don't take the team tickets away, so everyone can skip two days with a Joker. If anyone in the team stays below 100%, nobody gets these extra tickets. The extra tickets appear in the TICKETS column when the month ends. The extra tickets are for teams of 2 or 3."
],
[
"8.5",
"Tiim kehtib ühe kuu. Tiimi saad kirja panna ja muuta esimese 7 päeva jooksul kuu algusest või oma liitumisest, siis on see kuu lõpuni lukus. Nii ei saa keegi kuu lõpus lisapiletite pärast kiiresti tiimi teha. Tiimis olemine ei ole kohustuslik.",
"A team lasts one month. You can set or change your team in your first 7 days from the start of the month or from when you joined, then it's locked until the month ends. That way nobody can form a team at the end of the month just for the extra tickets. Being in a team is optional."
]
]
],
[
[
"9. WhatsApp ja ausus",
"9. WhatsApp and honesty"
],
[
[
"9.1",
"WhatsAppi saadame 20. kuupäeval uue harjutuse, 1. kuupäeval stardi, pühapäeviti nädala seisu ja 3. kuupäeval tulemused. Kuu lõpus küsime ka, kas kuu oli liiga kerge, paras või liiga raske.",
"In WhatsApp: the new exercise on the 20th, the start on the 1st, a weekly update on Sundays and results on the 3rd. At month end we also ask whether the month was too easy, just right or too hard."
],
[
"9.2",
"Iga päev „tehtud“ kirjutama ei pea, aga pildid ja kaasaelamine on alati oodatud.",
"No need to post “done” every day, but photos and cheering are always welcome."
],
[
"9.3",
"Kõik põhineb ausal sõnal ja tõendeid me ei küsi.",
"Everything runs on the honour system. No proof needed."
],
[
"9.4",
"Kasuta tabelis eesnime või hüüdnime, sest lingi kaudu näevad tabelit kõik.",
"Use first names or nicknames in the sheet, because anyone with the link can see it."
],
[
"9.5",
"Reegleid võime muuta. Muudatustest anname teada enne uue kuu algust.",
"The rules may change. We announce changes before the new month starts."
]
]
]
],
"palette": {
"15202B": "2B241E",
"2B55E6": "8B6B47",
"E6ECFF": "F2E8DA",
"C9D5FA": "E3D3BC",
"1E3A8A": "5C4630",
"F1F4F8": "F6F1EA",
"F7F8FA": "FBF8F3",
"E4E8EE": "ECE5DC",
"EEF0F3": "F2EDE6",
"5B6673": "6E655B",
"C9D1DC": "D9CEC0",
"9AA3AE": "A59B8F",
"8A94A0": "978C80",
"A6AEB8": "B0A698",
"DCE1E8": "E6DED3"
}
};
var EHITUS = 'c4f76bd80696';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
