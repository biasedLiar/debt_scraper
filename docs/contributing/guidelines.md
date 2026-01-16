# Bidragsretningslinjer

Takk for at du vurderer å bidra til Gjeld i Norge! 🎉

Vi ønsker alle typer bidrag velkommen - kode, dokumentasjon, bug-rapporter, funksjonsforslag, og mer.

## 📋 Innholdsfortegnelse

- [Atferdskodeks](#atferdskodeks)
- [Hvordan kan jeg bidra?](#hvordan-kan-jeg-bidra)
- [Utviklingsprosess](#utviklingsprosess)
- [Kodestandard](#kodestandard)
- [Commit-meldinger](#commit-meldinger)
- [Pull Requests](#pull-requests)

## 🤝 Atferdskodeks



## 🎯 Hvordan kan jeg bidra?

### Rapporter bugs

Bugs spores som [GitHub issues](https://github.com/biasedLiar/debt_scraper/issues).

**Før du rapporterer en bug:**

- Sjekk at den ikke allerede er rapportert
- Samle informasjon om problemet
- Test på nyeste versjon

**Når du rapporterer:**

- Bruk en klar og beskrivende tittel
- Beskriv nøyaktige steg for å reprodusere
- Gi spesifikke eksempler
- Beskriv forventet vs. faktisk oppførsel
- Inkluder skjermbilder hvis relevant
- Inkluder din miljøinformasjon (OS, Node-versjon, etc.)

[Se mal for bug-rapporter →](bug-reports.md)

### Foreslå funksjoner

Feature requests er også [GitHub issues](https://github.com/biasedLiar/debt_scraper/issues).

**Før du foreslår:**

- Sjekk om det allerede er foreslått
- Vurder om det passer prosjektets omfang

**Når du foreslår:**

- Bruk en klar tittel
- Gi detaljert beskrivelse av funksjonaliteten
- Forklar hvorfor dette ville være nyttig
- List eventuelle alternativer du har vurdert

### Bidra med kode

**Første gang?** Lett!

1. Se etter issues merket `good first issue`
2. Kommenter at du vil ta oppgaven
3. Les [Utviklerguiden](../developer-guide/setup.md)
4. Start koding!

**Erfaren?**

1. Finn issue merket `help wanted`
2. Eller foreslå din egen forbedring
3. Diskuter tilnærmingen i issue først (for større endringer)

## 🔧 Utviklingsprosess

### 1. Fork og klon

```bash
# Fork på GitHub, deretter:
git clone https://github.com/DIN-BRUKER/debt_scraper.git
cd debt_scraper
```

### 2. Sett opp miljø

```bash
# Installer avhengigheter
npm install

# Kjør applikasjonen
npm start
```

### 3. Opprett branch

```bash
# Opprett feature branch
git checkout -b feature/amazing-feature

# Eller bugfix branch
git checkout -b fix/bug-description
```

### 4. Gjør endringer

- Skriv kode
- Test grundig
- Følg kodestandard
- Dokumenter endringer

### 5. Test

```bash
# Kjør applikasjonen
npm start

# Test alle berørte funksjoner
# Test på din plattform (Windows/Mac/Linux)
```

### 6. Commit

```bash
git add .
git commit -m "feat: legg til støtte for ny kreditor"
```

### 7. Push og Pull Request

```bash
git push origin feature/amazing-feature
```

Gå til GitHub og opprett Pull Request.

## 📝 Kodestandard

### JavaScript-stil

Vi følger JavaScript Standard Style med noen tilpasninger:

**Generelt:**

```javascript
// ✅ Bruk const og let, ikke var
const immutable = "value";
let mutable = 0;

// ✅ Use async/await, ikke callbacks
async function fetchData() {
  const result = await api.call();
  return result;
}

// ✅ Bruk template literals
const message = `Hei ${name}!`;

// ✅ Bruk arrow functions for korte funksjoner
const double = (x) => x * 2;

// ✅ Destrukturering
const { name, age } = person;
```

**Formatering:**

```javascript
// ✅ 2 spaces for innrykk
function example() {
  if (condition) {
    doSomething();
  }
}

// ✅ Krøllparenteser på samme linje
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}

// ✅ Space rundt operatorer
const sum = a + b;
const result = condition ? yes : no;

// ✅ Semicolons
const value = 42;
```

**Navngivning:**

```javascript
// ✅ camelCase for variabler og funksjoner
const userName = "John";
function getUserData() {}

// ✅ PascalCase for classes og skjemaer
class UserManager {}
const UserSchema = z.object({});

// ✅ UPPER_CASE for konstanter
const API_URL = "https://api.example.com";
const MAX_RETRIES = 3;

// ✅ Beskrivende navn
// Dårlig:
const d = new Date();
function calc() {}

// Bra:
const currentDate = new Date();
function calculateTotalDebt() {}
```

### Prettier

Vi bruker Prettier for automatisk formattering:

```bash
# Formater alle filer
npm run format

# Sjekk formatering
npm run format:check
```

**Prettier-konfigurasjon (`.prettierrc`):**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### JSDoc-kommentarer

```javascript
/**
 * Henter gjeldsinformasjon fra kreditor
 * @param {string} creditorName - Navn på kreditor
 * @param {string} userId - Brukerens fødselsnummer
 * @returns {Promise<DebtCollection>} Gjeldsinformasjon
 * @throws {Error} Hvis scraping feiler
 */
async function fetchDebtData(creditorName, userId) {
  // Implementasjon...
}
```

### Filstruktur

```javascript
// 1. Imports
import { LIBS } from "./libs.mjs";
import { helperFunction } from "./utilities.mjs";

// 2. Konstanter
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// 3. Funksjoner
async function mainFunction() {
  // ...
}

function helperFunction() {
  // ...
}

// 4. Eksport
export { mainFunction, helperFunction };
```

## 📨 Commit-meldinger

Vi følger [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Typer

- `feat`: Ny funksjonalitet
- `fix`: Feilretting
- `docs`: Dokumentasjonsendringer
- `style`: Formatering, manglende semicolons, etc.
- `refactor`: Koderestrukturering uten funksjonell endring
- `perf`: Ytelsesforbed

ring
- `test`: Legge til eller rette tester
- `chore`: Vedlikeholdsoppgaver

### Eksempler

```bash
# Ny funksjonalitet
git commit -m "feat(kredinor): legg til PDF-parsing"

# Feilretting
git commit -m "fix(intrum): håndter tomme gjeldslister"

# Dokumentasjon
git commit -m "docs: oppdater installasjonsguide"

# Med body
git commit -m "feat(tfbank): legg til scraper

Implementerer grunnleggende scraping av tfBank-data.
Inkluderer BankID-autentisering og datavalidering.

Closes #42"
```

## 🔀 Pull Requests

### Sjekkliste

Før du sender inn PR:

- [ ] Koden følger prosjektets stilguide
- [ ] Endringer er testet på din plattform
- [ ] Dokumentasjon er oppdatert
- [ ] Commit-meldinger følger konvensjonen
- [ ] PR-tittel er beskrivende
- [ ] PR-beskrivelse forklarer endringene

### PR-mal

```markdown
## Beskrivelse
[Beskriv hva denne PR-en gjør]

## Relaterte issues
Fixes #123
Relates to #456

## Type endring
- [ ] Bug fix
- [ ] Ny funksjonalitet
- [ ] Breaking change
- [ ] Dokumentasjon

## Hvordan testes det?
[Beskriv steg for testing]

## Screenshots (hvis relevant)
[Legg til skjermbilder]

## Sjekkliste
- [ ] Koden er testet
- [ ] Dokumentasjon oppdatert
- [ ] Følger kodestandarder
```

### Review-prosess

1. **Automatiske sjekker:** Linting, formattering
2. **Code review:** Minst én godkjenning
3. **Testing:** Tester på flere plattformer
4. **Merge:** Etter godkjenning

### Etter merge

- Din kode blir del av neste release
- Du får credits i CHANGELOG.md
- Tusen takk for bidraget! 🎉

## 🏷️ Issue Labels

- `bug` - Noe fungerer ikke
- `enhancement` - Ny funksjon eller forbedring
- `documentation` - Dokumentasjonsendringer
- `good first issue` - Lett for nybegynnere
- `help wanted` - Trenger hjelp fra community
- `question` - Spørsmål om prosjektet
- `wontfix` - Vil ikke bli fikset
- `duplicate` - Duplikat issue
- `invalid` - Ikke relevant

## 📞 Kontakt

- **GitHub Issues:** [Opprett issue](https://github.com/biasedLiar/debt_scraper/issues)
- **Discussions:** [Diskusjonsforum](https://github.com/biasedLiar/debt_scraper/discussions)

## 🙏 Anerkjennelse

Alle bidragsytere blir anerkjent i:

- README.md Contributors-seksjon
- CHANGELOG.md for hver release
- GitHub Contributors-grafen

Takk for at du bidrar til å gjøre Gjeld i Norge bedre! 💙
