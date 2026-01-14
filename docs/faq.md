# Ofte stilte spørsmål (FAQ)

Her finner du svar på de mest stilte spørsmålene om Gjeld i Norge.

## :material-information: Generelt

### Hva er Gjeld i Norge?

Gjeld i Norge er en gratis, åpen kildekode desktop-applikasjon som hjelper norske borgere med å få oversikt over sin gjeldssituasjon. Applikasjonen automatiserer datainnsamling fra ulike inkassobyråer og kreditorer, og presenterer informasjonen på en enkel og oversiktlig måte.

### Er applikasjonen gratis?

Ja, applikasjonen er helt gratis og åpen kildekode (CC0-1.0 lisens). Du kan bruke, modifisere og distribuere den fritt.

### Hvem står bak prosjektet?

Dette er et open source-prosjekt hostet på [GitHub](https://github.com/biasedLiar/debt_scraper). Alle kan bidra til utviklingen.

### Hvilke operativsystemer støttes?

Applikasjonen fungerer på:

- ✅ Windows 10/11
- ✅ macOS (Intel og Apple Silicon)
- ✅ Linux (Ubuntu, Fedora, Debian, etc.)

## :material-security: Sikkerhet og personvern

### Er applikasjonen sikker å bruke?

Ja. Applikasjonen:

- ✅ Lagrer **all data lokalt** på din maskin
- ✅ Sender **ingen data** til eksterne servere
- ✅ Har **ikke tilgang** til BankID-legitimasjon
- ✅ Er **åpen kildekode** - alle kan inspisere koden

!!! warning "Viktig"
    Som med all programvare: Last kun ned fra offisielle kilder og sørg for at maskinen din er sikret.

### Hva skjer med mine data?

All data lagres i `exports/`-mappen på din lokale maskin. Ingen data sendes til internett eller eksterne servere. Du har full kontroll og kan slette dataene når som helst.

### Kan applikasjonen logge inn med BankID for meg?

**Nei.** Applikasjonen kan **aldri** logge inn med BankID automatisk. BankID krever at du personlig godkjenner påloggingen via BankID-appen på mobil eller tablet. Applikasjonen kan kun:

- Fylle ut fødselsnummer automatisk
- Navigere til BankID-siden
- Vente til du har godkjent påloggingen

### Hvorfor trenger applikasjonen mitt fødselsnummer?

Fødselsnummer brukes for:

1. **Automatisk utfylling** ved BankID-pålogging (valgfritt)
2. **Organisering av data** - filer lagres under ditt fødselsnummer

Du kan fjerne fødselsnummer fra kildekoden hvis du foretrekker manuell utfylling.

### Er det trygt å oppbevare data lokalt?

Dataene er så trygge som din maskin er. Vi anbefaler:

- ✅ Bruk passord-beskyttet brukerkonto
- ✅ Aktiver disk-kryptering (BitLocker/FileVault/LUKS)
- ✅ Ikke del `exports/`-mappen
- ✅ Ta regelmessige backups til kryptert medium

## :material-bank: Kreditorer

### Hvilke kreditorer støttes?

| Kreditor | Status | Automatisert datainnsamling |
|----------|--------|----------------------------|
| Statens Innkrevingssentral (SI) | ✅ Fullt støttet | Ja |
| Intrum | ✅ Fullt støttet | Ja |
| Kredinor | ✅ Fullt støttet | Ja |
| PRA Group | 🔄 Under arbeid | Delvis |
| tfBank | 🔄 Under utvikling | Nei |
| Digipost | 🔄 Under utvikling | Nei |
| Zolva AS | 🔄 Under utvikling | Nei |

### Kan jeg foreslå flere kreditorer?

Absolutt! [Opprett et issue](https://github.com/biasedLiar/debt_scraper/issues/new) på GitHub med kreditorens navn og nettadresse.

### Hvorfor støttes ikke min kreditor?

Kreditor-støtte legges til basert på:

- Etterspørsel fra brukere
- Tilgjengelighet av nettside-API
- Kompleksitet i autentisering
- Bidragsytere som kan implementere

Du kan selv bidra ved å [lage en PR](../contributing/code-contributions.md)!

### Fungerer det med alle typer gjeld?

Applikasjonen kan samle inn informasjon om:

- ✅ Inkassogjeld
- ✅ Forfalte krav
- ✅ Betalingsavtaler
- ⚠️ Studielån (delvis - via SI)
- ⚠️ Skattekrav (via SI)

Private lån mellom personer støttes ikke.

## :material-cog: Tekniske spørsmål

### Hvorfor åpner det seg et Chrome-vindu?

Applikasjonen bruker Puppeteer, som styrer en Chrome/Chromium-instans for å automatisere nettlesing. Dette vinduet er nødvendig for å:

1. Navigate til kreditor-nettsteder
2. Håndtere BankID-autentisering
3. Ekstrahere gjeldsinformasjon

Du ser vinduet for åpenhet - du kan se nøyaktig hva applikasjonen gjør.

### Kan jeg kjøre applikasjonen i bakgrunnen (headless)?

Ja, men det anbefales ikke for første gang. Endre i `src/scraper.mjs`:

```javascript
const browser = await LIBS.puppeteer.launch({
  headless: true,  // Endre til true
  // ...
});
```

!!! warning "BankID i headless mode"
    BankID-autentisering kan være vanskeligere å følge med på i headless mode.

### Hvorfor tar installasjonen så lang tid?

Første installasjon tar 3-5 minutter fordi Puppeteer laster ned hele Chromium-nettleseren (~300 MB). Dette er normalt og skjer kun én gang.

### Kan jeg bruke min eksisterende Chrome-installasjon?

Ja! Rediger `src/scraper.mjs`:

```javascript
const browser = await LIBS.puppeteer.launch({
  executablePath: '/path/to/chrome',  // Din Chrome-sti
  // Windows: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  // macOS: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  // Linux: '/usr/bin/google-chrome'
});
```

### Hvor mye diskplass kreves?

- **Applikasjon:** ~50 MB
- **Chromium (Puppeteer):** ~300 MB
- **Data per bruker:** ~1-5 MB per år (avhengig av antall gjeldssaker)

Total: Ca. 350-400 MB

### Fungerer det på Raspberry Pi?

Ja, men:

- Krever ARM-kompatibel Chromium
- Kan være tregt på eldre Raspberry Pi-modeller
- Anbefalt: Raspberry Pi 4 med 4GB+ RAM

## :material-hammer-wrench: Bruk og funksjonalitet

### Hvor ofte bør jeg kjøre applikasjonen?

Det avhenger av dine behov:

- **Månedlig:** For generell oversikt
- **Ukentlig:** Hvis du har betalingsavtaler
- **Ved behov:** Før økonomiplanlegging eller møter

Applikasjonen lagrer tidsstempel, så du kan spore endringer over tid.

### Kan jeg se historiske data?

Ja! Applikasjonen lagrer hver datainnsamling i separate mapper med dato:

```
exports/
└── [fødselsnummer]/
    ├── 2025_12_15/
    ├── 2026_01_14/
    └── 2026_02_01/
```

Du kan manuelt navigere og sammenligne JSON-filene.

### Kan jeg eksportere data til Excel/CSV?

Ikke direkte, men JSON-filene kan enkelt konverteres:

**Online verktøy:**
- [ConvertCSV](https://www.convertcsv.com/json-to-csv.htm)

**Programmatisk:**
```javascript
import fs from 'fs';
import { parse } from 'json2csv';

const jsonData = JSON.parse(fs.readFileSync('data.json'));
const csv = parse(jsonData);
fs.writeFileSync('data.csv', csv);
```

### Fungerer offline-modus?

Ja! Sett `offlineMode = true` i `src/renderer.mjs` for å:

- Lese kun lagrede data
- Teste UI uten nettverkstilkobling
- Jobbe med historiske data

!!! info
    Offline-modus kan ikke samle inn nye data - kun vise eksisterende.

### Kan jeg kjøre flere kreditorer samtidig?

Nei, applikasjonen kjører én kreditor om gangen for å:

- Unngå konflikter i nettlesersesjon
- Redusere ressursbruk
- Gjøre feilsøking enklere

### Hva skjer hvis autentiseringen feiler?

- Nettleservinduet forblir åpent
- Du kan prøve å logge inn manuelt
- Eller lukke vinduet og prøve på nytt

Applikasjonen logger feilmeldinger i konsollen for debugging.

## :material-bug: Feilsøking

### Applikasjonen starter ikke

**Løsninger:**

1. Verifiser Node.js er installert: `node --version`
2. Reinstaller avhengigheter: `rm -rf node_modules && npm install`
3. Sjekk konsollfeilmeldinger i terminal

### "Error: Cannot find module"

**Løsning:**
```bash
npm install
```

Hvis det ikke hjelper:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puppeteer feiler ved oppstart

**Løsning:**

```bash
# Linux: Installer avhengigheter
sudo apt-get install -y \
  libgbm-dev \
  libnss3 \
  libxss1 \
  libasound2

# Eller skip Chromium download og bruk system Chrome
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

### BankID-siden laster ikke

**Sjekk:**

1. Internettilkobling
2. BankID-tjenesten er oppe: [bankid.no](https://www.bankid.no/)
3. Nettleservinduet har nettverkstilgang

### Data vises ikke i applikasjonen

**Mulige årsaker:**

1. **Ingen data samlet:** Kjør datainnsamling først
2. **Feil mappe:** Sjekk at data er i `exports/`
3. **JSON-feil:** Valider JSON-filene
4. **Offline-modus:** Sjekk `offlineMode`-innstilling

### "Timeout exceeded" feilmelding

**Løsning:**

Øk timeout i `src/scraper.mjs`:

```javascript
await page.goto(url, { timeout: 60000 }); // 60 sekunder
```

## :material-code-tags: Utvikling

### Hvordan kan jeg bidra?

Se vår [Bidragsguide](../contributing/guidelines.md) for detaljer!

Rask oversikt:
1. Fork repositoriet
2. Opprett en feature branch
3. Gjør endringer
4. Submit pull request

### Hvordan legger jeg til en ny kreditor?

Se detaljert guide: [Legge til ny kreditor](../developer-guide/adding-creditor.md)

Kort versjon:
1. Opprett `src/pages/[kreditor].mjs`
2. Implementer scraping-logikk
3. Legg til Zod-skjema
4. Oppdater `src/data.mjs`

### Hvor finner jeg utviklerdokumentasjonen?

- [Arkitektur](../architecture/overview.md)
- [API-referanse](../api/core-modules.md)
- [Utviklerguide](../developer-guide/setup.md)

### Bruker dere TypeScript?

Nei, prosjektet bruker vanilla JavaScript med ES-moduler. Men vi bruker **Zod** for runtime type validation, som gir mange av fordelene til TypeScript.

Fremtidig TypeScript-støtte er under vurdering.

## :material-help-circle: Får fortsatt ikke hjelp?

Hvis spørsmålet ditt ikke er besvart her:

1. **Søk i eksisterende issues:** [GitHub Issues](https://github.com/biasedLiar/debt_scraper/issues)
2. **Still et spørsmål:** [GitHub Discussions](https://github.com/biasedLiar/debt_scraper/discussions)
3. **Rapporter en bug:** [Ny Issue](https://github.com/biasedLiar/debt_scraper/issues/new)

---

<div align="center">

**Fant du ikke svaret? [Still et spørsmål på GitHub](https://github.com/biasedLiar/debt_scraper/discussions)**

</div>
