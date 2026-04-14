/**
 * Debt Collection Document Schema
 * Type definitions for representing a complete debt collection statement
 * with all cases and details extracted from PDF documents.
 * Can be used for any debt collector (Kredinor, Intrum, etc.)
 */

/**
 * @typedef {Object} DocumentMetadata
 * @property {string} source - Source of the document (e.g., "Kredinor", "Intrum", "PRA Group")
 * @property {string} documentType - Type of document (e.g., "Debt Collection Statement")
 * @property {string} extractionDate - ISO 8601 datetime when data was extracted
 * @property {string} [pdfPath] - Optional path to source PDF file
 * @property {string} [pdfLink] - Optional URL or link to the PDF document
 * @property {string} [documentDate] - Date on the document if available
 */

/**
 * @typedef {Object} DebtSummary
 * @property {number} totalAmount - Grand total amount (Totalbeløp)
 * @property {number} numberOfCases - Total number of active debt cases
 * @property {string} debtCollector - Name of debt collector (e.g., "Kredinor", "Intrum", "PRA Group")
 */

/**
 * @typedef {Object} CaseIdentifiers
 * @property {string} caseNumber - Case number (Saksnummer, e.g., "12345/23")
 * @property {string} [referenceNumber] - Reference to original creditor (Referanse til oppdragsgiver)
 * @property {string} [customerNumber] - Customer number (Kundenummer)
 */

/**
 * @typedef {Object} CaseAmounts
 * @property {number} totalAmount - Total outstanding amount (Totalbeløp)
 * @property {number} principalAmount - Principal amount remaining (Rest hovedstol)
 * @property {number} [interest] - Interest charges (Renter)
 * @property {number} [fees] - Administrative fees (Gebyrer)
 * @property {number} [collectionFees] - Collection fees (Inkassosalær / Omkostninger)
 * @property {number} [interestOnCosts] - Interest on collection costs (Renter av omkostninger)
 */

/**
 * @typedef {Object} CaseDates
 * @property {string} [invoiceDate] - Original invoice date (Fakturadato, format: DD.MM.YYYY)
 * @property {string} [originalDueDate] - Original due date (Forfallsdato, format: DD.MM.YYYY)
 * @property {string} [issuedDate] - Date case was issued (Utstedet dato)
 * @property {string} [paymentDeadline] - Payment deadline (Betalingsfrist)
 */

/**
 * @typedef {Object} Address
 * @property {string} [street] - Street address
 * @property {string} [postalCode] - Postal code
 * @property {string} [city] - City name
 * @property {string} [country] - Country name
 */

/**
 * @typedef {Object} Invoice
 * @property {string} [invoiceNumber] - Invoice number (Fakturanummer)
 * @property {string} [invoiceDate] - Invoice date (Fakturadato, format: DD.MM.YYYY)
 * @property {string} [dueDate] - Due date (Forfallsdato, format: DD.MM.YYYY)
 * @property {number} [amount] - Invoice amount
 * @property {string} [description] - Description of the invoice
 */

/**
 * @typedef {Object} DebtorInfo
 * @property {string} [name] - Debtor's full name
 * @property {string} [nationalId] - National ID number (Fødselsnummer, may be partially redacted)
 * @property {Address} [address] - Debtor's address
 */

/**
 * @typedef {Object} CaseParties
 * @property {string} debtCollector - Current debt collector handling the case
 * @property {string} [currentCreditor] - Current creditor (Oppdragsgiver)
 * @property {string} [originalCreditor] - Original creditor (Opprinnelig oppdragsgiver)
 * @property {DebtorInfo} [debtor] - Information about the debtor
 */

/**
 * @typedef {Object} CaseDetails
 * @property {string} [caseStatus] - Current status of the case (e.g., "Active", "Closed", "Paid")
 * @property {string} [description] - Description or comment about the case
 * @property {string} [basisForClaim] - Basis for the claim (Grunnlaget for saken)
 * @property {Invoice[]} [invoices] - List of invoices under "Grunnlaget for saken"
 * @property {string} [claimType] - Type of claim (invoice, contract, loan, etc.)
 * @property {string} [notes] - Additional notes or comments
 */

/**
 * @typedef {Object} DebtCase
 * @property {CaseIdentifiers} identifiers - Case identification information
 * @property {CaseAmounts} amounts - Financial breakdown of the debt
 * @property {CaseDates} dates - Important dates related to the case
 * @property {CaseParties} parties - Parties involved in the debt case
 * @property {CaseDetails} [details] - Additional case details
 */

/**
 * @typedef {Object} DebtCollectionDocument
 * @property {DocumentMetadata} documentMetadata - Metadata about the document
 * @property {number} totalAmount - Grand total amount (Totalbeløp)
 * @property {number} numberOfCases - Total number of active debt cases
 * @property {string} debtCollector - Name of debt collector
 * @property {DebtCase[]} cases - Array of individual debt cases
 */
