# Gjeld i Norge - Gjeldsoversikt


En Electron-basert skrivebordsapplikasjon som hjelper norske borgere med å få oversikt over sin gjeldssituasjon ved å automatisere datainnsamling fra ulike inkassobyråer og kreditorer.

## Oversikt

Denne applikasjonen bruker Puppeteer til å automatisere nettleserinteraksjoner og samle inn gjeldsinformasjon fra flere norske kreditor- og inkassonettsteder. Tjenesten gir deg en enkel oppsummering av din innsamlede gjeld hos kreditorer i Norge. 


### Støttede Kreditorer

Applikasjonen støtter for øyeblikket følgende norske kreditor-/inkassotjenester (Dette er ikke en komplett liste, kun det som for øyeblikket er under utvikling):


- **Statens Innkrevingssentral (SI)** - Statlig innkrevingsbyrå
- **Intrum** - Inkassoselskap
- **Kredinor** - Inkassoselskap
- **PRA Group** - Under arbeid
- **Digipost** - Digital postkassetjeneste - Under utvikling
- **Zolva AS** - Inkassoselskap - Under utvikling

## Funksjoner

- **Automatisert Innlogging**: Fødselsnummer blir tastet automatisk for brukeren når en må logge inn med BankID
- **Dataeksport**: Lagrer all innsamlet data som JSON-filer organisert etter bruker og dato
- **Gjeldsvisualisering**: Viser totalt gjeldsbeløp og detaljert informasjon per kreditor

## Prosjektstruktur

```
src/
  ├── main.mjs              # Electron hovedprosess
  ├── renderer.mjs          # Hoved-UI-logikk
  ├── scraper.mjs           # Puppeteer nettleserautomatisering
  ├── data.mjs              # Konfigurasjon for nettsteder som blir besøkt av tjenesten
  ├── json_reader.mjs       # Parse og behandle innsamlede JSON-data
  ├── dom.mjs               # Hjelpeverktøy for UI-rendering
  ├── utilities.mjs         # Filoperasjoner og datahåndtering
  ├── pages/                # puppeteer-operasjoner spesialisert for hvert nettsted
  │   ├── intrum.mjs
  │   ├── kredinor.mjs
  │   ├── statens-innkrevingssentral.mjs
  │   └── ...
  └── index.html            # Hovedapplikasjonsvindu

exports/                    # Innsamlede data organisert etter bruker/dato/kreditor
```

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

1. **Bruker Starter Innlogging**: Bruker klikker på en kreditorknapp i brukergrensesnittet
2. **Nettleserautomatisering**: Applikasjonen åpner et automatisert nettleservindu via Puppeteer
3. **BankID-Autentisering**: Bruker fullfører innlogging med BankId
4. **Data-innsamling**: Applikasjonen finner data på nettstedet gjennom skraping
5. **Databehandling**: JSON-data blir parset og organisert etter kreditor
6. **Visualisering**: Gjeldsinformasjon vises i applikasjonens brukergrensesnitt






## Konfigurasjon

Konfigurasjonsalternativer i kildekoden:

- `showPaidDebts` (renderer.mjs): Veksle visning av betalt gjeld
- `offlineMode` (renderer.mjs): Aktiver testing med lagrede data
- Mål-nettsted-URL-er er definert i `data.mjs`

## Personvern og Sikkerhet

>  **Viktig**: Denne applikasjonen håndterer sensitive økonomiske data. 
> - Data lagres lokalt på din maskin
> - Ingen data sendes til eksterne servere
> - Ikke del eksporterte JSON-filer da de inneholder personlig informasjon

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
