/**
 * Inkassodokument-skjema (norsk)
 * Typedefinisjoner for a representere en komplett inkassooversikt
 * med alle saker og detaljer hentet ut fra PDF-dokumenter.
 */

/**
 * @typedef {Object} Inkassodokument
 * @property {DokumentMetadata} dokumentMetadata - Metadata om dokumentet
 * @property {number} totalbelop - Totalt utestående beløp (Totalbeløp)
 * @property {number} antallSaker - Totalt antall aktive saker
 * @property {string} inkassoselskap - Navn på inkassoselskap
 * @property {Gjeldssak[]} saker - Array av individuelle gjeldssaker
 */

/**
 * @typedef {Object} DokumentMetadata
 * @property {string} kilde - Kilde for dokumentet (f.eks. "Kredinor", "Intrum", "PRA Group")
 * @property {string} dokumenttype - Type dokument (f.eks. "Inkassooversikt")
 * @property {string} uttrekkDato - dato/tid for når data ble hentet ut
 * @property {string} [pdfLenke] - Valgfri URL eller lenke til PDF-dokumentet
 * @property {string} [dokumentDato] - Dato på dokumentet hvis tilgjengelig
 */

/**
 * @typedef {Object} Gjeldssak
 * @property {Saksidentifikatorer} identifikatorer - Saksidentifikasjon
 * @property {Saksbelop} belop - Beløpsfordeling
 * @property {number} [rente] - Rente knyttet til saken
 * @property {Saksdatoer} datoer - Viktige datoer knyttet til saken
 * @property {SakParter} parter - Parter involvert i saken
 * @property {Saksdetaljer} detaljer - Ytterligere saksdetaljer
 */

/**
 * @typedef {Object} Saksidentifikatorer
 * @property {string} Saksnummer - Saksnummer (f.eks. "12345/23") hos inkassoselskapet
 * @property {string} [referansenummer] - Referansenummer fra oppdragsgiver
 * @property {string} [kundenummer] - Kundenummer
 */

/**
 * @typedef {Object} Saksbelop
 * @property {number} totalbelop - Totalt utestående beløp (Totalbeløp)
 * @property {number} [restHovedstol] - Rest hovedstol
 * @property {number} [opprinneligBelop] - Opprinnelig beløp
 * @property {Renter} [renter] - Renter
 * @property {Gebyrer} [gebyrer] - Gebyrer
 * @property {number} [inkassosalear] - Inkassosalær / omkostninger
 */

/**
 * @typedef {Object} Renter
 * @property {number} totalRente - Total rente
 * @property {number} [renterAvOpprinneligBelop] - Renter av opprinnelig beløp
 * @property {number} [renterAvOmkostninger] - Renter av omkostninger
 */

/**
 * @typedef {Object} Gebyrer
 * @property {number} totalGebyrer - Totale gebyrer
 * @property {number} [rettsligeGebyrer] - Rettslige gebyrer
 * @property {number} [andreGebyrer] - Andre gebyrer
 */

/**
 * @typedef {Object} Saksdatoer
 * @property {string} [fakturadato] - Fakturadato (format: DD.MM.YYYY)
 * @property {string} [opprinneligForfallsdato] - Opprinnelig forfallsdato (format: DD.MM.YYYY)
 * @property {string} [utstedtDato] - Utstedt dato
 * @property {string} [betalingsfrist] - Betalingsfrist
 * @property {string} [avslutningsdato] - Avslutningsdato for saken (format: DD.MM.YYYY)
 */

/**
 * @typedef {Object} SakParter
 * @property {string} inkassoselskap - Nåværende inkassoselskap som håndterer saken
 * @property {string} [Fordringshaver] - Nåværende fordringshaver / oppdragsgiver
 * @property {string} [opprinneligFordringshaver] - Opprinnelig fordringshaver
 * @property {string} [Saksbehandler] - Saksbehandler eller kontaktperson hos inkassoselskapet
 * @property {string} [skyldnerType] - Type skyldner (f.eks. "Hovedskyldner")
 * @property {Skyldnerinfo} [skyldner] - Informasjon om skyldner
 */

