/**
 * LOOSIRATAS – Kuu harjutuse loos eraldi projektis (Erik 4.11.2026)
 *
 * See on kolmas, täiesti eraldi loosi viis. Kood on oma ja projekt on oma: uuendaja seda ei puuduta ning Kuu harjutuse
 * skripti päästikud ja koodi uuendused seda ei mõjuta. See avab sinu tabelid otse ja teeb loosi sama reegli järgi:
 *   - loositakse lõppenud kuu piletite järgi, rohkem pileteid = suurem võimalus;
 *   - auhind on juhuslik (väärtus võimalust ei mõjuta), üks auhind inimese kohta;
 *   - Erik (korraldaja), „Endine osaleja“ ja piletita inimesed loosis ei osale.
 * Tulemus läheb samasse kohta kus teistelgi viisidel: ühise tabeli vahekaardile „Loos | Draw“, „Ülevaade“ ja „Autahvel“.
 * Kui selle kuu loos on juba tehtud (linnuke D32, veebileht või varuloos), ei loosi see uuesti, vaid näitab tulemust.
 *
 * Paigaldus (üks kord arvutis):
 *   1. script.google.com → Uus projekt → nimeks „Loosiratas“. Kleebi see kood (kõik) asemele, salvesta.
 *   2. Juuruta → Uus juurutus → tüüp „Veebirakendus“; käivita kui „Mina“, juurdepääs „Ainult mina“ → Juuruta → luba ligipääs.
 *   3. Kopeeri veebirakenduse URL (lõpeb /exec) ja ava see telefonis, lisa järjehoidjasse või avakuvale.
 */

var LR = {
  PRIV_NIMI: 'Kalisteenika rühmad', TZ: 'Europe/Tallinn',
  T_LOOS: 'Loos | Draw', T_BOARD: 'Ülevaade | Board', T_FAME: 'Autahvel | Fame', T_GUIDE: 'Juhend | Guide',
  KORRALDAJA: 'erik', EKS: 'Endine osaleja',
  R0: 5, N: 100, PILETID: 40, AW: 49,                     // kuu vahekaart: osalejad A5:A104, piletid AN, seaded AW1:AW20
  FAME0: 5, FAMEN: 36, FAME_WIN: 10,                      // Autahvel: kuud A5:A40, võitjad J
  AUH_VEERG: 22, AUH0: 3, AUHN: 20, AUH_PAIS: 'Auhind (eesti k)',   // plaan: auhinnad V3:X22
  LS0: 6, LSN: 100, LSV: 30,                              // „Loos | Draw“: salvestatud tulemus H6:N105, näidatav A6:E35
  VV0: 20, VV_MAX: 100,                                   // Ülevaade: pealkiri G20, selgitus G21, päis 22, võitjad 23+ (tulbad G:J ja L, K on peidetud abitulp)
  ET_M: ['Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni', 'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember'],
  ET_G: ['jaanuari', 'veebruari', 'märtsi', 'aprilli', 'mai', 'juuni', 'juuli', 'augusti', 'septembri', 'oktoobri', 'novembri', 'detsembri'],
  EN_K: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  VERSIOON: 'LR1 (4.11.2026)'
};

// ---------------------------------------------------------------- veebileht

