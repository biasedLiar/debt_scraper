# Rask start

Denne guiden tar deg gjennom de grunnleggende stegene for å komme i gang med Gjeld i Norge.

## :material-rocket: Start applikasjonen

Hvis du ikke allerede har installert applikasjonen, se [installasjonsguiden](installation.md).

```bash
npm start
```

Applikasjonsvinduet vil åpne seg med tittelen "Min Økonomihjelper".

## :material-view-dashboard: Brukergrensesnitt

Hovedvinduet består av:

- **Kreditorknapper** - Velg hvilken kreditor du vil sjekke
- **Datavisningsområde** - Viser innsamlet gjeldsinformasjon
- **Totaloversikt** - Summert gjeldsbeløp
- **Kontrollpanel** - Innstillinger og alternativer

## :material-step-forward: Steg-for-steg

### 1. Velg kreditor

Klikk på en av kreditorknappene for å starte datainnsamling:

- **Statens Innkrevingssentral (SI)**
- **Intrum**
- **Kredinor**
- **PRA Group**
- **tfBank**
- **Digipost**

!!! tip "Start enkelt"
    Vi anbefaler å begynne med **Statens Innkrevingssentral** da dette er en offentlig tjeneste som de fleste har tilgang til.

### 2. Automatisert nettleser åpnes

Når du klikker på en kreditorknapp:

1. Et nytt Chrome-vindu åpnes automatisk
2. Applikasjonen navigerer til kreditorens innloggingsside
3. Fødselsnummer fylles ut automatisk (hvis konfigurert)

!!! info "Puppeteer-vindu"
    Nettleservinduet som åpnes er kontrollert av Puppeteer. Ikke lukk dette vinduet manuelt - la applikasjonen håndtere det.

### 3. Autentiser med BankID

Følg normal BankID-påloggingsprosess:

1. BankID-siden lastes
2. Bekreft identitet i BankID-app på mobil/tablet
3. Vent på videresending til kreditorens side

!!! warning "Viktig"
    Applikasjonen kan **ikke** og vil **aldri** logge inn med BankID automatisk. Du må selv godkjenne påloggingen.

### 4. Datainnsamling

Etter vellykket pålogging:

1. Applikasjonen navigerer gjennom kreditorens sider
2. Gjeldsinformasjon ekstraheres automatisk
3. Data valideres med Zod-skjemaer
4. Informasjon lagres som JSON-filer

!!! success "Automatisk prosess"
    Du trenger ikke gjøre noe under denne fasen. Applikasjonen håndterer alt automatisk.

### 5. Se resultatene

Når datainnsamlingen er ferdig:

- **Nettleservinduet lukkes** automatisk
- **Data vises** i hovedapplikasjonsvinduet
- **JSON-filer lagres** i `exports/[fødselsnummer]/[dato]/[kreditor]/`

## :material-file-eye: Forstå dataene

### Visualisering i applikasjonen

Innsamlet data vises strukturert:

```
📊 Statens Innkrevingssentral
   Total: 25 000 kr
   
   Sak: 2024-12345
   └─ Beløp: 15 000 kr
   └─ Kreditor: NAV
   
   Sak: 2024-67890
   └─ Beløp: 10 000 kr
   └─ Kreditor: Skatteetaten
```

### JSON-filstruktur

Eksporterte filer er organisert slik:

```
exports/
└── 01010199999/              # Ditt fødselsnummer
    └── 2026_01_14/           # Dagens dato
        ├── Intrum/
        │   ├── manualDebts.json
        │   └── detaljer_på_sak/
        │       └── data.json
        ├── Kredinor/
        │   └── min_side_-_kredinor/
        │       └── data.json
        └── SI/
            └── mine_krav_-_statens_innkrevingssentral/
                └── data.json
```

## :material-cog-outline: Grunnleggende innstillinger

### Offline-modus

For å teste med tidligere innsamlede data:

1. Åpne `src/renderer.mjs`
2. Sett `offlineMode = true`
3. Start applikasjonen på nytt

