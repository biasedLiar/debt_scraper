# Konfigurasjon

Denne guiden forklarer hvordan du konfigurerer Gjeld i Norge for dine behov.

## :material-file-cog: Konfigurasjonsfiler

### Hovedkonfigurasjon

Konfigurasjon skjer primært gjennom kildekodeendringer. Dette er bevisst valgt for å gi full kontroll.

#### `src/renderer.mjs` - Brukergrensesnittinnstillinger

```javascript
// Offline-modus: Test med lagrede data uten nettverkstilkobling
const offlineMode = false; // Sett til true for å bruke kun lokale data

// Vis betalte gjeld: Inkluder gjeld som allerede er betalt
const showPaidDebts = false; // Sett til true for å vise all historikk
```

#### `src/data.mjs` - Kreditor-URLer

Definerer hvilke nettsteder som skal besøkes:

```javascript
export const SITES = {
  SI: {
    name: "Statens Innkrevingssentral",
    url: "https://minside.si.no/",
    pages: [
      "https://minside.si.no/mine-krav"
    ]
  },
  INTRUM: {
    name: "Intrum",
    url: "https://minside.intrum.no/",
    pages: [
      "https://minside.intrum.no/mine-saker"
    ]
  },
  // ... flere kreditorer
};
```

#### `src/main.mjs` - Electron-vindukonfigurasjon

```javascript
const mainWindow = new BrowserWindow({
  width: width / 2,           // Vindubredde
  height: height,             // Vinduhøyde
  frame: false,               // Fjern vindusramme
  movable: true,              // Tillat flytting
  fullscreen: false,          // Fullskjermmodus
  webPreferences: {
    nodeIntegration: true,    // Aktiver Node.js i renderer
    contextIsolation: false,  // Deaktiver kontekstisolasjon
    devTools: true,           // Tillat DevTools
  },
});
```

## :material-cog: Brukerinnstillinger

### Fødselsnummer

For automatisk utfylling av fødselsnummer ved BankID-pålogging:

1. Åpne relevant kreditor-modul (f.eks. `src/pages/intrum.mjs`)
2. Finn `fillBankIDForm`-funksjonen
3. Rediger fødselsnummer-utfyllingen:

```javascript
// Automatisk utfylling
await page.type('#input-persid', 'DITT_FØDSELSNUMMER');

// Eller deaktiver for manuell inntasting
// await page.type('#input-persid', ''); // Tom streng
```

!!! warning "Sikkerhet"
    Lagre **aldri** fødselsnummer i kildekoden hvis du deler prosjektet. Vurder å bruke miljøvariabler.

### Miljøvariabler (Anbefalt)

Bruk `.env`-fil for sensitive verdier:

1. Installer dotenv:
```bash
npm install dotenv
```

2. Opprett `.env` i prosjektrot:
```env
FODSELSNUMMER=01010199999
```

3. Last inn i koden:
```javascript
import 'dotenv/config';
const fnr = process.env.FODSELSNUMMER;
```

4. Legg til i `.gitignore`:
```gitignore
.env
```

## :material-web: Nettleserinnstillinger

### Puppeteer-konfigurasjon

I `src/scraper.mjs`:

```javascript
const browser = await LIBS.puppeteer.launch({
  headless: false,              // false = vis nettleser, true = kjør i bakgrunnen
  args: [
    "--no-sandbox",             // Påkrevd for noen Linux-systemer
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",  // Unngå minneproblemer
    "--window-size=1920,1080"   // Standard vindustørrelse
  ],
  defaultViewport: null,        // Bruk full vindusbredde
  
  // Bruk egendefinert Chrome-installasjon (valgfritt)
  // executablePath: '/path/to/chrome',
  
  // Sett nettleserens brukerdata-mappe (valgfritt)
  // userDataDir: './browser-data',
});
```

### Timeout-innstillinger

Juster hvor lenge applikasjonen venter på sideinnlasting:

```javascript
// Global timeout for alle navigasjoner
page.setDefaultNavigationTimeout(60000); // 60 sekunder

// Per-navigasjon timeout
await page.goto(url, { 
  timeout: 30000,              // 30 sekunder
  waitUntil: 'networkidle2'    // Vent til nettverket er stilleå
});

// Vent på spesifikk selector
await page.waitForSelector('.debt-list', { 
  timeout: 20000 
});
```

## :material-database: Datalagring

### Eksportmappe

Standard eksportplassering er `exports/`. For å endre:

1. Åpne `src/utilities.mjs`
2. Finn `exportJSON`-funksjonen
3. Endre basepath:

```javascript
const basePath = path.join(process.cwd(), 'exports'); // Standard

// Endre til custom path
const basePath = '/custom/path/to/exports';
```

### Filnavn og struktur

Kontroller hvordan filer navngis:

```javascript
// I utilities.mjs
const folderName = `${identifikasjon}/${dateStr}/${site.name}/${cleanedPageName}`;

// Tilpass format:
// Eksempel: Bruk ISO-datoformat
const dateStr = new Date().toISOString().split('T')[0]; // 2026-01-14
```

## :material-shield-check: Validering

### Zod-skjemaer

Tilpass datavalidering i `src/schemas.mjs`:

```javascript
// Strengere validering
export const IntrumDebtCaseSchema = z.object({
  caseNumber: z.string()
    .min(5, "Saksnummer må være minst 5 tegn")
    .regex(/^\d+$/, "Kun tall tillatt"),
  
  totalAmount: z.string()
    .transform(val => {
      const num = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (num < 0) throw new Error("Beløp kan ikke være negativt");
      return num;
    }),
  
  creditorName: z.string()
    .min(2, "Kreditornavn må være minst 2 tegn")
    .max(100, "Kreditornavn for langt"),
});
```