function doGet() {
  var info;
  try { info = lrSeis(); } catch (err) { info = { viga: lrViga_(err), grupid: [] }; }
  var t = HtmlService.createTemplate(LR_HTML);
  t.info = JSON.stringify(info).replace(/</g, '\\u003c');
  return t.evaluate().setTitle('Loosiratas').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

var LR_HTML = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>' +
  'body{font-family:Arial,sans-serif;background:#FBF8F3;color:#2B241E;margin:0;padding:18px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:18px 0 4px}' +
  'p{font-size:14px;line-height:1.45;margin:6px 0}button{display:block;width:100%;font-size:18px;font-weight:bold;padding:16px;margin:10px 0;border:0;border-radius:10px;background:#8B6B47;color:#fff}' +
  'button.proov{background:#fff;color:#8B6B47;border:2px solid #8B6B47;font-size:15px;padding:10px}button:disabled{background:#B0A698;color:#fff;border-color:#B0A698}' +
  '.tulemus{font-size:15px;line-height:1.5;background:#fff;border:1px solid #E6DED3;border-radius:10px;padding:12px;white-space:pre-wrap;display:none}' +
  '.vaike{font-size:12px;color:#6E655B}.viga{color:#B3261E}input{width:100%;font-size:15px;padding:10px;box-sizing:border-box}</style></head><body>' +
  '<h1>🎡 Loosiratas</h1><p class="vaike">Eraldi loosi viis: töötab ka siis, kui tabeli linnuke ja Kuu harjutuse veebileht ei tööta.</p><div id="sisu"></div>' +
  '<script>var INFO=<?!= info ?>;' +
  'function e(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c];});}' +
  'function joonista(){var h="";if(INFO.viga)h+="<p class=viga>"+e(INFO.viga)+"</p>";' +
  'if(INFO.kusiLinki)h+="<p>Kleebi siia oma privaatse tabeli („Kalisteenika rühmad“) link:</p><input id=link><button onclick=link()>Salvesta</button>";' +
  'INFO.grupid.forEach(function(g,i){h+="<h2>"+e(g.silt)+"</h2><p>"+e(g.seis)+"</p>"+' +
  '"<button id=b"+i+" onclick=\\"loosi("+i+",false)\\">🎟️ Loosi võitjad: "+e(g.silt)+"</button>"+' +
  '"<button class=proov onclick=\\"loosi("+i+",true)\\">Proovi (ei salvesta)</button><div class=tulemus id=t"+i+"></div>";});' +
  'h+="<p class=vaike>"+e(INFO.versioon||"")+"</p>";document.getElementById("sisu").innerHTML=h;}' +
  'function loosi(i,p){var t=document.getElementById("t"+i),a=Date.now(),koik=document.querySelectorAll("button");koik.forEach(function(x){x.disabled=true;});' +
  't.style.display="block";t.textContent=p?"Proovin…":"Loosin…";' +
  'var kell=setTimeout(function(){t.textContent+="\\nVastust pole 10 sekundiga. Kasuta varuloosi: ühise tabeli vahekaart „Loos | Draw“, kirjuta lahtrisse B3 suvaline number.";},10000);' +
  'google.script.run.withSuccessHandler(function(r){clearTimeout(kell);t.textContent=r+" ("+((Date.now()-a)/1000).toFixed(1)+" s)";koik.forEach(function(x){x.disabled=false;});})' +
  '.withFailureHandler(function(err){clearTimeout(kell);t.textContent="Ei õnnestunud: "+(err&&err.message?err.message:err)+"\\nKasuta varuloosi: vahekaart „Loos | Draw“, lahter B3.";koik.forEach(function(x){x.disabled=false;});})' +
  '.lrLoosi(INFO.grupid[i].nimi,p);}' +
  'function link(){var v=document.getElementById("link").value;google.script.run.withSuccessHandler(function(r){INFO=r;joonista();}).withFailureHandler(function(err){alert(err.message||err);}).lrSalvestaLink(v);}' +
  'joonista();</script></body></html>';

// Lehe info: grupid ja nende seis (kas loos on tehtud, mitu auhinda, mitu inimest loosis).
function lrSeis() {
  var priv = lrPrivaatne_();
  if (!priv) return { kusiLinki: true, grupid: [], versioon: LR.VERSIOON };
  var g = lrGrupid_(priv).map(function (plan) {
    var nimi = lrStr_(plan.getRange('U1').getValue()), silt = nimi ? nimi + ' grupp' : 'Põhigrupp', seis;
    try {
      var k = lrKontekst_(plan);
      var olek = lrKirje_(k.loos, k.voti);
      seis = olek ? '✓ ' + k.Kuu + ' loos on tehtud (' + olek.aeg + '), ' + olek.voitjad.length + ' võitjat.'
        : (k.kuu ? k.Kuu + ' loos on tegemata. Auhindu ' + lrAuhinnad_(plan).length + ', loosis ' + lrOsalejad_(k.kuu.sh, []).length + ' inimest.'
          : 'Lõppenud kuu vahekaarti ei leitud.');
    } catch (err) { seis = 'Viga: ' + lrViga_(err); }
    return { nimi: nimi, silt: silt, seis: seis };
  });
  return { grupid: g, versioon: 'Loosiratas ' + LR.VERSIOON + ' · ' + priv.getName() };
}

function lrSalvestaLink(url) {
  var m = String(url || '').match(/\/d\/([\w-]{20,})/) || String(url || '').match(/^([\w-]{25,})$/);
  if (!m) throw new Error('See ei ole tabeli link.');
  SpreadsheetApp.openById(m[1]);
  PropertiesService.getUserProperties().setProperty('LR_PRIV', m[1]);
  return lrSeis();
}

// ---------------------------------------------------------------- loos

// Loosib grupi (nimi = plaani U1, põhigrupil tühi) auhinnad. proov = true: ei salvesta midagi.
function lrLoosi(grupp, proov) {
  var priv = lrPrivaatne_();
  if (!priv) return 'Privaatset tabelit ei leitud. Ava leht uuesti ja kleebi selle link.';
  var plan = lrGrupid_(priv).filter(function (p) { return lrStr_(p.getRange('U1').getValue()) === String(grupp || ''); })[0];
  if (!plan) return 'Gruppi „' + grupp + '“ ei leitud.';
  var k = lrKontekst_(plan), eel = proov ? 'PROOV, midagi ei salvestatud. ' : '';
  if (!k.kuu) return eel + 'Lõppenud kuu (' + LR.ET_M[k.m - 1].toLowerCase() + ') vahekaarti ühises tabelis ei leitud.';
  var olek = lrKirje_(k.loos, k.voti);
  if (olek) return eel + k.Kuu + ' auhinnad on juba loositud (' + olek.aeg + '): ' + lrLoetelu_(olek.voitjad) + '.';
  var vara = lrVaruloos_(k);
  if (vara) {
    if (proov) return eel + 'Vahekaardil „Loos | Draw“ on varuloosi tulemus: ' + lrLoetelu_(vara) + '. Päris nupp salvestab selle.';
    lrSalvesta_(k, vara, 'Loosiratas (varuloos)', plan);
    return k.Kuu + ' loos tehti varuloosiga, salvestasin selle: ' + lrLoetelu_(vara) + '. Võitjad on nüüd vahekaartidel „Ülevaade“ ja „Autahvel“.';
  }
  var famel = lrAutahvliNimed_(k);
  if (famel.length) return eel + 'Autahvlil on ' + k.G + ' võitjad juba kirjas (' + famel.join(', ') + '), seega loos on tehtud. Uuesti ei loosi.';
  var auh = lrAuhinnad_(plan);
  if (!auh.length) return eel + 'Auhindu pole kirjas (plaani vahekaart, tabel „Auhinnad“, tulbad V–X).';
  var loos = lrOsalejad_(k.kuu.sh, []), n0 = loos.length;
  if (!n0) return eel + 'Loosis pole kedagi: ' + k.kuus + ' pole kellelgi piletit.';
  var tukid = [];
  auh.forEach(function (a) { for (var j = 0; j < a.n; j++) tukid.push(a); });
  for (var s = tukid.length - 1; s > 0; s--) { var r = Math.floor(Math.random() * (s + 1)), x = tukid[s]; tukid[s] = tukid[r]; tukid[r] = x; }
  var kokku = 0, voitjad = [];
  loos.forEach(function (o) { kokku += o.p; });
  while (voitjad.length < tukid.length && loos.length) {
    var y = Math.random() * kokku, v = loos.length - 1;
    for (var i = 0; i < loos.length; i++) { if (y < loos[i].p) { v = i; break; } y -= loos[i].p; }
    var pr = tukid[voitjad.length];
    voitjad.push({ nimi: loos[v].nimi, p: loos[v].p, et: pr.et, en: pr.en });
    kokku -= loos[v].p; loos.splice(v, 1);
  }
  voitjad = lrJarjesta_(voitjad, auh);
  if (proov) return eel + 'Loos töötab: loosis ' + n0 + ' inimest, ' + tukid.length + ' auhinda. Näiteks võidaksid: ' + lrLoetelu_(voitjad) + '.';
  var lukk = LockService.getUserLock();
  lukk.waitLock(8000);
  try {
    var veel = lrKirje_(k.loos || k.pub.getSheetByName(LR.T_LOOS), k.voti);   // keegi jõudis vahepeal ette?
    if (veel) return k.Kuu + ' auhinnad on juba loositud (' + veel.aeg + '): ' + lrLoetelu_(veel.voitjad) + '.';
    lrSalvesta_(k, voitjad, 'Loosiratas', plan);
  } finally { lukk.releaseLock(); }
  var jaab = tukid.length - voitjad.length;
  return '🎉 ' + k.Kuu + ' loos on tehtud: ' + lrLoetelu_(voitjad) + '. ' +
    (jaab ? 'Piletiga osalejaid oli ainult ' + voitjad.length + ', ' + jaab + ' auhinda jäi loosimata. ' : '') +
    'Võitjad on nüüd ühise tabeli vahekaartidel „Ülevaade“ ja „Autahvel“.';
}

// Grupi kontekst: ühine tabel, lõppenud kuu vahekaart, „Loos | Draw“.
function lrKontekst_(plan) {
  var link = String(plan.getRange('C29').getValue()), id = (link.match(/\/d\/([\w-]{20,})/) || [])[1];
  if (!id) throw new Error('Plaani lahtris C29 pole ühise tabeli linki.');
  var pub = SpreadsheetApp.openById(id);
  var tana = Utilities.formatDate(new Date(), LR.TZ, 'yyyy-MM-dd').split('-').map(Number);
  var y = tana[1] === 1 ? tana[0] - 1 : tana[0], m = tana[1] === 1 ? 12 : tana[1] - 1;
  var kuu = null;
  pub.getSheets().forEach(function (sh) {
    if (kuu || sh.getMaxColumns() < LR.AW) return;
    var v = sh.getRange(1, LR.AW, 2, 1).getValues();
    if (v[0][0] !== 'KUULEHT') return;
    var a = lrKuupaev_(v[1][0]);
    if (a && a[0] === y && a[1] === m) kuu = { sh: sh, nimi: sh.getName() };
  });
  var G = LR.ET_G[m - 1];
  return { pub: pub, kuu: kuu, y: y, m: m, voti: y * 100 + m, loos: pub.getSheetByName(LR.T_LOOS), G: G, kuus: G + 's', Kuu: G.charAt(0).toUpperCase() + G.slice(1) };
}

// Kuupäev [a, k, p]: lahtris võib olla kuupäev või seerianumber.
function lrKuupaev_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v, LR.TZ, 'yyyy-MM-dd').split('-').map(Number);
  if (typeof v === 'number' && v > 30000) { var d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; }
  return null;
}

