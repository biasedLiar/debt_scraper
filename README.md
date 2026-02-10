# Gjeld i Norge - Gjeldsoversikt


En Electron-basert skrivebordsapplikasjon som hjelper norske borgere med å få oversikt over sin gjeldssituasjon ved å automatisere datainnsamling fra ulike inkassobyråer og kreditorer.

## Oversikt

Denne applikasjonen bruker Puppeteer til å automatisere nettleserinteraksjoner og samle inn gjeldsinformasjon fra flere norske kreditor- og inkassonettsteder. Tjenesten gir deg en enkel oppsummering av din innsamlede gjeld hos kreditorer i Norge. 


### Støttede Kreditorer

Applikasjonen støtter følgende norske kreditor-/inkassotjenester:

- **Statens Innkrevingssentral (SI)** - Statlig innkrevingsbyrå 
- **Intrum** - Inkassoselskap 
- **Kredinor** - Inkassoselskap 
- **PRA Group** - Inkassoselskap 
- **Zolva AS** - Inkassoselskap 
- **Digipost** - Digital postkassetjeneste 

## Funksjoner

- **Automatisert Innlogging**: Fødselsnummer blir tastet automatisk for brukeren når en må logge inn med BankID
- **Dataeksport**: Lagrer all innsamlet data som JSON-filer organisert etter bruker og dato
- **Gjeldsvisualisering**: Viser totalt gjeldsbeløp og detaljert informasjon per kreditor
- **Feilhåndtering**: Robust feilhåndtering med norske feilmeldinger og automatisk ressursopprydding
- **Modulær Arkitektur**: Organisert kodebase med klare ansvarsfordelinger
- **Data Validering**: Zod-skjemaer sikrer datakonsistens

## Prosjektstruktur

```
src/
  ├── main.mjs              # Electron hovedprosess
  ├── renderer.mjs          # Hoved-UI-logikk (modulær og forenklet)
  ├── index.html            # Hovedapplikasjonsvindu
  ├── styles.css            # Applikasjonsstyling
  │
  ├── pages/                # Sidespesifikk scraping-logikk per kreditor
  │   ├── bankid-login.mjs
  │   ├── digipost.mjs
  │   ├── intrum.mjs
  │   ├── kredinor.mjs
  │   ├── pra-group.mjs
  │   ├── statens-innkrevingssentral.mjs
  │   └── zolva-as.mjs
  │
  ├── services/             # Forretningslogikk og orkestrering
  │   ├── data.mjs          # Konfigurasjon for nettsteder
  │   ├── dataLoader.mjs    # Laste lagrede data
  │   ├── pageHandlerSetup.mjs  # Puppeteer event handlers
  │   ├── scraper.mjs       # Puppeteer nettleserautomatisering
  │   └── scrapingService.mjs   # Scraping workflow orkestrering
  │
  ├── ui/                   # UI-komponenter og tilstand
  │   ├── detailedDebtDisplay.mjs  # Detaljert gjeldsvisning
  │   ├── dom.mjs           # DOM-hjelpeverktøy
  │   ├── uiNotifications.mjs      # Feilmeldinger og varsler
  │   └── uiState.mjs       # Applikasjonstilstand
  │
  └── utils/                # Hjelpefunksjoner og validering
      ├── constants.mjs     # Globale konstanter
      ├── debtReader.mjs    # Les lagrede gjeldsdata
      ├── errorHandler.mjs  # Sentralisert feilhåndtering
      ├── fileOperations.mjs  # Filoperasjoner
      ├── formatters.mjs    # Dataformateringsfunksjoner
      ├── json_reader.mjs   # JSON-parsing og behandling
      ├── schemas.mjs       # Zod-valideringsskjemaer
      ├── utilities.mjs     # Generelle hjelpefunksjoner
      └── validation.mjs    # Input-validering

exports/                    # Innsamlede data organisert etter bruker/dato/kreditor
```

### Arkitektur

Applikasjonen følger en modulær arkitektur med klare ansvarsfordelinger:

- **Pages**: Kreditorspesifikk scraping-logikk
- **Services**: Forretningslogikk, datainnsamling og orkestrering
- **UI**: Brukergrensesnittkomponenter og tilstandshåndtering
- **Utils**: Gjenbrukbare hjelpefunksjoner og validering

## Installasjon

```bash
# Installer avhengigheter
npm install

# Kjør applikasjonen
npm start
```

### Krav

- Node.js (nyere versjon med støtte for ES-moduler)
- Git
- Windows/macOS/Linux

## Hvordan Det Fungerer

1. **Bruker Starter Innlogging**: Bruker klikker på en kreditorknapp eller "Start" for alle
2. **Validering**: Fødselsnummer valideres før start
3. **Nettleserautomatisering**: Puppeteer åpner et automatisert nettleservindu
4. **BankID-Autentisering**: Bruker fullfører innlogging med BankID på mobil/BankID-app
5. **Data-innsamling**: Applikasjonen finner og lagrer data fra nettstedet
6. **Validering & Lagring**: Data valideres med Zod og lagres som JSON i exports/-mappen
7. **Visualisering**: Gjeldsinformasjon vises umiddelbart i applikasjonens UI
8. **Ressursopprydding**: Nettleseren lukkes automatisk, selv ved feil