### Feilhåndtering

Tilpass hvordan valideringsfeil håndteres:

```javascript
try {
  const validatedData = IntrumDebtCaseSchema.parse(rawData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Valideringsfeil:', error.errors);
    // Lagre ugyldig data for debugging
    fs.writeFileSync('invalid-data.json', JSON.stringify({
      raw: rawData,
      errors: error.errors
    }, null, 2));
  }
}
```

## :material-eye: UI-innstillinger

### DevTools

Kontroller om utviklerverktøy åpnes automatisk:

```javascript
// I src/main.mjs

// Alltid åpne DevTools
mainWindow.webContents.openDevTools();

// Aldri åpne DevTools
// mainWindow.webContents.openDevTools(); // Kommenter ut

// Åpne kun i utviklingsmodus
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

### Vindusstørrelse og posisjon

```javascript
const mainWindow = new BrowserWindow({
  width: 1200,                  // Fast bredde
  height: 800,                  // Fast høyde
  x: 100,                       // X-posisjon på skjermen
  y: 100,                       // Y-posisjon på skjermen
  minWidth: 800,                // Minimum bredde
  minHeight: 600,               // Minimum høyde
  maxWidth: 1920,               // Maksimum bredde
  maxHeight: 1080,              // Maksimum høyde
  resizable: true,              // Tillat endring av størrelse
});

// Eller bruk skjermstørrelse
const { width, height } = screen.getPrimaryDisplay().workAreaSize;
```

### CSS-tilpasning

Rediger `src/styles.css` for visuell tilpasning:

```css
/* Endre hovedfarge */
:root {
  --primary-color: #3498db;
  --background-color: #f5f5f5;
  --text-color: #333;
}

/* Kreditorknapper */
.creditor-button {
  background-color: var(--primary-color);
  padding: 15px 30px;
  border-radius: 8px;
}
```

## :material-lightning-bolt: Ytelsesoptimalisering

### Minnebruk

Juster for bedre ytelse på maskiner med begrenset minne:

```javascript
// I scraper.mjs
const browser = await LIBS.puppeteer.launch({
  args: [
    '--disable-dev-shm-usage',        // Bruk /tmp i stedet for /dev/shm
    '--disable-gpu',                  // Deaktiver GPU
    '--no-zygote',                    // Reduser minnebruk
    '--single-process',               // Kjør i én prosess (ikke anbefalt for produksjon)
  ],
});
```

### Samtidige forespørsler

Kontroller hvor mange sider som lastes samtidig:

```javascript
// Sekvensiell lasting (tryggere)
for (const url of urls) {
  await page.goto(url);
  await extractData(page);
}

// Parallell lasting (raskere, men krever mer ressurser)
await Promise.all(urls.map(async url => {
  const page = await browser.newPage();
  await page.goto(url);
  return extractData(page);
}));
```

## :material-format-list-checks: Miljøkonfigurasjon

### Utviklingsmodus vs. Produksjon

Opprett forskjellige konfigurasjoner:

```javascript
// config.mjs
export const config = {
  development: {
    headless: false,
    devTools: true,
    verboseLogging: true,
  },
  production: {
    headless: true,
    devTools: false,
    verboseLogging: false,
  }
};

// Bruk i koden
const env = process.env.NODE_ENV || 'development';
const settings = config[env];
```

### Logging

Tilpass logging-nivå:

```javascript
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVEL.INFO;

function log(level, message) {
  if (level <= currentLogLevel) {
    console.log(`[${Object.keys(LOG_LEVEL)[level]}] ${message}`);
  }
}

// Bruk
log(LOG_LEVEL.DEBUG, 'Detaljert debug-informasjon');
log(LOG_LEVEL.ERROR, 'Kritisk feil oppstod');
```

## :material-wrench: Avanserte innstillinger

### Proxy-konfigurasjon

For å bruke proxy:

```javascript
const browser = await LIBS.puppeteer.launch({
  args: [
    '--proxy-server=http://proxy.example.com:8080',
  ],
});

// Med autentisering
await page.authenticate({
  username: 'proxyuser',
  password: 'proxypass',
});
```

### User Agent

Endre nettleserens user agent:

```javascript
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
```

### Cookies og sesjonshåndtering

```javascript
// Lagre cookies
const cookies = await page.cookies();
fs.writeFileSync('cookies.json', JSON.stringify(cookies));

// Last inn cookies
const savedCookies = JSON.parse(fs.readFileSync('cookies.json'));
await page.setCookie(...savedCookies);
```

## :material-checkbox-marked-circle: Konfigurasjonssjekkliste

- [ ] Sett opp miljøvariabler for sensitive data
- [ ] Konfigurer nettleserinnstillinger
- [ ] Juster timeout-verdier for nettverket ditt
- [ ] Velg eksportmappe-plassering
- [ ] Tilpass Zod-valideringsskjemaer
- [ ] Konfigurer logging-nivå
- [ ] Sett DevTools-preferanser
- [ ] Optimaliser for systemets ressurser

## :material-arrow-right: Neste steg

- [Brukerguide](../user-guide/overview.md) - Lær å bruke applikasjonen
- [Utviklerguide](../developer-guide/setup.md) - Dykk dypere inn i koden
- [Sikkerhet](../security/best-practices.md) - Sikre applikasjonen