function lrOsalejad_(sh, valja) {
  var nimed = sh.getRange(LR.R0, 1, LR.N, 1).getValues(), pil = sh.getRange(LR.R0, LR.PILETID, LR.N, 1).getValues(), out = [], nahtud = {};
  nimed.forEach(function (r, i) {
    var nimi = lrStr_(r[0]), p = Math.floor(Number(pil[i][0]) || 0);
    if (!nimi || p <= 0 || nimi === LR.EKS || nimi.toLowerCase() === LR.KORRALDAJA || valja.indexOf(nimi) >= 0 || nahtud[nimi]) return;
    nahtud[nimi] = true;
    out.push({ nimi: nimi, p: p });
  });
  return out;
}

function lrAuhinnad_(plan) {
  if (plan.getMaxColumns() < LR.AUH_VEERG + 2 || lrStr_(plan.getRange(LR.AUH0 - 1, LR.AUH_VEERG).getValue()) !== LR.AUH_PAIS) return [];
  return plan.getRange(LR.AUH0, LR.AUH_VEERG, LR.AUHN, 3).getValues().map(function (r) {
    return { et: lrStr_(r[0]), en: lrStr_(r[1]) || lrStr_(r[0]), n: Math.floor(Number(r[2]) || 0) };
  }).filter(function (a) { return a.et && a.n > 0; });
}

