# Endringslogg

Alle merkbare endringer til dette prosjektet vil bli dokumentert i denne filen.

Formatet er basert på [Keep a Changelog](https://keepachangelog.com/no/1.0.0/),
og dette prosjektet følger [Semantic Versioning](https://semver.org/lang/nb/).

## [Unreleased]

### Planlagt
- [ ] Støtte for flere kreditorer (PRA Group, tfBank, Digipost, Zolva)
- [ ] Eksport til CSV/Excel-format
- [ ] Multi-bruker støtte
- [ ] Historisk datavisualisering (grafer)
- [ ] Notifikasjoner for nye gjeldssaker
- [ ] Automatisk oppdatering ved oppstart

## [1.0.0] - 2026-01-14

### Lagt til
- ✨ Omfattende MkDocs-dokumentasjon
  - Installasjonsguide
  - Rask start-guide
  - Konfigurasjonsdokumentasjon
  - Arkitektur-dokumentasjon
  - API-referanse
  - FAQ
- 📝 Bidragsguider
- 🔒 Sikkerhetsdokumentasjon

### Endret
- 📦 Oppdatert README.md med bedre strukturering
- 🔧 Forbedret konfigurasjonsmuligheter

## [0.9.0] - 2025-12-20

### Lagt til
- ✅ Zod-validering for Intrum-data
  - `RawIntrumDebtCaseSchema` for lenient parsing
  - `IntrumDebtCaseSchema` for strict validation
  - Automatisk filtrering av ufullstendige saker
- 📊 PDF-parsing støtte (eksperimentell)
  - pdf-parse bibliotek
  - pdf2json for avansert parsing

### Endret
- 🔄 Refaktorert Intrum scraper med null-filtrering
- 📝 Oppdatert datastruktur-dokumentasjon med number-typer

### Fikset
- 🐛 Const redeclaration feil i intrum.mjs
- 🐛 Zod schema access pattern for transformerte arrays

## [0.8.0] - 2025-12-15

### Lagt til
- 🏦 Kredinor scraper implementasjon
- 🏛️ Statens Innkrevingssentral (SI) scraper
- 📄 Intrum detaljert saksvisning
- 💾 JSON eksport-funksjonalitet

### Endret
- 🎨 Forbedret UI for gjeldsvisning
- ⚡ Optimalisert data-lesing fra filsystem

## [0.7.0] - 2025-12-10

### Lagt til
- 🤖 Intrum scraper med BankID-støtte
- 🔐 Automatisk fødselsnummer-utfylling
- 📊 Gjeldsoversikt-visualisering
- 🗂️ Strukturert JSON-lagring

### Fikset
- 🐛 Puppeteer timeout-problemer
- 🐛 BankID redirect-håndtering

## [0.6.0] - 2025-11-28

### Lagt til
- 🎯 Puppeteer-integrering
- 🌐 Automatisk nettleserautomatisering
- 📁 Mappestruktur for data-eksport

## [0.5.0] - 2025-11-15

### Lagt til
- 🖥️ Electron app-struktur
- 🎨 Grunnleggende UI med kreditorknapper
- 📝 Konfigurasjon av nettsteder i data.mjs

## [0.4.0] - 2025-11-01

### Lagt til
- 🔧 Prosjektoppsett
- 📦 Package.json med avhengigheter
- 📄 Grunnleggende README

## Typer endringer

- **Lagt til** - for nye funksjoner
- **Endret** - for endringer i eksisterende funksjonalitet
- **Deprecated** - for funksjoner som snart fjernes
- **Fjernet** - for funksjoner som er fjernet
- **Fikset** - for feilrettinger
- **Sikkerhet** - for sikkerhetsforbedringer

---

[Unreleased]: https://github.com/biasedLiar/debt_scraper/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v1.0.0
[0.9.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.9.0
[0.8.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.8.0
[0.7.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.7.0
[0.6.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.6.0
[0.5.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.5.0
[0.4.0]: https://github.com/biasedLiar/debt_scraper/releases/tag/v0.4.0