## Konfigurasjon

Konfigurasjon finnes i:

- **services/data.mjs**: Mål-nettsted-URL-er og konfigurasjon per kreditor
- **utils/constants.mjs**: Globale konstanter (timeouts, meldingsvarighet, etc.)
- **main.mjs**: Electron-vindu og sikkerhetsinnstillinger

## Personvern og Sikkerhet

> **Viktig**: Denne applikasjonen håndterer sensitive økonomiske data.
> - Data lagres lokalt på din maskin
> - Ingen data sendes til eksterne servere
> - Ikke del eksporterte JSON-filer da de inneholder personlig informasjon

### Sikkerhetsimplementering

- **webSecurity**: Aktivert for hovedvinduet
- **Navigasjonsbegrensninger**: Forhindrer navigering til eksterne nettsteder
- **Content Security Policy (CSP)**: Strenge retningslinjer for innlastede ressurser
- **Tillatelsesblokking**: Kamera, geolokasjon og varsler er blokkert
- **Feilhåndtering**: Robust håndtering for å unngå minnelekkasjer

Se [SECURITY.md](./exports/SECURITY.md) for detaljert trusselmodell.

## Feilhåndtering

Applikasjonen har robust feilhåndtering implementert:

- **Sentralisert Feilhåndtering**: Alle feil går gjennom `utils/errorHandler.mjs`
- **Norske Feilmeldinger**: Brukervennlige meldinger på norsk
- **Ressursopprydding**: Nettleser lukkes automatisk ved feil
- **Beskyttede Filoperasjoner**: Try-catch rundt alle fil I/O-operasjoner
- **Timeout-håndtering**: 5 minutters timeout for scraping-operasjoner
- **Visuell Feedback**: Knapper viser suksess (grønn) eller feil (rød) status

## Datavalidering

Applikasjonen bruker **Zod**-skjemaer for å sikre at alle lagrede data opprettholder et konsistent format:

- All manuelt innsamlet gjeldsdata valideres før lagring
- Ugyldig data lagres med et `_unvalidated`-suffiks for feilsøking
- Valideringsfeil logges med detaljert informasjon om hva som feilet
- Skjemaer er definert i [src/schemas.mjs](src/schemas.mjs)

### Validerte Dataformater

- **Intrum**: Manuelle gjeldssaker med saksnumre, beløp og kreditornavn
- **Kredinor**: Gjeldsbeløp, aktive saker og detaljerte gjeldslister
- Alle filer inkluderer ISO 8601-tidsstempler for sporing av når data ble samlet inn

## Utvikling

Applikasjonen er bygget med:

- **Electron** - Rammeverk for skrivebordsapplikasjoner
- **Puppeteer** - Nettleserautomatisering
- **Zod** - Skjemavalidering for datakonsistens og typesikkerhet
- **ES-moduler** - Moderne JavaScript-modulsystem

### Kodestruktur

- **Modulær design**: Koden er delt inn i pages/, services/, ui/, og utils/
- **Separasjon av bekymringer**: UI-logikk, forretningslogikk og hjelpefunksjoner er adskilt
- **Gjenbrukbar kode**: Fellesfunksjoner er ekstrahert til tjenester og utilities
- **Typesikkerhet**: JSDoc-kommentarer og Zod-skjemaer for validering

### Kjente Begrensninger

- **Digipost**: Leser meldinger merkes som lest under scraping
- **Kontaktbekreftelse**: Noen nettsteder ber om kontaktbekreftelse som kan avbryte automatisering
- **Sikkerhetsmodell**: Puppeteer kjører i renderer-prosessen (krever `nodeIntegration: true`)

---

## Feilsøking

### Scraping Feiler
- Kontroller at fødselsnummeret er korrekt (11 siffer)
- Sørg for at du har BankID-appen tilgjengelig for innlogging
- Lukk alle åpne nettlesere og prøv igjen

### Data Vises Ikke
- Sjekk at data ble lagret i `exports/` mappen
- Se i konsollen for valideringsfeil
- Kontroller at JSON-filene er gyldige

### Applikasjonen Krasjer
- Sørg for at Node.js er oppdatert
- Kjør `npm install` på nytt for å sikre at alle avhengigheter er installert
- Sjekk Electron-konsollen for detaljerte feilmeldinger

---

## Bidra

For å bidra til prosjektet:

1. Les [exports/ai_helper.md](exports/ai_helper.md) for oversikt over kjente problemer og forbedringer
2. Følg den modulære strukturen (pages/, services/, ui/, utils/)
3. Bruk JSDoc-kommentarer for alle funksjoner
4. Valider eksterne data med Zod-skjemaer
5. Håndter feil med `utils/errorHandler.mjs`