// Salvestatud tulemus (vahekaart „Loos | Draw“, H6:N105) selle kuu kohta või null.
function lrKirje_(sh, voti) {
  if (!sh || sh.getMaxColumns() < 14) return null;
  var v = sh.getRange(LR.LS0, 8, LR.LSN, 7).getValues();
  if (Math.floor(Number(v[0][0]) || 0) !== voti) return null;
  return { aeg: lrStr_(v[0][6]).split(' · ')[0].split(' ')[0],
    voitjad: v.filter(function (r) { return lrStr_(r[2]); }).map(function (r) { return { nimi: lrStr_(r[2]), p: Math.floor(Number(r[3]) || 0), et: lrStr_(r[4]), en: lrStr_(r[5]) || lrStr_(r[4]) }; }) };
}

// Varuloos: Erik kirjutas lahtrisse B3 numbri ja valemid loosisid. Tagastab võitjad või null.
function lrVaruloos_(k) {
  var sh = k.loos;
  var b3 = sh ? sh.getRange('B3').getValue() : '';
  if (!sh || typeof b3 !== 'number' || !(b3 > 0) || Number(sh.getRange('H2').getValue()) !== k.voti) return null;   // miinusega number = Eriku proov
  var ws = sh.getRange(LR.LS0, 1, LR.LSV, 5).getValues().filter(function (r) { return lrStr_(r[1]); })
    .map(function (r) { return { nimi: lrStr_(r[1]), p: Math.floor(Number(r[2]) || 0), et: lrStr_(r[3]), en: lrStr_(r[4]) || lrStr_(r[3]) }; });
  return ws.length ? ws : null;
}

