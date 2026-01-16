# Installasjon

Denne guiden vil hjelpe deg med å installere og sette opp Gjeld i Norge på din maskin.

## :material-check-all: Forutsetninger

Før du begynner, sørg for at du har følgende installert:

### Node.js og npm

Applikasjonen krever Node.js versjon 18 eller nyere.

=== "Windows"

    1. Last ned Node.js fra [nodejs.org](https://nodejs.org/)
    2. Kjør installasjonsprogrammet
    3. Verifiser installasjonen:
    ```powershell
    node --version
    npm --version
    ```

=== "macOS"

    **Med Homebrew:**
    ```bash
    brew install node
    ```
    
    **Eller last ned fra [nodejs.org](https://nodejs.org/)**
    
    Verifiser installasjonen:
    ```bash
    node --version
    npm --version
    ```

=== "Linux"

    **Ubuntu/Debian:**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
    
    **Fedora:**
    ```bash
    sudo dnf install nodejs
    ```
    
    Verifiser installasjonen:
    ```bash
    node --version
    npm --version
    ```

### Git

Git er nødvendig for å klone repositoriet.

=== "Windows"

    Last ned fra [git-scm.com](https://git-scm.com/download/win)

=== "macOS"

    ```bash
    brew install git
    ```

=== "Linux"

    ```bash
    # Ubuntu/Debian
    sudo apt-get install git
    
    # Fedora
    sudo dnf install git
    ```

## :material-download: Installasjon

### 1. Klon repositoriet

```bash
git clone https://github.com/biasedLiar/debt_scraper.git
cd debt_scraper
```

Eller last ned som ZIP:

1. Gå til [repository-siden](https://github.com/biasedLiar/debt_scraper)
2. Klikk på "Code" → "Download ZIP"
3. Pakk ut ZIP-filen
4. Naviger til mappen i terminalen

### 2. Installer avhengigheter

```bash
npm install
```

Dette vil installere alle nødvendige pakker:

- **Electron** - Desktop applikasjonsramme
- **Puppeteer** - Nettleserautomatisering
- **Zod** - Skjemavalidering
- **pdf-parse** - PDF-parsing (for dokumentbehandling)

!!! info "Installasjonstid"
    Første gang kan installasjonen ta 3-5 minutter da Puppeteer laster ned Chromium.

### 3. Verifiser installasjonen

Sjekk at alle avhengigheter er installert korrekt:

```bash
npm list --depth=0
```

Du skal se noe lignende:

```
debt_scraper@1.0.0
├── electron@39.1.1
├── pdf-parse@2.4.5
├── puppeteer@24.29.1
└── zod@4.1.12
```

## :material-rocket: Kjør applikasjonen

Start applikasjonen med:

```bash
npm start
```

Første oppstart vil:

1. Åpne Electron-applikasjonsvinduet
2. Åpne utviklerverktøy (DevTools)
3. Vise hovedgrensesnittet

!!! success "Vellykket installasjon"
    Hvis applikasjonsvinduet åpnes med tittelen "Min Økonomihjelper", er installasjonen vellykket!

## :material-cog: Konfigurasjon

### Første gangs oppsett

Når applikasjonen starter første gang, trenger du å:

1. **Velg kreditor** - Klikk på en av kreditorknappene
2. **Logg inn** - Bruk BankID for autentisering
3. **Vent på datainnsamling** - Applikasjonen vil automatisk samle inn data

### Mappestruktur

Etter første kjøring vil følgende mapper opprettes:

```
gjeld-i-norge/
├── exports/                    # Lagrede data
│   └── [fødselsnummer]/       # Dine data
│       └── [dato]/            # Organisert etter dato
│           ├── Intrum/
│           ├── Kredinor/
│           └── SI/
```

!!! warning "Personvern"
    `exports/`-mappen inneholder sensitive personopplysninger. Legg denne til `.gitignore` og del den aldri.

## :material-alert: Feilsøking

### Problem: "node: command not found"

**Løsning:** Node.js er ikke installert eller ikke i PATH.

```bash
# Verifiser at Node.js er installert
node --version
```

Hvis ikke installert, følg [Node.js installasjonsguiden](#nodejs-og-npm) ovenfor.

### Problem: "npm ERR! code EACCES"

**Løsning:** Tillatelsesproblem. På Linux/macOS:

```bash
sudo chown -R $(whoami) ~/.npm
```

### Problem: Puppeteer feiler under installasjon

**Løsning:** Installer manuelt med miljøvariabler:

```bash
# Skip Chromium download hvis du har Chrome installert
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
```

Eller spesifiser eksekverbar Chrome-sti i koden (se [Konfigurasjon](configuration.md)).

### Problem: Electron starter ikke

**Løsning:** Prøv å reinstallere Electron:

```bash
npm uninstall electron
npm install electron --save-dev
```

### Problem: "Error: Cannot find module"

**Løsning:** Reinstaller avhengigheter:

```bash
rm -rf node_modules package-lock.json
npm install
```

## :material-update: Oppdatering

For å oppdatere til nyeste versjon:

```bash
# Hent siste endringer
git pull origin main

# Oppdater avhengigheter
npm install
```

!!! tip "Hold deg oppdatert"
    Abonner på [GitHub releases](https://github.com/biasedLiar/debt_scraper/releases) for å få varsler om nye versjoner.

## :material-folder-cog: Avanserte installasjonsalternativer

### Installer fra spesifikk versjon

```bash
git clone --branch v1.0.0 https://github.com/biasedLiar/debt_scraper.git
```

### Utviklermodus

For å jobbe med kildekoden:

```bash
# Installer dev-avhengigheter
npm install --include=dev

# Installer Prettier for kodeformatering
npm install --save-dev prettier
```

### Bruk alternativ Chrome/Chromium

Rediger `src/scraper.mjs` for å bruke eksisterende Chrome:

```javascript
const browser = await LIBS.puppeteer.launch({
  headless: false,
  executablePath: '/path/to/chrome', // Din Chrome-sti
  args: ["--no-sandbox"],
  defaultViewport: null,
});
```

## :material-help-circle: Trenger hjelp?

Hvis du støter på problemer:

1. Sjekk [FAQ](../faq.md)
2. Søk i [eksisterende issues](https://github.com/biasedLiar/debt_scraper/issues)
3. [Opprett et nytt issue](https://github.com/biasedLiar/debt_scraper/issues/new)

## :material-arrow-right: Neste steg

Nå som installasjonen er ferdig:

- [Rask start guide](quickstart.md) - Lær de grunnleggende funksjonene
- [Konfigurasjon](configuration.md) - Tilpass applikasjonen
- [Brukerguide](../user-guide/overview.md) - Detaljert brukerveiledning
