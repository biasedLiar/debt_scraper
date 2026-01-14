# Gjeld i Norge - Gjeldsoversikt

<div align="center">

![License](https://img.shields.io/badge/license-CC0--1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Electron](https://img.shields.io/badge/electron-39.1.1-blue.svg)
![Puppeteer](https://img.shields.io/badge/puppeteer-24.29.1-green.svg)

**En Electron-basert skrivebordsapplikasjon som hjelper norske borgere med å få oversikt over sin gjeldssituasjon**

[Kom i gang](getting-started/installation.md){ .md-button .md-button--primary }
[Se kildekode](https://github.com/biasedLiar/debt_scraper){ .md-button }

</div>

---

## :material-information-outline: Om prosjektet

Gjeld i Norge er en desktop-applikasjon bygget for å hjelpe norske borgere med å få en komplett oversikt over sin gjeldssituasjon. Applikasjonen automatiserer datainnsamling fra ulike inkassobyråer og kreditorer, og presenterer informasjonen på en enkel og oversiktlig måte.

### :fontawesome-solid-star: Hovedfunksjoner

- **:material-robot: Automatisert innlogging** - Fødselsnummer blir tastet automatisk ved BankID-pålogging
- **:material-database-export: Dataeksport** - Lagrer all innsamlet data som JSON-filer organisert etter bruker og dato
- **:material-chart-line: Gjeldsvisualisering** - Viser totalt gjeldsbeløp og detaljert informasjon per kreditor
- **:material-shield-check: Datavalidering** - Bruker Zod-skjemaer for å sikre konsistent dataformat
- **:material-eye-off: Personvern** - All data lagres lokalt på din maskin

## :material-bank: Støttede kreditorer

| Kreditor | Status | Beskrivelse |
|----------|--------|-------------|
| **Statens Innkrevingssentral (SI)** | :material-check-circle:{ .green } Fullt støttet | Statlig innkrevingsbyrå |
| **Intrum** | :material-check-circle:{ .green } Fullt støttet | Inkassoselskap |
| **Kredinor** | :material-check-circle:{ .green } Fullt støttet | Inkassoselskap |
| **PRA Group** | :material-progress-clock:{ .orange } Under arbeid | Inkassoselskap |
| **tfBank** | :material-progress-clock:{ .orange } Under utvikling | Finansielle tjenester |
| **Digipost** | :material-progress-clock:{ .orange } Under utvikling | Digital postkasse |
| **Zolva AS** | :material-progress-clock:{ .orange } Under utvikling | Inkassoselskap |

[Se alle støttede kreditorer](creditors/supported.md){ .md-button }

## :rocket: Rask start

### Installasjon

```bash
# Klon repositoriet
git clone https://github.com/biasedLiar/debt_scraper.git
cd debt_scraper

# Installer avhengigheter
npm install

# Kjør applikasjonen
npm start
```

[Les full installasjonsguide](getting-started/installation.md)

### Krav

- **Node.js** (v18 eller nyere)
- **Git**
- **Windows/macOS/Linux**

## :material-code-braces: Teknologier

Dette prosjektet er bygget med moderne web-teknologier:

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop applikasjon
- **[Puppeteer](https://pptr.dev/)** - Headless Chrome for nettleserautomatisering
- **[Zod](https://zod.dev/)** - TypeScript-first schema validering
- **JavaScript ES Modules** - Moderne JavaScript modulsystem

## :material-file-tree: Prosjektstruktur

```
gjeld-i-norge/
├── src/
│   ├── main.mjs              # Electron hovedprosess
│   ├── renderer.mjs          # Hoved-UI-logikk
│   ├── scraper.mjs           # Puppeteer nettleserautomatisering
│   ├── data.mjs              # Konfigurasjon for nettsteder
│   ├── json_reader.mjs       # Parse og behandle JSON-data
│   ├── schemas.mjs           # Zod validerings-skjemaer
│   ├── utilities.mjs         # Hjelpefunksjoner
│   ├── dom.mjs               # UI-rendering hjelpeverktøy
│   ├── pages/                # Kreditor-spesifikke scrapers
│   │   ├── intrum.mjs
│   │   ├── kredinor.mjs
│   │   ├── statens-innkrevingssentral.mjs
│   │   ├── tfbank.mjs
│   │   └── ...
│   └── index.html            # Hovedapplikasjonsvindu
├── exports/                  # Innsamlede data (lokal lagring)
├── docs/                     # MkDocs dokumentasjon
└── package.json
```

[Utforsk arkitekturen](architecture/overview.md)

## :material-shield-lock: Sikkerhet og personvern

!!! warning "Viktig sikkerhetsinformasjon"
    Denne applikasjonen håndterer sensitive økonomiske data. 
    
    - :material-check: Data lagres **kun lokalt** på din maskin
    - :material-check: Ingen data sendes til eksterne servere
    - :material-alert: Ikke del eksporterte JSON-filer da de inneholder personlig informasjon
    - :material-alert: Sørg for at din maskin er sikret med passord

[Les mer om sikkerhet](security/privacy.md)

## :material-frequently-asked-questions: Ofte stilte spørsmål

??? question "Er applikasjonen sikker å bruke?"
    Ja. Applikasjonen lagrer all data lokalt på din maskin og sender ingen informasjon til eksterne servere. Du har full kontroll over dine data.

??? question "Hvorfor trenger applikasjonen BankID?"
    Kreditorene krever BankID for autentisering. Applikasjonen automatiserer kun datafylling, men du må selv godkjenne påloggingen via BankID-appen.

??? question "Kan jeg legge til flere kreditorer?"
    Ja! Prosjektet er åpent for bidrag. Se vår [guide for å legge til nye kreditorer](developer-guide/adding-creditor.md).

??? question "Hvilke data samles inn?"
    Applikasjonen samler kun inn gjeldsinformasjon som er synlig på kreditorens nettside etter pålogging. Dette inkluderer saksnummer, beløp, forfallsdatoer og kreditornavn.

[Se alle FAQ](faq.md)

## :material-hand-heart: Bidra

Vi ønsker bidrag velkommen! Her er noen måter du kan bidra på:

- :material-bug: [Rapporter feil](contributing/bug-reports.md)
- :material-lightbulb: Foreslå nye funksjoner
- :material-code-tags: Bidra med kode
- :material-file-document: Forbedre dokumentasjon
- :material-bank-plus: Legg til støtte for flere kreditorer

[Les bidragsretninglinjer](contributing/guidelines.md)

## :material-license: Lisens

Dette prosjektet er lisensiert under CC0-1.0 License - se [LICENSE.md](https://github.com/biasedLiar/debt_scraper/blob/main/LICENSE.md) for detaljer.

## :material-link-variant: Nyttige lenker

- [GitHub Repository](https://github.com/biasedLiar/debt_scraper)
- [Rapporter et problem](https://github.com/biasedLiar/debt_scraper/issues)
- [Diskusjonsforum](https://github.com/biasedLiar/debt_scraper/discussions)

---

<div align="center">

**Laget med :material-heart: for det norske samfunnet**

[Kom i gang nå](getting-started/installation.md){ .md-button .md-button--primary }

</div>