function lrAutahvliNimed_(k) {
  var f = k.pub.getSheetByName(LR.T_FAME);
  if (!f) return [];
  var a = f.getRange(LR.FAME0, 1, LR.FAMEN, LR.FAME_WIN).getValues();
  for (var i = 0; i < a.length; i++) if (String(a[i][0]) === k.kuu.nimi) return lrStr_(a[i][LR.FAME_WIN - 1]).split(/\s*[,\n]\s*/).filter(String);
  return [];
}

// Salvestab: „Loos | Draw“ (H:N), Autahvel (J), Ülevaade (G20:L), plaani E32.
function lrSalvesta_(k, voitjad, viis, plan) {
  var pub = k.pub, sh = k.loos;
  if (!sh) {                                                   // Kuu harjutuse skript pole vahekaarti veel teinud: lihtne versioon
    sh = pub.insertSheet(LR.T_LOOS, pub.getSheets().length);
    sh.getRange('A1').setValue('LOOS | DRAW').setFontWeight('bold').setFontSize(16);
    sh.getRange('A5:E5').setValues([['NR', 'NIMI | NAME', 'LOOSIPILETITE ARV | TICKETS', 'AUHIND', 'PRIZE']]).setFontWeight('bold');
    sh.getRange(LR.LS0, 1, voitjad.length, 5).setValues(voitjad.map(function (w, i) { return [i + 1, lrTxt_(w.nimi), w.p, lrTxt_(w.et), lrTxt_(w.en)]; }));
    k.loos = sh;
  }
  if (sh.getMaxColumns() < 26) sh.insertColumnsAfter(sh.getMaxColumns(), 26 - sh.getMaxColumns());
  if (sh.getMaxRows() < LR.LS0 + LR.LSN) sh.insertRowsAfter(sh.getMaxRows(), LR.LS0 + LR.LSN - sh.getMaxRows());
  var aeg = Utilities.formatDate(new Date(), LR.TZ, 'd.MM.yyyy HH:mm');
  var read = voitjad.slice(0, LR.LSN).map(function (w, i) { return [k.voti, i + 1, lrTxt_(w.nimi), w.p, lrTxt_(w.et), lrTxt_(w.en), i ? '' : aeg + ' · ' + viis]; });
  while (read.length < LR.LSN) read.push(['', '', '', '', '', '', '']);
  sh.getRange(LR.LS0, 8, LR.LSN, 7).setValues(read);
  if (sh.getRange('B3').getValue() !== '') sh.getRange('B3').setValue('');
  try { lrAutahvel_(k, voitjad); } catch (err) { Logger.log('Autahvel: ' + err); }
  try { lrYlevaade_(k, voitjad, aeg.split(' ')[0]); } catch (err) { Logger.log('Ülevaade: ' + err); }
  try { plan.getRange('E32').setValue('Loosiratas: ' + k.Kuu + ' loos on tehtud ' + aeg + ': ' + lrLoetelu_(voitjad) + '.'); plan.getRange('D32').setValue(false); } catch (err) {}
}

