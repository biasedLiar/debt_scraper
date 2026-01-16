# Hovedmoduler

Dette dokumentet beskriver kjerne-API-ene for Gjeld i Norge applikasjonen.

## :material-application: main.mjs

Electron hovedprosess som håndterer applikasjonslivssyklus og vindusadministrasjon.

### `createWindow()`

Oppretter hovedapplikasjonsvinduet.

**Returnerer:** `Promise<BrowserWindow>`

```javascript
const createWindow = async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  const mainWindow = new BrowserWindow({
    width: width / 2,
    height: height,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  
  mainWindow.loadFile("src/index.html");
  return mainWindow;
};
```

**Konfigurasjon:**

| Parameter | Type | Beskrivelse |
|-----------|------|-------------|
| `width` | number | Vindubredde i piksler |
| `height` | number | Vinduhøyde i piksler |
| `frame` | boolean | Vis vindusramme |
| `nodeIntegration` | boolean | Aktiver Node.js i renderer |
| `contextIsolation` | boolean | Isoler renderer-kontekst |

### Event Handlers

```javascript
// App er klar
app.whenReady().then(async () => {
  let w = await createWindow();
});

// Alle vinduer lukket
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
```

## :material-pencil: renderer.mjs

UI-logikk og brukerinteraksjon i renderer-prosessen.

### Konstanter

```javascript
const offlineMode = false;      // Test med lagrede data
const showPaidDebts = false;    // Vis betalte gjeld
```

### `displayDebts(debts)`

Viser gjeldsinformasjon i brukergrensesnittet.

**Parametere:**

- `debts` (Array): Liste over gjeldsobjekter

```javascript
displayDebts([
  {
    creditSite: "Intrum",
    totalAmount: 25000,
    debts: [
      { amount: 15000, type: "Hovedkrav" },
      { amount: 10000, type: "Renter" }
    ]
  }
]);
```

### `startScraping(creditor)`

Starter datainnsamling for valgt kreditor.

**Parametere:**

- `creditor` (string): Kreditornavn (f.eks. "Intrum", "Kredinor")

**Returnerer:** `Promise<void>`

```javascript
async function startScraping(creditor) {
  const { page, browser } = await PUP.openPage(SITES[creditor].url);
  
  // Kjør kreditor-spesifikk scraper
  const data = await scrapeCreditor(page, creditor);
  
  // Valider og lagre
  const validated = validateData(data);
  await saveData(validated, creditor);
  
  await browser.close();
}
```

## :material-code-json: data.mjs

Konfigurasjon av kreditor-nettsteder og URL-er.

### `SITES`

Objekt som inneholder kreditor-konfigurasjon.

**Struktur:**

```javascript
export const SITES = {
  KREDITOR_ID: {
    name: string,        // Visningsnavn
    url: string,         // Hovedside URL
    pages: string[],     // Liste over undersider
    loginUrl?: string,   // Spesifikk innloggings-URL
  }
};
```

**Eksempel:**

```javascript
export const SITES = {
  SI: {
    name: "Statens Innkrevingssentral",
    url: "https://minside.si.no/",
    pages: [
      "https://minside.si.no/mine-krav",
      "https://minside.si.no/betalingsavtaler"
    ],
    loginUrl: "https://loginservice.bankidnorge.no/"
  },
  
  INTRUM: {
    name: "Intrum",
    url: "https://minside.intrum.no/",
    pages: [
      "https://minside.intrum.no/mine-saker"
    ]
  }
};
```

### Tilgang til konfigurasjon

```javascript
import { SITES } from './data.mjs';

// Hent kreditor-konfigurasjon
const intrumConfig = SITES.INTRUM;
console.log(intrumConfig.name);  // "Intrum"
console.log(intrumConfig.url);   // "https://minside.intrum.no/"

// Iterer over alle kreditorer
Object.keys(SITES).forEach(key => {
  const site = SITES[key];
  console.log(`${site.name}: ${site.url}`);
});
```

## :material-eye: dom.mjs

DOM-manipulerings hjelpefunksjoner.

### `createElement(tag, className, textContent)`

Oppretter et HTML-element.

**Parametere:**

- `tag` (string): HTML-tagnavn
- `className` (string): CSS-klassenavn
- `textContent` (string, optional): Tekstinnhold

**Returnerer:** `HTMLElement`

```javascript
const div = createElement('div', 'debt-item', 'Gjeld: 5000 kr');
document.body.appendChild(div);
```

### `clearElement(element)`

Fjerner alt innhold fra et element.

**Parametere:**

- `element` (HTMLElement): Element som skal tømmes

```javascript
const container = document.getElementById('debt-list');
clearElement(container);
```

### `showLoading(show)`

Viser/skjuler lastingsindikator.

**Parametere:**

- `show` (boolean): true for å vise, false for å skjule

```javascript
showLoading(true);   // Vis spinner
await fetchData();
showLoading(false);  // Skjul spinner
```

## :material-account-multiple: json_reader.mjs

Parser og aggregerer JSON-data fra filsystemet.

### `readAllDebtData()`

Leser all gjeldsinformasjon fra exports-mappen.

**Returnerer:** `Promise<Array<DebtCollection>>`

