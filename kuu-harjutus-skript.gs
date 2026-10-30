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
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest average EXTRA, i.e. most above your target per day on average\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige suurem keskmine LISA ehk keskmiselt päevas kõige rohkem üle oma eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
185.6
],
[
"Juhend | Guide",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges: ✅ Finisher (80%), 🥇 Iron (100%), 🏆 Perfect (every day, no joker or H), 🔁 Comeback, 💥 Volume champ. All on the Fame tab.\",\"Embleemid: ✅ Läbitud (80%), 🥇 Raudne (100%), 🏆 Täiuslik (iga päev, ilma jokkeri ja H-ta), 🔁 Tagasitulek, 💥 Mahukuningas. Kõik on lehel Autahvel.\")",
"=IF('Juhend | Guide'!$C$3=\"English\",\"Badges:\n✅ Finisher: 80% of days done\n🥇 Iron: 100%\n🏆 Perfect: every day, no joker or H\n🔁 Comeback: missed 3+ days in a row but still finished\n💥 Volume champ: highest average EXTRA, i.e. most above your target per day on average\nA badge needs at least 10 counted days in the month. All badge winners are shown on the Fame tab.\",\"Embleemid:\n✅ Läbitud: 80% päevadest tehtud\n🥇 Raudne: 100%\n🏆 Täiuslik: iga päev, ilma jokkeri ja H-ta\n🔁 Tagasitulek: vahele jäi 3+ päeva järjest, aga kuu sai ikka läbitud\n💥 Mahukuningas: kõige suurem keskmine LISA ehk keskmiselt päevas kõige rohkem üle oma eesmärgi\nEmbleemi saab, kui kuus on vähemalt 10 arvestatud päeva. Kõik embleemide võitjad on näha vahekaardil „Autahvel“.\")",
185.6
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
"💥 Mahukuningas: selle saab see, kes tegi keskmiselt päevas oma eesmärgist kõige rohkem üle (kuu vahekaardi tulp LISA). Näiteks kui su eesmärk on 50 ja teed enamasti 60, on sul keskmiselt umbes +20%. Päevad alla eesmärgi vähendavad keskmist, nii et LISA võib olla ka miinuses. Arvesse lähevad need, kes on kuus osalenud vähemalt 10 päeva. Nii ei mängi tase rolli. Igal kuul saab selle embleemi üks inimene.",
"💥 Volume champ: whoever went the most over their own daily target on average per day (the EXTRA column of the month tab). For example, with a target of 50 and mostly doing 60, you are about +20% on average. Days below your target lower the average, so EXTRA can also be negative. Only people who took part for at least 10 days count. Your level doesn't matter. One person gets it each month."
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
var EHITUS = 'feaa89829154';
var KH_XLSX = [
  "UEsDBBQAAAAIAEuqXl1Gx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIAEuqXl3rpPUV8gAAACsCAAARAAAAZG9jUHJvcHMvY29yZS54bWzNklFLwzAQx7+K5L29pIWhoeuLY08KggPFt5DctmDThuSk3bc3jVun6AfwMXf//O53cI32Ug8Bn8LgMZDFeDO5ro9S+zU7EnkJEPURnYplSvSpuR+CU5Se4QBe6Xd1QKg4X4FDUkaRghlY+IXI2sZoqQMqGsIZb/SC9x+hyzCjATt02FMEUQpg7TzRn6augStghhEGF78KaBZirv6JzR1g5+QU7ZIax7Ec65xLOwh4fXx4zusWto+keo3pV7SSTh7X7DL5pb7f7LasrXi1KgQvar6rhBS3Uty9za4//K7CbjB2b/+XccW/GV8E2wZ+3UX7CVBLAwQUAAAACABLql5dmVycI/8FAACcJwAAEwAAAHhsL3RoZW1lL3RoZW1lMS54bWztWltz2jgUfu+v0Hhn9m2LjW0CbWkn5tJ227SZhO1OH4URWI1seSSRhH+/RzYQyzaGdkmT7oYHjCV937no6BzJ5tWb25ihayIk5Unfcp7b1pvXz17hFyoiMUHQmcgXuG9FSqUvWi0ZQjOWz3lKEuibcxFjBbdi0ZoJfEOTRcxabdvutGJMEwslOCZ96/N8TkOCJprSev0MoQ3/iMFXoqRuy1pDJi7DTHIRaeX92YjZlbO5y+7lSg6YQNeY9S2QP+M3E3KrLMSwVNDRt+zsY7W2HC2DBCiY2kdZ",
  "oBtnH5OuQJBp2DbpxGK65XPGXu9kWNambWjTAB+NRoORU5ZehOMwBI86uym8cdcJShqUQFuaBk0Gtm97tTRVbdzdNL0gCPxeHY1bofF203TtjnfarqPxKjR+g2+C08GgU0fjV2g6u2nGJ72OV0vTKdBEjCZXu0l01JYDzYAAYM7Zu2aWLrB0S9FvonTLdtltF+KcJ2rPSozxNy7GMM6QzrCiCVKrlMxxCLgBjqeC4jsNslEEF4aU+kK5u0+rhWQoaKr61p8phhRzN/b3327H4/bwZXZ13Zco/2HrBtcOvPX1JL8O3Px6On7ZJOQdThYlIUFv6Gjs4MSzMyGng1EmJPAdfx+ZLJH5QTfQWG/su/uwqoTt+EEm92SYG9np2CN97Z0OvUauU4GnRa4JjYlEn8gNuuAxOLVJDTIVPwidRJgaUBwBpAkxUpGB+LTCrBEQEHO2vgjI342It8tvhj2XkVgq2oT4EMUG4oxzFnDRbPsHrUbR9mWy2KOXWBYBFxhfN6o1KMXWaJnC8qWNQgYRMUw5ZxBkeEESopDu41eENOG/UmrMzxkNBZd8rtBXigJMmx05oVNVj35HY5joFd4TTYZHz76ggLNGgUNybUJgbWPWKIQwYxbe4qXCcbNVOGZFyEesokZDLlciNCZOKgimBWEcjWZEykbwZ7EyTPqAIbM3R9YZW8UmRCh61Qj5iDkvQob8ahDhOG22iyZREfReXsFKweicq2b9uLmG9T1MLE72R9QXStQPJqe/6CKqD0bdsxRmCa3UPl0PaXJQPWQUCuJTPXzM9fAUdizse6rgXsB/tPYN8TI5J7DOn0rfU+l7Kn2PqPTtzUjfWfDM4pYfIzdHxLtTY7zv0DinjF2qFSMfpVknJdg5G0PvXWvenvFtz7NpBD8Ns1q1WEAuBM4akeDqb6qiywinoJNjlSQspKHLthWlXMIx3DK7ditVHpc/5qLg8myQbz6GMvmwOuOzfJxr1w/MDN3ILanb0vru",
  "NMHVoo9lhnvyUGY4OeOR7HD8A+3wj2BH3lIKM705hK0h5DvQptPOrYPliRmZ6TAtBfkmnB9fjMsIz8g6yJ3DvOq4x46O7r8PjoIdPfeh7DhGlBcN8Q41xH+QMLf3hXlWaWqKhqZNaisJS9ANGO63fQuFOO1bcziDwc84BXlSF1jMFknfCpUoL5PaInS480uu3+HRkuPtumE73b6j3GW0qZBqiGWUE2ejyt5lSY2r2r6np+R+fdW6byvcrvOrWpHf1UQ4mc9JqGqjvNBVEp331OV7vlREXEazGzRlS3GBwTtevhxnVMKWsL25EZDJvfVKNStLfWYqv7eoSWD5mxOWRnhdV7u7801OV10RW/3Ls1Bj8l1zyUf35Tv3J/rOf/LdY/XdOneQhLiziiNCOBUJjHRy6FtcqIhDuUsjGo4FHKbqTAQvIEhm2gGI6Tf02jPkulQ4t+/xMv6KWAYHOnVBF0hQKMIqEoScq7W/v0+q067d1mcJbC2kkiGrvtAeSmvcMyXXhE10Mu/oabJQtClO1bxr4HcEbKnZzK3Txfh/exb17J94+DFM8I55hvOaznCFjVjvoaw98ma+feC0tf173MynWEVIf8F+ioqQEativt6vT/gFrDu0ffCBIJv80V2n9m3jFHzUrVqlZWsRv8oJ+C4ku/av/HikEGvuobFm248y1vyaUPN/NNJ0W129yA6nceEpqG6o/LNN74Cm30DDIZnjJVOytW4lt0rgwea/N8AKHVuG18/+AVBLAwQUAAAACABLql5d/+NEBSkcAAANZwAAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbO1d63fiuJL/Pn+FmpnpTs6yBMw76cchCd2h89xAuu/snv0gsAIKtsVadtLZM3/8VpVkYxKITaZ3736Ye+Z2wLZkqZ6/KpXE+wcVzvVMiIj98L1AfyjNomixv7enJzPhc11RCxHAnVsV+jyCr+F0Ty9CwV1q5Ht7TrXa2vO5DEof",
  "39O1q/Dj+4iPj5SnQhZOxx9K1apz6DRq/dLex/cqjjwZiKuQ6dj3efh4KDz18KFUKyUXruV0FuEFeHrBp2IoopvFVQjf9tL+XemLQEsVsFDcfij1avtHtSq1oEe+SfGgM5+ZnqmHL6F0z+DVMMdqicEIh8ITk0i49HKkw1ipOT4+cPERaE8P4Fs4/LkXR8Lz8GUw1P+y7y2lw8KG2c/J+z8T5WC+Y64FEOW7dKPZh1KnxFxxy2MvulYPJ8LOuYn9TZSn6V/2YJ6tVeolNol1pHzbGobgy8D85T8ssTItOpXWhhaObeE8adGobmxSt03qNFkzOpraMY/4x/ehemAhPY1TaFSTXtJJASUn+AQRzny//Tj4vPPuazwTgcv+ZF9i6Yp3b347+q3+odQPpp7Us1K59PZXx6kenA5vhuz88mJ0cvYHOzrpnZ31L770V2732enNDTvpXX+9Gd0MS7vv924/vr+HweL/J/b1h+b1QAAYFEpreudo3Z09mFc6OcdMrt7YPDmH+qgXntyZiN5pNgXF89W9DKZvWI8FIKrihwgnUgsm7kX4CDeDaFZhX5UMGPxnLrr8kXHo3FNT9qhiUDOhQZLYTISign1LOY0j7gu2EIs4esMGU87mccziWLMZD+/iKNZlpjT3hMsk3FwgMTsH4p7dwRcewOUo9oQfw0C0lNBahne8som0zkbSOnmkrVvSbpabwzr10aA+ZIDmYxiFcFeCIEYfT4Xw2B4748E0BnPxfi+CN+Ct5SBMB80NHfSFjuRqs5URNnJHeNSgF7QKM3/EFyyaCTYBi0KcXMjJnNFAWKSYfpDRZAYWYzKvsD9UzCYcbJCn0zs8ouaRWjB1a4UCLFqZrj7MlAdcI6NunhcapeIbB75z5vFZFEp4Ajh9zz3J7LAqDCkJTTh34cZMRNwFvnOSD/w+5zx0JQNJaToHHliz8J6DFM3VNMaXAxdMqzGbY0drhGWFrC1DVqezmfEtImu7MFmHo971",
  "iJ30r9E89M5u4DsbDgajDWJ7ZPrvbBbOthlja90QVx7s2MnUKrUX5tOh93U3yGFtneiaJrVqYRr0XNfYhAD1H3wXisS10pEIkUvwxKkMSRCUz1kgfZlhLkjF2187juMcXICHBZ2X9LV6kMPLrjX+7cpmC3nYNVOprbES9pZTeJYDM69bGeqICX8RPTIcyo5Eo/oIWqUedo3qqMADg6ngcanhy0TsZ8jDFwvBQ7yeNbdIJzZ+ZDICBHBbyZBMaCCLBpt4z8Gdw99QRnB5Rwsi9Vx5HthOePNQgO5EAswoICM0zUZr5hqeCd19sKlBbIgvPT8eMzT4oGdAfzTTWYbkqRGIhhG9FyiPz2wifXKvvkEq/+NbD7wq6VHvP2EaNadTbdcPWCIgwCMjXS9Y0JoFB51cPao5hRSp5ryoSc46TbJttlClS8C+JGZLqUhtNcmQB0Ljoc7d8xW+RaltRR2LwFTmMbFeRIFq9RfYWN9WhT7LIGsp0pk9zMC76BiEH+8i6EASnPW/9c8YgL/YDypsBFdo8gBi9SSUC0TJmvFQsDHieQIhQmZsTEIQQBWgOWzUG/bLAC81vMlDb6XGcgz9Aql8EQmCG8JzAX64qFjc8xZKebm60CigC40XiNh4nS5cziOlxmBg/2SXk+glRWgWVoRWMUVovagI9bWK0NpWEfoJ6gSA8bgQDKIpCAkCsLliYaTElS5a5RUkOTdGE9kcxWT3YBJgFKfwbA4frd9tN1+YefsFPra3VYaRgtmB65hBZAt8BLmcKs9FgVw896apOdgHFwF/58IQAZBbZPshYAePG3QOCsFGSDhsHcQ+ikpEYJ0NbqnpDDqiZyMeQkxQXqLDKA5Bs6ahEEHZKJd9Bt+tI/4I3isE7EvAf2SIH4AaLRmR8oQcIBgqzw3gzRYOPvE3icZC6AteCtzavZRj464g6mdR5gUGSAYSgKN1j/BYwO0E4WosmRDaN03COSBLmXQgATh65uNMjKkrgYSa",
  "CWCImMNdUHmebT4FG2I+mn/HNDqc+ttf6x3nQM51rnnoFNY+C2hanUq1m/3f5hCgZjFMo7h7AbvGFjMViDLDOAtZ/kWpKZjDIYJ3jfCE7LKWU4r+AMzPjJjY5/hkouIgQsGYcOzDdsjGMBEA6Bg4vAOA5EoTMFBQYMy3iQ9mYIs1Qh/uoUBrEjxpxN3YcxtqjFUE08Zog/qZoDySxIGg3KoARGvONcrAygwkC0E7AlJ88AAQr0qYDAInFDPz6DsJtiGI1BQshRZkIUyXMAmcUwh9U3hB7axRAXQlJIYqqKJ4j7SNDE3qhGUZAurAFSTO5EbEPOQcOgbZYiZ8yRMZx6KrWjVXZpxafkDj1LaMaL6f9EZsdMlGf1xhTHM+OO6xs97J6HowxKzHADMevePepgDHvu+FCMdxioY4zhKjNIvpxKFjQcmmyLteXeefklbFw+mTFX+0o0Lg7kQFrt5NnFPG/kYqAmG3sAZNLIrxedZF7dyDiWk0D0DAxDwOQHl2jdtaWjpj+0gg7bNzaD6fx7kClUCU1mZT4lgY0t4iU9ZtNTsHaa4A4h2bFwJ6wFQTFddoVdwYrPaUpg/OqpJpfmJTQxAS2lmB7VEKghxUuIxDuVNqDsANFc7HRIIC7Y8XPHfyFv6084WtlSCASq2osFlY09kUFKwXtta2wkYJ66yz/mRkC0wsiOADUJQZvATEN+Kn0IjOFFBqqgTyA4ECUH8aqnhh5fEBZFH5C8S+typEpny1ntJd4wo/pYIo53OwgZTfUyC8IKezKHatKGddrAlAIQim+NWKujBJd7iCKA2BOLl+zPokEqAjDyB5LmfbhTnb2d6MdF42I43mWs52tuXsdxFETAHvNnCXcnXI4TKw612YcAyVCXj2jKUQEyAfhxxYaJNmxu+tohrMsNRqB4lnI46Wn5A/w71lXtawSnM/jmQuf7pF+VO3Hq9VeykUrduswabA4+vaNGx1W44cKQSrgGBAhxDCILq2DLGJ",
  "qa/0F8iXNeipHTSQ6KuaA08dFkkCNcucOl52EUETimKAhVwATytA2sKMAHQKVIt/WuMBbMbsqx1RBd6E6kXQWmcsqQFILo0H3iyjSvIpY1oxqS8gpEBGoyrno9p6rTBrnUKstSn76gbWnqxlrbMta4eYawCtkcFdHAp3lasna7k6mnFM712evmGHArVOU75CoYDM4jDKroUgE0+4nIqUARDJTDkETGgen+rcM2aepMwcmtQevtT0p0D9gCQoGHM+uwMqQuATJ2qZm/au1wuzq7G1pawb5ODUNvDuH2t519gab3FSyjslcaHocTWk4K6rTbZ1mT+9Uh5q0D0u1XgSsBZ8Q9Kix8HVprFdQAD7lku/whii3iok7gYAOMVzBY8C051gN+CzkJ7YBL7rW0OLzyqcKjRztLInwfckhkxH4J3ZLf4DKpGOIMk0kGGssEvPTSwahm6emsyFi/S/CVBMNRihNBqXLhizvvQAElrxt0s/SYQOYk38SkN+TBkEwkd3ltoryfyYEuMmGMvjXWGUUO8Ujrvq3fy4q97dMu66Ghydsj8ub65N4hNXz3pnA3Z53qPU5UaWd/PirUa1aLzVSOLJl9Yd7cp1suzcv76+vN4pMMGjk8vLYX+HltV3BhfHg+v+0Win9K70lvuLg3c94OkM07t/ss/cx+a9w98adK/07k3vu1Pa3QWECm6Rh6gGn8U4tB/PeTihdahFKD36jle/xoGgPx5+68VTmBA6AbGIBGaLMB0yiZT5dAEYzF48FhPzcde8PF0e32dmqDdXV/3rV8ygizP4SVQgMkiUEWHogJ/PraJFWibU8Og6l0SIOLB/6aqhiFyShPoweWX6aGhCH48hiDOfE6IkS/p/lSgdmBDMKEeLGxZGNBovCKazmoEtLJhm6Gf9z6NXjL9WS0nC0QzusyGAeMwsmg6277FhO4SRv2I4dWjtRQdvp9FBCRjHdl47DOqJvu2WkD92km9/rXXqB+wQs7Gv7br5",
  "tLcrD1Dra3trPRubAMz16u7af4n8zZ9G/uYq+cu1XfP9fHD8t5j+Lab/X8XUKTer1d2/aFOrKa2WUSp4mp435Xf8nySxzk8jmfOSxF6Z0HEmf67Y/kS5HcnF4p8kto2fxoPGz7Wufwvs3wL7fyuwxs4WQM71wsHf9rmfhs39FF+AtqgDww/SjU1RbWPrBNFXXEbT2L0Mpp/YEIsnbN2DuqVVqTLmMXjAwO9KuHovQiznr9BYPMzSepixcKktZzy8t0sWssz4lDNPziINdzS7h3CLB67MzZM2CieOGjZxVK9XXsgpNFrb0hsBEOYWEiXdSO+tE0dDKtfyFVB9IdTCoxz2EGuqmAi4L+dxfiFho3ByptEpRJ/OtvRBU2P/6I202XpV5wqTxCYfSbU2uHCjo1AFUxGasmgPhGoeS8zsYtn7FPyFTwu+d7kZrUbhdZVmtQjRmtWthQqRK65YgGHdRLRm9a8SjT1wXCDBGiCPTWYcdNSWHC3JB0aTuyBvLpax6hgT8vfGAXt3fB5HWuQmx5uF1zKaNgnRqVbw46Y8RNPZtionybhSLSQW38BsYaqZgs/sAropQG6bnOttqHxTHoOWL6mVMdViKjS3H+DtRFCTPKfEecCobNmka1kcRNLLtITR6rROzKXFDhob1Q1lRgW8QgMDPYaPwKkZDzEZbO4F4keULHuBfTVXk2UvGjH3zboXx3yw3QLgSZdj2Y5N8VLts4DJrikEwCoy7k1jKuBJV1xwsZPS/T4uO0cVNpSmBg1LYqmNZx5dxIFkXjyPtSkb06ZqNsK88j0JGDSiIjRqmVrQCrvmei58LFJajnwRKnVPY09WWfH9NEgP+k8KNiS18YWkNTc/XSkKXQ1GM1dU64Uz1M1Gfoa62dgyQ90bmU1RrH9xjBXqNzfsDMZfqx9cbdwCdWTf8kJ+utksClGahZZXmq2X1+471d/XrUk1t3aBx1j2BnLgUSQP3aL+kXqgbtJKyrt7VNgAnkc7",
  "nyiYWeKjJ39P1huPLs+vzvqjweWFLXleVeaIj2lXAEkqiM99Umbhc8+8O7Oga0rasCqjbDxMIvdYxChpIewS9ASEFiwk6D4LbFv3SW1mWjt9c9Y/vxnmCmhhf95MFls6zUrrBVZah76JlVgP3e42agdrGbq13z7k7lTo/V/e/trtdroH7LPhXLifMJdsLi7Y/4Jv7tabtQM2AL++z2rV6u+/2OE4EMKI8FZMov3l7rkyCxTYLlz/B8N8Qs92nGb7gB0pX+C+q30sTsfq8/q/mBchXKU9JuM4SpfjjCyZ5rVW84B9Q2kR6DP8xT6bAQmR/Ryrr8CH9P8xuu4B8q2AlSawxsfqXmSrTQC+kcBS0btp9UuPjZEUYMSFq5ciXqsa+w1jTAaYkWm08qbZgwwCQNe0Ioj7YIOkjBljm0SU+/7YE8KX7pLeZ4mIguTubxbqDPGveewG4hn5bS2FjLUnga4r2w3LuP8F3YipgwBnc/KvEc/wYwRoX0tcXIemqAu4cc12iLzJ+iJr7e9gcCZKQP3BomMsqVmqXDJow7FzPgO/E4BDxyRBUs03NQhG+Gwu9JzW+88Gwx4Ts7m9onGvXCbBkG0aqhk4pReKfn5J6I0Oa2zgE1WLAGtWjQlwGYIfYesWlu/L+DEmEuYtix2iO04Vr9aWzPhKjbctckji3KTWIc+gFMa6raRqttZ6yaC0qkUMSrV+8PbXVrNa7641LK3qK1bZM/toEVUBqp3MVtQQr+LfGgv57S2wMALIJaKkaMgUZQMII82bSlBiMCjmmTJZCFCwR4vWPPWQlJSRcnqP7PeM0zGtUv0dDY5O+6PhRr/DetEqxsxuXHsQzA35AzgT+d8QRCdVafYVb+wWjSgUQSAzmiNIY3yQjDsjPzFKz1OhDQCGEb6qwZSUlgvpiUgui5juEHRKwIBPembmwcgWCSxVM+PycKeckEvZhyDCukVsixAtzyteDdBhH1fSvc4Wjpqx4lZoMwphxrSM",
  "TBiPZzJw4zd5+1ULxyYtZ+vkTcvJV4VOrdterwJbF1+tlpVgsQmKiYduxTof/F7TaRCTCSAI+MS4L8R/ss2EhIM2imNRT2DrR1ZAOHGmVsE/y4a5+7pahWumWo3CqLzVLLABubklKu/3hoP+NRtdfumPTvrXSKvLyyEDHHk2OBkNe+cbtyI385B5q1UUmbcs8uu8JHDtIgJX3SBw7a1tLm42RLEIo8CALjBbiKiiUCoypz6fY61mJLjPdhxboFe36azdCuujiTaQnjahaWPZ8HHam7WDxk78ANwF1voQd/Xupia13ztP7emTLVxlI9qRLZhHeITdVdiFos5tXeLZ5eXp4OJLuq9xAbZHIs2Wwa6OpcYqbM8Hl0ybXdQUTa9cmY/Eql0d7aZbCewz0myT3AmS6isx1+yUh7G7+2yLFli8BQdHMTgvI5pKtxYnW7coE1NhI+p2ATHHsmr1cjQcXOSqW2fb4vujlo0NikvEID23AFnoU5UPFVSjvdcZJvGIAGWZCSsBcMtH56xZAxgehTzxb9Y76yfu2Xhh3Ka3FJnE6fIHswMCQznDhuV+Dk/KOW4cigTV5ZLlgoFkt7AheiNAS22hAXCzAQ01t94m9Y7uOveY+jx4YWQ7WbYWpm4cbWduNqJVGJu1C9V3t3OhWbfTWQ/I2lsDsoHxMSqccgioQAx8Hs61qY0we96cH8RTu5vCVTEA3hW8FuGmZQrsEuSGawsZ4UiYPFdhyD0XVwL97HbCEBj5DBfN1QxzmfD2O7ubH9NIGcfF5txu6efP8ZJFS0tpyGNiuzDCaG+PMNqFEEZ1ffTe3hph0BYYiM3fabMJaarMvhfM0ixUZPAvch1A4DQUWieW+VCBkUszLElMJe3yD7Ag3dOC+mP3RUTUKYLRoZA6zoDFNWGPOTfIg/YQxxaMfdqFEUi7OAJpF0Ag7W0RyFUPz0PqXRyzs37vG/gse419pZ2Dpzfng4uN9avtXBTSLoxC2u1CQWA7",
  "F4h0nWrnxRCwvTUcOeJJ/XoG2X5il09PSzGZdisjVxwC9GRVHHemJpsUVhCEQQ8IsE16yOxfiMMQNxdZj6ZZrGOAvc9iOQO1H+xzy43nvrpHn2i2jeHM7LMwHVCl73ZNAVe2MHdVXhn2JZ7yFCQDHwTJqO0G9GPyjq5Ah5OZwXIDWjZ7bkM4e3IU/8Rw9Wedjj05PmYJTax7DdF42meRlul2i1PrXCG2UJ6w52qQ6c0uFQSczhzCpQHMw1TYTSxWgz48AWucOWYlMAO642k/i7his0sIqHDNmQ6o0GI5MkO6dGyXySQSlwGv1BHAqlzr0SlsPbrFlKZbwJi3Os56deluqy5ngt8nu9ymSrmf2FVGwPqYqQIHaCXsWqC0PtnAo+kwMo9PBO0wD5K2pxI8boS+2nRCMaLt6EgFtzL0wX9Ah9xL5VYBTKQ7pGaZ40tovZJUh7wObgMyaU8j3e4ykg2QoBVQhuV6ALXTmRMaNJ2uwOLANac1mPckcw5cBP+kB3c8GRrGID7iF0KzuxQtWGnD07QS5BCS0FrlMVUMiDR0InaWoInu3OHpa0imGE9GSB5aR7nlpqVU7qGxpm02pEd266BrBBcd6JMlMhxt68D8C/YpGf1C4PYd6MIFNVk5hgH7QHqFZp8q3LYaYmbynEwwIe7lRvydalGN6dQK+9uOk+9vO86W/nbUOxzS9pCT/mmvd308ON7kXG3XLzjXTuH6oM729UEdWx+0za5y4pdxh1bGk8sFTgizs268FjpiyIZWB5MGxqPylbPN0H/RiV5ZpDhPhM2l1WaeHhixdEErR3HlCmLhqqFOq5Dp7rS2ZcM5WqYk65YcbrGR3K1XpcNt3iSBDCvnGVnOgzVYHje50Ib8aR49xTIWnSQH31A8ppNct4YQi8+TWC40HiFB/mNE/mYn4RKUvdPm3K3lQW34qFONZnSO27JUI1MJgQ6mnB6QmTiCtDqjpikavMhmWhKH/3zixpxmBWn1vEwU",
  "qyQ2qYDzWwIMQItpHGIPQdqwWmUrjwSuBlPBBR6roM1V4Qp7+skS5SzPGUOLPgZyPM2o4glzeLhWppDDFDuUEycgl+lasyuZexwTL0+Ts/k7WjuFF5o72+/973ReabUojnxmtNbFfhtVaesl6y+0+z+JaMu4UAvggeSaxPFhpqjOR80TNGUSnhVqGy8QfWJaKeE5ygIujZRxzZGpSEt0t5QmymVK4YRQt1BhWrf6Sj7gKvMzNjxZedzEge7WqSTKEieGg9a/TTbQruLZtfCKXQhDXUoXT23OFmicWUPNI3O3cMqm6xQis/NaJw1arZ/R+VoIeM7NI/PW2R2sLkBTGuJbEeNTWgeN+aovDs37kzSNsEA3l6qFsy3d4tmWboFsS3fbbMu/3fSHWCY0tNMGKg8H5zfD/kYU2M1NsXQLp1i67UIyVWipp70+WOxunVvp6XkS9X2f8Uj3Fgt7LAraO3BZIZdYbpFICggGOKPkUQnPgiFcnpths7L5MlM4xu52tz5bqFsk3m52GutJuHW8fWzjVa18AUEt+IrxI571Bg8HeCCNsOqXZswrybFrc4HQzKAyW7hqs0Z0OEMZusSDVBA1jQVCo0iF5oiAU5PKwDMC5mqKJZWIQ1yOhw31cDF3mTn3aBEFV+jtW2dKcnuEgyR45EOkyCM6fQVjwjIAb8mwPJNCUVo1iTgexuHy/PNtC4eC+BMA2+ILalNg5b21lrVp6w7x9uSPq/712eDidId+RkHv7+25aqIrUyJTZaJ8/B77wMU9d692Jy/jf/86EA0+8L597o+/3N637qpXh99bd3P1jzAc9r/VH45qPz4f3ezhEX6fYr34oGccq49L5UInGmHVNgjAPAAKkVQYcQL9RIghvU+IWClyz9jz5Bj5IZXRZgqbsOjLAMOFNuVJJAefIDLIHIQmjdnH5SsAoQgf8zjs5HJ4L/ODA74Ip/RbDLaAmQ5szVw2vwlxWO/u43kMe8/vtPaPWuuuO7V9",
  "PDFvzZ1mYx9rZ5/foV+eWNei5uzjUbNr7nSb++gE1tzp7ONJzes6a+3jeafrmjj7mFdYN0l4TWvda3rQZG2LNrRoU4u9JYk/vgdF5t8ohDCH/CY0Lz29lfwqBh23P1MPx6FaHKuHgH5vAy8MgkUcnQMy5lORXuyHoQrTi6BOHA/vPvR4MKdnBN4fyciDu+aA/L3kxHp78wPtQbCn56duIz3Vfs8kK81tcEHJjRKVEXwoYQ4dtVeFfuzx2kfzlnLyDhDd5M77vdUJP7sA1JpBnyHYkHn2s/ltlf2wyK+rqNtbORHHiZmgn1cJhWf6n8mFLhl20cHd4b50P5TCgUsy+L/8vkbmfSRAe9nJ4k+1nHMsE4MIR9yChFQruJwUGlU2XyK1IB6b00TNj4ZQjIQPwP1bpaLkC7wAa9nQXP3k6SSTMD9okv4Czsf/AVBLAwQUAAAACABLql5dRJ9E3HIBAABpBQAAGAAAAHhsL2RyYXdpbmdzL2RyYXdpbmcxLnhtbOVUS07DMBS8SuQD4CRtWhElkRAVqBuouIHrvDSW/NOz++H2+DWoCFYVXXbl9x17JqM0x7DC7GS0DS0bY/Q150GOYER4cB5s6gwOjYgpxR3vURyV3RnNyzxf8OARRB9GgLiaOqxrnIVn0PrJytFh1wzoTNdIp7uy4XRQ/D4MXVFWy1men4uUN+iONEMHxVSrlkWVn0vnCT6BwSlm8tSyefFY5DnL5GfLysVimWLeNV7JrrGHjZKbdL18O2wwU33LCpZZYaBlayN2kKW0hyCxZWky7hFol6ZpL4X8ArHVyr8onV4uaoonuWrxD8GMUJZ97+M1+24YlISVk3sDNk4gCFpE5WwYlQ+JfYgiJloelY0swxrMFhJfXPcFcRJ1iAhRjre+m6CGpMMHyEgCXYBT/KNR8KSZqD2G+ArO3KwWASU26VJiwyd8fv7KUqukykpEQZ0/xrvah8uqXNzkw2o2m1/vw/K3D8s78GF5zz7k",
  "9IvtvgBQSwMEFAAAAAgAS6peXS9GjwKVAAAAdAEAACMAAAB4bC9kcmF3aW5ncy9fcmVscy9kcmF3aW5nMS54bWwucmVsc8WQOw6DMBBEr2LtAVigSBEBVRraiAuszPqj4I9sI5HbhygNSCnSpRyN9OZpujsvVGzw2diYxeYWn3swpcQrYpaGHeUqRPZ7o0JyVPaYNEaSD9KMbV1fMB0ZMHRHppiekX8hBqWs5FuQq2NfvoDRun0RxERJc+kBtwUdz5Y+RVNFr0GMcw9pnBvAP3m0J4/27YGnk4cXUEsDBBQAAAAIAEuqXl0NvIjx1QAAADoCAAAjAAAAeGwvd29ya3NoZWV0cy9fcmVscy9zaGVldDEueG1sLnJlbHO9krFOAzEMhl8lDcNtda8gBtSrVARDB6hU9QVCzncXXRJHjhGHxMMThpYiIcECo//f+vwNXu3RG3EU8+BSVlPwMTd6EEk3ANkOGEyeU8JYmo44GCkj95CMHU2PsFwsroHPGXq9Omeqw2vC3xCp65zFO7LPAaN8A4ahkNi7OGp1MNyjNPqienQBR8dOvak9ZUGuZrdXx4UHasvt+6nE0Xittm2jedvWGv5XcjcK0RNykdxZqWab+gfD5R8atmxeXOw//WDyx/DU1vPCPelcfujAl1dZvwNQSwMEFAAAAAgAS6peXVUQTGKmDgAAclQAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0Mi54bWyd3GtT27gaAOC/opPu9DLDJLFulrjtcOtutpR2gO45Xw0RwY1j59gOlJnz449kOwEU+ZXYD4XEtqRXF/tpm+jdfyzKeXWvVI1+LbK8Ohjc1/VydzSqbu/VIqmGxVLl+sxdUS6SWr8tZ6NqWapk2hRaZCM8HvPRIknzweF+c+x7ebhfJzcnRVaUqJzdHAzGY3HMj2k8GB3uF6s6S3P1vUTVarFIyqdjlRWPB4NosD5wmc7ua3NAX71MZupK1T+W30v9brSpf5ou",
  "VF6lRY5KdXcwOIp2P0djYko0l/ydqsfqxWtU3RePf5Tp9Fw3rfs4HiAd4ZXK1G2tps17Mw43RTE3l0+aQ7p8c4FpJdG/HtSJyjLTmA71v127g01YpuDL1+v2Pzcjp/t7k1RKD8q/02l9fzAQAzRVd8kqqy+Lxz9V12dm6rstsqr5iR7ba+mQDtDtqqqLRVdah7BI8/Z38qsbrBclItlTAHcFsFUAxz0FSFeA2C1EPQVoV4CuC9yn06lqY12X7esO68qyf1CWd2V5MyXtGDYTcJrUyeF+WTyisrnaDDTh61o2Q6/n+9Zc0Uxv+/7ucPL544e/Vvcqn6L/oT9W6VR9+NdvJ7+Rg8FZPsvS6n6wM/h+dHk9OZl8P7q4vtJvv10dnZ/9dXR9hi4mX8++TC4ng0/7o7vD/Qcdlvlz2zV03DakZ0Q3b+6ezZmT3jOn3RnZnEpzcytd1aW+JNXdrQ+/KJWhETpP8tlK3zr7o1oXNqdMDSM9BpuBwO1AxKJ/IHDTFlkPxMm3HxfX+rfuP93VP/QNtzM40w+JbJqg9+8iQfbQpVoUD2rw6f2s3hvvhIze+3dSCLH3/h1nYyL30EmR36XlAtX3St/burYk20X6DmzfT5EJf5neznWLAuPx3pc0z9M6yZFqI1mklVpHs66rq6cpEe0N0bWuK1e/apSbLuuqE/0yWSiU6Ejr+7RCiyKv7z9UumSl79AKJaXSt2um9NOiu0g1JSp0Yx5fyPQarZZD9F2Hpq9Ja3TzpNdlVSdz9XtzdB3wtyrJVL4OcZJ3UaFkpp+hujr9pFVt/Sa4oWOIui4/9zhXu0j3L0XLVa4fMpkOO8na9rBzgLpQhuiv9+8wFnvlzBw1RTDle+3PDM31ulg9JFNUKRPNIkU/E/06y5Q+tUL1KlOLVaV7m6f5DP18WZU5tmh+3s+bKvRJhvcyVS2LIlNDdDav0iqd/o7+NnGrPFevGp+i1UpVdbruRDto67AHn4KW1vXTUqGn",
  "YlW2k5u2i0iviKpGarGsn5rF9PFJ96h4/DREkxoly6VKysosOPWgyqd2IRgszHymte793RBdzdPl0vS5WUTNJa/n+HuyqtYzbF6r9SQ3BeriOaqdZjl5lsaj7qcp8kGvjJvkdj5E5yp5MAHoxYJmRTF93bzzplyvfj0wX9Ly50ovoGKRtPOqKj1blb5xHhKtlP5dprU+/3FeZFmSKz02V3oJpNlidYPM/ZXOkm4RPCT3ap4k5TQ1s2otJ31BhlSKCtOvbqq7NnVpM9Nsr3x4XqpmqLou7OgxnyVValaZXjXudYDO2zqWqtZLbNk1bpquu9a6Yt2APK+fnicy7n0i95457Z6S454n8plZxsBzmLTPYQyARNoWwkV61/zp6eOba7s4+npmfk2+9kl28vY6z/5zjb5+u7j+U7/RqyaSfO/yj6+Tq7Nz9OXHj/Oehk7f3NBf3yYXZ6f6xflkcv3jqqfes65e3DOJD2m60PdBe7N8rOZluqw/vZ7Upp7PgfXoR+C8p55Xi4N2i4P2Lw7atkg2K/PhMLJmvLuEOpZ1d4o51nV3ir869So65o+ObUeHrehYf3SsPzrmjY77o+Pb0RErOt4fHe+Pjnuji/3RxdvRUSu6uD+6uD+62Bud8EcntqNjVnSiPzrRH53wRif90cnt6LgVneyPTvZHJ73RRWN/eOYaO77Y/tfBuD/A9TlXhOtzUIhRQIjRdojCDjECQoyAECN/iDggRLwdorRDxECIGAgR+0MkASESx+N5bMdIgBgJECPxxxggSOQixDYkAhCJAEUiPyNRgCORA5LIliQCKIkASyI/JlGAJpGDk8j2JAJAiQBRIj8pUYApkQOVyFYlAliJAFciPyxRgCyRg5bItiUCcIkAXSI/L1GAL5EDmMgWJgKIiQBjIj8yOAAZ7EAmspXBgDIYUAb7lcEBymCHMpHNDAaYwQAz2M8MDmAGO5iJbGcw4AwGnMF+Z3CAM9jhDLadwYAzGHAG+53B",
  "Ac5ghzPYdgYDzmDAGex3Bgc4g13/YLGdwYAzGHAG+53BAc5ghzPYdgYDzmDAGex3Bgc4gx3OYNsZDDiDAWew3xkc4Ax2OINtZzDgDAacwX5ncIAz2OEMtp3BgDMYcAb7nSEBzhCHM9h2hgDOEMAZ4neGBDhDHM5g2xkCOEMAZ4jfGRLgDHE4g21nCOAMAZwhfmdIgDPE4QyxnSGAMwRwhvidIQHOEIczxHaGAM4QwBnid4YEOEMczhDbGQI4QwBniN8ZEuAMcf33mO0MAZwhgDPE7wwJcIY4nCG2MwRwhgDOEL8zJMAZ4nCG2M4QwBkCOEP8zpAAZ4jDGWI7QwBnCOAM8TtDA5yhDmeI7QwFnKGAM9TvDA1whjqcIbYzFHCGAs5QvzM0wBnqcIbYzlDAGQo4Q/3O0ABnqMMZajtDAWco4Az1O0NDPnlxOEO3PnuBPnyBPn3xO0MDnKEOZ6jtDAWcoYAz1O8MDXCGOpyhtjMUcIYCzlC/MzTAGer6MMZ2hgLOUMAZ6neGBjhDHc5Q2xkKOEMBZ6jfGRrgDHU4Q21nKOAMBZyhfmdYgDPM4Qy1nWGAMwxwhvmdYQHOMIcz1HaGAc4wwBnmd4YFOMMczlDbGQY4wwBnmN8ZFuAMczjDbGcY4AwDnGF+Z1iAM8zhDLOdYYAzDHCGBXzMH/I5v8MZtvVJP/RRP/RZv98ZFuAMczjDbGcY4AwDnGF+Z1iAM8zhDLOdYYAzDHCG+Z1hAc4w10f/tjMMcIYBzjC/MyzAGeZwhtnOMMAZBjjD/M7wAGe4wxlmO8MBZzjgDPc7wwOc4Q5nmO0MB5zhgDPc7wwPcIY7nGG2MxxwhgPOcL8zPMAZ7nCG285wwBkOOMP9zvAAZ7jDGW47wwFnOOAM9zvDA5zhDme47QwHnOGAMzzgS2Uh3ypzOMO3vlcGfbEM+maZ3xke4Ax3OMNtZzjgDAec4X5neIAz3OEMt53hgDMccIb7neEBznDXF81sZzjg",
  "DAec4X5n4gBnYocz3HYmBpyJAWdivzNxgDOxwxluOxMDzsSAM7HfmTjAmdjhDLediQFnYsCZ2O9MHOBM7HAmtp2JAWdiwJnY70wc4EzscCa2nYkBZ2LAmdjvTBzgTOxwJradiQFnYsCZ2O9MHOBM7HAmtp2JAWdiwJk44CvMId9hdjgTb32LGfoaM/Q9Zr8zcYAzscOZ2HYmBpyJAWdivzNxgDOxw5nYdiYGnIkBZ2K/MyLAGeH6UrPtjACcEYAzwu+MCHBGOJyJbWcE4IwAnBF+Z0SAM8LhTGw7IwBnBOCM8DsjApwRDmeE7YwAnBGAM8LvjAhwRjicEbYzAnBGAM4IvzMiwBnhcEbYzgjAGQE4I/zOiABnhMMZYTsjAGcE4IzwOyMCnBEOZ4TtjACcEYAzImDDTMiOGYczYmvPDLRpBto143dGBDgjHM4I2xkBOCMAZ4TfGRngjHQ4I2xnJOCMBJyRfmdkgDPStXvGdkYCzkjAGel3RgY4Ix3OCNsZCTgjAWek3xkZ4Ix0OCNtZyTgjASckX5nZIAz0uGMtJ2RgDMScEb6nZEBzkiHM9J2RgLOSMAZ6XdGBjgjHc5I2xkJOCMBZ6TfGRngjHQ4I21nJOCMBJyRfmdkgDPS4Yy0nZGAMxJwRgZszwzZn+lwRm7t0IS2aEJ7NEM2aQbt0nRII7f3aYIbNcGdmgFbNcchezXHDm7k1m7NMbRdcwzt1xwHbNgch+zYHLu2bG7t2RxDmzbH0K7NccC2zXHIvs2xc+Pm1s7NMbR1cwzt3RwD+Ixe5C1aqHLWJJ6q0G2xyk3cgxdHN/mvTpoUUPZxvHvSZHoaPVdjEivl09SktUqyNjlVbVKJrFNamepv7y5XmUL101IdDNSvZakqk2xrgJZlWpRp/dQkUpr+umszZSE9iMvJ3XW5Ul3iJF3tKksO35wyaH+0LqqHowmiyeXkiNfXDbrbjHFQX/CmL1F/X75d6m7Qg57wd5pzb0hG1GSi",
  "2OprQLBkEyzuD/bo4vTjb8c6Ih3YMXmf1XtmeAf/uFG6aZT0N9oMwVbqm8Fb5nSq17xJ3KJ/63ObJW/m8fWp9Tw36Vfui8fTslieFo95uxz1gUm+XNVfdU+SmdocPCvLotwc1JOdmNQ/x1mSz5trlDl/ndaZMvNs8g+N0DqXSHvyYNDklWlPPrTpZ9L1NUN9eZOHpz1dlJsTg2509Zv6ecSiw7aVnXUbm6GK9BC97nDfAJzQ3e5J4x+FKGAUotej4MroM0IXm7xHr4fFJPaZp+XPpKo3Y3FXFm02L9P3oVlUxWJZB1ffXt6tq4PXWaasDEND1CVQOjAJVvIug9AQre/YgzajlUnm1GQg+pk857DaQfMuq1aVplVQ7qwR6mKq5unyRSqoF2FMPiy6hE3PMbRpxKrnhGNdjrEdM0i5XvHNY6J/xdhJona27rgd5yNq5y0Pp3+wEI/p7nHoQhy/fSFemNQ7emnoUdusucA8VkN0layzTum1UiUJmifzCs2LUg/SvK1kmuy0U68HPEGpHqkqTZJsB+XtiktrpYt8TcoUfTFzH5RcbIiO2tO3Sf6hRjcKNfnS6sf0VunmCpRMTT65prnUNKaGs+G6kfUKaP+O8nINmKf7htZjQ+txQ+sx/WQe9QfRjvuZ75pM60DV5tzUIcxS/fzN1J2+98ZD85FV2f4lqX2jCWim6KaodXBtXkWVTFVpLtDn74qiXr8xf//YpBk9/D9QSwMEFAAAAAgAS6peXYBVhTW6TAAAXAsDABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0My54bWy1nXl328a2Z78Kn647sRIlFqoKUxynV5EU53km/2Ns2ua1LLklKkOv9+EbnGRKAbbr4N2+a91Y5K4CQOAHHByK3Pr1z9u7T/cfV6tN4a/P1zf3b84+bjZffnn16v7tx9Xn5f3Pt19WNwl5f3v3eblJHt59eHX/5W61fLeb9Pn6lbq8DF59Xq5vzn77dfdc7+63",
  "XzfL30u317d3hbsPv785u7yMikHRhGevfvv19mFzvb5Z9e4K9w+fPy/v/i6urm//fHPmnR2fGKw/fNxsn0hGf1l+WA1Xm/GX3l3y6NXj8t+tP69u7te3N4W71fs3Z9b7xc69y90KdmMm69Wf9yc/F+4/3v5ZvVu/ayXrTl7k5Vkh2cTh6nr1drN6t3u83RG/395+2g6v757arv5mVfhr+OV6vdugwt+HH00y/fZLa/V+U1pdX785K/pnheXbzfqPVS+Z8ebs99vN5vbz7oUkL2uz3CTPvb+7/b+rm90W7la73fgvu9HJovZDU9h+Sds1ZdPDevYbsN8gu92d/+ewb84ed932tZ3+fNxFld3RTY7J78v7VXLgput3m49vzqKzwrvV++XD9WZw+2dtdTgu/nZ5b2+v73f/Lfy5H6uSXfj24T7ZnMPkZAs+r2/2/y7/OhzPkwme97OfMUUdpqjnUy4zp+jDFP1sivnZZMwwhxnGeYZ/mOE7zwgOMwLnGeFhRug8IzrMiJxnxIcZsfMM7/J4EC/d5zweeM99zvHIe8p9zvHQe+7H3jsefM/96HvHw++5H3/vGADPPQHeMQKeewa8Ywg89xR4xxh47jlQxxwo9xyoYw6Uew7U4xXAPQfqmAPlngN1zIFyz4E65kC550Adc6Dcc6COOVDuOVDHHCj3HKhjDpR7DvQxB9o9B/qYA+2eA33MgXbPgX4sBe450Mcc6Oc5iLIrzjEH+nkOwuw5xxzoQFDajkHQ4T9KaNaUYw708xxEWTOOKdCx4wxzzIB5ngFPZb4WcwyBeQzBx/W7d6v9fcJxvs6afYyDUXlmH4NhdJ7Zj/cLJs/sY1iMn2f2MTYmyDP7mB8Twuwga/YxSibKM/sYKxM7n1j+MVj+pWMU/WOq/P297v7mdHdnW15ulr/9enf7Z+FuN357B6sfb1Uf72mTe/232xG7++bdmfbbr+9/q1deft94+Li6eVf470L1Yf1u9f1/vSi9",
  "0G/Orm4+XK/vP55djHu9q8HLUq3bHV69bHc7o9rLF3b6Qp1fnDWWNw9JO3N2cVZZ/X53+LG9vHubTDuzX+7W17vH22cbDzer3T/X20f24UOydckPw9WXzerz76u75Ofu283t/qfO7R/HJ8urt/sfz895S3abkkyYrPabsl3zd/9SKnp9t7k/bs5+e9a7DXm4Ofx7vc7cok+b27RN2twft+n811fvf/v1j+SIbP//9rCPi/t9vK07ya5f32zbweHmLtnj6+SobX5rrlbXhVeF1vLmw0PS/v36apNM3qLHJZQORynKWMLV6n6zTplXPsyLXY/u/MoODnvxu+XnL6/PCoXv/uVF+nWhcLZ7Yr/TtyPijBFb5nkHtiy8W/79S2G4Wd5tVncnI8zup2SLdsP1d9eb19992Lw+S3Zo4eXJgvR+QefJ82fHFR7WV0xat5Ml+k9p7/rh/oQGz+aulvebExw+2Rw/c3P8082R7K2I9tblgX3ZJ3T1x/L+l4K9/rD89zJzl6nMbVTZu6yXrMD4rz+ueb/Bjhutv3zJ3G8mc5vM6TalnyVXh7NkF/HteyuPpJJJqpmklknqmaSRSZqZpJVJ2pmkk0m6maSXSfqZZJBJhplklEnGmWSSSaaZZJZJ5plkkUmszUbFbFTKRuVslB1Um51Umx1Vm51Vmx1Wm51Wmx1Xm51Xmx1Ym51Ymx1Ze8iFVhlV63r1cZNStOwhNdv77fR6OR63rmqjtKnZsbKpuXqV3Cg93i2p/d3SthfPultS+y3zXOvpWce2r7b/1Nv1s4y7A/EyW1eTq1by78gOrzIWWhIvdHRl29t/6vV2xjLLj8s87sE/fvOeXcNThqinQyopQ/TTIdWUIebpkFrKEP/pkHrKkODpkEbKkPDpkGbKkOjpkFbKkPjpkHbarrt8OqaTNubZ/u2mjXm2g3tpY57t4X7amGe7eJA25tk+HqaNebaTR2ljnu3lcdqYZ7t5kjbm2X6epuXv2X6e",
  "pY15tp/naWOe7edF2phn+9natEHPdrQtpg16tqdtKW3Qs11t005R9Wxf29ST9NnOtmmnqXq2t23aiaqf7W6bdqrqZ/vb1uXXKzuoXo2SH66uhkln58XB60Ez48plG+LFl7udq91VsTYal7MW2xQvttRt91pXo3q3s114Usba42HW0lvyfdId2W1haHabzXHWYtvixV7NRgO7rTv1oc1aake+sfVS82o0TH7q1be7JHMvd8WLLtpydXv0rtrF1tVVVj2zhytK5v3J8vrDw33qDcphi9RpgQpU/Px0nIm3PAmyilScNFrD0eDKNp881TjEvHE1HGW9prl4lQPbae4yU0tZ6JP7I324Pwqy74/0fu1a8IIjP/ZfF96vk1F/3z7cFW6Wn1cn4Hq1XhZuPy8LN+vP66xbqMNqjfNqv6zffkpa2jgI1Ovk4R/L6/Xjw4w7KvE6Nqvl58LtXaHV7Tbrner2mfX6c+GPfQ++LnRHw3on617rdG3bkN1/XN6t3p3tf/tf1r/Y2nbEevdO5HZryi/UtvHeNts66bEvHDbw8M7Z9OqqWbbz/fsYPybL+cm72L6H1r7dnqQPyX+m2+Mx2r6kyvYNr+Fy+5+Hs/NvLWF3Ad1Ga3sDvE3a9hqyPd+/vlNWeHV695j1og+v89XzCRXphKp0Qk06oS6d0JBOaEontKQT2tIJHemErnRCTzqhL50wkE4YSieMpBPG0gkT6YSpdMJMOmEunbCQTrBWPKMonlESzyiLZ4gvf1Z8/bPiC6AVXwFtXVwpd78l2Fblr+9/Z97JixeeLPr+ybIz7+bFi44u/1fhzfbWJXmY7JLjE9f7Vf2+3jy8y7y5l65s/2uV/T+XWbf24ldw+8fqrrBZ3n1YbXb3XMpXr69XhdXq/vPht2Uf1pm3/OK1vU/uhjYfV4W75fv319ubiuvb2/v1p8yD/bVMpLy5qPnm/fF4r1Pv4PXpW4wZTens/1/W5vIjdbPbdb/fLu+2SVu9",
  "W22Wv68S+I2bdrO/affgpt3st8UX3LTHURS/Lqi/krS/u334PYnM/gx+Qja3X1bXm8edkXXzflh98M+DXMpG5QMK/4muslElG1WzUS0b1bNRIxs1s1ErG7WzUScbdbNRLxv1s9EgGw2z0SgbjbPRJBtNs9EsG82z0SIbWQusCKwEDBJsIcIWMmwhxBZSbOvZJ5ptAGsCawFrA+sA6wI7ZCWzIOx/n55aDExKMXj+NuYMVj1PZU8uw/7hvROTfRn29wuJUlt+6/9ivUuzv+263LX833fWn1ef1nfr5EI9uL3frO6+/6+ieZM0/xfpKK3nLh7WGqdcfbNReY/8y5SrbzaqZKNqNqplo3o2amSjZjZqZaN2Nupko2426mWjfjYaZKNhNhplo3E2mmSjaTaaZaN5NlpkI2uBFYGVgEGCLUTYQoYthNhCiu3XGKee+fXk1K8/nvve7tx/Yf3tib5/o+9FMXlw+LjQ4WM6hw9c7dsG8zho/+Gek0/67AcEjwN2H+85/YzUfkC4+69/nv6+nW3wC2gkL6Dx+ALUsxdQ6o47o+0zZf+XF8l+Sm4iP2xev9l/eCh58ec/Dsft3qBbHpdGL5NRL8x22IuTzxqd/5D2tPorAfVhZ9wubj+DdVj6buz+x+2oy9PHyczt+tJf4/Gq4aW/xmbyGpuPr1H/8yDZof+T7Sf/H+xW9OZy+3y73nnpXbxM9tCP2x9tz79Q5+evTgdn7fMW7/NWsj2tx+0xz7Yn2aNf90jq4o+XO5W++Hay+Pbj4v1/vtzdUf26juTlXj5d66tnI14lu/4nL31jjhdYnb4xnWRjOo8bEzzbmO3OTU/QG7eMvFE/7GLx4/Yodsr7j7qFO7J/u/1F6fQDg4fP/JX888cn9+/0p5HH3w08ngWlF8maS0mPby52I3cbkI23UdJHPHzOk9O2uX0i+e/2mf2Z5Z2dv8la3vmFubhMPwjHUpb+K4kE/2K7jwch3B2E7uB4HJLzY/vP",
  "k2Bvt927PD+eH839zvZ2D3r+j8mwJDWuvzQLY6OSS9rq7v3q7ebJc6N9/7l+uL9efzo7d15irH3vdaF+d3vz5InB8uHdzWr7+eOTjb78OXJcbhxv2+PK/i2ju5OnWk/eNNp9TDL1MPT89P3fS/Z/73H/R9+8yDbO0pffz1h+P1l+/3H58TeXX8tY/iBj+YNk+YOvVe7ymyuYZaxgmLGCYbKC4dcVPK+j+7P6x+NHWaPdFWuf4e1J/3iRqHfKV7Ovm7EfvE1D6vO7dGyvHhf/w4VcPrLj1euRfr30fHPI9nqXsZLklvksE9WyUXIYLrztNSP1YIwyDsYoORijrwdDpV4udpeGQXLgy9sT7cKc/+BdPv7vx+S6vn+8K51x8r+Ltp29vDzMeJnUqB+9/ZTd5v3o/TToTl+ev9o+k7qx44yNHScbO/66sSnF/Wl92e6iyu4FJIXkavuoenxU2e++/aOkSLbG7c7js+c/6f0FfZ/F88OB97KuyIf788yO9/HT3qlNr+/S9PJNxizZMbOvO8b8c8d0tlf8ffXfXvq3B2gfpK8vvvzsxW8n/PDS++nly28W5kNZdrrHk9w2/vg4f3tWPHmYXNb2y0xmp7yCXdJSD9acd+Xc332h/7gr/ecnxOjxhHi8EtrRrrSPTkr7/qY52cWjl8mMJPLb2D/bnCdvSwTfflsi2G+3n/b7n8t//vqneBif9nZuNiofUNrbudmoko2q2aiWjerZqJGNmtmolY3a2aiTjbrZqJeN+tlokI2G2WiUjcbZaJKNptlolo3m2WiRjawFVgRWAgYJthBhCxm2EGILKbZfY5z2O9uUX9k2aIJKmXCMfJQ2QadMaNEaTMqE4+kRp03wUyYcTprgMm1C2u+pD6dS4KVNCFMmJCdYysgoZWQ/dWScMnKQOtJLubDaYfrQtOM5Sh+adiTH6UPTjuHh9M2+39i+u5R6rxH8817D/8e9BoY2LSJznPE0I0+qXvjtqhfus6Fc",
  "q16Y/TZ6NiqH2W+jZ6NKNqpmo1o2qmejRjZqZqNWNmpno0426majXjbqZ6NBNhpmo1E2GmejSTaaZqNZNppno0UIb6MDKwIrAYMEW4iwhQxbCLGFFNuvMXatejQhteqFGe8BZ1Y9WkNq1Qsz3nbNrHphxlujmVUvzHgbL7Pqhc5VL3SueqF71Qvdq17oXvVC96oXctXb/sokteiF/yx63uU/qh6GNrXq4QyoetG3q160r3ratepF2b1eNipH2b1eNqpko2o2qmWjejZqZKNmNmplo3Y26mSjbjbqZaN+Nhpko2E2GmWjcTaaZKNpNpplo3k2WkTQ6wErAisBgwRbiLCFDFsIsYUU268xdq16kbTXi6S9XiTt9SJprxdJe71I2utFzlUvcq56kXvVi9yrXuRe9SL3qhdx1Uvm//thk/H1uOgb39/f/6prs/q0f4P6j9Xdu4f71bvUL/RH4q4wytkVxt+uj/E+Rca1PsbZXWE2KsfZXWE2qmSjajaqZaN6Nmpko2Y2amWjdjbqZKNuNuplo342GmSjYTYaZaNxNppko2k2mmWjeTZaxNAVAisCKwGDBFuIsIUMWwixhRTbrzF2rY+xtCuMpV1hLO0KY2lXGEu7wljaFcbO9TF2ro+xe32M3etj7F4fY/f6GHN9XP21unu7vl+l1seY62Pv4f7jTw9fUmvrLBb3i3HOfnHrQP5WQdyO2VZE598OHiaktozAykeW1jQCqwCrAqsBqwNrAGsCawFrA+sA6wLrAesDGwAbAhsBGwObAJsCmwGbA1sAs5ZgkWCJIGXbUrgtpdtSvC3l254E3LVm4ozUonmc4d5V4jpSy+ZxhntfebyeuTeWxxnunaV36Vw604em1s70oenFM2NsavXMGJtaPjPGptbPw37LLKD776J+XH9KN8Rdcgn9lNpibtKVcZfiFpOnUE31HGrqXlQXBM411ctuM4GVDyy10QRWAVYFVgNWB9YA1gTWAtYG1gHWBdYD",
  "1gc2ADYENgI2BjYBNgU2AzYHtgBmLcEiwRJByralcFtKt6V4W8q3PQm4c031pI3ocYZ7J4rrSK+pnrQXPc5wb0aPM9y7Uc9zr6mee031BDXVE9RUT1BTPUFN/YZw9eFmnSFc/YZx9Qt1pJzs9Prp5e1JlUP93CvQgtC5firoSRX0pAp6UgU9qYKeVEFPqqAnVdCTKuhJFfSkCnpSBT2pgp5UQU+qoCdV0JMq6EkV9KQKelIFPamCnlRBT6qgJ1XQkyrqSRX1pIp6UkU9qaKeVFFPqqgnVdSTKupJlbgnVeKeVIl7UiXuSZW4J1XinlSJe1LlXj+Ve/1UgvqpBPVTCeqnEtRP5aKQKGxWq9/Ty6j6RhndN6PXf6zera43X02Qh2519a5wvXxYXqdXWSXvUlXeLlU7VNm9wSiInKushi5VQ5eqoUvV0KVq6FI1dKkaulQNXaqGLlVDl6qhS9XQpWroUjV0qRq6VA1dqoYuVUOXqqFL1dClauhSNXSpGrpUDV2qpi5VU5eqqUvV1KVq6lI1damaulRNXaqmLlWLu1Qt7lK1uEvV4i5Vi7tULe5StbhL1e5VVrtXWS2oslpQZbWgympBlf2Gue/4x6Le3a7SP17kaS6ztzeFTzer1f1WvvxxefMu+eGmsNz+/ePrVXpt1fIOVuftYI1Dbd37pILYubYa6GANdLAGOlgDHayBDtZAB2uggzXQwRroYA10sAY6WAMdrIEO1kAHa6CDNdDBGuhgDXSwBjpYAx2sgQ7WQAdroIM10MEa6mANdbCGOlhDHayhDtZQB2uogzXUwRrqYI24gzXiDtaIO1gj7mCNuIM14g7WiDtY415bjXttNYLaagS11QhqqxHUVvPtL6tA/2qyCutpsTTyRtTkbUQdtIneXqwQXjoXS1AeAit7ID0EVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7bwSIVIsEiwRJCybSncltJtKd6W",
  "8m1PAu5cLH1xI+qLG1Ff3Ij64kbUFzeivrgR9d2Lpe9eLH1BsfQFxdIXFEtfUCy/4U/a/5Hg7DbUd6mWvry19PO2lg42H2/vTAg952oJPh9gZQ+MPsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObAFh55fggWCZYIUrYthdtSui3F21K+7UnAnaul2PjjiZU/ntj544mlP57Y+uOJtT+eu/fHcxf/eALzjydQ/3gC948nkP94gdsHdm+e/PmYjI/vPgqBtn9yZGfR/WE4bu8Mtra+09rV905au3twUNwdHX2pfvu9y6+cDNX7oW++/v15lfFnWGaeXDrk5bUOeQ7aIW8vdwidvUMeiIeAlT1QDwGrAKsCqwGrA2sAawJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDW3gkJCJYJFgiSNm2FG5L6bYUb0v5ticBdy7PYjWRJ3YTeWI5kSe2E3liPZEn9hN57oIiz91Q5AkURZ7AUeQJJEWewFLkha5/D62wuklq9Gb/+GZ5n/GR4PC0RG8Vy3vZ/d6xPOpu/+Dr+U/74ppZXeVyIy+v3chz0Bt5ezVE6Ow38kBwBKzsgeIIWAVYFVgNWB1YA1gTWAtYG1gHWBdYD1gf2ADYENgI2BjYBNgU2AzYHNjCI/ERwSLBEkHKtqVwW0q3pXhbyrc9CbhzdRUrkDyxA8kTS5A8sQXJE2uQPLEHyXMXIXnuJiRPoELyBC4kTyBD8gQ2JO8bOqTHappU1sdKm15Xo9O6eviTMody+vg3ZdSxwG772P2fVd9V3/OnhffH7Z8GyKq9cnGSl9ec5Dmok7y9hiJ0did5IE8CVvZAnwSsAqwKrAasDqwBrAmsBawNrAOsC6wHrA9sAGwIbARsDGwCbApsBmwObOGRVIlgkWCJIGXbUrgtpdtSvC3l254E3Ln2ivVKntiv5IkFS57YsOSJFUue2LHkuUuWPHfLkifQLHkC",
  "z5InEC15AtOS9w3V0uOfWy+8vH749HB/nl5349O6e1JwT8prVimVO5e8vNIl5SBdUnv7ROgsXVIgXQJWViBdAlYBVgVWA1YH1gDWBNYC1gbWAdYF1gPWBzYANgQ2AjYGNgE2BTYDNge2UCRdIlgkWCJI2bYUbkvpthRvS/m2JwF3LaVKLF1SYumSEkuXlFi6pMTSJSWWLil36ZJyly4pgXRJCaRLSiBdUgLpkvqGdOlm/Xn7JdRtFU0touryudP+pEwquUdJ5fUoKQePktpLJkJnj5ICjxKwsgKPErAKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwhSKPEsEiwRJByralcFtKt6V4W8q3PQm4c5kUe5SU2KOkxB4lJfYoKbFHSYk9Ssrdo6TcPUpK4FFSAo+SEniUlMCjpL7hUVr+sdw8vEuvkIc6oU7+6osJVBw8byqV3Jqk8lqTlIM1Se1lEaGzNUmBNQlYWYE1CVgFWBVYDVgdWANYE1gLWBtYB1gXWA9YH9gA2BDYCNgY2ATYFNgM2BzYQpE1iWCRYIkgZdtSuC2l21K8LeXbngTcuVqKrUlKbE1SYmuSEluTlNiapMTWJOVuTVLu1iQlsCYpgTVJCaxJyt2aNFNyM5HKayZSDmYitVczhM5mIgVmImBlBWYiYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB9YANgQ2AjYGNgE2BTYDNgc2ALRWYigkWCJYKUbUvhtpRuS/G2lG97EnDnSiY2EymxmUiJzURKbCZSYjOREpuJlLuZSLmbiZTATKQEZiIlMBMpLahkcg+QyusBUg4eILX3JoTOHiAFHiBgZQUeIGAVYFVgNWB1YA1gTWAtYG1gHWBdYD1gfWADYENgI2BjYBNgU2AzYHNgC0UeIIJFgiWClG1L4baUbkvxtpRvexJw50om9gApsQdIiT1ASuwBUmIPkBJ7gJS7B0i5e4CUwAOkBB4gJfAA",
  "KSOoZHJJj8or6VEOkh61dxpEzpIeBZIeYGUFkh5gFWBVYDVgdWANYE1gLWBtYB1gXWA9YH1gA2BDYCNgY2ATYFNgM2BzYAtFkh6CRYIlgpRtS+G2lG5L8baUb3sScOdKJpb0KLGkR4klPUos6VFiSY8SS3qUu6RHuUt6lEDSowSSHiWQ9ChfUMnkAh2VV6CjHAQ6av/1/8hZoKNAoAOsrECgA6wCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5soUigQ7BIsESQsm0p3JbSbSnelvJtTwLuXMnEAh0lFugosUBHiQU6SizQUWKBjnIX6Ch3gY4SCHSUQKCjBAIdFQgqmdw1o/K6ZpSDa0btv2ofObtmFLhmgJUVuGaAVYBVgdWA1YE1gDWBtYC1gXWAdYH1gPWBDYANgY2AjYFNgE2BzYDNgS0UuWYIFgmWCFK2LYXbUrotxdtSvu1JwJ0rmdg1o8SuGSV2zSixa0aJXTNK7JpR7q4Z5e6aUQLXjBK4ZpTANaNCQSWTe11UXq+LcvC6qP0X1yNnr4sCrwuwsgKvC7AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwhSKvC8EiwRJByralcFtKt6V4W8q3PQm4cyUTe12U2OuixF4XJfa6KLHXRYm9Lsrd66LcvS5K4HVRAq+LEnhdVCSoZHJLisprSVEOlhS1/9545GxJUWBJAVZWYEkBVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7ZQZEkhWCRYIkjZthRuS+m2FG9L+bYnAXeuZGJLihJbUpTYkqLElhQltqQosSVFuVtSlLslRQksKUpgSVECS4qKBZVMLilReSUl2kFSovdf7Y6cJSUaJCXAyhokJcAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObAFpokJQSLBEsEKduW",
  "wm0p3ZbibSnf9iTgrpVMiyUlWiwp0WJJiRZLSrRYUqLFkhLtLinR7pISLZCUaIGkRAskJdpdUjLTco+IzusR0Q4eEb3/2nXk7BHR4BEBVtbgEQFWAVYFVgNWB9YA1gTWAtYG1gHWBdYD1gc2ADYENgI2BjYBNgU2AzYHttDkESFYJFgiSNm2FG5L6bYUb0v5ticBd65kYo+IFntEtNgjosUeES32iGixR0S7e0S0u0dECzwiWuAR0QKPiPYElUzu+NB5HR/awfGh91+7jpwdHxocH8DKGhwfwCrAqsBqwOrAGsCawFrA2sA6wLrAesD6wAbAhsBGwMbAJsCmwGbA5sAWmhwfBIsESwQp25bCbSndluJtKd/2JODOlUzs+NBix4cWOz602PGhxY4PLXZ8aHfHh3Z3fGiB40MLHB9a4PjQAseHljs+dF7Hh3ZwfOj9164jZ8eHBscHsLIGxwewCrAqsBqwOrAGsCawFrA2sA6wLrAesD6wAbAhsBGwMbAJsCmwGbA5sIUmxwfBIsESQcq2pXBbSreleFvKtz0JuHMlEzs+tNjxocWODy12fGix40OLHR/a3fGh3R0fWuD40ALHhxY4PrTA8aHljg+d1/GhHRwfev+168jZ8aHB8QGsrMHxAawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5socnxQbBIsESQsm0p3JbSbSnelvJtTwLuXMnEjg8tdnxoseNDix0fWuz40GLHh3Z3fGh3x4cWOD60wPGhBY4PLXB8aLnjQ+d1fGgHx4fef+06dnZ8aHB8ACtrcHwAqwCrAqsBqwNrAGsCawFrA+sA6wLrAesDGwAbAhsBGwObAJsCmwGbA1tocnwQLBIsEaRsWwq3pXRbirelfNuTgDtXMrHjQ4sdH1rs+NBix4cWOz602PGh3R0f2t3xoQWODy1wfGiB40MLHB9a7vjQeR0f2sHxofdfu46dHR8aHB/Ayhoc",
  "H8AqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObAFpocHwSLBEsEKduWwm0p3ZbibSnf9iTgzpVM7PjQYseHFjs+tNjxocWODy12fGh3x4d2d3xogeNDCxwfWuD40ALHh5Y7PnRex4d2cHzo/deuY2fHhwbHB7CyBscHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObCFJscHwSLBEkHKtqVwW0q3pXhbyrc9CbhzJRM7PrTY8aHFjg8tdnxoseNDix0f2t3xod0dH1rg+NACx4cWOD60wPGh5Y4PndfxoR0cH3r/tevY2fGhwfEBrKzB8QGsAqwKrAasDqwBrAmsBawNrAOsC6wHrA9sAGwIbARsDGwCbApsBmwObKHJ8UGwSLBEkLJtKdyW0m0p3pbybU8C7lzJxI4PLXZ8aLHjQ4sdH1rs+NBix4d2d3xod8eHFjg+tMDxoQWODy1wfGi540PndXxoB8eH3n/tOnZ2fGhwfAAra3B8AKsAqwKrAasDawBrAmsBawPrAOsC6wHrAxsAGwIbARsDmwCbApsBmwNbaHJ8ECwSLBGkbFsKt6V0W4q3pXzbk4A7VzKx40OLHR9a7PjQYseHFjs+tNjxod0dH9rd8aEFjg8tcHxogeNDCxwfWu740HkdH8bB8WH2X7uOnR0fBhwfwMoGHB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBaGHB8EiwRLBCnblsJtKd2W4m0p3/Yk4K6VzIgdH0bs+DBix4cROz6M2PFhxI4P4+74MO6ODyNwfBiB48MIHB9G4PgwcseHyev4MA6OD7P/2nXs7Pgw4PgAVjbg+ABWAVYFVgNWB9YA1gTWAtYG1gHWBdYD1gc2ADYENgI2BjYBNgU2AzYHtjDk+CBYJFgiSNm2FG5L6bYUb0v5ticBd65kYseHETs+jNjxYcSO",
  "DyN2fBix48O4Oz6Mu+PDCBwfRuD4MALHhxE4Pozc8WHyOj6Mg+PD7L92HTs7Pgw4PoCVDTg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtDDk+CBYJlghSti2F21K6LcXbUr7tScCdK5nY8WHEjg8jdnwYsePDiB0fRuz4MO6OD+Pu+DACx4cROD6MwPFhBI4PI3d8mLyOD+Pg+DD7r13Hzo4PA44PYGUDjg9gFWBVYDVgdWANYE1gLWBtYB1gXWA9YH1gA2BDYCNgY2ATYFNgM2BzYAtDjg+CRYIlgpRtS+G2lG5L8baUb3sScOdKJnZ8GLHjw4gdH0bs+DBix4cROz6Mu+PDuDs+jMDxYQSODyNwfBiB48PIHR8mr+PDODg+zP5r17Gz48OA4wNY2YDjA1gFWBVYDVgdWANYE1gLWBtYB1gXWA9YH9gA2BDYCNgY2ATYFNgM2BzYwpDjg2CRYIkgZdtSuC2l21K8LeXbngTcuZKJHR9G7PgwYseHETs+jNjxYcSOD+Pu+DDujg8jcHwYgePDCBwfRuD4MHLHh8nr+DAOjg+z/9q1d+ks+TAg+QBWNiD5AFYBVgVWA1YH1gDWBNYC1gbWAdYF1gPWBzYANgQ2AjYGNgE2BTYDNge2MCT5IFgkWCJI2bYUbkvpthRvS/m2JwF3LmViyYcRSz6MWPJhxJIPI5Z8GLHkw7hLPoy75MMIJB9GIPkwAsmHEUg+jFzyYfJKPoyD5MMEh1LmbPkwYPkAVjZg+QBWAVYFVgNWB9YA1gTWAtYG1gHWBdYD1gc2ADYENgI2BjYBNgU2AzYHtjBk+SBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYsuHEVs+jNjyYcSWDyO2fBix5cO4Wz6Mu+XDCCwfRmD5MALLhxFYPozc8mHyWj6Mg+XDhIdS5qz5MKD5AFY2oPkAVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2",
  "BDYCNgY2ATYFNgM2B7YwpPkgWCRYIkjZthRuS+m2FG9L+bYnAXcuZWLNhxFrPoxY82HEmg8j1nwYsebDuGs+jLvmwwg0H0ag+TACzYcRaD6MXPNh8mo+jIPmw0SHUubs+TDg+QBWNuD5AFYBVgVWA1YH1gDWBNYC1gbWAdYF1gPWBzYANgQ2AjYGNgE2BTYDNge2MOT5IFgkWCJI2bYUbkvpthRvS/m2JwF3LmViz4cRez6M2PNhxJ4PI/Z8GLHnw7h7Poy758MIPB9G4PkwAs+HEXg+jNzzYfJ6PoyD58PEh1LmLPowIPoAVjYg+gBWAVYFVgNWB9YA1gTWAtYG1gHWBdYD1gc2ADYENgI2BjYBNgU2AzYHtjAk+iBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYtGHEYs+jFj0YcSiDyMWfRix6MO4iz6Mu+jDCEQfRiD6MALRhxGIPoxc9GHyij58B9GHf3koZc6mDx9MH8DKPpg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtfDJ9ECwSLBGkbFsKt6V0W4q3pXzbk4C7ljJfbPrwxaYPX2z68MWmD19s+vDFpg/f3fThu5s+fIHpwxeYPnyB6cMXmD58uenDz2v68B1MH753KGXOqg8fVB/Ayj6oPoBVgFWB1YDVgTWANYG1gLWBdYB1gfWA9YENgA2BjYCNgU2ATYHNgM2BLXxSfRAsEiwRpGxbCreldFuKt6V825OAO5cyserDF6s+fLHqwxerPnyx6sMXqz58d9WH76768AWqD1+g+vAFqg9foPrw5aoPP6/qw3dQffjqUMqcXR8+uD6AlX1wfQCrAKsCqwGrA2sAawJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDW/jk+iBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYteHL3Z9+GLXhy92ffhi14cvdn347q4P39314QtcH77A9eELXB++",
  "wPXhy10ffl7Xh+/g+vD1oZQ5yz58kH0AK/sg+wBWAVYFVgNWB9YA1gTWAtYG1gHWBdYD1gc2ADYENgI2BjYBNgU2AzYHtvBJ9kGwSLBEkLJtKdyW0m0p3pbybU8C7lzKxLIPXyz78MWyD18s+/DFsg9fLPvw3WUfvrvswxfIPnyB7MMXyD58gezDl8s+/LyyD99B9uGbQylztn34YPsAVvbB9gGsAqwKrAasDqwBrAmsBawNrAOsC6wHrA9sAGwIbARsDGwCbApsBmwObOGT7YNgkWCJIGXbUrgtpdtSvC3l254E3LmUiW0fvtj24YttH77Y9uGLbR++2Pbhu9s+fHfbhy+wffgC24cvsH34AtuHL7d9+HltH76D7cM/2D48Z9uHD7YPYGUfbB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBY+2T4IFgmWCFK2LYXbUrotxdtSvu1JwJ1Lmdj24YttH77Y9uGLbR++2Pbhi20fvrvtw3e3ffgC24cvsH34AtuHL7B9+HLbh5/X9uE72D78g+3Dc7Z9+GD7AFb2wfYBrAKsCqwGrA6sAawJrAWsDawDrAusB6wPbABsCGwEbAxsAmwKbAZsDmzhk+2DYJFgiSBl21K4LaXbUrwt5dueBNy5lIltH77Y9uGLbR++2Pbhi20fvtj24bvbPnx324cvsH34AtuHL7B9+ALbhy+3ffh5bR++g+3DP9g+PGfbhw+2D2BlH2wfwCrAqsBqwOrAGsCawFrA2sA6wLrAesD6wAbAhsBGwMbAJsCmwGbA5sAWPtk+CBYJlghSti2F21K6LcXbUr7tScCdS5nY9uGLbR++2Pbhi20fvtj24YttH7677cN3t334AtuHL7B9+ALbhy+wffhy24ef1/bhO9g+/IPtw3O2ffhg+wBW9sH2AawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5s4ZPt",
  "g2CRYIkgZdtSuC2l21K8LeXbngTcuZSJbR++2Pbhi20fvtj24YttH77Y9uG72z58d9uHL7B9+ALbhy+wffgC24cvt334eW0fvoPtwz/YPjxn24cPtg9gZR9sH8AqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObAFj7ZPggWCZYIUrYthdtSui3F21K+7UnAnUuZ2Pbhi20fvtj24YttH77Y9uGLbR++u+3Dd7d9+ALbhy+wffgC24cvsH34ctuHn9f2ETjYPoKD7cNztn0EYPsAVg7A9gGsAqwKrAasDqwBrAmsBawNrAOsC6wHrA9sAGwIbARsDGwCbApsBmwObBGQ7YNgkWCJIGXbUrgtpdtSvC3l254E3LWUBWLbRyC2fQRi20cgtn0EYttHILZ9BO62j8Dd9hEIbB+BwPYRCGwfgcD2EchtH0Fe20fgYPsIDrYPz9n2EYDtA1g5ANsHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObBFQLYPgkWCJYKUbUvhtpRuS/G2lG97EnDnUia2fQRi20cgtn0EYttHILZ9BGLbR+Bu+wjcbR+BwPYRCGwfgcD2EQhsH4Hc9hHktX0EDraP4GD78JxtHwHYPoCVA7B9AKsAqwKrAasDawBrAmsBawPrAOsC6wHrAxsAGwIbARsDmwCbApsBmwNbBGT7IFgkWCJI2bYUbkvpthRvS/m2JwF3LmVi20cgtn0EYttHILZ9BGLbRyC2fQTuto/A3fYRCGwfgcD2EQhsH4HA9hHIbR9BXttH4GD7CA62D8/Z9hGA7QNYOQDbB7AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwRUC2D4JFgiWClG1L4baUbkvxtpRvexJw51Imtn0EYttHILZ9BGLbRyC2fQRi20fgbvsI3G0fgcD2EQhsH4HA9hEIbB+B3PYR5LV9",
  "BA62j+Bg+/CcbR8B2D6AlQOwfQCrAKsCqwGrA2sAawJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDWwRk+yBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYttHILZ9BGLbRyC2fQRi20cgtn0E7raPwN32EQhsH4HA9hEIbB+BwPYRyG0fQV7bR+Bg+wgOtg/lbPsIwPYBrByA7QNYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB/YANgQ2AjYGNgE2BTYDNgc2CIg2wfBIsESQcq2pXBbSreleFvKtz0JuHMpE9s+ArHtIxDbPgKx7SMQ2z4Cse0jcLd9BO62j0Bg+wgEto9AYPsIBLaPQG77CPLaPgIH20dwsH0oZ9tHALYPYOUAbB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBYB2T4IFgmWCFK2LYXbUrotxdtSvu1JwJ1Lmdj2EYhtH4HY9hGIbR+B2PYRiG0fgbvtI3C3fQQC20cgsH0EAttHILB9BHLbR5DX9hE42D6Cg+1DOds+ArB9ACsHYPsAVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7YIyPZBsEiwRJCybSncltJtKd6W8m1PAu5cysS2j0Bs+wjEto9AbPsIxLaPQGz7CNxtH4G77SMQ2D4Cge0jENg+AoHtI5DbPoK8to/AwfYRHGwfytn2EYDtA1g5ANsHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObBFQLYPgkWCJYKUbUvhtpRuS/G2lG97EnDnUia2fQRi20cgtn0EYttHILZ9BGLbR+Bu+wjcbR+BwPYRCGwfgcD2EQhsH4Hc9hHktX0EDraP4GD7UM62jwBsH8DKAdg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtArJ9ECwSLBGkbFsK",
  "t6V0W4q3pXzbk4A7lzKx7SMQ2z4Cse0jENs+ArHtIxDbPgJ320fgbvsIBLaPQGD7CAS2j0Bg+wjkto8gr+0jdLB9hAfbh3K2fYRg+wBWDsH2AawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5sEZLtg2CRYIkgZdtSuC2l21K8LeXbngTctZSFYttHKLZ9hGLbRyi2fYRi20cotn2E7raP0N32EQpsH6HA9hEKbB+hwPYRym0fYV7bR+hg+wgPtg/lbPsIwfYBrByC7QNYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB/YANgQ2AjYGNgE2BTYDNgc2CIk2wfBIsESQcq2pXBbSreleFvKtz0JuHMpE9s+QrHtIxTbPkKx7SMU2z5Cse0jdLd9hO62j1Bg+wgFto9QYPsIBbaPUG77CPPaPkIH20d4sH0oZ9tHCLYPYOUQbB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBYh2T4IFgmWCFK2LYXbUrotxdtSvu1JwJ1Lmdj2EYptH6HY9hGKbR+h2PYRim0fobvtI3S3fYQC20cosH2EAttHKLB9hHLbR5jX9hE62D7Cg+1DOds+QrB9ACuHYPsAVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7YIyfZBsEiwRJCybSncltJtKd6W8m1PAu5cysS2j1Bs+wjFto9QbPsIxbaPUGz7CN1tH6G77SMU2D5Cge0jFNg+QoHtI5TbPsK8to/QwfYRHmwfytn2EYLtA1g5BNsHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObBFSLYPgkWCJYKUbUvhtpRuS/G2lG97EnDnUia2fYRi20cotn2EYttHKLZ9hGLbR+hu+wjdbR+hwPYRCmwfocD2EQpsH6Hc9hHmtX2EDraP8GD70M62",
  "jxBsH8DKIdg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtQrJ9ECwSLBGkbFsKt6V0W4q3pXzbk4A7lzKx7SMU2z5Cse0jFNs+QrHtIxTbPkJ320fobvsIBbaPUGD7CAW2j1Bg+wjlto8wr+0jdLB9hAfbh3a2fYRg+wBWDsH2AawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5sEZLtg2CRYIkgZdtSuC2l21K8LeXbngTcuZSJbR+h2PYRim0fodj2EYptH6HY9hG62z5Cd9tHKLB9hALbRyiwfYQC20cot32EeW0foYPtIzzYPrSz7SME2wewcgi2D2AVYFVgNWB1YA1gTWAtYG1gHWBdYD1gfWADYENgI2BjYBNgU2AzYHNgi5BsHwSLBEsEKduWwm0p3ZbibSnf9iTgzqVMbPsIxbaPUGz7CMW2j1Bs+wjFto/Q3fYRuts+QoHtIxTYPkKB7SMU2D5Cue0jzGv7CB1sH+HB9qGdbR8h2D6AlUOwfQCrAKsCqwGrA2sAawJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDW4Rk+yBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYttHKLZ9hGLbRyi2fYRi20cotn2E7raP0N32EQpsH6HA9hEKbB+hwPYRym0fYV7bR+hg+wgPtg/tbPsIwfYBrByC7QNYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB/YANgQ2AjYGNgE2BTYDNgc2CIk2wfBIsESQcq2pXBbSreleFvKtz0JuHMpE9s+QrHtIxTbPkKx7SMU2z5Cse0jdLd9hO62j1Bg+wgFto9QYPsIBbaPUG77CPPaPiIH20d0sH1oZ9tHBLYPYOUIbB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBYR2T4IFgmWCFK2LYXbUrotxdtSvu1J",
  "wF1LWSS2fURi20cktn1EYttHJLZ9RGLbR+Ru+4jcbR+RwPYRCWwfkcD2EQlsH5Hc9hHltX1EDraP6GD70M62jwhsH8DKEdg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtIrJ9ECwSLBGkbFsKt6V0W4q3pXzbk4A7lzKx7SMS2z4ise0jEts+IrHtIxLbPiJ320fkbvuIBLaPSGD7iAS2j0hg+4jkto8or+0jcrB9RAfbh3a2fURg+wBWjsD2AawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5sEZHtg2CRYIkgZdtSuC2l21K8LeXbngTcuZSJbR+R2PYRiW0fkdj2EYltH5HY9hG52z4id9tHJLB9RALbRySwfUQC20ckt31EeW0fkYPtIzrYPrSz7SMC2wewcgS2D2AVYFVgNWB1YA1gTWAtYG1gHWBdYD1gfWADYENgI2BjYBNgU2AzYHNgi4hsHwSLBEsEKduWwm0p3ZbibSnf9iTgzqVMbPuIxLaPSGz7iMS2j0hs+4jEto/I3fYRuds+IoHtIxLYPiKB7SMS2D4iue0jymv7iBxsH9HB9qGdbR8R2D6AlSOwfQCrAKsCqwGrA2sAawJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDW0Rk+yBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYttHJLZ9RGLbRyS2fURi20cktn1E7raPyN32EQlsH5HA9hEJbB+RwPYRyW0fUV7bR+Rg+4gOtg/jbPuIwPYBrByB7QNYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB/YANgQ2AjYGNgE2BTYDNgc2CIi2wfBIsESQcq2pXBbSreleFvKtz0JuHMpE9s+IrHtIxLbPiKx7SMS2z4ise0jcrd9RO62j0hg+4gEto9IYPuIBLaPSG77iPLaPiIH20d0sH0YZ9tHBLYPYOUIbB/A",
  "KsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBYR2T4IFgmWCFK2LYXbUrotxdtSvu1JwJ1Lmdj2EYltH5HY9hGJbR+R2PYRiW0fkbvtI3K3fUQC20cksH1EAttHJLB9RHLbR5TX9hE52D6ig+3DONs+IrB9ACtHYPsAVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7aIyPZBsEiwRJCybSncltJtKd6W8m1PAu5cysS2j0hs+4jEto9IbPuIxLaPSGz7iNxtH5G77SMS2D4ige0jEtg+IoHtI5LbPqK8to/IwfYRHWwfxtn2EYHtA1g5AtsHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObBFRLYPgkWCJYKUbUvhtpRuS/G2lG97EnDnUia2fURi20cktn1EYttHJLZ9RGLbR+Ru+4jcbR+RwPYRCWwfkcD2EQlsH5Hc9hHltX1EDraP6GD7MM62jwhsH8DKEdg+gFWAVYHVgNWBNYA1gbWAtYF1gHWB9YD1gQ2ADYGNgI2BTYBNgc2AzYEtIrJ9ECwSLBGkbFsKt6V0W4q3pXzbk4A7lzKx7SMS2z4ise0jEts+IrHtIxLbPiJ320fkbvuIBLaPSGD7iAS2j0hg+4jkto8or+0jdrB9xAfbh3G2fcRg+wBWjsH2AawCrAqsBqwOrAGsCawFrA2sA6wLrAesD2wAbAhsBGwMbAJsCmwGbA5sEZPtg2CRYIkgZdtSuC2l21K8LeXbngTctZTFYttHLLZ9xGLbRyy2fcRi20cstn3E7raP2N32EQtsH7HA9hELbB+xwPYRy20fcV7bR+xg+4gPtg/jbPuIwfYBrByD7QNYBVgVWA1YHVgDWBNYC1gbWAdYF1gPWB/YANgQ2AjYGNgE2BTYDNgc2CIm2wfBIsESQcq2pXBbSreleFvKtz0JuHMpE9s+YrHt",
  "IxbbPmKx7SMW2z5ise0jdrd9xO62j1hg+4gFto9YYPuIBbaPWG77iPPaPmIH20d8sH0YZ9tHDLYPYOUYbB/AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwBYx2T4IFgmWCFK2LYXbUrotxdtSvu1JwJ1Lmdj2EYttH7HY9hGLbR+x2PYRi20fsbvtI3a3fcQC20cssH3EAttHLLB9xHLbR5zX9hE72D7ig+3DONs+YrB9ACvHYPsAVgFWBVYDVgfWANYE1gLWBtYB1gXWA9YHNgA2BDYCNgY2ATYFNgM2B7aIyfZBsEiwRJCybSncltJtKd6W8m1PAu5cysS2j1hs+4jFto9YbPuIxbaPWGz7iN1tH7G77SMW2D5ige0jFtg+YoHtI5bbPuK8to/YwfYRH2wfxtn2EYPtA1g5BtsHsAqwKrAasDqwBrAmsBawNrAOsC6wHrA+sAGwIbARsDGwCbApsBmwObBFTLYPgkWCJYKUbUvhtpRuS/G2lG97EnDnUia2fcRi20cstn3EYttHLLZ9xGLbR+xu+4jdbR+xwPYRC2wfscD2EQtsH7Hc9hHntX3EDraP+GD78J1tHzHYPoCVY7B9AKsAqwKrAasDawBrAmsBawPrAOsC6wHrAxsAGwIbARsDmwCbApsBmwNbxGT7IFgkWCJI2bYUbkvpthRvS/m2JwF3LmVi20cstn3EYttHLLZ9xGLbRyy2fcTuto/Y3fYRC2wfscD2EQtsH7HA9hHLbR9xXttH7GD7iA+2D9/Z9hGD7QNYOQbbB7AKsCqwGrA6sAawJrAWsDawDrAusB6wPrABsCGwEbAxsAmwKbAZsDmwRUy2D4JFgiWClG1L4baUbkvxtpRvexJw51Imtn3EYttHLLZ9xGLbRyy2fcRi20fsbvuI3W0fscD2EQtsH7HA9hELbB+x3PYR57V9xA62j/hg+/CdbR8x2D6AlWOwfQCrAKsCqwGrA2sA",
  "awJrAWsD6wDrAusB6wMbABsCGwEbA5sAmwKbAZsDW8Rk+yBYJFgiSNm2FG5L6bYUb0v5ticBdy5lYttHLLZ9xGLbRyy2fcRi20cstn3E7raP2N32EQtsH7HA9hELbB+xwPYRy20fcV7bR+xg+4gPtg/f2fYRg+0DWDkG2wewCrAqsBqwOrAGsCawFrA2sA6wLrAesD6wAbAhsBGwMbAJsCmwGbA5sEVMtg+CRYIlgpRtS+G2lG5L8baUb3sScOdSJrZ9xGLbRyy2fcRi20cstn3EYttH7G77iN1tH7HA9hELbB+xwPYRC2wfsdz2Eee1fcQOto/4YPvwnW0fMdg+gJVjsH0AqwCrAqsBqwNrAGsCawFrA+sA6wLrAesDGwAbAhsBGwObAJsCmwGbA1vEZPsgWCRYIkjZthRuS+m2FG9L+bYnAXcuZWLbRyy2fcRi20cstn3EYttHLLZ9xO62j9jd9hELbB+xwPYRC2wfscD2EcttH3Fe24d36aD72A3aFTNn38dxSmpjRrD8CNNaM4IVglWCNYJ1gg2CTYItgm2CHYJdgj2CfYIDgkOCI4JjghOCU4IzgnOCC4LWIi0iLSHF1FuMvcXcWwy+xeTb0+i7ljueklrvHqe49268ltSK9zjFvXs7ThG0b49T3Pu37RTXqpcxNrXsZYxNr3tZg1MLX9bg1MqXNTi19H0jcKm17xtzsPh5LsXvYAjxA/fiB4oQguUjTG3mCFYIVgnWCNYJNgg2CbYItgl2CHYJ9gj2CQ4IDgmOCI4JTghOCc4IzgkuCFqLtIi0hBRTbzH2FnNvMfgWk29Po+9e/MQSkccpnqD4iTUij1OUoPiJRSKPU4yg+HmC4ucJip8nKX6epPh5kuLnSYqfXCjyjTlY/JRL8Ts4RfzQvfgp6vwUdX6KOj9FnZ+izk9R56eo81PU+Snq/BR1foo6P0Wdn6LOT1Hnp6jzU9T5Ker8FHV+ijo/RZ2fos5PUeenqPNT1Pkp",
  "7PwUdn4KOz+FnZ/Czk9h56ew81PY+Sns/JS881Pyzk/JOz8l7/yUvPNT8s5PyTs/JSh+SlD8lKT4KUnxU5LipyTFT+Xo/FTuzk+7FL+DhcSP3Iufps5PU+enqfPT1Plp6vw0dX6aOj9NnZ+mzk9T56ep89PU+Wnq/DR1fpo6P02dn6bOT1Pnp6nz09T5aer8NHV+mjo/TZ2fxs5PY+ensfPT2Plp7Pw0dn4aOz+NnZ/Gzk/LOz8t7/y0vPPT8s5Pyzs/Le/8tLzz04LipwXFT0uKn5YUPy0pflpS/HSOzk/n7vyMS/E7eEv82L34Ger8DHV+hjo/Q52foc7PUOdnqPMz1PkZ6vwMdX6GOj9DnZ+hzs9Q52eo8zPU+Rnq/Ax1foY6P0Odn6HOz1DnZ6jzM9T5Gez8DHZ+Bjs/g52fwc7PYOdnsPMz2PkZ7PyMvPMz8s7PyDs/I+/8jLzzM/LOz8g7PyMofkZQ/Iyk+BlJ8TOS4mckxc/k6PxM7s4vOKlxh2+B7w/2b/XKy+8bDx9XN+8K/12oPqzfrb7/rxelFzopQjcfrtf3H88uzr77l3d5ealfFz6uN4XN8u7DanP67Gp1//m7fykVvb77VNjsf1rfn53/+up9skXJtvzxtGIeN8BLLZlAy1/pP+7s7lbv9wN+2Z7swWGnJLsqeYHlF+q7D5vXL+z0hb44O7sYjtu9Qbc8Lo1evnxhX/i/JP9J9u5315vX23FnZ+c/1Iedcbt4NUjm+r+Ut/T8h5cvvz7ajnvzwtZ3k+s7/uNTeplMKL94stAnj9VfZ+fn+4Hnh1315IBfwYs9vLZ/hKSSY041x5xajjn1HHMaOeY0c8xp5ZjTzjGnk2NON8ecXo45/RxzBjnmDHPMGeWYM84xZ5JjzjTHnFmOOfMccxY55libZ1Ixz6RSnknlPJPyXExtnqupzXM5tXmup7aOtdI2GDcZtxi3GXcYdxnPGM+z8LN7nvDknuegCwi04J4n1t7r",
  "wuZ2s7z++vDT7adPD9l3NiHe2YR4ZxN+684m3N3ZhIdERFl3NvXK8OuNyMXJ7c3F2f/+4SzrViPE+EWptxriOdUcc2o55tRzzGnkmNPMMaeVY047x5xOjjndHHN6Oeb0c8wZ5JgzzDFnlGPOOMecSY450xxzZjnmzHPMWeSYY22eScU8k0p5JpXzTMpzMbV5rqY2z+XU5rme2joWL9tg3GR8ckXcvYPy26GIvbCtXe1qpRey1Bps27yuDuMu4xnjeRbe35i8uv+4Wm3Ky83yt18/r+4+rEqr6+v7wtvbh5vDbyEenz3W/F+SLdoejldfxycru715t96sb2+W15Xbu8/LzWZ986Fw/3/2c/xf9m92JuPeDx6uV4XN319Wb85Wf325W93fJ7POCl/u1rd3683f25UW3v31vv5u+1Zi4X5z+6X+fnT3sNpvzftk4Q/Xy99O7zGSnX54Nnlhu+U7rUc9rseH9fjJ1eos5xr04xoCXkMj7xrM4xpCXkMt7xr8xzVE2WuwnfL2baQ32/ePLr6+S+WfX5T93ZtS6ocXtu6f59yG4HEb4v/BNvxPtiB83ALvkjfhP73myHnNT97Xu3j2rl7aHrnMu02xy/E4XWHO9Wxf8fHFe/ziX1j/9MUniT+72F4c1I/JleIn782oW7bzl+e5t+TrRclT/5Et+clL3ZZXqRfSb11fVXJ91Y5X16+XPU//f72+el8vfx5cyVP2zX9ux5hkx7iWna/XUo8Kwv4K8x/bxKL/S9G9NH69GnuBJIYvitsc/ud2rG0mJb3pvt2B/PqZrOL8IvnP7grq5T5xT67cYZ41X/4ciXbbu+RWarK8Xif/JuzxTmp7dj5Fx11Z2l7ZPt7+Wb67/VK+/fNm+5GO3RP1my8Pm3bykpYfVo9PXt3d3d49PplMXV5f3/5ZvF7efNqNWW35aL25TujV6n6zLrwqHN8/2sOky0u2obCHf3z3L2X81+vjmJ+T4b31208HfHv3CM4O",
  "uzl5sPm647zf9mu5OK7jcVd5yS56+oKzdsDj3eF/ajd4T3fDcL1eFlbrwv1yWfi0vvv3w2b5bpm8zs7tpvBxdbd63C/NPSzcfl4m97rLbbL2vze8Wd4nq1p93Vur9fX+mevlx83dOvnpl8LNw+ffV3cXhUbh5aeHm3VBFT49PNyff51U2+7ccTLp79uHu0Jy931R2Ny+W/79/f12P/+d7MbV3f7h2+Se+pfC8nSRn5d/JUtcFj7f3mw+nm8n1B4Pyf6TQ6cHJaUOJdfz692tyPZNuZNr7u7Zw3X3opuEP+Me5nL7QzJ2++vV7bj68GowSP4dXtlBqfby7Mt23+8rXfTd8vOXXemIz5MTKVlgZ7uk3S3Hxf7H7YKeoTfB5UW7e3jiQl+ev9n+DnI3ZtzrJRszGtTbW3a+vV8+/XXpTz+djnhR3rZktcO489263qjzi38spHaWvvDZ2fP907azZLPqnXJ9cJWs7+z7zvrzKonSuvDfhcHt9rh9/1/ls92rfjnoTnfFPdn03VK2P53nOCuOdcHlpPDkJ8UoiXQSx9bqj9X10wvDZktu9i/w38v7zeMlYVm43o4uvL+7/VzYfEzCn1wKft5ebG8/f9mkLnePDgv+d5Leh4fk1FvdJ0tPhoWFL/vza/XHsvDv29tP9w/XF0m/v05OiJv9diSnUOF6fwJ92Z5U1w+fHu5/LjQftudg4Y9ksReF2+vVu0JvP+jj+nFzk1Pk7cflzYdVYb0prG/2Z9379d39Jllxcp7dX2xfxE1CkzPu+vbtp2QpyaV6fb17bbvzrLC6eZesrXNb+LJd4ufVMrmgF5Ptyr4a2usPy+SFfvcvL9KvC8PN8i5Jx8Xj1h3BdiEXveuH+/vjM9sHF6P1ly+PQ1bJzufr6bMnkjb8S3Lo28u7D+tkQ69X75Ndf/lzmNw03O0/Vbh/kNTAXR5+v90k143djx9Xy3eru+2AhL+/vd0cH2z7/D9v7z7t3ib47f8BUEsD",
  "BBQAAAAIAEuqXl2+pRPPMhsAAKcaAQAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDQueG1sxd1rU9tIugfw9+dTaD3ZhOxyYve9m4ScMlhJGK4Bk5ndN6cULLAW2/JKMsxU7Yc/LfkCOG13P0rX0VTNAJbU6m79u4Hf40k+PKbZfT6M4yL4Yzya5PutYVFM99rt/GYYj6P8XTqNJ/rIbZqNo0J/md2182kWR4PqovGojTsd3h5HyaT18UP12kX28UMRfT9MR2kWZHff91udzid8wAhqtT9+SGfFKJnEF1mQz8bjKPvzIB6lj/st1Fq+cJncDYvyBX32NLqLr+LienqR6a/aq/YHyTie5Ek6CbL4dr/VRXtXCFdXVKd8S+LH/NnnQT5MHz9nyeBE31qPsdMKdA+v4lF8U8SD6utyHr6n6X15+lH1kr6+OqG8S6Q/PMSH8WhU3kx39d+L+7ZW3SovfP758v6fqpnT4/0e5bGelN+SQTHcb8lWMIhvo9mouEwfv8SLMbOyvZt0lFf/DR7n57J3rBXczPIiHS+u1l0YJ5P5x+iPxWQ9uwLxDRfgxQV4/QK04QKyuICsXaA2nE8X59P1G5ANF7DFBcuhB8NkMIjnY7Ndi1bjX5+ATeNHYnmFcJ0BJJeXSOdL1PISVQVk/kSrOPSiIvr4IUsfg6w6v3zstLNsZxUEnb6b8owqbPOvbz8efdp58+tsGE8GwX+Cz7NkEL/5y6vDV2S/FU7uRkk+bO22Ds67lz398fUvGHfen4Tfut1e2Hr7oX378cOD7kr5782i8YN54zoT+pbl+l0dOdx4pLfxSGg60tYjXQ0Xz4eL+ebh4qoN4jzcz1k6mwbTLL3L4jwPIn3uSG9OcfY9jbLBu6A7GgWT2fh7nOXBbDqIijj4/mdQ6L1NL+6HOH+n27hKkkkwKSdMvo8HwV02myZBHif5LPhXFMSDWO8V8Sgp3gXH+iTK3if3VZt6Pwlms3gSP0SDIMnjd5um",
  "GW+c5o1HehuPhNg2zWQ+zWRLqsg8VZxVrSSTcku+KjJ9PNFBLT4ex/EoaAcn0eRuprfgD+1C36M89NT1eRPlTYwthHFeJIbrestbc8PQzMdeDI7aB0cXrQjnFF0kN/dBFIzTSTEMXv+iOOPv9cvfolES3M9mq5fMz/dweUO5YS6qy+n74CKL4rvZJF60iSR5H/SHST6/sWmy6JbJ2nLsmC6Hfkj333RnRTR80A/0P8GnaFwO/5+v6K7h5e6Bfv2Q/jDKFw+ALef5K6s6QJ1nudf9RznXeuCKvw+/bZjNS2izny/Pry+C/nm/e1J9dX1xERyfHx9fb7jBFfQGX476Qb97+Tns6y/C8Op0PoLL46A//+zoqrV9zvgqm3zx0JTz3bv9LydhP7wqN6qL88v+SffqaNNGs2hddAxbDfzOvfOzUM+rHveX8FJ/XU1q0A+/9K97G3rQW/YAGQK7pXdfl8eetrWHj2gtGPNzCF4MILy8PL/cOds5OusdXYaH/Z3Wm9braDx9/+r4Fa0+ab35Sw91ROvt293OhizUbJOb23zx0MVip6KbdyqxGDV5cfvD8+uzvn5AWzvRZXtd1KGtt7ut//lba+MAD5a3oIZILI+xF7e/uj613PpE3/ukuvnG+/aWbZt2ri19+ioMQcBrQRA1HlpoCULNNl2CIFfPW4LX4Hxz+3xe7W3zn+m+HOll+Xwb2rQbyC27AbwnF5fnny/Dq3If+tY9OTXtefMnL7dsAVu69FUanjxZe/KyxlP6ZHnyNdt0efLKvgUo4xq03L77G+JbhnSgtiz65THx4oanR2c7aPdQtLtq85pWW9b0llt+VYYnS9eerKrxFD5bnmzNNl2eLOosfpfZ8mjLc6pxy6oDl+GFvmX5s2BH6p8u9cI+6+0cqr/hjr7Z2+r+T6cgoU/Bnf9eO8s4zq+rGz2fYLY2wYuTYLPxxTLDdRt1muLFb8dy4wx/RcgwcL4+cFSjj0e2gdds1Gng+ClC",
  "GLxPfzo6O7r6EvYC2fnr3/XXJ/NvEwdHZ9eL1zZhAN7y/aJGR7r9AHU6f9WflR+Ci1B/D9uwsaxubfqesa1fX1cHnydArCcA13hYv9oSULNRpwQsfoXHcsvusvhlWagaPzye65/gzl1+fFzdxfStZHsXrix9ONZ9OF704fVd8X4ftXb99Lq36pjpO9W2IX1dHXyeJ7meJ1Lj0R/b8lSzUac80afYUPBCPjn//FnvJ/3z+S/wi196z7rB8dHlr92rjfsJ3bafwLuhb4sl4ux98O385Po0DA6/dE8vXhw47X65Pr4+Ozr7vLFbvVW3jHsN3bbXUEM21Ho2aI3HeGLLRs1GnbLBHPYaZlzo+qnZf1CVug/7nfIpSYyQ/qmm2h665XXh75ZftPV6/zJf751dtzvpf55utSmYbNuetnGo//vH6Hby7rT7u31rO9UdP513fPuJV/rEqxd7YKf19vVIf/J8xhym6okDTrv9wy//f53ddW684/BseqvpN+7cbNvOzUyE1FlfnqzGSjq1Lc+ajTotT27/KdiIZ+t6hupQ15lt5DUbdRq5sFM/WnCR7AC+m50f628Qwafzy6Ab9MPuqX7xvH919K2rv8cdHZ1u1NXlzTgy7RvLnqAXUzFfh/3w9/6v5/pX7NZu0NrtX16Hu5+OTvrhpeuidjut3DjKhdlq7e5cX1zYmj9ke4dzxduvJuCs9fbv0OsWs9lyWttb5i/cdvArMqkgWmdBVMfwzm0Jr9moU8LlPOGos2Vxm1gMrbsYqoNYF7ah12zUaejqaQ0veEhi9zUcdnvh5bLUHfbCfvcg3PTb5Vdk8ie0DlCojhZ9tU1hzUZdphAvCAptiU8XL2hIupfU+8M4iIrhKC7iPMiiyX08CIa63TgvgiiLg2KY5nHwOEyD6GaYxA/6cDGMkyzI4yK4S6NRHqST8qXVVdM4u4knRXQXB+ltdWQQ/ZmXn/wZTKOsSG6SaVTodpJJsHOTjmbjSXB4fnpx",
  "EvaPzs+Cv75991//daQvfEyDNAvGafasg8PoIa6azKNx/OKq3Wc9vUnH0/L8wfzq6vbpQ5xFo1E1pufDzFZ9KAtgy3vrO8zfR1AO4am5qqUkD/So0yD+9ywaPb9t/MdNHA9WE1RE2V1c5OU7EKLgLov1mPVw9It63D/04l1QPoiqu9VEmdvafZrobHGkbCWZ3JXvbAjjfJqmo/J5TPTFetZG+kMy2A3u9dTlUfQwK6I8GQTpOAriOB/P3wShOxTks1kWjyN9ba7/M128O+IhGugHuhuMk1EwiXRf4jt99X0U5VGwU8xG06B/fRKeXl/NH9rxLHl6IaiO6648zN9FkQ0m8W75dbzspb5T/K9o0Tt94D69v58Fo/m9vyeT2SDI0uF9PA6KLI4nepCrfiXL21fVyeW976Onqwt99fNh6Bl/2Nabl3OlT2L4vX7mq+nK9ePTTT6btftk0b13wWkyiBZTGKSjZG1unxobJ+Vd81iffb/ox115STn2oV44eoixzkm+6a0lX7GJftG6/eI6THtp2dvqNuq0tyF75QQv8Fe6V/J/qf7d9C4deHtn3dOw/LD5h8bDGq0+bWLlbjxfPpt+pqrRfLmrlQ1vq+OHNdo96PY+lw2HpwcnYXi6MbEms0fraI/r+PqVLbE1G3VK7PLNbWhLYhdYLZfFvp1Xxxjv6x/XWwsWscJtX/+s33/+O/j8HH1Vf+ekfI+K+/Xo7du/z//dsB6WvS3fvXJbPqt8qL9LDVrz99zq43sHqJrSpHq77Mvh9C+PTndAcFFe/HZZ4graLxbRsivC2BV9XP9GsuwKWu+KSy+eYfS8H4Zu9FbdkMZu6ON7vVU3cJ1u/Kq78aulG+GqG8rYDX18L1x1g9TpxjNo39gN/frLCnLlTuAM7jqf29GR37ipmMpAaL0OhOuUbPq2TaVmo06bCnHYVIhhUyFNbSrYtqmQTZvKfBdp/7j2yaa1P1/s7R+XKdm0TOfrsv3jiiKbVtR8",
  "CbV/DD/5+fBjX+E31azQetEK16kvXdvCX7NRp/BTh/BTQ/hpU+EntvBTcPgpOPwUHH4KDj/9+fATX+E3FeXQelUO1ymgfbOFv2ajTuFnDuFnzx/1IvysqfBTW/gZOPwMHH4GDj8Dh5/9fPipr/Cbal54veaF65SnfrOFv2ajTuHnDuHnhvDzpsLPbOHn4PBzcPg5OPwcHH7+8+FnvsJvKnvi9bInrlOh/N0W/pqNOoVfOIRfGMIvmgo/t4VfgMMvwOEX4PALcPjFz4ef+wq/8f+TWK+I4jrFy3/Ywl+zUafwS4fwS0P4ZVPhF7bwS3D4JTj8Ehx+CQ6//PnwC1/hN9XE8XpNHNcpX//TFv6ajTqFXzmEXxnCr5oKv7SFX4HDr8DhV+DwK3D41c+HX/oKv+ndDHj93Qy4zhsPul1b+uu26hJ/0rHHn3R+jD/pNBV/ZYn/qrfO8V9d4Rz/lzPiEv/VFc7xJ52fj7/yFH9iKnjj9YI3qVOb7h5Y4l+7Vaf4I4f4I0P8UWMFxI4t/wicfwTOPwLnH4HzjzxUujq+FoCpfo7X6+ekTqm7e2hbAHVbdVoADhV0gg0LoLkKuq2ETjB4AWDwAsDgBYDBC8BHqddXrZeYar14vdZL6pRlu7Y/LqJ2q04LwKHaS4hhATRW7UW2ci8Bl3sJuNxLwOVeAi73Eg/lXuSr3ktM9V68Xu8ldUqzXdsfk1G7VacF4FDxJdSwABqr+CJbyZeAS74EXPIl4JIvAZd8iYeSL/JV8yWmmi9er/mSOuXZru1PC6ndqtMCcKj6EkPVlzRW9UW2si8Bl30JuOxLwGVfAi77Eg9lX+Sr7ktMdV+yXvcldUq0XdsfqlK7VacF4FD5JYbKL2ms8otspV8CLv0ScOmXgEu/BFz6JR5Kv8hX7ZeYar9kvfZL6pRpu7Y/86Z2q04LwKH6SwzVX9JY9RfZyr8EXP4l4PIvAZd/Cbj8SzyUf9HP139fxsWhXkoM9VLSWL0U",
  "2QqmBFwwJeCCKQEXTAm4YEo8FEyR8BwXhwojMVQYSWMVRmQrMRJwiZGAS4wEXGIk4BIj8VBiRNJvXKhDRY4aKnK0sYocspXkKLgkR8ElOQouyVFwSY56KMkh5TkuDhUsaqhg0cYqWNhWwaLgChYFV7AouIJFwRUs6qGChTue4+JQ76GGeg9trN6DbfUeCq73UHC9h4LrPRRc76Ee6j0YeY6LQ3WEGqojtLn/F85WHaHg6ggFV0couDpCwdUR6uN/hsOe4+JQS6CGWgJtrJaAbbUECq4lUHAtgYJrCRRcS6AeagmYeI6Lg7xTg7zTxuQd2+SdguWdguWdguWdguWdepB3TD3HxcGpqcGpaWNOjW1OTcFOTcFOTcFOTcFOTT04NWae4+KgutSgurQx1cU21aVg1aVg1aVg1aVg1aUeVBd7Vl3qoLrUoLq0MdXFNtWlYNWlYNWlYNWlYNWlHlQXe1Zd6qC61KC6tDHVxTbVpWDVpWDVpWDVpWDVpR5UF3tWXeagusyguqwx1cU21WVg1WVg1WVg1WVg1WUeVBd7Vl3moLrMoLqsMdUlNtVlYNVlYNVlYNVlYNVlHlSXeFZd5qC6zKC6rDHVJTbVZWDVZWDVZWDVZWDVZR5Ul3hWXeagusyguqwx1SU21WVg1WVg1WVg1WVg1WUeVJd4Vl3moLrMoLqsuT8TzKa6DKy6DKy6DKy6DKy6zMcfCuZZdZmD6jKD6rLGVJfYVJeBVZeBVZeBVZeBVZd5UF3iWXWZg+oyg+qyxlSX2FSXgVWXgVWXgVWXgVWXeVBd4ll1mYPqMoPqssZUl9hUl4FVl4FVl4FVl4FVl3lQXeJZdZmD6jKD6rLGVJfYVJeBVZeBVZeBVZeBVZd5UF3iWXWZg+oyg+qyxlSX2FSXgVWXgVWXgVWXgVWXeVBd4ll1uYPqcoPq8sZUl9hUl4NVl4NVl4NVl4NVl3tQXeJZdbmD6nKD6vLGVJfaVJeDVZeDVZeDVZeD",
  "VZd7UF3qWXW5g+pyg+ryxlSX2lSXg1WXg1WXg1WXg1WXe1Bd6ll1uYPqcoPq8sZUl9pUl4NVl4NVl4NVl4NVl3tQXepZdbmD6nKD6vLGVJfaVJeDVZeDVZeDVZeDVZd7UF3qWXW5g+pyg+ry5v5uBJvqcrDqcrDqcrDqcrDqch9/OYJn1eUOqssNqssbU11qU10OVl0OVl0OVl0OVl3uQXWpZ9XlDqrLDarLG1NdalNdDlZdDlZdDlZdDlZd7kF1qWfV5Q6qyw2qyxtTXWpTXQ5WXQ5WXQ5WXQ5WXe5Bdaln1eUOqssNqssbU11qU10OVl0OVl0OVl0OVl3uQXWpZ9UVDqorDKorGlNdalNdAVZdAVZdAVZdAVZd4UF1qWfVFQ6qKwyqKxpTXWZTXQFWXQFWXQFWXQFWXeFBdZln1RUOqisMqisaU11mU10BVl0BVl0BVl0BVl3hQXWZZ9UVDqorDKorGlNdZlNdAVZdAVZdAVZdAVZd4UF1mWfVFQ6qKwyqKxpTXWZTXQFWXQFWXQFWXQFWXeFBdZln1RUOqisMqisaU11mU10BVl0BVl0BVl0BVl3hQXWZZ9UVDqorDKormvs7Ym2qK8CqK8CqK8CqK8CqK3z8JbGeVVc4qK4wqK5oTHWZTXUFWHUFWHUFWHUFWHWFB9VlnlVXOKiuMKiuaEx1mU11BVh1BVh1BVh1BVh1hQfVZZ5VVziorjCormhMdZlNdQVYdQVYdQVYdQVYdYUH1WWeVVc6qK40qK5sTHWZTXUlWHUlWHUlWHUlWHWlB9VlnlVXOqiuNKiubEx1uU11JVh1JVh1JVh1JVh1pQfV5Z5VVzqorjSormxMdblNdSVYdSVYdSVYdSVYdaUH1eWeVVc6qK40qK5sTHW5TXUlWHUlWHUlWHUlWHWlB9XlnlVXOqiuNKiubEx1uU11JVh1JVh1JVh1JVh1pQfV5Z5VVzqorjSormxMdblNdSVYdSVYdSVYdSVYdaUH",
  "1eWeVVc6qK40qK5sTHW5TXUlWHUlWHUlWHUlWHWlB9XlnlVXOqiuNKiubEx1uU11JVh1JVh1JVh1JVh1pQfV5Z5VVzqorjSormxMdblNdSVYdSVYdSVYdSVYdaUH1eWeVVc6qK40qK5sTHW5TXUlWHUlWHUlWHUlWHWlB9XlnlVXOaiuMqiuakx1uU11FVh1FVh1FVh1FVh1lQfV5Z5VVzmorjKormpMdYVNdRVYdRVYdRVYdRVYdZUH1RWeVVc5qK4yqK5qTHWFTXUVWHUVWHUVWHUVWHWVB9UVnlVXOaiuMqiuakx1hU11FVh1FVh1FVh1FVh1lQfVFZ5VVzmorjKormpMdYVNdRVYdRVYdRVYdRVYdZUH1RWeVVc5qK4yqK5qTHWFTXUVWHUVWHUVWHUVWHWVB9UVnlVXOaiuMqiuakx1hU11FVh1FVh1FVh1FVh1lQfVFZ5VVzmorjKormpMdYVNdRVYdRVYdRVYdRVYdZUH1RWeVVc5qK4yqK5qTHWFTXUVWHUVWHUVWHUVWHWVB9UVnlVXOaiuMqiuakx1hU11FVh1FVh1FVh1FVh1lQfVFZ5VF3UcWLc6aT0w+sXGEmOD3acOO0fm6RLnzKxNi0toni5xTk15yc/HRvmODXKJDTLFpjHglR1rbBA8NggeGwSPDYLHxoPyyo7v2GCX2GBTbBqDXomsscHw2GB4bDA8NhgeGw/aK5Hv2BCX2BBTbBoDX4mtsSHw2BB4bAg8NgQeGw/qK7Hv2FCX2FBTbBqDX0mssaHw2FB4bCg8NhQeGw/6K4nv2DCX2DBTbBoDYEmtsWHw2DB4bBg8NgweGw8KLKnv2HCX2HBTbBqDYMmsseHw2HB4bDg8NhweGw8aLJnv2AiX2AhTbBoDYcmtsRHw2Ah4bAQ8NgIeGw8qLLnv2EiX2EhTbBqDYSmssZHw2Eh4bCQ8NhIeGw86LIXv2CiX2ChTbBoDYimtsVHw2Ch4bBQ8NgoeGw9KLH0r",
  "MXJRYmRSYtSYEkurEiO4EiO4EiO4EiO4EiMPSix9KzFyUWJkUmLUmBIrqxIjuBIjuBIjuBIjuBIjD0qsfCsxclFiZFJi1JgSK6sSI7gSI7gSI7gSI7gSIw9KrHwrMXJRYmRSYtSYEiurEiO4EiO4EiO4EiO4EiMPSqx8KzFyUWJkUmLUmBIrqxIjuBIjuBIjuBIjuBIjD0qsfCsxclFiZFJi1JgSK6sSI7gSI7gSI7gSI7gSIw9KrHwrMXJRYmRSYtSYEiurEiO4EiO4EiO4EiO4EiMPSqx8KzFyUWJkUmLUmBIrqxIjuBIjuBIjuBIjuBIjD0qsfCsxclFiZFJi1JgSK6sSI7gSI7gSI7gSI7gSIw9KrHwrMXJRYmRSYtSYEiurEiO4EiO4EiO4EiO4EiMPSqx8KzF2UWJsUmLcmBIrqxJjuBJjuBJjuBJjuBJjD0qsfCsxdlFibFJi3JgSo46ViTGciTGciTGciTGcibEHJi6nzE9w2vkwjoteVEQfP4zj7C4+jEejPLhJZ5MyRuXkrV4Osvi2zA/bO9C/D7Z/OHKo9kJleL2L9kJkOh9hfQCbruB7B9z0utg7EKaW5F4ojXcQ+g7GK/QB0+tdsndAjGPAetTYeA+i72G8Rg/PeIW+wHwPqu9BjUf0wI3j6Mq9A/PIme6V8SnxvdA4t/rm1NgS1S0Ze4U7eoAdY3/1EWQ+okOCTCk51Lcxj10/EvP8qr2DqqX2U3L1Mksng6RI0kk0+pRm46goksldkP970eUqctVmeHs5G8VB8ec03m/Ff0yzOM/1Va1gmiVplhR/lrtEMPjj9mhQLvBy0ermZqPoY/est/PqAOPXo+J9uffpTfPoKvwWnu1cnv+28/ZtudQWp+qVVt2m/MTUL4fudp27i5+6q9a7233R3eWX+wTU14HeJr5Fo0R/1MeedonW+qFl/w9L1x6mj70snfbSx0m5V1cvHE2ms+JUDyG6i1cvhlmWZqsX9eRHo1H6",
  "eDCKJvfVOXF5vJ8UI300jPMiCdpBOLkbJflwcXC/VfYhmB98eP0Lpux9sjznnT79Irm5XxxOs9WB1mJa9RfF08Shj/O77C7vsZoqpKfo5YA3TgCtPwGdHybA3Ms33VkRDR/iUfCf4FM0jt/85dU/X9G98j+drV1ee0Gvnam+8WmU3SX64Y7iW/1sO+/KvwQsm/8MMf+iSKfV0/meFvrni+rTYRwN4qw8QR+/TdNi+YVenIMseiwj/cd4NMn39OvDopjutdv5zTAeR/m7dBpP9LHbKmf6y+yund7eJjdxL72ZjeNJ0cadDm9n8Wjey2EyzXWP9hKd8+xoUH1jaT+m2X31nezj/wFQSwMEFAAAAAgAS6peXfn3xDwoAQAAwQIAABgAAAB4bC9kcmF3aW5ncy9kcmF3aW5nMi54bWydkk1uwyAQha+COEBxWjWNLIxUxWrVTZsrjDAEJH6sgSTu7Qu2F0m7qeIN7/E8HzDAL6lHMnkXUkdNzmPLWJJGeUgPcVShJDqih1wsHtmAcLHh6B17bJotSyMqGJJRKvdLQgWPQe2Vc69BmoiCa4xecBmd2HJWh6q/tBbNbKviGC/iibM6VL2mq+JsQagpEzl19Pll25SPEvnd0cfdbjZM8CPCaKx8Q/BK8HB+v/KHshH5eT4gsUNHN5SEMtnRvQHMZFOrS3pbUObYX8ik0ZcE2nW1pXUt3NE8DzbQK1QPGcgJ7R0oWc9RWLKd1bopeTdpBeB/AFFrK1Uf5cmrkBcKKgfZxpCMHRMl2Nau48cwd5rdnPjaF317idLZwqy/1bpfD4vVpyt+AFBLAwQUAAAACABLql5djtHpOYsAAADtAAAAIwAAAHhsL2RyYXdpbmdzL19yZWxzL2RyYXdpbmcyLnhtbC5yZWxzjc87CsMwEATQq4g9gNdOkSLIrtK4Db7AIq8tEeuDtAHn9hEkhQMpUs4MPBh9443ExVCsS0XtfgulByuSLojFWPZUmpg41GWJ",
  "2ZPUmFdMZO60Mp7a9oz5aMCgj6aanon/EeOyOMPXaB6eg/yA0VjKAmqivLL0gPv2rj5L11QR1Dj3kMe5Axw0fr0bXlBLAwQUAAAACABLql5dLQSk6I0AAADzAAAAIwAAAHhsL3dvcmtzaGVldHMvX3JlbHMvc2hlZXQ0LnhtbC5yZWxzjc87CsMwEATQq4g9gNdxkSLIrtK4Db7AIq8+xPogycS5fdwkOJAi5czAg5E3Xqi6GIp1qYjNL6H0YGtNF8SiLHsqTUwc9kXH7KnuMRtMpO5kGLu2PWM+GjDIoymmZ+J/xKi1U3yNavUc6g8Y50wPFwyIibLh2gNuy7v8rF2zuyDGuYc8zifAQeLXx+EFUEsDBBQAAAAIAEuqXl3eoFvVzQ4AAHN8AAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDUueG1s1d1rU+LIGgfwr5JlrRndpYR+noSbl62IQVAUl8uszptTUaLkiMQTwrhbtR/+dBLCeCFN/906p3ZfzCjpfpJO9z8hzG+q2H8Owof5xPMi4/fH6Wx+UJhE0VOjVJrfTrxHd74bPHkz2XIXhI9uJF+G96X5U+i546TocVqicrlSenT9WeFwP9l2GR7uR+5NM5gGoRHe3xwUyuUWHVksCqXD/WARTf2Zdxka88Xjoxv+ceRNg+eDgihkG/r+/SSKN8jeT+69N/Ci0dNlKF+VVvsf+4/ebO4HMyP07g4KtmjYTbMcVyRdvvje8/zF78Z8EjyfhP64Kw8tz7FcMOQIB97Uu428cfI6noebIHiIu3eSTbI+6RAfxZU/vnlNbzqNDyaH+p/lcQurYcWFL3/Pjt9KZk6e74079+Sk/OaPo8lBoVYwxt6du5hG/eC57S3P2Yr3dxtM58nfxnPaV242bhfzKHhcFssRPPqz9Kf7+3KuXhRQOaeAlgX0pkDkFfCygN8WUE6BuSwwdY9gLQust+dg5hRUlgWVtwV5Q6ouC6pvh1TJKagtC2q6",
  "BfVlQV13SPFspCtXzkom/njspWuaHY7zVjGbZDI/Up3NOFkfqc6mnyofqc7Wgqofqc4Whmofqc5WiZJlKqWXWXKNHruRe7gfBs9GmPSPr0VzFdjV1SlvCbdxj+QOkL6+O+y0tj+fLibebGz8aZws/LH3+Yet5hYfFJzZ/dSfTwrFQtvudo1ey2jZ5458aY+GdvuL0y3s7JfuDve/ycHEf26Xuz9Kdy+zIw8a31ZXLc3cluPcFie3pZXbcpLb0s5t6eS2nK5rKcnZXk05pVNOlfwpp2QfrD3lLX86nRv+zLj5w/AjeSe/M55lheEaj8EsmhiyeL5r9N27u6knozObeeHccJ+ePDc0Jl7oGe5d5IVGNPGMceg+78pdDj/9SFTb86PFjeHPvaLxsPDln4Uh3yCmaduNv2t0g2Duf5OvTUv2/bc7NqLF1Psmf859340rjae0d+jOI2Mad9/NiwLlRiG35Ti3xcltaeW2nOS2tHNbOrktp7QpCryMQi0/CpxefRUr2Ys/i58nBlEo2315QUeHZ543NUpG153dL+Tzw34pkseIm75Pa7oLLufswfHmkb+m7mpZRzl17vR+MV9Td72hbpkH79u6g37dUPzNnfoPa+pse0OhMB6Wib4pGpSkVD7xFQ3+nuZ1uz3adDKh690vZl58aayrb26ov/fHxvb8IfSfop3X9a+CYqZBYcVt2kyDUjO17xrnvYthW/48G43yrkh8p86V0292Bk7yRtA/HQ1Hg5ydN/Gd28N21xk6A/nr4LLXH3btQSdn78f43o97F44x7J04w7bTj+eld3Y2MoZOezg6zjmKgx/lpGd3jXZn+Es8Wc7g/NOPol7Z658Zw/S3zuCXnIO18IPJXVK1btKecen0W05zKG8V8bY6W2LP6PR7F686ZUMYDbqds1dd+/bo+MLJGdjJRwZWr9fqe0arc9EZyOkevNjWTUdx1Mmf9/bHpqIm76N7xpded3TuGM22fX75quHcbo/O",
  "RhedixM7L7SdDx6YrOqe0eydO0d28+zVxqEtjyZPteuc5Rzz9KPrXua9Tz9WrDLX4wVstbqO8Vvn4iKb7bddur3eoPNF3g0F73WGp3be5H81c25mcgErlimz9uKmGGeoxvI0J/48fRpZe5vNTs3p93v97c7FsXO1vWVvWQ35l1kuntvDZntbFLfsdFuysbyzU9xQQUBFsze6GMrJfbGp8MtPBVlSkH+9m4pX92dr8/3ZShexnvc23HuIguBGPoX9afRuo3Xv49kekkfxeCfziRt640L6zwJHVuMofoyf+8nn+eRErIOCXOnC93PeHB05LZ2+vFFsFz4XPrmPT3tyL8nPwucf7N/qhZ0NPWpyrtJX2cqnna4dO5lzRSllc51OtVF6+WaRnTytPfmm1WhmJy/yT37YO7avt3c+TaO9g60r6+etayu57ZC8DAqrAChHaTVsUTblNLzIxprxHmfj5bXjPbYax9l46aPjHYzO1WPtysF2k9HmD9RRT6xjNZxsoPzRgcoOyFg/3cu9XGwIi6gks798z0juZzUSYk+xJq3sVM21p9qyGq3sVM2Pnuq/fp/ezXaHztXwtNe52JbvMf1tUd4pDvsjZ7WXVqc7dPp6Oft+LaXv0Ruu0J6s66WFcoDxTMajH1yMzo82HfFMlp6lK1DU7JislCiq93spu18m3Q/KOz+p+/4q+/6a9U0W8q9OWvL48k+etLh7eedn3XlLuy/fs/KuhBP1lXBiNU6yK8H621wJf7s1LO/WtPvLMYkNi9JWL0rbarSzRan8hTtxui7n9lWnNVDPy7kc/rnG1A9kv8HyTTENdzk944Py99tyMX3e0lvp9OHt/zTSou6u5WWVv3od9ep1rEYnW73qP/qSUlWMZMUovX2L//3Ft+F6Os1WxHr/T3NXWVtl7WpdWY2rbLVqeau16Vk2b1zX1tpjXluN6+yY9Q8dk/OP+XX9Mb9aja+rx+a3Hxrkb+t2Zdvr92XHqbJXe0uf",
  "wuWYZYzjHcokHxSSARZf51y2F+n9tiT6osg7b8/n1eeuyubPXZVXn7tepeCokveJKv0QVXr3KaSS97CcfvB4V3BcyfsYkD75vytwlEfg9wWtSt59J32OfVdwoiyw3he0lQWV9wUdZUH1fcFpRXGlVvKu1PTifLez67Ud6+87fl3bUaxZdtte3/X1gr8KZnVzMKuKYFbRYFbRYFbRYFbRYFbRYFbRYFbRYFbRYFYVwayiwazqBrOqH8wqGsza5mDWFMGsocGsocGsocGsocGsocGsocGsocGsocGsKYJZQ4NZ0w1mTT+YNTSY9c3BrCuCWUeDWUeDWUeDWUeDWUeDWUeDWUeDWUeDWVcEs44Gs64bzLp+MOtoMOP/vrQpmXGf3GiuGrWzuarQDueqQjud6mOsi+eqQjuf6op1AVVXrEuoumJdRFcV6zK6atQOafzBSS+l63uuj2lOX1VOhUZOhSqnAs6pgHMq4JwKOKcCzqmAcyrgnAo4p0KVUwHnVGjnVAA5FXBOSSOnpMopwTklOKcE55TgnBKcU4JzSnBOCc4pqXJKcE5JO6cE5JTgnLJGTlmVU4ZzynBOGc4pwzllOKcM55ThnDKcU1bllOGcsnZOGcgpwznV+M+BwlTl1IRzasI5NeGcmnBOTTinJpxTE86pCefUVOXUhHNqaufUBHJqwjnV+E9SwlLl1IJzasE5teCcWnBOLTinFpxTC86pBedUBWzCgnNqaefUAnJqwTnVQCWhUiUBs5KAXUnAsCRgWRIwLQnYlgSMSwLWJaHiJQH7ktAGJgEIk4CJSWgYk1Ahk4CVScDMJGBnEjA0CViaBExNArYmAWOTUGmTgLlJaHuTAMBJwOIkNMhJqMxJwOgkYHUSMDsJ2J0EDE8ClicB05OA7Umo8EnA+iS0+UkA/iRggBIaAiVUBCVggxIwQglYoQTMUAJ2KAFDlIAlSsAUJVQWJWCMEtoaJQCOErBHkYZHkcqjCPYogj2KYI8i",
  "2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHkYZHkcqjCPYogj2KYI8i2KMI9iiCPYpgjyLYo0jlUQR7FGl7FAEeRbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYo",
  "hj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHsYZHscqjGPYohj2KYY9i2KMY9iiGPYphj2LYo1jlUQx7FGt7FAMexbBHmRoeZao8yoQ9yoQ9yoQ9yoQ9yoQ9yoQ9yoQ9yoQ9ylR5lAl7lKntUSbgUaa+R5VefA3roxfeJ1+1PDdug8UsSr4O6PvW1Tc+nyY7erudGqdJVErfd3O4P5Y7/uJOffnTD2ar/cZhft2UfbFz8h2Hk+D5OAyejoPnWfIV0fGGzuxpEZ1787l77602OmEYhKuNomC402nwfDR1Zw9JHy9uH/rRVLYmXy1plIzs26XSxoNCPAYjbcy+OzTrsyu7X/q3D8vmIFw1yMX/40nuVL6I4rkOwsfF1BWH6VGK2TH2S6uW/dLrE363YZ5+6fa5G977cqam3p2cqPJuVQYtTG8Z6YsoeEpO9SaI5O0k/dZczx17YdxBtt8FQZS9iJdj9T3jh/8FUEsDBBQAAAAIAEuqXl2zZInrzyUAAAx5AAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDYueG1srX1pd9u4kvZfwfWdvm2fUWTtXrKdLO6OE2c5bSfd836DRFiCRZEaLnZ7zvz4t54qgItMh5LnzrnTsSQSBAq1PLWBL+7iZJkujMnU36swSl/uLbJsfXp4mM4WZqXTbrw2Ef1yHScrndHHZH6YrhOjA75pFR4Oer3J4UrbaO/VC/7uW/LqRaan7+IwTlQyn77c6/UGbwej/tne4asXcZ6FNjLfEpXmq5VO7t+aML57udff81/8YeeLDF/Q1Ws9N5cm+77+ltCnw2L8wK5MlNo4Uom5frn3pn/6bnKCG/iKH9bcpZW/VbqI735PbHBBT6Yl9vYUTfDShGaWmYA/gwzTOF7i8nP+iu7nC/AQTf/cmncmDPEsmul/u8fuFbPCjdW//fN/Y8LRcqc6NUSTP22QLV7uHe+pwFzrPMz+iO8+GLfkMcabxWHK/1V3",
  "cm2/O9xTszzN4pW7m6awspH8q/92tKrccdydPHLHwN0x2Lhj1H/khqG7YchLlbnxwt7rTL96kcR3KuGrsYBRz49SLInoOMMVTDb5fP3q/Lf9Xz/mCxMF6n/V77kNzK//+I93/zF8uXcWzUObLvY6e398vzi7xL9nZ79fnL/fO3hxeP3qxS1NAv8/c8O+lWFpWfQwsGDxy7umXw5pvsWkBzLpweTxSQ94jOHWk34ThipbGJXkoUmVjVQcGbUO9cx06ddP//rnYDR+bpfEtYZuCRR9MR48X9C1y3hB0vbYKgePrnLQtsqhrHL4+Na8HfIYIx7DRhDPyyyhXy3tdfbqkzGhOlQXOprnJI4vDjN6An4qJyED4BGNI5yZNLP1+2pTHLmNOH50iu9Gwj2yEx/+69vZHxfnXz7ts7ZKSV0F8SztzuN4HpruLF7hc04qIjsMDvs39mv+/z6em5E+D3/8djb9/fp2ctP79vbPyc0y/itJLs9+DO/e9f/+7d33QxPY7HWerl+mC53YaL7X2Wbb//XP/uC4fzJ5rr6SuqxwgKb/KT+X2oVvbnXBBUG8xAWBjfTewQMOqJFqLKRqZNnahZNW5n47EZqeHG3N3v2u+nOhM2VTWqNNX8tXn+ljagzx+uu9n8/+SCZ1NH58UkduUseP8FK/22/iQHfbYOulXNEereIoW4T3arbQYWiiucHC4jxRM01X0S5GdpaqeRLn619Ttf8mnOsbHagbrT7xBYYuWGq6IF+vD9QiXplyqK4607OFPEKRaLMmMH+bZGZTc0pbTowR2iwLiW7XymaKyMojmFuT3KtA3ytN8w/jOX60wlRgShMo1r+sUPKcxk5u8izHA9TKWKOWlblharZ15ss4yGl2t6SNBsfPwxu9zLOUVnA+16Fa5nmIsUVVLdPigaeKhqHJmEDzCKTv5lqtZRBzqyKd5UuDZ651RBdmJBGrPDVe6REdUvpEltjQlOivpU1udLeFhY6dAPS7g8eZ",
  "6LiViQZNTHT8JCYi6KPmMVGKmGcWEyoh8kaz+46K4gy2067ylVqbhCFURJZAvVFTM7dRZBLeY97ZLImJa1LwwSI0mSEy34JhCHoQh/IlWviLhlBZrK5tRJPgX4TJMNQdzYXondj/YYPzzWgy4jSMSVeyL8kSe3njPtyYNa3rNk87ZOyzDItZpnaldUg3pXGcWNpnmi+zT4itzPK5udV0CfNEJuOsCSllmJ8mDEfic+vsHF1FXEEMpEK5cGqJV2gUnS8szdZfl7Xu+okzYsPu+KT6f4+zwEkrCwybWODkKSxwbRPaONkFYoKvsyye0t4OeoOJ7IqBvK/zdPEsX6fYmLMUANYwbYiO8TKLy1tAZmNos5dCtcwshVCkGUjMbBux+r12NYtrWugzaqKPv297Ap2xPmMlSvpphVXONLFgbKMO6bVZmJPdmxMfx6QC7hYxfv0VgkO6gzQfcbrIB10WEysGgbqHio4gDbGoxX/983gw6D3/QjQlHWJpLn/EJIQJf99/DhWjyBfJjENn5MRoEh6TdNUVa1W4P0SAJXbPqVrYufTNeu1mHph0ltg1vAFWvFqnuuDfW1KtmVlotSwAnije0NrlygQd0skqMvwHgYKU5MsqY1kM6fJcd9UnC6WqVUwyFNmVdWpR3eqFWWqdBDZ06xwU63TLLqZBvBZBFSeJDgMILOkJctRo9CsZjJdINPNrs26aULwmJNYyaStvtYPmt/3BzsBiQObS2UYxe2QFQ/n+g7dvEAvyodomONyC+YctzD9oBhn+vu2Z/08sJ4pz1tnEVZH5OytQAFitYDPHyoMe6RACBKVanxoyHEY4NSJfVr4FS+v12ugkLcEB2LiwFIQgTiEqLG1rO1uK3DBlVQKSKH1XQRmJSckbTdV1Eq94lH7KGON7LmrKm322URGLX8FHqTAa2ZlwhYXh+kGvi38LPKDDrrrUMByVrxgUTCsYIHdP83yfnRLAoOtIZgL4SIRSSHgCYYWV6XhU",
  "Yd0VIkb0uw51RrLW35gE1tTCQKOdbU1/1MpPjXjD37c9P33DPmJzZBszgPE0t7Rt2GnHCBdnP84uCIqE+Sqq8xLRGVv6g/VPFEBDpPHU3jI1a3QPLCg7Jdx69ebyrJVm421QGa56hEwVmox3pQmrQfKoLjNiF5Ocqht6PhkM+kSG5TWYjiQnZ8tD1EjMmuCO0amlz2SbEEXqqt/IPhDYWq1DA6tU2PBhr7DbEFEWoSWp8hQGhbBYwF+DHachQy4/G8FMp0RU0ssh+4IEhog1Ow42Ay3p5DaHwoZVJ+28yPBtSpuQWBraEvT6IpxrCQOkDiYklp8Jj4tm14wRMhYy+hjemgDgrLARxfWE1UOdk7WBpWjd4MnuQjHZZrcnT93ttxpulPD+KsaCTUybt9VOVvfpmxBmYU9ZFKYkF4SZlzmGeirxW6l5tDs1j7ah5tFTqfkthD+3Fu0CEHQNVv81KRyT5HHCjh8hLA1JY0Jdg1wdloQ4JNa/yafekVi1EXn8dCI7T3F01B39hK7H29D1+MlcSnome0hYdacjsqJqaufViMFjFO73mkl8ZdfrTQpnekF20Ct38sayTb8+a6M5HvdUojtH7fi4e/wTop+02stG56y/s3eGeCybSrjmeVTCo676ryo0AgiCaz03VZQU5Im4Jt7FOwKqqkAkNjJ1E0tbyD/f0cR4q+HomIDxW0QOza8poa3ZksSApmPDyp20EFL458Ig1wi6evRGzuOKMGDHzRVQLDB+kgwpeYRaiNk6hGSB7uBMOguQBClpOLgExAkCmhyiIny9yuGDGDinhAeOKkiNlhEvCSAySNDhXHBgYVXgtpCzk+WAf8Qm6tIYH2QwEirwCCOUe9Z5RCYvXyK+8Al8m0cRHCSaFPFpStNK4sXSrDrC336wOR7gglKJTukCHrmNLwdbuMSDXitXNrrEg51d4vexcBmgCOJ+MdwDYhwL+SNJA941GaEUMAdxHPFMFmf0LfNwKopiHeqI",
  "pBecG9N1hEbikNCIJgeZ/FXmTjOLiac6ihwIlRInh+ZZaOaF/yEXT+luYqV5qvYHPfWfhNvVSzXqHTA3MTQxZaTG+7nwMeelA4zoEbEM7VxMjyNUw5E9F/RZEMCvMNIyJuZBpq9LJgI5BYl3IGpGS7DBiv9a5wvaYWIpYszULHNCQ8D/y2XeKZImdGOoC7+kuGnlkI9Zabli6VexucAWnulvY0AG/VauGTdyTX9XrvkaIVQdGh0J4zAzdNWf7OXPJBKYmdkisv9NTpTOKnorS7SNoMqqqgob/GZzqxDKoGvJE3SBBEChDLue5UFByS72oD98bud45IJjyU6sTQa4TTI6h22BwDt1QjycmCiyrSGGwWArug9a6T5ppPvg35YpWBlYcQjXNLchR7E0iaul65I4J+eDNHYak4TeV0ROYoFZPDcstLqyOfQ9Qsayr03RfSExIjUBYu0Vrxb5pszSMMosLO0APWrJEROy55nclmV5JT5VePMByS6W4kKOZWweuy4bVgi0sSWjtO7iqD1QNBjtHCgadtVFPJ9zZg4fEDeTBAMC3W1zcm5qvz/5KWuNW1hr2BweGoyfFhtFrie7X3M8KItF388Qq/QOJ03/lFjL+bD7LP1Q6aLfDzrqo9q/iZcmId1L6MOw0eioAX1ixj3A1R/Ufgr4wHbmJk9M8JyhRDSPaRbEfCZF3JW5r+N8aLZT5O/Gdwdd9ZVTC4sYbI00DhTJ75xxVZcIPaUISLE9Su2coE7UUVMz07jU3aemtJJUAsD0KORay8gVc7yLgtYTSQAXieFwpnwXOSxRsSqhXmQJR5A8lcgked+6AlScLYFGm9ugIB3RjiRnSVhjWnlyh8AVmR3aBnpYqgYH5ThEzYWG+iu+uaVJEx4kNflcrePFChuYWqtZamLDyCaFpSN0Q9S8MqG5jiFdS51izTVSWgI3S2IdzJ34O4znNHUsjzQKgFfm7iaKgsAA7/U8mgTBDIfFWkV1spXCnbRK",
  "RWOQa7Czi/8mUma1zu5FCKBlkUVfYW0BOLsatV+TR6P+whYxMpdgaRV3Q4F7pcZcQjudeSVGXtKUN6ZkNgc0JfKOIMC3gskC+kwoHakxspAF3s1Y/bggpkL4869nrTmawdFWND9qpXmjozTYORDwnvj82tyBOKQSRO2Qc0NW6jUULieoo/s7EF+UFikhJjMS2S5zPY+55sVlbCRvIriVjN4sXq2R1qT94T2B+HnPdEEoHr5rNU35ukiJ2OVScy7aZZlrWKQKMut5ZSf6RsrKWHRWlow30ivwIEr0mmaEFdsN2laZ58Fx6441OxHHT4KDCNx7KxHfRbAU4hHgxztEh3mPrCTNyKhfew8zcSqZNEdgCPSRWfARH9pL8l7przubLQjIYE9NEhkyC94jJc9LsS4j0macjnaFCtcyTlWZOzhZavGb4jvUDmBbSFVBblgnO3dQFJxPMov4lu4mwkhIU5OCzuyt1ksIYqfipqx1mCNLYO2KwKlOQw23EQIPLsuk1gCCG7Wqx2GvHckMezsjmREXzkClATTeyzdY+gNd5HLnTiO1zba/DZsO27yWUTPEGe7stXyJ1TqJpyRhZciFc7ukHO4NsrQMf2JOV5EyYXcUuvxX5x679BS+ryr+uxgQIjTC4S52Qx4woAzdzdUPxCaKPMIwJ6VlQ2KwCmDgyEeBJ1QZrGCPRnNxS82VrLmwzqF00LN6XeDKWNQPYFINVvQ3uqSuj7LAHLVHLoZbeUPDQet+Nhrn4c7eEPaQS1MGiiFn6kGm2q+gSdIq1yg8gRoB2AG6/VgUu2DHJZSBArmA1JBzd9jNETxEgspPoEeQWiHoysWUBbIK8ymg1kGZOf8oQAlOTGWr2FgsW33O4XArKg9bqdxojoc7540vHVJnRb3K0xkSSIs8IWv8nhmfncaOuA0fIBeonmAIFIhgxLDlLsqExC4o/KGOWEO70BzcIV2ZacI3r8mEojgx4QIU5/4hAGeLzCoe9gX5q5LG",
  "gcAhl4jNwNi3FYDVSvrxFup1vLN6HZN69WFVckR0MDeiTBJ9fU1alK/4VIlHrgkIrkhPkSMZCCvFadvUd8+KDdtQ9PgRxbs7imYxsyJfZTg64VhRGeRGbJFxnihXhtxZnkSoezSGi12+lZ5Y5NCX5BqK+pWArbsEnKsojvx021WXFhEGUnr51CPwJF7AWTFbSObRNhmF4VErWZv139FT9N+D0juX1QHGRe1eAEgcIvWjjnu/IOjG9Ga7hMi4fPzF5+vfff387eLs6vzrF5e076qPUK0iz5K3cHqyQ44nmPgv+U0nqAS4JnCVY/9iRfuItBK4nWeEoqNyMv2ejCZuVFE4UiYPpBqtKNYrNprxVmZIzKuYXYeyvooq4Nj/V1jLJM5SE2VWRe7X4LH6gu8XZ5+/X/Kaoexrrj/p86nX4bT2ZxDMv55VLCopG45OkeNNNvfMCTCsu4uBrY2eKpe4SLGQld5YAlHFD5FX9VorZx635xSGx6182WwxdnYH3mRlGom3vsoKnJHCwnrPlykyvb8xByNMUuXUg446T4gB9vu93i+dwr6HMCYBB5G+meTazMgeF1XKKHOVKznIdMBqhNgSrKnDlHzBu1ilazOzhNZFDZ86VisyQSkXFE0rM8SOwdl2+3mqLio8qfYf8CDN/A+dB6ToyrmDmTh447FCafmunJOfp6Fdqv06z3kNZ0MkEGQc8N2HZ5mm5V3YVC8dUKF/6cdilm0Mc7IFw5xskY8enjw1H839B4Px0XP1jry8qZ4tpUbMBVeG2EOkGgv9oOFSkv0kL3CGwD5ukRhfRs6004QmqOjCOkeRu5nBqJhpwvVYCHCTiswkWD4la7T0HJuUiujhdK/0XKcWGGN5yuK8EaehqRe7K4nDWvKyqHdOyYlF5opGQjKLR2Vr7/krtaKoEHWY2yZWExXuNp3zlqjrkTgSJkMaB+XTa01s7CLmLjEC9clYiR4QtKmXkXM7+6OfINJRbwt2GfX+T+zS",
  "n4yfqx8wTFx+vlqfokwXCkDdGZdS5wocRv70yUosQjIhAi64SAqZTVJGa7Fsah83nv119cebx2rVDjZKIhCP4ForGfIa1SHgRTydHhXE4KpJT8IUrICmCF/85wBGuJhAV72XUCGptWqgy2FmzMBdyekbN0MEPaDOpqjCnGv0AyIkTo+VwiMuXc7ieEkbn0gcpGp3S1PObnBRYeCi7iudZaix+RoxfVKa7RwRdXJ9TNFG0m3cmc96kS9zJJB0imJJ6E0yf1NXEoK8myFGpj+WK0nrVPJGjNtqgA2xESdItFdOlCQCQwPvP7Tha3VxfvnmYKOoBKghzR80HtCGSXV7wHVWRBzLG4bKE9jocpKI4qe8dbUQLKzRxoxr3gYucaOQpEfWQioxwUI9TAkEICmMiDLJImqeVWMatCzY9gmAONWheYiBaHsrqEF9sQxL3ASjuVRiECnD0FZ7atwmVe1c2WRjI24QaFUS/Z09kFG/FZI0RihH/acU33jHi0uVN+r135A/uYAU/K/6jWxLtVpf5zR3ErIZbfd9vXWydNLIQOfYKIQOm+rk/fjuca209KXt49HPggCjQSv9GhP+o51DLaz7igzhhvPmdJZHen3n1yqi2RLOnHgQko0jk836Z05KC3BNrhGrTvtx/zBm4PPdv0jQDk8wf2eIC/Ctrug1iHPaC1HmR93hgWtByvwUjV6p/ePu6KDi9fgBnO9xdf7u09nVZeH4SLI98etwNTBTA/UoA5QdUHc2ciqYS+uLCl//CAkxdWoVXT7LWan1kgHl0UVniAoSfZfywNxNlf68oKIozO+Ip62Rva1YM3jZblawS5g4p1HYNWer5m0FvpFLK80omEyn3rpCv9JCZNY8w19TDuSYn6zxVIzJnbSesYEhfEebRt6B9IyJAcKfbKadKcKfYoHUn3xvIdB5FDiTSU9Isg0BFzxPlNfkGRKfv41JQGtizqmK7XQCtACSQBKVqoA7w6BuZcPNeMRGIKIj",
  "Md8+R3bsmhRFZguvE2YJCd083RhZyYWZy6UKeoQVrHi4bM42ol7sJ/C9SCFLtDlek2Wrdj+I1Ny4PAUN7KSFPWh/b5sD/e0cwYP3SCcEugC/7u6O9GeiEJS+JVrXe/MeNuKpC1AnFc/bpWkcCeDU3XZctA8mrUi35LVRM2/+6BvEDLvqU9GTJMSfyoMjHVSKU4vej82CIYlBlLUrTH2ekuTmacRi2vjsL4TxJusa+mWXFrswszxMp9IzxcYklLFoFWzxCR/IbP0ojqlQlrMlCVzaHmCiuAMuA2MARwt1ky/YIUW0tvCFPRKQSxmGlLtVlsK5Mbrqh/8R/b7eQjZZx5pw+layeaL1Nc1AYBaR499hV7eKrY+GrWa1sZ5rNHxKBA9wXjxY5Ja4oQbKF5bM6aN+mpXKvaiwlSperrSj3UAhb1pkNcrmLC4LTitNVj64dktirhvyUJVspLpF5W+t3JUZvt/QTVWrsS06pqSqFsFWlqnUl+yCfeL2wq3RFvH40e7x+AlUrdhMEAzesRRxTaAquZIics3ieVvcfbRVwcqoLdQ+aQ61jyZP5SiUnCCb/YzZ4JTLa5/SrIqzA5LQ+ggw0NdfdUjMNBTUVpQLMhUD7RSFGCm4QiY8LbI3RXvpFn2lSGEmCOlrJONrUV7gTG7c42oX7BoXStWCsW17uFUBzOiodQ8b4/qjoyeBbR9ouHGcSlt2XHRhuIzlYOQC+X8Ctw16TkusJM/iaigIzh0Pf+Fd4mTpwzgZdqzmMR93i06MUGqLApOW9FwSpenRVUcTxQIRCqd5FmVqBn9KMo4ncaN9m3k1sN+6Py663R/2flZIMDpu3aDGAPdo5wD35dKu19iUUh2/Rk3itg3g3DvhLvyG2Ny//tk/Hj5X+LvAmQ5vfzn760p9/vrl6oMPTfFDs7gUZ3GMKpmgWZ4kCIe5wxhSlae5DjtFBaerWKh7wqXN0FFVV6ziW+AfqaQCWZwpwtkd4mE0WRycziJp",
  "PvAgQrWd2rK/cvzCL/w8KsgjEXs/A0x2FqOeXywYBuq6vDNkPzMVMrBlAzRubNFYcp+8QT2PcZ0cFc3zWEO701LGQ7nEdQoD7X6UFPUfv38+vzy7UJ++f7/ww2AnC931yckW2ds45KINkgEOPFUbUCI9B5bFxBB16gCD+vAMYG5ipYoSQEpVIKrrgIGcznPkl0SrRrIQF0/mrHLedbFrLABZfGnX4j5PPvPJz142x5MApdvFBPB0Md4uYi0eApPIER3rI5u/hd492SasfNIq1c0xop0TE+dFoyG5v7cQb0RO53Ec1Fn3DMA90J53/zCQkA2plQNSRF65oSuOyFtfiYPtxvlEKJmAc0S+HQ/I+MoN+s5dn2BwHbrRfec9yX/E4lBKqSA/JLedj+976OHji6QEJTzUkCiJOmPyKl93SQZL08CDpJVYRgqxvq/42PxQTxAcF2XEQbnRnhL7OGQG3joftEGe5HfXZKYrs6+g3y20w3OlrzOpC80Qj5ba7anBvIrKnVqao0iiJk6oKizvpNjxvNvVCtMveX9yTt26i5q2rBDzj3Wlg0lMnst/QxGJokCFJfRG+9bGDc3gDicidxtMWNNlAUsa/rtY8nA+HJ6u4xju4YUXdg4OI7mDXqiqr8jxZNpUZCSlG9wJr5Dh4V4SNeg62PjI1lYVuZMO2E1oVB3SztdRCxveECxh/98lum59K8i2peFjn4Q6OfkZChj3WvVFY0x03HuavmBQJSHL+Zxl7J7kkPZtP4qd8KCynxPSXjuwg+caOKuhOckWSSdn3ajCEzHBaWGrWX7crQN/bhOfCiNl6BgH0TJueXA3JYxD6rb1ge0PECriszygbEif4FyOSlqJISTXeQjkZ7XgliVl1nz+FPtVJpkRCtFzU/aSBjZwtCoJRbKMGGWlw7VCDKgvJGqFAGp/pe+npiSTAagNr2mSB4KCODHmJ+Vax2+R/sc5ofd+k1BXLA+3mwSgjZJyfdbVLRv2VJTz",
  "AMLV96iCZAxXvEi4zXnsjb2wKFye24r3jtoEulkknRTfx2fkFM1ROoBWE3cABIGIjJWEOMHknaVLYSJuIyAsMdjw9WsKAGquwBmpG8NUwQljhqWOp0UuqqaLUIO1zDFXDi1hh+uV89WkneX5F7HOABeI50F0WsdcLUsuCj/Xk8WNJmnHOMFkxP2M4J3U5uJoQPpov8jPPeP8nBAL2XhWsqjjCbMDOUJmRfDAbg7EarVSrlQiOT5voGmvKpWQsDmFbv7ZpjfCucp+NGLXJj3dqnq3OGlpvPtJS0dd9XtdZZRZHPlZAoOLB+fGIUxdj2C3rcAF/vrjo5/V7o3bIn9HzXGa8fBJ7XaEWRiprVMigbSr8CGtsUumVBSqFTSW5iuvgKo1DayVjM/i1PV9GUSU7mt8IE0eFiqMD4eU9ArNplYqEZi1cefKSDGFpK72SbGSdZMPNmWVhwQ199agRBAnomxWTNA9x86SbDym7BSP1WjQc8fiZA8IgN/Q7Dt+roZ9UcYvVX/Y6bl7CP1orJj1N0HWhQnX5Ppy0Er8ymvN6pVTgKRI5gSS0x0TRdUMsFMqbJlq+fpC7WAvkdp5jJErOQIabDOwukxr4oxJZcapyqwaBqupycD1GVXUITSWHKLpFe0jN6vUtQ8gZpuZopKWzN++HOmBoxpY2ULbcIzHxYVcsTsfYMOXNdVhHP/8+XOfRlkuc95u1znVKU/9fEjDOltU1CSYQ/XKUbrqg+BQ1rE33F7OxeY4rJS9bJxZZ22CBt6ypBgZtEtj4VgX6a+GyEFTEqNVse5+wNd41KqiGsOQ450P+GJoQyKdFC39EESRcl9F5+ugRFDXixgqLKngq+s8+odDM0VK9GFhdqfog7Spa9rnk1zjVI4FXKOnvXLEg/yBbhfUbtJewK8wcxwfShjhH21UH7cXP47HrWRuDCaOd268vgStIBMgLMPrajXD6UaqfaUT5HkqnfoEdXkTBn8jMOZvrRZmsLvsT/Et",
  "6nGjWhmFKwWLcDBs6G8Ux/xhe8wP1Dm6Lv3NTPJpNYNZ7vH0YbIcISeaKeb9iUvDDNcg1c7ke5A7l0pXhnIuZRn65LatVGfVqrWRgfCBtfpo83av82gL6HO0M/Q5Rte1XqXuT6Tcg7aZbNX0OW4Lgh8/gmB2DoKf4/wgd3adP0Oii2ruoNqOCcBxF0tpJFrttCvFGUBD9vvPhw4SHDgcIg0K3EyUlpE0vof9JF+rc/bm86PxcME5Dnh4u/4WPq2Po/F5MjGbfnfUHWEHY2tNmlGlPSnNicmE9aRuAIeN0KXVdTizXLaBzc1GoUDVaBTYHIdkce2iVlfn55/lMD6eBkeJOt7oiA31cSid5MG2NuZkm+zW+KSVb5rNyskTujCxna+lE+/i69dP519+b9jXSlkSEXzJznrKr8+IPGRjbMYt3JXeWoEnZc92lbbObmj19ery/ItE5mV/yKm0QAQ0siP4Qv+7rPxkixOfJr1W+jfam8nOYasrJ5qELXM0ZLB1j0V6z68rsuuP/gDV2RDISQhupwj7w/50CDulKXgdicdTL23vuXYMnbSvi9j1F67TRs4YsR92VPLiOHkcP8cgYnM74T5nqcNpvliGz2hy3dnVa31Pl6BFQFHafYlPFq3bUnsFi8DlyY4l8lUpW2m1GZcPCORs5usi0nuJEiYHTfjAGvJ+4NFzO7/UDFdqiZByiuNWJulvkQyZ9Fu5pDEZMuk/Ibgp9Z6sev1h2a6pLK0e9Y6iY7S5GKe+OQHNXt2oXqjpCkFTtS+u3uBgoyZUIooZzIQcIEVPLkoV79Dfk8all8uZg6Vds33h+x0W5acILwubORbj8RAa9KkPmXcUT+PgXmZMlwEi1GcNT7xeceoSp411o2VKtHqUXsMYiRF3HDAAdBvAVg596E8sQGk/3PHdQElcV44yHJq+51RUpjEaQuUe34t0oKEtKOFRVlQYBnDmyMMZHDTVGhYFhAjPe1sUVksIfaKvqGqnpxZ1",
  "bGVxO9vLCuAru+pco4wLm2WZqyBYGsTp+IE4bKZ+5ACXgTlW44SBFHrUJsYDVOodrbzqgQ9FZzPgChTrp/+5UJ0vVOCjJ0M0Z1TH8akajDXg5r/hM9kUlnjjqN5a0zRxsbR+b9D92QtRBq2S3pjGmAx2b85lwYDllDeDuLBQUZuG/pakVsLLN1h31sf/9ThKjvRscxzlFdwYpCOcxGJyyDF6TOmqoislCnI3nx/lI18bsv3WuCSAGwNlm3yyPs4hFkNETLXI7LSsbyTecZD9YcXcv/HgSlS3lgehPnJcpQuqQxpEeOqMXZX+IuSSaD50xCZ4FZITb5wz4RYlnakcZXG5h3iB5CXKQVuZe4uT1ia7n7R20i0Pp+c6JmLTNLvf+IVf5pG2VuxNtvD+J23e/0mzFzXZ2fs/L8/dPy0yUcWp/JWT+DtVsaqEdLW6M2YZ3qt8HbDDFRE8iaQlG0cMuDIAd8uQ8LKq9efeud5YHKNDksknAZaycwcwFMfw8+7dSWxSiANximM+/rXLsSL/GgcGVyvTcOY+J4WKw/46D8tIeXUBAbS1k7XyWEFbdm8HOEcz5XgclPCDQYr0ef1MBRSfyrApp0Q03oQhBakxv48CdonME1rt1ig2rKVk5lqOeG0VgN2PYZhMWnmt0fOaTJ7geXF/AGGvNZokHZ5FVMcHuCu91OjI4YBe6o4kNoYTtNJNfceAy4QozvLtEGXfsoPSgpt9MYDLvK0YEROAkv4FDu3xKRdcoGVCeU0QmnpCTbsekxOxRY3gZPdzzCdHrYRvdrmOnpTskXhokkeFMJIagwFN78mfwenjfDwRmS5skhwXV/qnRWgdeVlSc5AW783K25DciZxRACC0Yu1dMHwr9Y53p95xK/WaXZGdA03fU9/qJHVLpHoist/yofrCkcohj1HZziS1itHSgRm8yUdem8NHHbqjChEW5HBMIfQLoZ38N8BvrnGCxuIwZB6UCQEGmDxS2bLabix3f5PU",
  "5KSV6M2o8EnvkpL3Bq70vQN/fMBv8Q4Z+a4457CxCBTvzMSLBY0tM9wrIxCpqz7nOWSbuL98j4t7eQtONqwVOD5+3Pth5RWgK+hvvBvVddzhfNW9ytfyita3k9N3E7xDdPP7wej03WDU9Muwd/pu2Gv6ZTw4fTceNP0yodEmTaPhFbH9pjtG49N3o3HjU47oKUeNM6N7hk33vKGJNc6rTz/0+ZfDkl6vXtBW6B9crwX8WxJwb/Mn/8pZftXmIr57n8Tr9/FdxC+vxRfn0TrPPktYqPjyLEnipPiyvydnebzFyeF8jcHvVzYL6Vd+Sac6VJ4d5ceX8rIY+bGQU3dNly7nN9LIz6Qj/A97HEx+uYd6ZbA/eQx5qPuv5Ckd/wxiLv/Li8P6gh98kcrbgD9rJK9SLoeiNXSBKBMRWfmQxWte6jTOSJzl1bTE3ybBBfT7dRxn/gO2o3gB8qv/D1BLAwQUAAAACABLql5dIM5+k+ciAACdpgAAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQ3LnhtbM1deXPbOLL/KohmdsauVWzx0OkkUz4US9Hl8TEz+9cryoIlWhSp5eFMXu2Hf42Dp8Am7cnuvqqUQ6mBBgg0fn0AaH346vnbYENpSP7cOW7wsbEJw/3g9DR43NCdFZx4e+oC5cnzd1YIH/31abD3qbXilXbOqd5qdU53lu02Pn3g3934nz6E1vLSczyf+Ovlx0ar9Vm/aBta4/TTBy8KHdulNz4Jot3O8r9dUMf7+rGhNeIvbu31JmRfQOm9taZ3NHzY3/jw6TThv7J31A1szyU+ffrYONcGD+0Wq8BL/GbTr0HmmQQb7+u1b6+m0DK8YqtBoIN31KGPIV3xz2wYlp63ZcXH/CvWuEvJt7u9Y0N3dKjj7af0KbykjgNNGg1iPYb2C72BYh8bSy8MvR2jw4uEVghfPfne/1KX94o3xbq7PygsmEimbBT+KV+pkbwx61T2OX63z3xSYCiX",
  "VkBhvH+3V+HmY6PXICv6ZEVOeOt9HVE5nG3G79FzAv6XfBVlzZN2gzxGAXRH1oYu7GxX/G/9KechU0PrlFTQZQW9WKFXUsGQFYy6FUxZwSxUKCvfluXbNct3ZPlOzfJdWb5bs3xPlu/VHdK+rNCvW0FrxbPWKlTRW2VVkonWaleJp1rTa1eJJ1szaleJp1srzjejqKvEM64Vp1wrl/N41rVO/TrxzGvd2jMTT75WnH2jrEY8+1oy/Rt7taJibcajVzYUeiwJequ8dvlajoVCFzAkcIODzpUVWp8++N5X4vPyDFwMPeaTwA3g5yMrwSGNvQO8DXxvuwz970If6DawDD9NHh5G57dfHu4f7shPP2g944xsPd+3nJX1bJEXa0O3luWH5AhUDEAaaAnHoccfTkPoFuNw+ihbuhctsb6oGxpprXy1U3iL5FV0+Sqt8lfReQOmVtLA3Ff06qKi0iSKFLUuK2qNLP85CqOAHFEahDbZqgbkqoLJ8E/qP9oBJUe2u3bYg5LNsILNubOGmVJU/FxR8eanH3SzfbaxFXWvq+o6URAo6o0q6t3b+72i2riiGvRUb0FPt+iAf6ng8uDaYcVgT2oNNtmxDvXO/G2FCEzfwA7t36zG+Nbu3fzVzNC+LSrY6X+SvWBGX6wVOXJD0m0SXVOCieAFxm0JM2tpvwhmzjNjJnsJYxlFK+sYARojwRODt9EWTTD7+eWT9uH0JYsehuyGliljdvR+J1/uMi5XCn6ifyHdikX3Qv1VFNCVCjaqeN1EweZ9tFctv6HilYxWvq+fa5S5VpRpF8qMVMPXKhQaxy9jlLzMVjkwoWp1V7Hal4/LpLKuaN15oSsKSu5FfIR1IwV2RRwrshzVEq9iDV7H1oVVSMAd21juCh5cYjEPyKGqFZ7nx8Y1XbAIbRHTzEPavYGr5oDCko4icgQ+mkX2jmW5dqBalg8Jo08fnj6NPw9vbxe3R7Pz+8vR0dX5/fDoH8Pz26MfL380",
  "tOPmbDG/H8Uf4N+PFz8aA/ijd5qt42ajAQ08MaFJJCa3TM1kmZpCzroZOdMLy9SU797OLVND7xaWaVyuU6rWLHerWpNvrThUdL5TXJA1ylwrymh6cUXWYDSO36RbKgvbyF3ZyhVYXffRAwFXLcCqqgYYn7rWPiN6i6gYTP8qg1kVgw7UI3vQcFFohdGKLQPllM5rMbqdXJZyWMQceoqlauJL9VkqujX4CZlFq1ys5hsX69+11y/XdrJc2wr1Uliubfn+/fxybReXa7tKE8JgtPUz8BacrXjc2kqVWsnIZjxI8M/ICpV6VfFSZnEZ1yhz3a6hV2vwGbdr6LPCyGxtcrSTao7uwGZ6thz4u/W220hpTVe2kR00crT0wg1x6Dogobem4Yb6SgO7imvoeY6t1IzT6qqgVx83lq1yBGdVtS26dqwAtH8TXoCGKo9qXsUjcLyvTeJ64CXv956vAtFFG9HTbXzxU+rUWPbtNy77929Y9p1k2XcOdY9ZWPaiiK618su+1yss+05O2eZG6AqhDQ+6kK7NctJ1OWlUThp3ckogR/uC0CYIbYrQZghtjtAWHUTVdGpZhQMBESSkG1CLKoHL8YmbyIlJNxGTrgIAC2LSlWKS97lMrV8Qk24O1PNigtCGB11IxaScdF1OGpWTxt1yg/0LQpsgtClCmyG0OUJbdBFQ6tYUE6FnNgygwN1J4gYqielWSkwvkZiewqgtSExPSoyelxizaE/0EGBBaMNeObCUk67LSaNy0riHAAtCmyC0KUKbIbQ5Qlv0EGDp1ZQYL7Ac+mwpbbaHXqWM9BMZ6R+iSmHuL/pSRoy8jHSLyqePoApCG/bLUaWcdF1OGpWTxn0EVRDaBKFNEdoMoc0R2qKPoEq/poz0Wn9LwzG+t9nSnUpa+pXSorXSPZHWIaYU5OBCltE1Mycw7VZRYOKCSlTBiMPDbqQyg9CuEdoIoY2TzqiwBSNOMOIUI84w4hwjLhKiCmEksVp8tFbr",
  "byp5yTNQC0xmE007BJh+UWA0KTD5IFTbKNotcUElxGDE4WE3MgJTTrtGaCOENk46owIajDjBiFOMOMOIc4y4SIgquNG0mgKTbFHYRMZaxF9XbfumfLPe1nCRcazAj3ofP6DOlKanAqcr4n2tosTJTRKtk5e4zoHE6RhE6RhE6QhE6QhE6QhE6QhE6RhE6RhE6RhE6RhE6RhE6RhE6RhE6bWc+Wr3Ks9IDVXpppam2pYpbmvJQrqWc9c7neL2zaVmYFhlYFhlIFhlIFhlIFhlIFhlYFhlYFhlYFhlYFiF7dVgxIWG7dZoRk3JeYXHleepFqJ0y0VTbjcUhUiGsbVeXogMrShEJgY/JgY/JgI/JgI/JgI/JgI/JgY/JgY/JgY/JgY/JgY/JgY/2D6CZtYUItQJy3NRi00a+tcUoWutGPzX2so99U7nQGzaGPa0MexpI9jTRrCnjWBPG8GeNoY9bQx72hj2tDHsaWPY08awB4tAa+2aYuMItFnagb0iR+Cl/V0ZjM7zUwtQGkTWFFFkrRhG1jrK3d5OXy8KEBZIxohDDQklI7RrhDZCaGMNCydjxAlGnGLEGUacY8SFhgWVtU5NAWKeGXHtHVUDT3VQWUujypoirKwV48paV7nt2NUP5AaLLGPEoYbElhHaNUIbIbSxhsWXMeIEI04x4gwjzjHiQsOizFq3ptzsrE20jVzbXVuBUnKqg8taGl3WFOFlrRhf1nrKnatu2yhKDhZhxohDDYkxI7RrhDZCaGMNizNjxAlGnGLEGUacY8SFhkWbtV5NyQktEBk7jByqNpGrI85aGnLWFDFnrRh01vrKvaxuzywKDhZ2xohDDQk8I7RrhDZCaGMNCz5jxAlGnGLEGUacY8SFhoWgtYoYtBvtlj5YN1FE3ZVV5p1XR571NPKsKyLPWjH0rLeU+1m9oil9qWOhZ4w41JHQM0K7RmgjhDbWsdAzRpxgxClGnGHEOUZc6FjoWa8KPYeWHw4qzmik",
  "TF57Nmv8GQr8Q376yQnPPurNVvMtJyz1zM0KRXy7uN9+oWvKLbSeWQQzHQtwY8ShjgS4Edo1QhshtLGOBbgx4gQjTjHiDCPOMeJCxwLculZLLF8RMspzVCNbGrHWFRHr4gHVC11Xbqr1ugcihEWsMeJQRyLWCO0aoY0Q2ljHItYYcYIRpxhxhhHnGHGhYxFrXa8lQmjASK8OVutpsFpXBKv1YrBaN5Qba/1Wuyg0WLAaIw51JFiN0K4R2gihjXUsWI0RJxhxihFnGHGOERc6FqzWjZoba1m4IaF4soNmdsPtxfLVu/t6dfRaT6PXuurGQDF6rZvKzbO+cSBVWPQaIw51JHqN0K4R2gihjXUseo0RJxhxihFnGHGOERc6Fr3Wzddv1zrilMg+cm1ytPW8IJYy1wrousQOq45v62l8W1fEt/VifFsWKu6t9TvFO2M6Ft/GiEMdiW8jtGuENkJoYx2Lb2PECUacYsQZRpxjxIWujm/nJzWNOeuKmLNejDnrHeVeV79fPGKoYzFnjDjUkZgzQrtGaCOENtaxmDNGnGDEKUacYcQ5Rlzo6phzflLTsJ4eR+zKrr3fDc+vhlfYffS+vJDeQS6ky+iC3qq4txxQdt+POgBStvJK0GXCSlPJjSBqHaXcIMTPGPEaI44w4jjpbRk+3219ex+Src3uyVtLElDHoQTG4YTc0ZXFh8Emz9baIr9vrDA43+9tsvYj+MvqUIfdjg1OsGu8rer5MVoV8zOJNhEJLCu0yBF9v/eCUKUlLhM+qsmRRPXkYMTPGPEaI44w4jjpbdnk3MdOIPlIAtuNyLXnrR36s00sa+XTIDghMzuM4k82oTwdBNl6O5gwdFK0GpOiVUzKkDovMCVcwSfqXTktMSeDR1HuFywwchDzkLOkYbOkYbOkYbOkYbOkYbOkVczSje95L/YO1sw2iBcSTJfNr7jnxobwRB2cvqOumFx5/wv8/R40cTaBKps4aQV81+6bZ+SBxzXB",
  "MGfjvaK8aOvshIxhVW683c7e8nxJsHrFauaNiyA6kYONCoNM6WGaiDDoFcIwBTvOTg4Ah8/WSikJevlIXyVtCHtgyXV3ITIxTAppKhHQMRHQMRHQMRHQK0QAJojHEWlg7yjgIQl96ro2/A/mr2NtQt8OQLXAGzJAdaMtBcNXelZLsoXJog598thl7hNyzxQQcdh4LhNbeU/daMXb2NsODW1YdckNUzHsIsMCkdfzQSSsaANtWSuQDfDWLIdYQfRiBaHUcPAgZe5cFpRyRY7CyFlCvd/YF5p29scxE9xERWTnOAlTpYozyURjr+Cl4jaEgnVoVoAZ16QLobV5oU4i2qI8LCib7Ty7NGl1BT2AYQjilmn8nk0GkZYYt4BQW4Q/ULk3aoCgUS33fFrSBDxbb0OVsm9gsm/UkX0Dk30Dk30Dk30Dk32jQvanUqDhFQZM3pdkH0UrkLTcsKxsPi6gvV2YTGFlAJ1NGsxW5rJ0IFYSaDBYCkn6nj2FaZf5DrgkWgHx2O3YEzJRriN03s0a825WzPsdCLJF9gz7ibBI7LWlnHYTm3azzrSb2LSb2LSb2LSb2LSbtafdHDDLjK1LnnIqg0ABRz1HrFTHltf12VCFLKdKLBEqM8LKwNvxmyY5jQYY7Qof4/zhfjE7P7+/G16Rm8Xd/fj+4Q71OYzUKzWkv6O3D0fxQhJLM+0s5kqJqah1I0dQmZOmou7MdhxlepRhVc2hyE8Es0WDeNJWygRjkypWsSehzNJSUXfskiFPbrQhR3ufvtj0q6oPt2/rQ36WuwIntF67FCguDHlWRu9kVnDxhGRSqFtqQASJ2aec1phBryxnU+skv34ccnSIqnETyvRlSRt9udd59OPDj+bHRqPZQFixJDkxML+AVMR2wg58teNGE7iM51fDP/g+6AD+6J0mY3v8F/k2fvpB08FW6J6Rxk/Wbn92OVos7oZHYgtWNpnusvImj5uNL8AwsnwbGPwGqsqXzzPZjTBg",
  "n873PqwS/r3F/n6JIlf+z789j9YgDOzpju5Dys4ewPNiG3qeeJx7L/G3VzQMxPMx72Yj94Ki6w83N8PbkmGStd7FL3l+e6S15Jeq725SAM3G8QeqstzY6pwRkdxsIHsj+zFk/Rgm/ZCdzxUZsyLjfJF0vieMOsnPN/wjRzkehVKimWM5WOruJunwCj3+zFh9fnWPSxphefMKDVyz2tffqQGWs63Af8Qqj/7CkM8YdVY15IVS2JCrpCb2dZgrACIsnQmSc2dXwjgLQHFTLujP0dLiZ0iF7daMtXu4BS5WBMgKFgDL6XFCGBSCA2KDc8CtvmTdM5uQ82Bt2qlrMRds7cR3mEQ2WCR5o9JhfXaYWwC2inANVuAyAE7aJXxEK2mj0qzxGbTKGjdWFMStqoaKe3LxJLNF3T9WRz0+x9hrqHYDMOIII44x4heMOEmITNM9MXoAwEVXDZFIGuiDCdOtgc1zQI/+ARA2Hc8nRzwvdjA4Pf1qnezo6S8h/RMq8xH4nz+dJ/dkOL9cXA0fbqdHoHGOYyA3dcChl0yQMYgPxZDTnHmAKCkXmiI7zw03P4MDGCfttAP35xDcSBKCsckyPZFvNKzWTK9jllFHI/qNbOi3d+QeiiQVnzz/lYqK6alvwPmzUFPfuDryHzexguKfv3G15FL+n/MtUU6pbqI+002PoSeehGrij1f0UTzGSAOrOKeQkgG6Yt27yg2Qeuia6gqv1mJXlu18gwXor2mIqq47dtKB+q/RXclbfWGlvqjeqoCyTXWFIvpOGXlahb6FUnUU3oUV0Nfouu/8huUK8jX68T/SqQtqBeFrtOq/TRjmjDyvEoZCqdeqYoYwLv0qYIorZFjC7DcHvp2Q8RP55kU/+5QraSjog9dI/Sb7ljxCBduNqFS9of1oOQ5UmgOzDfXpL+R8tWIlfeJau4SF1HWxoiT/IrecKf9e4xqTWO6KwKoV3SChR9beCbm0GGw+ewCcKa7+Qm7sx23MlOnS",
  "OK81e6YxU14B+KS9YSnLqFLh3rHE23UU7gxTfnOMuMCINxjxV4x4W6FwgT64jRWu9kaFOy0o3MWeukyZxUq3qHLz3nCvjjfcq+MN9yq8YY7qSje4V+EGa4decBypGJB8SkZ+SE7tCPeKNkZ87lel9XRxgpcjhuLIb+MoCXYqfduCW/tmjzie2I7Zqu0SQ9f/f/jE6f7FNgIascAjXaangt4lgeB4bU8Xvw9Lp0NyPXmNfyydYMSO0GMWzdQDRZRytjjzJRFVmSnKM3mXq6+kJOIVJmVO6lpbM2qv0mgEY6HLVljKc2rTssPIaaX74R/3zBLXtWbjh+YPP7Qa/46O3scCobQJtWPhzuW3HYQHF1osfT8LU7NN2dCKd+q42wosV5YDDqPnbYPIOT5TcdePiUPZtqpt72xgHTjsV2/SfbF1NvAN/uveIvfj8QzczZ2sxNxImxyJ5z04yL8ku8WL+7vxXN2uccw3EWV/WcxcJCRnTfMf3uEedf0hPHRJSzzSHuaR9jCPtId5pD3MI+1hHmmvTEEKH/T00Ff8vjgebgB4qz3C41d7jznoZjbdK+H7P+8pPm7AXqTuWmpRlkl2ZYHLG/9SRgGm1Y4kdL/Mk2RzUVIFRfec3xg7h/UwnTlZ9eG8Hppzd+Q1cK52R/IDVcTQZkmVV4Mrs6oJrCiFHvCeCLwzM+2ZEb72vWgPdj1YV0nIoFIB/FdfjUlnmc7YMyeEOxcOfQGrSvo6qU91xD0mWKwg9Uzk7ZCsIt9216LWk+3DJH+ldFuqOJ5sGDm2b2ntdmyjkw0kLCASfttzb4YpCcrJwsGRCHE/PJ+Bq+ZEO5ccuR4v8IuoNF0sJuP5danKWHnZzvl0L2bP8daM8672yCkcqhJ/qof5Uz3Mn+ph/lQP86d6mD+Fqgstpy7yfo48T6oZmJ/Tr+Pn9Cv8nHnG+Aiord7561e4PPYa1qFMI76xMq6P0rXpK8Knhoh4FnsTJdv64lTZYRt2aDfB",
  "3BImV3Ke6YQMA3Fmhx9XAkNHuCvA141WJ+WhV0OGXl/lMAlvtgXebLH/g7p61GBq9Fl4QcDxRTpB8LhLfCD4YHEXiH3LPaBn6QE9Sw/IitVpkFGnHneA+KOb6tOVcIBShdqsdGuM47pBoQm7UMG2Xxii2OzUWB6hO/UtdCMuQjfbLJfYjGLcTuFPl99ibf0tYZmeCgP0yXgMa3bq7Cjfn26hP8cqcIJyWitWJPzDR1A0yeEwz23En6AB+BR3hOcu2VNYIezoJZNCwXx2/sdRi71i/z3nVnBE2U96OiFPacoqK+GSndTM3mTJOlCalu2rxvuarJqTRvYTmO5x4+w4pzDvAajp8h3hsq11W2d/wbovM+/7mHnfx8z7Pmbe9zHzvo+Z9/1Xm/cIljErmqlksAaj/Yrp3LXHdiIjJh3kLnLBIAjI1w3bRrSkrmex08hl+UpOuBUudKegbSxuunNrF3wvMNtr4NgrHIYUxX7P9vp1EPZf8ASadQx9o9TON9RmvnFcG+3u5U9YwGz//ELB7nFpTbxTG6RGqT1qqM3RGJhhKMKNFf4cvAoowbAuWNTfER331A9A2u2AAw719g6375PGrVDgIzdHXY8PIw6PlsBEzwexVofgS8BvxaWO/Rckzcu9geEL9b8xExVM3cgNgzfA3ivC/n3MTO1jZmofM1P7mJnax8zU/hvNVFNeq+HZ1crMVLNVw0xNCpWZqfcRWBNlP4KX1C6zTw1lSD6Jbocxc2UoPuGexfi2xPi4ZsFOPWgwtVFhNSTp8MrM1LRAOcK3JcJnX6SmrdrtG/XPrLX/n8bns+P4muB8+9WuO7dmQ7pmJ3DyyKjp9Q3ZdtwsiS/6HUSyHbvI3yjwH6Sagzf/0zo8+ygL/vRDv9/rn6XX5d9xR4Aycy7ed7LBuQ/ZkWl+Pr5Z2I5iJd8pd35jQ1MkccwYme1sd9o5gzhrDjdSZDYFx/dBWHsChMyy3UKmKwpj0OHLQF4TaTT5V8cl",
  "THpap31GZpmkcAVm3UNm3VJmehtW0X2aJ6zAq3fIq1fXpDi35Sxukoj+GuzEd/wQuojvw+pwKN2JbZPCvRe25VByq+WvmewxFipNdow4wohjjPgFI04SYm2THYPzWxpEThiATRCb6cxANvxVk1hPLIxrpbY4oe6KrkrNdE6tMNJjCHesIHyFkf4W+P6vnORilvArA/LtUju9rbbT28dvCMUm9jpZ2au6mK421tulxnpbbayn+oeLTsbs/moF3wP/fWo9bujqHY8LgWAFG88PCXcEQ0DjpjzNAo9KrE9RnbsGjQJwy5bNjHWfmvbJkD0B8AfQiTSM/d8C+99Y7JqyuPlu/5fB/tLb0aX1+D2R/n5judugSShzQfh6OXccsrRWaxrwnZD8uacYzsm/yGdrRzOnnv7iYSQMZecYcYERbzDirxjxFkd2zCuR98o1dm+u1CvR6nglWoVXMlSmKVK6KFqFi8Lcg7IjDuBbLAm/tLjNBPz2Udoky2Hj87u56ns1SfOJ0hMRAR6qYhta7AEUxdGEnalj1sxS9obdJ49ZCycmDY2/vb8n5Ma36Fr6PCxBT0pK1FyvpzH7ChYIOwECXbBtdqs9AtQhG2rxKmbnTPxlPWC/xinMdBFTcNYsMQSw55f+ijHgdPDSzUYjs6xhTHIx03zINPVL2M3md+SO0sOjKG+Ic59kepNFXN2s1xvmPhZ/iyYbIwZLxuUbfDA1O0sGOvS+cfbdT2/EMqe2FTXMVtQwW1HDbEUNsxW1V9uKdZfNHXWZufiYRHKb5OuGuiQXfs3vWUs1TZb0yfNpZr8XLEdYH+NQGoBxOWlKZpbGKFqDYehb/OK7x3dzxSY5O+gvlslXj50rAzsn5sIXBpRizQmjgy2/kEXV+CYwCy7DOzxFjoMvC1U0jVq+wy8dFGOQ/8EQaMX6UXU7CG14W4c+hSRy4ZmPBMxCE75jL7LkG+3sS0Cd8A1LpvYONia+c4y4wIg3GPFXjHiLLxlM",
  "Cct8HjqSz8OUKS1KE7dNHsZX53fkbjgk7NidZp6Jv/fnF8iVWVOmVOi3kKZlugG9/AzvDYufkSN2hpwY0rbTO+weeDa9ir228pE3yq8oPwOF3xCm8W1lFm4gcZLoje08i+29bPTu4P7sFnDgnh3jWwGDoezDiKkZ1iw7Twg4vlefJs3UnMia8zhmxpX2FvAmLgz9FmdPHX6c8N7egwXQjA8m2iHLKiPjCXv5q+AvdEWdUFqlTZL7sfCSMTjJHFoFojiSGlLo+SoZP5YZhJ2gFL+t7VJYjZlehtxeOCGz9CvAtDgtB+OTU30rYSOw131OB5Ms0gw5iSkTentoMR1L5vHbbuSEmfFd0WQCRXYjmesIzKWwMFjdJtFBhmRmq9TsWMIrxUkHCqkpzBMG0tAd/c/3wCGb7URkb8kOBA0CmB+QHLC1bPlzYCckzdXEagD8x0EklrpnCT5GSJJbiIUXtuXI3he/zpxXlQMCcu82D064ykkI0xi45VggBSIMnR1FcTlS7x0IO7+kWX70PBPIbhZzDYFJI065xqW5HOdSQtD34pQqhhwyKUdHR5DDxJFDF7dH422FpchjdrC0Zc4kNhE0fZHMmYUkmQ17OhyVdOiFUZ6N/HNgkqPF5YKNN5vepphNORIiE1ScMUZ0tnBfNemk7LjPAlUBv7XKGgWWq8yIyyZd3qTHj5RBa2KNgYgeJpwK0YxTLKtNJIcyn9kmc8vWtdOtE3G4RwS1QRQjiwGClD+QYLZQ+enlvOTKTHO/WSxNUZ4GtcHvoCHIJg+buIAAyV5RHmpYU8I3d2w844/ZlpmueoiQtXEhMwBKkxQmCcyoxJ2okjJEmUwPx02iuLAiLqY01eetyJFbOObEkzMpNtnSjTWh/w5dSp57R0jTX/F+1fmCQVkP38eZesAYB2QOqxT0fi9wFYRnmd4EZvLhiKSD+0wGNZ6A5yQpxq52O+yW+d731r4Fawd0JBMvUdGOV8gKR6FOvKuKCEgH",
  "FxBQJov5CYkT5HxMMt5wfKBMF/8WA3aSDixe47Gbz3ILyWohezWQbrzj3RqS3cU73oYpk5elQBmxCYNVmKhWiytmNj1OrNlAmDKZx9R5fJwTcQ47w2gp1VMW8OTZGpDv4opIx+FYaFELIMGOsY3LpkwwRAnrO6ioEzLP/CIIt3HsNFXe82vBsCz9HlZHmR4qziyQ/Ey2kyZRihHkldmTOOCggiGv7XWRZFdmDxeMTm7flKtGGEybQ8OKrzHAFJ9t6MmU86n5xFMn5BA/vj3alIyENeHY8Faxhs1mgbLIH+9hIvk8x4VYrEkMU8Da2FtRwO758JwRMONgJzEzK8wK53OcEBEcy4hZs+x+Wc6I5/pVXLMJs9eCQpYlgqfRS82oROJyUTD23t46Ekoxw/TQgijKOIc4ugP7FcSUW5z8SpYYzOTKEjcIT/gAsoUIE+8ISIkNaZ6R1V4xDAlCjnWEMUyWRwKBkleTdzniWZ3W/H4SZStLlGcbSrlhTqQ28HwwnHx7GZuCYiK5dS0GmaemZNug6eiUGluZfIQvlh9tPW8PJtQRz3d65dsv9GeupCw2Z8o0mTRTb5U4ReyCCvgC5MW2dzAJXEsyEIiNkRTFliK36uE2bpJhZJYYMPHaxxZcv4Yh28cXXBdAk/VJnqkO7DCw8yHXgTrfpFTQYDYxq8+1t1bIRb8sDeVAzt1bs00mOSa/Z07J75NB8ob3nO/QF7w93pWA3Iynw/vx1YHfxUxR6aNKA1Zc51sIY16sFScd6aVMIxOC/83dyBjinlN5zWSKGXCIko4g0/PUtXbSA2T82dSBsl+mmWfYBCaWbwws3EvPmA3ZTDZDFt9YWZlB4lkW47UDEwPaxAWFxosxVCrk3czm84RugBwJf4Nl2ARj3LaZIk40lR1DKlNQCXpxBwRsNYtdVxSW2N7yLdCkuAnWblWbYO0Wvn7Av73h3gN0SArevRS8ByYQ1tK2/BfmK/30g9bvwACycMdKgIOy",
  "c6cBiyNegXHx6cOO+mt6CagbiCOL/DBe5mtxY//caA0uDB7ZLlDGhj6YG7qCcmloA5aN+JAyNFsDdhrjkAL26OAWbNJDytToD9jpQwU36MFI2QMY2sFtu6Xk1huwKzeq9zHgfQxlO53BF0PZN1MbsPCn6n1YpoOukqIDRVdyaw1+VY7OEPo2Kulbb/BF/T56fzDXleMGvf5S0msD+qZq5xx6cKHswRRG51fl6AyN7oDlZ1Jx04GbcuZME3pgKudHg/nRlBQTKKZSEluDUYn0tqCOWhJ70APViJ7DiF6oRxR6MFL2YApj8Kt6DMw+tKPidq4NFsrVAyvhi3IlgLsPvNrKkdZgpFXcLuFtRsq3OYe3uRBvc5qixKcPe2tNZxboTjfgex0fG62TbrtBfAFs4kPo7RnGkaUXAujxxw0FXeezAkB/8rww/sAaYPtLHJU+/R9QSwMEFAAAAAgAS6peXQYwv/awBgAAThcAABMAAAB4bC9tZWRpYS9pbWFnZTEucG5n7Vd7TFNnFL+9rYUx8QUCOtGrzqkbLbelLS2zCuUhGEVUcFSd7Ot9tFfae8u9t9CZoEV0UeZjRjfn3FBx+Jy6zDlNFjYfE2UqOpaNqZM9dRidLKLL3GLY19sros6Y/bFkf/Qk7cc5Ped3ft95fAnLCvInRkcNjkIQJDovN2s6PJPgZ4hKCb/bz6ZvRJC4BQSwFQfPeT6PA5qHwpMk9F6A9Ef6BRBkJ2LeUKaUDNCrWPaaGPLy3O/l49m0oGeannZYLESqUZNqMKVqDCYDoQEmnVEDdDqKpA1GWq83QRTlGhlubAgOCA8l1QJBoHiR4VgB+iEH5YAsKcDB8T0DYqQAhnXyFMlQrKgtTwnGJBB6wdW7LvJ1Nnaj+8rtj1/7LefLMmh3B+O3MCSRRnO8B4gM4wFOKtnLOucxrCAClqDysvxJfo83jWHINF0KaTLSJKmxmFJMGgNhBBqzxejQAJJOpXQWB2HWE26ecgOJ",
  "rIvxuryAhyym0gii+FHmnfFo3oCQArXl+m7Sz2h25PCB78p2+9W5TZ1NsRBofTC4zik7L6qjQ3+VShCcl2Ipch7MCzyUSPHC5tJ71RCq6ggf7/ZrBMpNjwzyoa0PVDj54QKSLiC4ijHnqS+XNhd/NOzSwZKOhtTj1q7JhX/s1P2q9t9aXl/ruml/V+bhTyQ4jxawoovnvAyhJdzAR1JaL8+VM+T91PzD7nfleMbJsBqCY2noCovv9LGlLFfBlpKUQPCMV8KnMyVE7C4iJroYAaMZN4UBESoUxlNlPkoQMY7GAOaDV8MAS2Ie8DLmAuUURvAUEGEcx2MejmRoRsKgQhAwuRgsldYjcLRYAfuX4YT6ZpKFrOXUPHC7M0Llz2MJN7SQt2DDTsgdTn90h4Ol1JJABN0Ndu1tdL2Xu/IQgx7tf7191UhoDwRj6wngdtKCC+iNJsILyClIT5F7cs5lP7464ercndmN7RvKqyZ/2ll45PuV+/cujlzm6FhXM0AizUqNhtdnGRpWZR7lh5SFIPmqOqgDXkwYTrsp1im6BsXVIAg6Xr7H6NBKEu6HVxI2lfGE5hTt+yBdRmCcLBB9POWf0mPSpNFK/lcPRGgau+H+cSlBCkVYcEuKxkw6LBoDMMB9NOscGovFgZtMBhNw6HW83PKSe4Ne/R+uQgj62cdB31t3GffYQt3PC2s7jy79a+x6ftD8y41t+0YP3HZz+bHTffftqb6Mh3DHPg63e8hk2G1xKyauPtSQsNa7TdQxtf1tZbPya853nDw5M771RNuk06LUzRI45nCyRY4vYVia2yLNDpdxdzmxHLgdgrMc7i3MROm0uBYvFbwUMVO26LUGLY4g/czy9IyRp+cfHvTuhkK3fpHB8WlZbEcH1CmeSRhuR6PwRagaX6RYsUmJKlA0Nv3SpqjrRyxnPzlY/afa1svqLIpB8Ch15LOv5DZbVUolnqeLxweqlUWqqJg+3XyTsAJbJmSZFPxBGTPq",
  "3kUyQxuOZcK+wpMBbgGbznHQkIEPjY/Wm3AznqozG1KMpllQNUPVpLNIKp716FRj8dGhVFiPVKGX6m7GGfDecJ5wOx6jjpDoowr5HkpFhNKGqN6cH1V6siChV+xXhgZbvWV21pVvLrZ+cHvStfizB7bGPadIqSAr7nz7+bhspTjmkjatsnJCTZyhqPZy5aeT4htSD6zZUozPxPtAHol9FYoulUqJRgQkwomjVH3w3uqo59QKlaK6fS6qgBo0xwTdUBzBhwW1kaoEPC4Q2zztR1VVPjl75B8/fXbmrfFvH26dc6RnxZVOBCdRXCckxtYq5recLFrZnPODtbZmg1udTy88j+6/MVWRTt3YNWFc9vnO9qdbb91Of6e6qBHFvSVzLt4COx2TtiavXbIruqBpzNVWfcm7a6x/zbrYV7Uq6eiqNP2eZf72GX8WTvuhYeITm4Mvnz26FglLWMISlrCEJSxhCUtYwhKWsPwP5Pfi9LjorO2DZ7Q0eSo1Edup4+mz18d0TDe2LZk515V0bUQVVXlxnbflq1G4dfbPfU6LF7jW7IErFm7KPnp8e/LS36+WjF/su1IIkYYXTC7M7urqunPnTlPz10hFK8I3I2WnbDYbkmiE/3ciChR6ffh8KgGPuXlZGYX+88daDkcH8Mgl4NCBwFOGFw8PHHLBPudw6e79vqqu7at/ih8wVHEmpz53k/X9c5+Qt3vP39VxKHNWVfKUJ71fmANTh9rb7BHCC9mNAY+SfcM74pfyNv2Cg/Wd+6w7Xo09cblf2t7gDfOy87P22F5a9DdQSwMEFAAAAAgAS6peXTFtlsUDCAAAkRgAABMAAAB4bC9tZWRpYS9pbWFnZTIucG5n7VR5VFNnFn9ZjJgDyAhGxlZ9LqCgiS8LCaAgYFDwgOKCDVoLL29JHiTvxfdeMNpSQawcOSozwlj3BYtl1FrHFq1HbCuo4HJQUUTciuvgFJkzKnVjZL4sotZ6euaPOWf+yD0n+XJv",
  "7v3d33eXb3na1Ml+0oFSCIL8kpP0M8AZCT7v+4jAt4hY4QtBsk8xNMHgPLPtViMwDwYnjqlsKPQHKCAfgnZCkRvmi1wG4GXweE12e1nf9LKzdLTTM1qpRTB1JGaUIygZIddEGAk5qkKi5DiOETokSkcSpBNFVOqBC3PDodxbSRUoxxEsTzE0B/yg7zwBeleAkWFfDwh0BVC0iSVwiqB5Ra7aGROMqTjz9M+VNzfNTzKkFrUvY84dpIDd4ozfTuFYNMmwVpSnKCtqIsbaaFM2RXM8SmNEst4xxmG1RVMUHq1URqm1ughCTmhJjVyjxnA5iuNauValxaN0OmWEWhdlYQkL6iJrpmxmG8oCFtNICBLc9PCOfzdvFHMFKnJVPaSDz4Tezhx3DNtx8ebenMV5MABa5wwuN3mcl5ST7l85LgjGRtAEng3yolaCJ1huW86ranAF5ZidtTjkHGEhhzv5kDG/qvDYtwuIm1HObICPTivmEMFPfQpqz7Wjw8jdNZmfrG/def1Cl2/R4H6q+/u/8PBwDMIYqwKleTPL2ChMgVlQO04obCyTS+FvUnMMedOVYSkTRcsxhiaBKyi+yU7n0MwCOgcnOIylbC58cqILEX6JCPNmioNJykLAKA8UAmaJ+XaC42GGhFHYDq4GozQOW9GFsBnNJWCMJVAexDEsbGVwiqRcGIQbAiTnnaVSWDmG5BeA/sWbgL4NpwFrT2oWtVji3eVPpjELsOCdoGH1ng7HvbvDzlIqcJRHexrcciQxbnBl+hlpdZf864/bvgH2fGdsBYZaTCRnRlURWsyG4qnQ6+LpSbks7Jbu7r6j09adzy/uGFF2on3U5odsNhxbOaKMr/sg1EWadjUaXJ+mSFCVbMIBKHNO8gXlQEdZPngoaSFoE2/+o6wYgoSxnnuMdK8kZnl7JUFTKat7ToV9f02X4igTjfJ2lnCkvjZprtEa+189EO5p7IH7zaXEMcRoVKpAoNJIyjWEUi1HjTgi",
  "V5OqCALBcRRV46yn5ZmvBr3wf7gKbujw34N+te4e3A9auH0dx8e3fqO4sv+TQ77/6NOpytTlFdP1uYurR2JpIjdu2O/h9gyZBzbTf1tbTl1BXVpZ1lz1WjvaunPc4mh9ir5rdCKh/vE9gnd1MxOMOZhsnmEzKZpktrtmh4l/uZzwJLAdnCkX7C3IRCgViALJ4WwENttjUSk0CgSCAiI90zPKMz2/8aD3NBS4Bfg4x6dxaYawX7kgNHhohlCKLBFKkCWClVtFQoFQGBR3Z6u0oybq7PffFT6TJPSKMaUHQohU4hO+LKkhRiwSIcnKAUh/iShdLA307+E7Bk5LmAhYjnH+IQoMeXWRie4NhyeCvoKTQi0cPINhgCEeGTzAT6VFIhGdMlKjjtDOAWokULXKKJeK6N+dKgwZ6U4Fv5bK/VK9zDgT3BvME5KBBEp6u+gLBZ57iAS9RQmQeO0iac6ptOBeQU2awwkVUXP19y5da973dEr7gLMHdshGC9QL8AX/vnpyfKKIH3VHEZ2XN6FYpknffDfvhykDDusOlG43ILMRf8BjUF+BoFssFgl757sIDwoR+yO+EuloiUAsKGz7SCgAGjAHOt2ECIQMcWrDxcGILD+oYfpNccFUfO7wJ7eOnlkfu/FI84c1r1dcZIIQXIgouUFBmwWLGk+lr2qYdCNmc/EGi2QqufiysOrBNEEc8WDXhPGJlx+2jWjufBq3qTD9uBCxZX54rRPdaZyyY2zZZ7v80k6M+rlZlflFaczzOdf6ikvG1JZEq/Ysd7TNfDZr+o3Dk/tsc758GX6bIa94xSte8YpXvOIVr3jFK17xyv+B/GKIu5rkVyS3hxel3zdFL52zxyj1MSVkTQv/0tFCnLz3uCMDL63ULH0+49aVR+m+d/KGrTuYfKklu2bgHPufi8iANaETqrfsfQKQktJSZiV2d3e/6O5+/vR5609tjadaHlR9v31P/dpFGy6kYBfjDdXq6Sdlqvp+SJ2/",
  "/LjPyGOi4UeggcPgTNHwbMEwSjCUEgRj0EAcCpg38FJnBwQJFiXr42c5Luc1XVlTCPv2OlubWpFdNetOdze/2hE26vTCXXizwicsurfZejng870b+/wtXudX+7zXodCSH+bnrHx4/vagu8vDsmbOWVqz++cdLeO+au1KLj0gaz1BGotPPW1KSE8YgmAzlgdLH0m2jNEvrdCrDVlzf3wgPxvxWYhMJm7QbduX2mfFyFv9r33a9tgWEJJT9s/Oh1ejvrpna/ePWTGe2HH724NlhaHLG1eV9z8vCq9XJ6bc+1bW9D6z++vmxpJa5JcmIqVqRW3SXxVY5bJrhnnHujuGPNlDFDUR1aufaGIOxX5cdjE2N+PEpoLYkltPulYcbjTIiWX+V0f8vXJVaH756tGGkPciGuvYurUdMY8b1u+641uy5vB9y6FJ4X9pTx18saKq8frRjxo0N5pvX3hRXbPyelTHxXn59IJWyZdbHmHKQ7PBBe+RD6sW7buvFUwJCpHRgVv107POoOlb6/fjpop/Oc5xG9rKUnR3d4//ExN0+tnGphfCmqlU8fngblGlZMLCx6dXZzuHJDlxqn5PQtaS/wBQSwMEFAAAAAgAS6peXVmtzEsNAgAAsAUAABQAAAB4bC9jaGFydHMvY2hhcnQxLnhtbM1U224TMRD9FRNV6htOgQa02q6UtKLioWoIqH2erL2Jide2ZpywkfgUHvmT/hi+bJOUiougD7zY6znjM8dn7C3rJaD/4KCWrGu1obPB0ntXcE71UrZAz62TJiCNxRZ8WOKCC4TPyixazV8MhyOeKAZVSX6rJduAPhucDAe8KhNQlV55LcPUVSWqelmVUMyt2E4xVyzgL2q2oEwsAYX7V5ZEMsU4CdnMphho+S6UBl9d4toptrIo1uQlA9wwd/dNboAYZ5do146hdMScRCZgGwl8osFMFsZ8dh5t4L0lTls/RglVOQc8z26FrwuF2cba6njIReQPsvugjhJQ",
  "igiRDAWU6DKUXA8aJR6sY0HyOJNNVTbV8d1XHWSDkOwLm1hAcfxsdlryAPL7rKSRegPIaiXeKq2fwmfCxfxc9+reTEaTV68H2e5dmZimzZMUO6T8w8oOyV8ALXNegvo0baJDyZQaQp/Muv2FpUfvj0ZFGF6OsrX32TztDeS/JZhFgtljgrSXp74vwN0q4XuxJ6ep3dC9E4eP8HCdAnx/14KYcfd4C9Wgg6HxKilpPHhlTcZbZa6gSyy7JOimljKcbmsLnyx+VPXqCnCV48YamSBlfgbVaInG3QOleq6vm4akf6i/Vx1iP4r/X9SnEr0+vn/k8etG0bXR2z4zJgpFbqLBrGjcCwl9zQfNXeL7f3T1HVBLAwQUAAAACABLql5dcbL0FLoMAADi0gAADQAAAHhsL3N0eWxlcy54bWzdnW1v4kgSx78KQtp7c9qJ+9Hdt0l0YEC61c7u6mZ02rckmMQ6gzkws8l+nvsm98XOxkwwSfWUgYaUl9EM+KGqq6t/3f+2YdrXq/w5jT89xnHeeZql89VN9zHPF3+7ulrdP8az8epDtojnxZFptpyN82Jz+XC1Wizj8WRVGs3SKx4E+mo2Tubd2+v5ejaa5avOfbae5zddxtTLzk719o9JsVvLbqdyGGWT+KY7+TCbfXguXt0r8HS1f3p55vez2feTieN8vX/+X/6zzvIf2IdO9eHvDqsQsvpr9RZ898P3xd/gO4etgWw5VqKFrARiFQaQlcSsGGSlMCsOWWnMSkBWIWYlISuDWSnIymJWMCEBZgYiwjCyQpAOhuERgngwjA8D8sEwQAwICMMIMSAhDEPEgIgwjBEDMsIwSAwICcMoMSAlHKPEgJRwjBIDjyEYJQakhGOUWJASjlFiQUo4RokFKeEYJRakhGOUWJASjlFiQUo4RokFKREYJRakRGCUWJASgVFiYalBKCmkHTSTmBlIiVCYGUiJ0JgZSIkIMTOQEmEwM5ASYTEzkBIZYGYgJZJh",
  "ZiAlkmNmICUSo4TBMxKMEgZSIjFKGEiJxChhICUSo4SBlEiMEgZSIjFKGEiJwihhICUKo4SBlCiMEgZSojBKOEiJwijh8MQVo4SDlCiMEg5SojBKOEiJwijhICUKo4SDlGiMEg5SojFKOEiJxijhICUao0SAlGiMEgFSojFKBHx9g1EiQEo0RokAKdEYJQKkRGOUCJCSEKNEgJSEGCUCpCTEKBEgJSFGiQQpCTFKJEhJiFEiQUpCjBIJXwZjlEiQkhCjRIKUhBglEqTEYJRIkBKDUSJBSgxGiQQpMRglCqTEYJQokBKDUaJASgxGiQIpMRglCr5bglGiQEoMRokCKbEYJQqkxGKUKJASi1GiQEosRokGKbEYJRqkxGKUaJASi1GiQUosRokGKbEYJRq+qYZR4rjvGmCYwHdef/l3nmV38bLa6jhvD3P45uvP2Zd41sgcxGYQ56tm9vD92B/H4/l63MAaxOhfcXy3bGQO4vTxf/9d5ivcGISqt1gmaYobg2h9HCe4JUjXj+v1vIGtdtimDWxBzHrrh/Uqx41ByD7Fixyi5Gr7Rcjt9TSb774PKWYE1Z6ihPEs7nwZpzfdaJwmd8ukNJuOZ0n6XO3m5Y77LM2WnfwxnhVFsnLP6o/qMKu2yi9ptn5myTxbbgqvSnhdzi+r38fp5huTu62LXQnLh7ubbhCMNq96McVFm9vjP7O7LM/eeBnYaBgFe8E28+KMSw+1Uv26R3NaRU1f94spTD1E0SjExE+IDerM+8V0dfi2yQ9rC8DLiW0BpG6D6rraWCXzhzT2jiH33Tr2tCywUdh7lYUT8xppbrg5or2dHm1P9oLIZ4z+aXrbMKd67CnbN6Pz1tp470LMt0frPcTgkF7eoIi3MuF/UOenhfh2ILKHD8HHKoOXAQwB2YsT43u0Z9J3s31zCDgOLeajEUPfvfTEkakfhpaNzjvUBb6V1/iWIHsaLG97SINZdOdjNs9OnaceFRzT3j1677/+",
  "laFe6c1bea1WXPfufru2uVYr9txeL8Z5Hi/no2JjY7TZ+eZQZ/v58/OiuFh7WI6fGVfdxgarLE0mZZEPEZzdq5rpiU5HfGgGPc9Od0n26HRgRmIofFd/NLB9306HYiD6kW+n0VANIu/V/9q9fDodDEPvSI30iA29O+2PCqicTjdvxWBwly0n8XI3HATdr/tur9N4mhf2y+ThsXzPs0U5+mR5ns2KD5Nk/JDNx5ux4qvF7r08qbP51e1NdxZPkvWs+2q0UpHUolKM6nTATxnBVy/54+a3t3s+hnowHFSVLE/dxtrQYnPuploNDYozX1cNsWhUMTg9uwtlqGqozdvKoSZA9VAbZwX9p6lR+x/YmKcX6Kee58fWR5F+6nps4NsPxZh1H6fpp9LDb9PdwFX4eZrWbmVvvq6Yv3wsRrvtx8pNtVGWUvdW+a65LX8DcYzjziL5kuX9dZGD+Wa7vHEe/7qMp8nTZvtp+hKByzvbeeevvI8Xi/S5lyYP81lc1b5xgbfX4692nS/xMk/uy4nifbEZL7udZD7ZOixT8zRtVHfuv+78Her++3K8+Bw/VS6bJ0K4IfAU6mO2TP4oSqsH++3wsZjlLmZBDy110YyW47jHfO5FzM6Qz2pgPaR/vg7JQ/+0O++yLdDrd8WqELPDwg3cKfbQgGG7kmHOHu4btrCQWNCuFLLafELV4+WE+2xITgoO0DHGHdGLVkRfm9jotvDCakoctibo2oTHtCbompza1gRdG09Y0JqoTcuUxjouL9oycrTmOu7CQaNkHCIvYQvzzYM2z0f4+e8onSHl/Oz3KhoFjcYpWnhJzOVZ72By150cSavt9NnDPOV2GNcXzaJr0EEC3q52066G54b0PXYRtGTss6TTyMPzjnKiLbK630fPmxVR0+3y1tN7zZUO6G3sshH7kXAhSItX4I7Ox1ekIWGd2S7QhlypEZljyHYINuX2thdt7VO4DNuR0Poo1xI+LzxXP7ThDYwo47RH",
  "pHPF53tIohenvWyD+x+USDe9aAuj9WGJYttb2hOl7WK0hAfO7cK3lFPIyadQUE+hJJ9CRT2FmnwKQ+opNORTSF1ODHk5MdTlxJCXE0NdTgx5OTHU5cSQlxNDXU4MeTkx1OXEkpcTS11OLHk5sdTlxJKXE0tdTix5ObHU5cSSlxNLXE62T8MgnMLtgzcop5CTT6GgnkJJPoWKego1+RSG1FNoyKeQupww8nLCqMsJIy8njLqcMPJywqjLCSMvJ4y6nDDycsKoywknLyecupxw8nLCqcsJJy8nnLqccPJywqnLCScvJ5y6nAjyciKoy4kgLyeCupwI8nIiqMuJIC8ngrqcCPJyIqjLiSQvJ5K6nEjyciKpy4kkLyeSupxI8nIiqcuJJC8nkrqcKPJyoqjLiSIvJ4q6nCjycqKoy4kiLyeKupwo8nKiqMuJJi8nmrqcaPJyoqnLiSYvJ5q6nGjdnoUchHLF52ehqeC87vdWheKEF2HbW3DrDImor+pLOxEXXaN182ykUxfx+sY6fz4Q1iQy0pbVDg9bfs3VKRThoJ1DZnjeEdn6WW+RyErd8H/vqKHhXMZGt5ENc3zjiT9tUk5YxtC2PSnCtGUF93qntK1MNZGp19EPJ7hE1F4e5HbeRzqqyz/G6rDqt/0JAQHh65ILPKzj4Ot0+16P2vK+AmzQkoVA2wKlJDtGE3kewpHzR3Krwop2hPlu2fTc/oJwxHvPBzjvTOiSWtjwibkXuE22/+gsdDbG6T31VPingteX/mWKQucmoJrneW7qu8YnbTvWned766Sryy6d7IHIy30LeCSShAJ0MElvkWy+t0g23VGSh0E7Og/fWzKbckJ5WxIqWpJQ2ZaEqpYkVLcloWFLEtq+Cci37sL6+PWJJPHk3QN+9iQv+msGz48KZgHFbyr27k+0O8FB+55q3JqndLvY5S259c7f5+HtKAuqXfGG7Qr3G9T6+A1g22Dj76r3zniv7uM0/W26ur0uP3zK",
  "n9N41bnP1lUctb2d+XgW33R/zpazcboLoHO3TtI8mW+3HpNJoRjbtrvauby9njxNXxzzMvBJWXyZntvru86XMshNVPdZmi07y4e7wklgeiwq5oilr+rMMoW314txXgxI81Gx0dl+/vy8KKJbZWkyKXxPH6K6m9FgyIdVnWumpdPqbRNKk3j6kgtmLhnPcf5HIxHJ5vXdq6MNTWSC0+vIh4OhPl8dh9FQDaLmdUycbRr0tK23aXMcVCS1OD1VQzEQ/ejI5tJDrVT/9BgOTKczJ2wU9mRY7l5Xp6yS+UManxzgwIzEUBzLdE/2guh0pkcD2xdek3SpnBw7joSDM/bhYhwMB70j27RGLAnweZ9LNvQwbvaVOKc2nNt/8z5yXHsNR3bEzxh/f1T0Kg88mL7u7/XxyrT8t5gO5eO7NN6fbhXTp0k8Ha/T/PPLwZvu7vPHeJKsZ/blrF/LOeL2rN3nn8r/rcL0SzhFWeVV/FM8ibabRXx7Na5epcHrI6PNCz7isqmOwUfKY65yXBG4bCorVzl/pvqYwB2bCdyxmQD25rIxTpvKCjoSbf64yoFtbPGCa2qtEFq7MhpFYASRK29al39hb8ZZU61d5ZQlHZZrd2u7Cfk2ByY4nBBzIL1VTg/LdXkEzltpYS3c2q5ySgtXK7jYKcuHyymZgm2EKFvVFZurB7uPWOs6UrIIM6q1Izu6/AO3j6uXCGGtdtrAEQjhOlL2RvcRVwRlDK4jotLVV3p09VWnrlalgH16jOP89v9QSwMEFAAAAAgAS6peXZeKuxzAAAAAEwIAAAsAAABfcmVscy8ucmVsc52SuW7DMAxAf8XQnjAH0CGIM2XxFgT5AVaiD9gSBYpFnb+v2qVxkAsZeT08EtweaUDtOKS2i6kY/RBSaVrVuAFItiWPac6RQq7ULB41h9JARNtjQ7BaLD5ALhlmt71kFqdzpFeIXNedpT3bL09Bb4CvOkxxQmlISzMO8M3SfzL38ww1ReVK",
  "I5VbGnjT5f524EnRoSJYFppFydOiHaV/Hcf2kNPpr2MitHpb6PlxaFQKjtxjJYxxYrT+NYLJD+x+AFBLAwQUAAAACABLql5dn45y2L4BAACnBQAADwAAAHhsL3dvcmtib29rLnhtbLXUXW7bMAwA4KsYOsCcpkmKBXWBbkW7bkNTpEPfZYuOuUhioJ9kK3aU3WYXK23Dm4ABRl/8JIsS6I+EzcsTuX1JtM9+GG19IZoQDus891UDRvp3dADLJzU5IwNv3S73BwdS+QYgGJ3PZ7NVbiRacXU55Hp0ebqhAFVAshxsA88IJ//vvN1mR/RYosbwsxDdswaRGbRo8AVUIWYi8w2dPpHDF7JB6qfKkdaFOOsPnsEFrP4LP7XIb7L0XSTIcisZUojVjBPW6HzobnT5JRuPwJf7XQx0izqAu5EB7hzFA9pdm4aryJMyuj4Ma9/EtXtLG6musYIbqqIBG/o+OtAt0PoGD15kVhooxOfYgFXZr+wuooK2MH7TveqLDKxLWubWyAfuXnXO6UwPaGCPDlm1Jc9dSljzEdZ8WtZmH4hKcMzaVCExnY+Yzqc1/fmt4SilAkZ9IOlUwlqMsBbTsq5jkM0RNKtuOZCgliOo5bSoLcBOY/utb6MGn6BWI6jVtKgvMTbSfY8hpqCLv6AGlQKbeC66GTEMBgU1WlAPnMtznIdU9eiydun+4fliefaeh1HU+iPHNvYrSTXMmWFGXr0CUEsDBBQAAAAIAEuqXl2/qglu0QAAAF4FAAAaAAAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHPF1M0OgjAMB/BXIXsAq4CgBjh58Wp8gQXKRwS2rDXq24t6wCYevJidlrbZv79TsyP2mjszUttZCm5DP1KuWma7A6CyxUHTwlgcp0lt3KB5Kl0DVpdn3SCEy2UC7jNDFdlnZnC6W/wl0dR1V+LelJcBR/4SDFfjztQisgpO2jXIuYJbP7cJXs9qMSWr4FDlyh2q",
  "lQLfoFCAQv+gSIAi/6BYgGL/oLUArf2DEgFK/INSAUr/CCK+90iz5l2L9Zs/rufpL87bX+W7KQ/N9mkAcU6LB1BLAwQUAAAACABLql5dVIsZNV8BAACdCAAAEwAAAFtDb250ZW50X1R5cGVzXS54bWzNVstuwjAQ/JUo14oYaEulCrjQXlsO/QE33iQWfslrXn/fdUI4IKAgkMgljr27Mzsey8n4Z+sAk41WBidpFYJ7ZwzzCjTHzDowFCms1zzQ1JfM8XzBS2DDfn/EcmsCmNALESOdjj+g4EsVks8NLaO0ZpJ6UJgmsyYxck1S7pySOQ8UZysjDlh6O4aMKuscrKTDJ0pI2VGGGDlNcLrOmfKgTuqoLK5TxfcKvJcCkjn34YtrirONYhi2CjA7T3pElS0KmYOw+VJTSYbOAxdYAQStsga01XiCOZAn0DwHN/PXMOcIKXPurUPy2MP1dK2JsbrnCAh8kOcl7hkJ+mZ9EH0WIC7kpu1dW7+o/UBWD4M7e7zH/6cP4flamhLbl9v72AFdqX/4IP2HfTx3pI+XjpyH4YPOw2tHfBh1pI+3B/WRVzTFZrjb3UD8NeAFe/Br7eLen784ZppL0/Kz+q9k+gdQSwECFAMUAAAACABLql5dRsdNSJUAAADNAAAAEAAAAAAAAAAAAAAAgAEAAAAAZG9jUHJvcHMvYXBwLnhtbFBLAQIUAxQAAAAIAEuqXl3rpPUV8gAAACsCAAARAAAAAAAAAAAAAACAAcMAAABkb2NQcm9wcy9jb3JlLnhtbFBLAQIUAxQAAAAIAEuqXl2ZXJwj/wUAAJwnAAATAAAAAAAAAAAAAACAAeQBAAB4bC90aGVtZS90aGVtZTEueG1sUEsBAhQDFAAAAAgAS6peXf/jRAUpHAAADWcAABgAAAAAAAAAAAAAAIABFAgAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbFBLAQIUAxQAAAAIAEuqXl1En0TccgEAAGkF",
  "AAAYAAAAAAAAAAAAAACAAXMkAAB4bC9kcmF3aW5ncy9kcmF3aW5nMS54bWxQSwECFAMUAAAACABLql5dL0aPApUAAAB0AQAAIwAAAAAAAAAAAAAAgAEbJgAAeGwvZHJhd2luZ3MvX3JlbHMvZHJhd2luZzEueG1sLnJlbHNQSwECFAMUAAAACABLql5dDbyI8dUAAAA6AgAAIwAAAAAAAAAAAAAAgAHxJgAAeGwvd29ya3NoZWV0cy9fcmVscy9zaGVldDEueG1sLnJlbHNQSwECFAMUAAAACABLql5dVRBMYqYOAAByVAAAGAAAAAAAAAAAAAAAgAEHKAAAeGwvd29ya3NoZWV0cy9zaGVldDIueG1sUEsBAhQDFAAAAAgAS6peXYBVhTW6TAAAXAsDABgAAAAAAAAAAAAAAIAB4zYAAHhsL3dvcmtzaGVldHMvc2hlZXQzLnhtbFBLAQIUAxQAAAAIAEuqXl2+pRPPMhsAAKcaAQAYAAAAAAAAAAAAAACAAdODAAB4bC93b3Jrc2hlZXRzL3NoZWV0NC54bWxQSwECFAMUAAAACABLql5d+ffEPCgBAADBAgAAGAAAAAAAAAAAAAAAgAE7nwAAeGwvZHJhd2luZ3MvZHJhd2luZzIueG1sUEsBAhQDFAAAAAgAS6peXY7R6TmLAAAA7QAAACMAAAAAAAAAAAAAAIABmaAAAHhsL2RyYXdpbmdzL19yZWxzL2RyYXdpbmcyLnhtbC5yZWxzUEsBAhQDFAAAAAgAS6peXS0EpOiNAAAA8wAAACMAAAAAAAAAAAAAAIABZaEAAHhsL3dvcmtzaGVldHMvX3JlbHMvc2hlZXQ0LnhtbC5yZWxzUEsBAhQDFAAAAAgAS6peXd6gW9XNDgAAc3wAABgAAAAAAAAAAAAAAIABM6IAAHhsL3dvcmtzaGVldHMvc2hlZXQ1LnhtbFBLAQIUAxQAAAAIAEuqXl2zZInrzyUAAAx5AAAYAAAA",
  "AAAAAAAAAACAATaxAAB4bC93b3Jrc2hlZXRzL3NoZWV0Ni54bWxQSwECFAMUAAAACABLql5dIM5+k+ciAACdpgAAGAAAAAAAAAAAAAAAgAE71wAAeGwvd29ya3NoZWV0cy9zaGVldDcueG1sUEsBAhQDFAAAAAgAS6peXQYwv/awBgAAThcAABMAAAAAAAAAAAAAAIABWPoAAHhsL21lZGlhL2ltYWdlMS5wbmdQSwECFAMUAAAACABLql5dMW2WxQMIAACRGAAAEwAAAAAAAAAAAAAAgAE5AQEAeGwvbWVkaWEvaW1hZ2UyLnBuZ1BLAQIUAxQAAAAIAEuqXl1ZrcxLDQIAALAFAAAUAAAAAAAAAAAAAACAAW0JAQB4bC9jaGFydHMvY2hhcnQxLnhtbFBLAQIUAxQAAAAIAEuqXl1xsvQUugwAAOLSAAANAAAAAAAAAAAAAACAAawLAQB4bC9zdHlsZXMueG1sUEsBAhQDFAAAAAgAS6peXZeKuxzAAAAAEwIAAAsAAAAAAAAAAAAAAIABkRgBAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgAS6peXZ+Octi+AQAApwUAAA8AAAAAAAAAAAAAAIABehkBAHhsL3dvcmtib29rLnhtbFBLAQIUAxQAAAAIAEuqXl2/qglu0QAAAF4FAAAaAAAAAAAAAAAAAACAAWUbAQB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc1BLAQIUAxQAAAAIAEuqXl1Uixk1XwEAAJ0IAAATAAAAAAAAAAAAAACAAW4cAQBbQ29udGVudF9UeXBlc10ueG1sUEsFBgAAAAAYABgAdgYAAP4dAQAAAA=="
];
// ================================================================ SKRIPTI LÕPP (kui see rida on olemas, on kogu skript kleebitud)
