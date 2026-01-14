# Gjeld i Norge - Dokumentasjon

Dette er kildefilene for Gjeld i Norge sin MkDocs-dokumentasjon.

## Forhåndsvisning lokalt

### Installer MkDocs

```bash
pip install -r docs/requirements.txt
```

### Kjør utviklingsserver

```bash
mkdocs serve
```

Åpne http://localhost:8000 i nettleseren.

### Bygg statisk site

```bash
mkdocs build
```

Genererte filer vil være i `site/`-mappen.

## Dokumentasjonsstruktur

```
docs/
├── index.md                    # Hjemmeside
├── getting-started/            # Kom i gang
│   ├── installation.md
│   ├── quickstart.md
│   └── configuration.md
├── user-guide/                 # Brukerguide
├── architecture/               # Arkitektur
├── developer-guide/            # Utviklerguide
├── api/                        # API-referanse
├── creditors/                  # Kreditor-dokumentasjon
├── security/                   # Sikkerhet
├── contributing/               # Bidragsguider
├── faq.md                      # FAQ
└── changelog.md                # Endringslogg
```

## Skriving av dokumentasjon

### Markdown-utvidelser

Dokumentasjonen støtter:

- **Admonitions:** Meldingsbokser (!!! note, !!! warning, etc.)
- **Code highlighting:** Syntaksutheving for mange språk
- **Tabbed content:** Faner for plattform-spesifikk info
- **Mermaid diagrams:** Flytdiagrammer og sekvensdiagrammer
- **Icons & Emojis:** Material Design ikoner

### Eksempler

#### Admonitions

```markdown
!!! note "Viktig informasjon"
    Dette er en notis med viktig informasjon.

!!! warning "Advarsel"
    Pass på dette!

!!! tip "Tips"
    Her er et nyttig tips.
```

#### Code blocks

````markdown
```javascript
const example = "kode med syntaksutheving";
```
````

#### Tabbed content

```markdown
=== "Windows"
    Windows-spesifikk instruksjon

=== "macOS"
    macOS-spesifikk instruksjon

=== "Linux"
    Linux-spesifikk instruksjon
```

#### Ikoner

```markdown
:material-check: Suksess
:material-alert: Advarsel
:fontawesome-brands-github: GitHub
```

## Bidra til dokumentasjonen

1. Fork repositoriet
2. Rediger Markdown-filer i `docs/`
3. Test lokalt med `mkdocs serve`
4. Submit pull request

## Publisering

Dokumentasjonen kan publiseres til:

- **GitHub Pages:** `mkdocs gh-deploy`
- **ReadTheDocs:** Koble til GitHub-repo
- **Netlify/Vercel:** Deploy `site/`-mappen

## Ressurser

- [MkDocs dokumentasjon](https://www.mkdocs.org/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [PyMdown Extensions](https://facelessuser.github.io/pymdown-extensions/)
