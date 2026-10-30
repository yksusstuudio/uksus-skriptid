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
  '2026-10-31': { silt: 'NATO',
    markus: 'NATO test: Tee nii palju kätekõverdusi kui suudad 2 min jooksul. Vt. reeglid siit: https://shorturl.at/2ytSl\nKirjuta lahtrisse oma tulemus. Täna loeb iga tulemus päeva tehtuks, ka siis, kui see jääb alla sinu päeva eesmärgi.\n\n' +
      'NATO test: Do as many push-ups as you can in 2 minutes. Rules here: https://shorturl.at/2ytSl\nWrite your result in the cell. Today any result counts the day as done, even if it is below your daily target.' }
};
function eripaev_(m, p) {
  if (p > m.days) return null;
  var d = ymd_(m.start);
  return ERIPAEVAD[d[0] + '-' + (d[1] < 10 ? '0' : '') + d[1] + '-' + (p < 10 ? '0' : '') + p] || null;
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
  proovi('tekstid', function () {
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
  });
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
var VV0 = 19, VV_VEERG = 7, VV_MAX = 100;
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
  var C = VV_VEERG, koht = b.getRange(VV0, C, VV_MAX + 3, 4);
  koht.breakApart(); koht.clear();
  b.getRange(VV0, C, 1, 4).merge();
  b.getRange(VV0, C).setFormula(tx(Kuu + 'kuu fortuuna soosis neid osalejaid', 'Fortune smiled on these participants in ' + EN_K))
    .setFontFamily('Oswald').setFontSize(14).setFontWeight('bold').setFontColor('#2B241E').setVerticalAlignment('bottom').setHorizontalAlignment('left');
  b.getRange(VV0 + 1, C, 1, 4).merge();
  b.getRange(VV0 + 1, C).setFormula(olek
      ? tx('Loosisime ' + olek.aeg + ' ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem oli võimalus võita. Kõik võitjad on ka vahekaardil „Autahvel“.',
           'Drawn on ' + olek.aeg + ' from the ' + EN_K + ' tickets. More tickets meant a better chance to win. All winners are also on the “Autahvel | Fame” tab.')
      : tx('Võitjad loosime uue kuu esimeses trennis ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem on võimalus võita.',
           'We draw the winners at the first training of the new month from the ' + EN_K + ' tickets. The more tickets, the better your chance to win.'))
    .setFontSize(8).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('left');
  b.getRange(VV0 + 2, C, 1, 4).setFormulas([[tx('NR', '#'), tx('NIMI', 'NAME'), tx('LOOSIPILETITE ARV', 'RAFFLE TICKETS'), tx('AUHIND', 'PRIZE')]])
    .setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  if (!ws.length) {
    b.getRange(VV0 + 3, C, 1, 4).merge();
    b.getRange(VV0 + 3, C).setFormula(tx('Võitjad tulevad siia pärast loosi.', 'The winners appear here after the draw.'))
      .setFontSize(10).setFontColor('#6E655B').setHorizontalAlignment('center').setVerticalAlignment('middle');
  } else {
    var r0 = VV0 + 3, n = ws.length;
    b.getRange(r0, C, n, 3).setValues(ws.map(function (w, i) { return [i + 1, txt_(w.nimi), w.p]; }));
    b.getRange(r0, C + 3, n, 1).setFormulas(ws.map(function (w) { return [tx(w.et, w.en || w.et)]; }));
    b.getRange(r0, C, n, 4).setFontSize(10).setFontColor('#2B241E').setFontWeight('normal').setVerticalAlignment('middle').setHorizontalAlignment('center')
      .setBackgrounds(ws.map(function (w, i) { var c = i % 2 ? '#F6F1EA' : '#FFFFFF'; return [c, c, c, c]; }));
    b.getRange(r0, C, n, 1).setNumberFormat('0').setFontWeight('bold').setFontColor('#8B6B47');
    b.getRange(r0, C + 2, n, 1).setNumberFormat('0');
    b.getRange(r0, C + 1, n, 1).setHorizontalAlignment('left').setFontWeight('bold');
    b.getRange(r0, C + 3, n, 1).setHorizontalAlignment('left').setWrap(true);
  }
  b.setColumnWidth(C, 40); b.setColumnWidth(C + 1, 130); b.setColumnWidth(C + 2, 120); b.setColumnWidth(C + 3, 210);
  props_().setProperty('LOOS_VAADE', voti);
  return true;
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
function versioon() {
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
  } catch (err) { Logger.log('Versiooni kontroll: ' + (err && err.message ? err.message : err)); }
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
function kuuHarjutusVersioon() { KuuHarjutus.versioon(); }
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
"=IF('Juhend | Guide'!$C$3=\"English\",\"Higher result ranks first. With equal results, more days at your target ranks first. If that's equal too, more reps above your target decide.\",\"Eespool on see, kelle tulemus on kõrgem. Võrdse tulemuse korral on eespool see, kes on rohkem päevi oma eesmärgini jõudnud. Kui ka need on võrdsed, otsustab see, kes on teinud rohkem kordusi üle oma eesmärgi.\")",
40
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
var EHITUS = 'e373f7a50f9b';
var KH_XLSX = [
  "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"
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