function lrAutahvel_(k, voitjad) {
  var f = k.pub.getSheetByName(LR.T_FAME);
  if (!f) return;
  var a = f.getRange(LR.FAME0, 1, LR.FAMEN, 1).getValues();
  for (var i = 0; i < a.length; i++) if (String(a[i][0]) === k.kuu.nimi) {
    f.getRange(LR.FAME0 + i, LR.FAME_WIN).setValue(voitjad.map(function (w) { return w.nimi; }).join('\n'));
    f.setRowHeight(LR.FAME0 + i, Math.max(30, voitjad.length * 16 + 10));
    return;
  }
}

// Ülevaate fortuuna plokk (sama paigutus mis Kuu harjutuse skriptil): G20 pealkiri, G21 selgitus, rida 22 päis, 23+ võitjad.
// Tulbad G NR, H NIMI, I TIIM, J PILETID, L AUHIND. Tulp K on Ülevaate peidetud abitulp: seda ei puuduta.
function lrYlevaade_(k, voitjad, paev) {
  var b = k.pub.getSheetByName(LR.T_BOARD);
  if (!b) return;
  var C = 7, V0 = LR.VV0, L = "'" + LR.T_GUIDE + "'!$C$3=\"English\"";
  var q = function (s) { return String(s).replace(/"/g, '""'); };
  var tx = function (et, en) { return '=IF(' + L + ',"' + q(en) + '","' + q(et) + '")'; };
  var G = LR.ET_G[k.m - 1], EN = LR.EN_K[k.m - 1];
  if (b.getMaxRows() < V0 + 2 + LR.VV_MAX) b.insertRowsAfter(b.getMaxRows(), V0 + 2 + LR.VV_MAX - b.getMaxRows());
  var ylal = b.getRange(V0 - 1, C, 3, 6); ylal.breakApart(); ylal.clear();
  [b.getRange(V0 + 2, C, LR.VV_MAX + 1, 4), b.getRange(V0 + 2, 12, LR.VV_MAX + 1, 1)].forEach(function (x) { x.breakApart(); x.clear(); });
  b.getRange(V0, C, 1, 6).merge();
  b.getRange(V0, C).setFormula(tx(k.Kuu + 'kuu fortuuna soosis neid osalejaid', 'Fortune smiled on these participants in ' + EN))
    .setFontFamily('Oswald').setFontSize(14).setFontWeight('bold').setFontColor('#2B241E').setVerticalAlignment('bottom');
  b.getRange(V0 + 1, C, 1, 6).merge();
  b.getRange(V0 + 1, C).setFormula(tx('Loosisime ' + paev + ' ' + G + ' piletite järgi. Mida rohkem pileteid, seda suurem oli võimalus võita. Kõik võitjad on ka vahekaardil „Autahvel“.',
      'Drawn on ' + paev + ' from the ' + EN + ' tickets. More tickets meant a better chance to win. All winners are also on the “Autahvel | Fame” tab.'))
    .setFontSize(8).setFontColor('#6E655B').setFontStyle('italic').setWrap(true).setVerticalAlignment('middle');
  b.getRange(V0 + 2, C, 1, 4).setFormulas([[tx('NR', '#'), tx('NIMI', 'NAME'), tx('TIIM', 'TEAM'), tx('LOOSIPILETITE ARV', 'RAFFLE TICKETS')]]);
  b.getRange(V0 + 2, 12).setFormula(tx('AUHIND', 'PRIZE'));
  [b.getRange(V0 + 2, C, 1, 4), b.getRange(V0 + 2, 12)].forEach(function (x) {
    x.setBackground('#2B241E').setFontColor('#FFFFFF').setFontSize(8).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  });
  var tiim = {};
  k.kuu.sh.getRange(LR.R0, 1, LR.N, 3).getValues().forEach(function (r) {
    var t = lrStr_(r[2]); if (lrStr_(r[0]) && t && !/^(OTSIN|LOOKING)$/i.test(t)) tiim[lrStr_(r[0])] = t;
  });
  var r0 = V0 + 3, n = Math.min(voitjad.length, LR.VV_MAX);
  if (!n) return;
  b.getRange(r0, C, n, 4).setValues(voitjad.slice(0, n).map(function (w, i) { return [i + 1, lrTxt_(w.nimi), lrTxt_(tiim[w.nimi] || ''), w.p]; }));
  b.getRange(r0, 12, n, 1).setFormulas(voitjad.slice(0, n).map(function (w) { return [tx(w.et, w.en || w.et)]; }));
  var taust = voitjad.slice(0, n).map(function (w, i) { return i % 2 ? '#F6F1EA' : '#FFFFFF'; });
  b.getRange(r0, C, n, 4).setFontSize(10).setFontColor('#2B241E').setVerticalAlignment('middle').setBackgrounds(taust.map(function (c) { return [c, c, c, c]; }));
  b.getRange(r0, 12, n, 1).setFontSize(10).setFontColor('#2B241E').setVerticalAlignment('middle').setWrap(true).setBackgrounds(taust.map(function (c) { return [c]; }));
  b.getRange(r0, C, n, 1).setNumberFormat('0').setFontWeight('bold').setFontColor('#8B6B47').setHorizontalAlignment('center');
  b.getRange(r0, C + 1, n, 1).setFontWeight('bold');
  b.getRange(r0, C + 2, n, 1).setFontColor('#6E655B');
  b.getRange(r0, C + 3, n, 1).setNumberFormat('0').setHorizontalAlignment('center');
}

// ---------------------------------------------------------------- abi

function lrPrivaatne_() {
  var id = PropertiesService.getUserProperties().getProperty('LR_PRIV');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (err) {} }
  var it = DriveApp.getFilesByName(LR.PRIV_NIMI);
  while (it.hasNext()) {
    var f = it.next();
    if (f.isTrashed() || f.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
    var ss = SpreadsheetApp.openById(f.getId());
    if (lrGrupid_(ss).length) { PropertiesService.getUserProperties().setProperty('LR_PRIV', ss.getId()); return ss; }
  }
  return null;
}

// Plaani vahekaardid (lahtris T1 „KH…“): põhigrupp (U1 tühi) ees, siis teised.
function lrGrupid_(priv) {
  var ver = function (sh) { var m = sh.getMaxColumns() >= 21 ? /^KH(\d+)$/.exec(lrStr_(sh.getRange('T1').getValue())) : null; return m ? Number(m[1]) : 0; };
  var koik = priv.getSheets().map(function (sh) { return [sh, ver(sh)]; }), uusim = Math.max.apply(null, [0].concat(koik.map(function (x) { return x[1]; })));
  var s = koik.filter(function (x) { return x[1] && x[1] === uusim; }).map(function (x) { return x[0]; });   // vanad plaani vahekaardid jäävad välja
  return s.filter(function (x) { return !lrStr_(x.getRange('U1').getValue()); }).concat(s.filter(function (x) { return lrStr_(x.getRange('U1').getValue()); }));
}

function lrJarjesta_(ws, auh) {
  var koht = {};
  auh.forEach(function (a, i) { if (!(a.et in koht)) koht[a.et] = i; });
  return ws.map(function (w, i) { return [w, i]; }).sort(function (a, b) {
    return ((a[0].et in koht ? koht[a[0].et] : 999) - (b[0].et in koht ? koht[b[0].et] : 999)) || a[1] - b[1];
  }).map(function (x) { return x[0]; });
}
function lrLoetelu_(ws) { return ws.map(function (w, i) { return (i + 1) + '. ' + w.nimi + ' (' + w.p + (w.p === 1 ? ' pilet' : ' piletit') + ') – ' + w.et; }).join('; '); }
function lrStr_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function lrTxt_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
function lrViga_(err) { return err && err.message ? err.message : String(err); }

// LOOSIRATTA LÕPP
