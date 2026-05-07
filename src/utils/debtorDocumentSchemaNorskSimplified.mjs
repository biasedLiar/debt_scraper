/**
 * Inkassodokument-skjema (norsk)
 * Typedefinisjoner for a representere en komplett inkassooversikt
 * med alle saker og detaljer hentet ut fra PDF-dokumenter.
 */

/**
 * @typedef {Object} Inkassodokument
 * @property {DokumentMetadata} dokumentMetadata - Metadata om dokumentet
 * @property {Gjeldssak[]} saker - Array av individuelle gjeldssaker
 */

/**
 * @typedef {Object} DokumentMetadata
 * @property {string} kilde - Kilde for dokumentet (f.eks. "Kredinor", "Intrum", "PRA Group")
 * @property {string} dokumenttype - Type dokument (f.eks. "Inkassooversikt")
 * @property {string} uttrekkDato - dato/tid for når data ble hentet ut
 */

/**
 * @typedef {Object} Gjeldssak
 * @property {Saksidentifikatorer} identifikatorer - Saksidentifikasjon
 * @property {KravOgBetalinger} kravOgBetalinger - Krav og betalingsinformasjon
 * @property {Saksdatoer} datoer - Viktige datoer knyttet til saken
 * @property {SakParter} parter - Parter involvert i saken
 * @property {Saksdetaljer} detaljer - Ytterligere saksdetaljer
 */

/**
 * @typedef {Object} Saksidentifikatorer
 * @property {string} Saksnummer - Saksnummer (f.eks. "12345/23") hos inkassoselskapet
 */

/**
 * @typedef {Object} KravOgBetalinger
 * @property {Saksbelop} belop - Beløpsfordeling
 * @property {number | Innbetaling[]} betalt - Totalt betalt beløp
 */


/**
 * @typedef {Object} Saksbelop
 * @property {number} totalbelop - Totalt utestående beløp (Totalbeløp)
 */

/**
 * @typedef {Object} Innbetaling
 * @property {number} belop - Innbetalt beløp
 * @property {string} betalingsdato - Dato for innbetaling (format: DD.MM.YYYY)
 */

/**
 * @typedef {Object} SakParter
 * @property {string} inkassoselskap - Nåværende inkassoselskap som håndterer saken
 * @property {Skyldnerinfo} skyldner - Informasjon om skyldner
 */

/**
 * @typedef {Object} Skyldnerinfo
 * @property {string} navn - Skyldners fulle navn
 * @property {string} fodselsnummer - Fødselsnummer (kan være delvis maskert)
 */

/**
 * @typedef {Object} Saksdetaljer
 * @property {string} sakStatus - Nåværende status (f.eks. "Aktiv", "Avsluttet", "Betalt", "Avdragsordning")
 */