```javascript
// I renderer.mjs
const offlineMode = true; // Aktiver offline-modus
```

### Vis betalte gjeld

For å inkludere allerede betalte gjeld i oversikten:

```javascript
// I renderer.mjs
const showPaidDebts = true; // Vis også betalt gjeld
```

### Lukk utviklerverktøy

Hvis du ikke ønsker DevTools åpent:

1. Åpne `src/main.mjs`
2. Kommenter ut linjen:

```javascript
// mainWindow.webContents.openDevTools();
```

## :material-repeat: Kjør datainnsamling igjen

For å oppdatere informasjon fra en kreditor:

1. Klikk på kreditorknappen igjen
2. Data vil lagres i en ny mappe med dagens dato
3. Tidligere data blir bevart

!!! tip "Historisk data"
    Applikasjonen lagrer hver datainnsamling med tidsstempel, så du kan spore endringer over tid.

## :material-export: Eksporter data

All data lagres automatisk som JSON-filer. For å bruke dataene:

### Åpne i teksteditor

```bash
# Naviger til eksportmappen
cd exports/[ditt_fødselsnummer]/[dato]/[kreditor]/

# Åpne JSON-fil
code data.json  # VS Code
# eller
cat data.json   # Les i terminal
```

### Parse med JavaScript

```javascript
import fs from 'fs';

const data = JSON.parse(
  fs.readFileSync('exports/.../data.json', 'utf-8')
);

console.log(data.debtCases);
```

## :material-frequently-asked-questions: Vanlige spørsmål

??? question "Hvor lenge tar datainnsamlingen?"
    Typisk 30-60 sekunder per kreditor, avhengig av:
    
    - Nettverkshastiget
    - Antall gjeldssaker
    - BankID-autentiseringstid

??? question "Kan jeg kjøre flere kreditorer samtidig?"
    Nei, applikasjonen kjører én kreditor om gangen for å unngå konflikter. Vent til gjeldende prosess er ferdig.

??? question "Hva skjer hvis noe feiler?"
    - Nettleservinduet vil forbli åpent for debugging
    - Feilmeldinger vises i konsollen
    - Delvis innsamlet data kan være lagret
    - Du kan prøve på nytt ved å klikke kreditorknappen igjen

??? question "Må jeg logge inn hver gang?"
    Ja, av sikkerhetsgrunner må du autentisere med BankID hver gang applikasjonen samler inn data.

??? question "Kan jeg bruke applikasjonen uten internett?"
    Nei, ikke for ny datainnsamling. Men du kan bruke [offline-modus](#offline-modus) for å se tidligere innsamlet data.

## :material-alert-circle: Viktige sikkerhetsmerknader

!!! warning "Sensitive data"
    - Applikasjonen lagrer **fødselsnummer** og **gjeldsdetaljer**
    - Del **aldri** `exports/`-mappen med andre
    - Legg til `exports/` i `.gitignore` hvis du bruker Git
    - Krypter harddisken for ekstra sikkerhet

!!! danger "BankID-sikkerhet"
    - Applikasjonen har **ikke** tilgang til BankID-legitimasjonen din
    - Godkjenn kun pålogginger du selv initierer
    - Lukk applikasjonen når den ikke er i bruk

## :material-arrow-right: Neste steg

Nå som du har kommet i gang:

- [Brukerguide](../user-guide/overview.md) - Dypere forklaring av funksjoner
- [Datainnsamling](../user-guide/data-collection.md) - Forstå hvordan data samles inn
- [Konfigurasjon](configuration.md) - Tilpass applikasjonen til dine behov
- [Sikkerhet](../security/privacy.md) - Lær om personvern og datasikkerhet

## :material-help-circle: Trenger hjelp?

- [FAQ](../faq.md) - Ofte stilte spørsmål
- [Feilsøking](../developer-guide/debugging.md) - Løs vanlige problemer
- [GitHub Issues](https://github.com/biasedLiar/debt_scraper/issues) - Rapporter problemer
