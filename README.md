# Üksuse skriptid

Privaatne. „Kuu harjutuse uuendaja“ (Apps Script) loeb siit lugemisvõtmega uued versioonid ja kirjutab need Eriku tabeli skripti.

- `uuendaja.json`: mida uuendada (projekt, faili tunnus, allikas, lõpumärk, peidetud väärtused)
- `kuu-harjutus-skript.gs`: Kuu harjutus (ehitatakse projekti failides `.builder/` all)
- `hinnalugeja.gs`: rühmatrennide hinnalugeja / Arhiiv & tähtajad & tasud. „Bilans 2026“ tabeli ID asemel on `__BILANSS_FAILI_ID__`, uuendaja paneb päris ID tagasi.
- `uuendaja.gs`: uuendaja ise (uuendab ka iseennast)

Iga fail peab lõppema oma lõpumärgiga (`SKRIPTI LÕPP`, `HINNALUGEJA LÕPP`, `UUENDAJA LÕPP`), muidu uuendaja keeldub.