```javascript
const allDebts = await readAllDebtData();

allDebts.forEach(debt => {
  console.log(`${debt.creditSite}: ${debt.totalAmount} kr`);
  debt.debts.forEach(d => {
    console.log(`  - ${d.type}: ${d.amount} kr`);
  });
});
```

**Return-format:**

```javascript
[
  {
    creditSite: "Intrum",
    isCurrent: true,
    totalAmount: 25000,
    debts: [
      {
        id: "2024-12345",
        amount: 15000,
        dueDate: "2026-06-01",
        type: "Hovedkrav",
        typeText: "Kredittgjeld"
      }
    ]
  }
]
```

### `parseJSONFile(filePath)`

Parser én JSON-fil.

**Parametere:**

- `filePath` (string): Sti til JSON-fil

**Returnerer:** `Promise<Object>`

**Kaster:** `Error` hvis fil ikke eksisterer eller JSON er ugyldig

```javascript
try {
  const data = await parseJSONFile('exports/user/2026_01_14/Intrum/data.json');
  console.log(data);
} catch (error) {
  console.error('Kunne ikke lese fil:', error.message);
}
```

### `aggregateDebtsByCreditor(debts)`

Aggregerer gjeld per kreditor.

**Parametere:**

- `debts` (Array): Liste over gjeldsobjekter

**Returnerer:** `Object` - Gjeld gruppert etter kreditor

```javascript
const aggregated = aggregateDebtsByCreditor(allDebts);

// Output:
{
  "Intrum": {
    total: 25000,
    count: 3,
    debts: [...]
  },
  "Kredinor": {
    total: 15000,
    count: 2,
    debts: [...]
  }
}
```

## :material-sync: libs.mjs

Sentral import og re-eksport av eksterne biblioteker.

### `LIBS`

Samlet objekt med alle biblioteker.

```javascript
export const LIBS = {
  puppeteer,
  z,  // Zod
};
```

**Bruk:**

```javascript
import { LIBS } from './libs.mjs';

// Bruk Puppeteer
const browser = await LIBS.puppeteer.launch();

// Bruk Zod
const schema = LIBS.z.object({
  name: LIBS.z.string(),
  age: LIBS.z.number(),
});
```

**Fordeler:**

- ✅ Én fil å oppdatere ved biblioteksendringer
- ✅ Konsistent import-syntaks
- ✅ Enklere å mocke for testing

## :material-code-braces: Felles typer

### DebtItem

```javascript
{
  id: string,           // Unik identifikator (saksnummer)
  amount: number,       // Beløp i NOK
  dueDate: string,      // ISO 8601 dato (YYYY-MM-DD)
  type: string,         // Type gjeld (Hovedkrav, Renter, etc.)
  typeText: string,     // Menneskelesbar beskrivelse
}
```

### DebtCollection

```javascript
{
  creditSite: string,      // Kreditornavn
  debts: DebtItem[],       // Liste over gjeldsposter
  isCurrent: boolean,      // Er dette nyeste data?
  totalAmount: number,     // Total sum
}
```

### SiteConfig

```javascript
{
  name: string,       // Visningsnavn
  url: string,        // Hovedside URL
  pages: string[],    // Undersider
  loginUrl?: string,  // Innloggings-URL (optional)
}
```

## :material-code-tags: Brukseksempler

### Fullstendig datainnsamlingsflyt

```javascript
import { SITES } from './data.mjs';
import { PUP } from './scraper.mjs';
import { scrapeIntrum } from './pages/intrum.mjs';
import { IntrumManualDebtSchema } from './schemas.mjs';
import { exportJSON } from './utilities.mjs';

async function collectIntrumData(userId) {
  // 1. Åpne nettleser
  const { page, browser } = await PUP.openPage(SITES.INTRUM.url);
  
  try {
    // 2. Kjør scraping
    const rawData = await scrapeIntrum(page, userId);
    
    // 3. Valider data
    const validatedData = IntrumManualDebtSchema.parse(rawData);
    
    // 4. Lagre til fil
    await exportJSON(
      validatedData,
      userId,
      SITES.INTRUM,
      'manualDebts',
      'manualDebts.json'
    );
    
    // 5. Lukk nettleser
    await PUP.closeBrowser();
    
    return validatedData;
  } catch (error) {
    console.error('Feil under datainnsamling:', error);
    throw error;
  }
}

// Bruk
const data = await collectIntrumData('01010199999');
console.log(`Hentet ${data.debtCases.length} saker`);
```

### Vis data i UI

```javascript
import { readAllDebtData } from './json_reader.mjs';
import { DOM } from './dom.mjs';

async function displayAllDebts() {
  DOM.showLoading(true);
  
  try {
    const debts = await readAllDebtData();
    const container = document.getElementById('debt-container');
    
    DOM.clearElement(container);
    
    debts.forEach(debt => {
      const element = DOM.createElement(
        'div',
        'debt-card',
        `${debt.creditSite}: ${debt.totalAmount} kr`
      );
      container.appendChild(element);
    });
  } catch (error) {
    console.error('Feil ved visning:', error);
  } finally {
    DOM.showLoading(false);
  }
}
```

## :material-arrow-right: Se også

- [Scraper API](scraper.md) - Puppeteer wrapper
- [Schema validering](schemas.md) - Zod skjemaer
- [Utilities](utilities.md) - Hjelpefunksjoner
- [Kreditor scrapers](creditor-scrapers.md) - Spesialiserte moduler