/**
 * @typedef {Object} Saksdetaljer
 * @property {string} sakStatus - Nåværende status (f.eks. "Aktiv", "Avsluttet", "Betalt", "Avdragsordning")
 * @property {string} [beskrivelse] - Beskrivelse eller kommentar til saken
 * @property {string} [grunnlagForKrav] - Grunnlaget for saken
 * @property {number} [totalBetalt] - Totalt betalt beløp
 * @property {string} [mottakerKonto] - Mottakers kontonummer for betaling
 * @property {string} [KID] - KID-nummer for betaling
 * @property {string} [kravtype] - Type krav (faktura, kontrakt, lån, osv.)
 * @property {string} [notater] - Tilleggsnotater eller kommentarer
 * @property {Rentebetalinger} [rentebetalinger] - Betalte renter for fjoråret
 * @property {Faktura[]} [sendteFakturaer] - Liste over fakturaer som er sendt
 * @property {Innbetaling[]} [innbetalinger] - Liste over innbetalinger som er registrert
 * @property {Aktivitet[]} [aktiviteter] - Liste over aktiviteter knyttet til saken
 */

/**
 * @typedef {Object} Aktivitet
 * @property {string} [registreringsdato] - Dato aktiviteten ble registrert (format: DD.MM.YYYY)
 * @property {string} [handling] - Beskrivelse av handlingen som ble utført
 * @property {number} [betalt] - Betalt beløp ved denne aktiviteten
 * @property {number} [gebyrer] - Gebyrer knyttet til denne aktiviteten
 * @property {number} [utestaendeHovedstol] - Utestående hovedstol etter aktiviteten
 * @property {number} [renter] - Renter knyttet til denne aktiviteten
 */

/**
 * @typedef {Object} Rentebetalinger 
 * @property {number} [betalteRenterOpprinneligBelop] - Betalte renter for fjoråret på opprinnelig beløp
 * @property {number} [betalteRenterOmkostninger] - Betalte renter for fjoråret på omkostninger
 * @property {number} [betalteRenterSkattemelding] - Betalte renter for fjoråret som man kan få skattemelding på
 * // OBS, det er uklart om det 3. feltet er summen av de første 2 eller ikke.
 */

/**
 * @typedef {Object} Skyldnerinfo
 * @property {string} [navn] - Skyldners fulle navn
 * @property {string} [fodselsnummer] - Fødselsnummer (kan være delvis maskert)
 * @property {string} [telefonnummer] - Telefonnummer til skyldner
 * @property {string} [epostadresse] - E-postadresse til skyldner
 * @property {Adresse} [adresse] - Skyldners adresse
 */

/**
 * @typedef {Object} Faktura
 * @property {number} belop - Fakturabeløp
 * @property {string} [fakturanummer] - Fakturanummer
 * @property {string} [fakturadato] - Fakturadato (format: DD.MM.YYYY)
 * @property {string} [forfallsdato] - Forfallsdato (format: DD.MM.YYYY)
 * @property {number} [restHovedstol] - Rest hovedstol på fakturaen
 * @property {number} [rentesaldo] - Rentesaldo på fakturaen
 * @property {string} [beskrivelse] - Beskrivelse av fakturaen
 */

/**
 * @typedef {Object} Innbetaling
 * @property {string} [betalingsdato] - Dato for innbetaling (format: DD.MM.YYYY)
 * @property {number} belop - Innbetalt beløp
 * @property {string} [referanse] - Referanse for innbetalingen
 * @property {string} [kommentar] - Valgfri kommentar
 */

/**
 * @typedef {Object} Adresse
 * @property {string} [gateadresse] - Gateadresse
 * @property {string} [postnummer] - Postnummer
 * @property {string} [poststed] - Poststed
 * @property {string} [land] - Land
 */
