const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
import { StructuredDebtDocumentSchema } from '../utils/schemas.mjs';

// Configuration
const DEBUG_LOGGING = process.env.DEBUG_PDF_EXTRACTION === 'true';
const FALLBACK_WORKER_PATH = '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs';

// Regex patterns as constants
const REGEX_PATTERNS = {
  totalbeløp: /Totalbeløp\s*:?\s*([\d\s]+,\d{2})/i,
  saksnummer: /(\d{5,}\/\d{2})/g,
  norwegianDate: /\d{2}\.\d{2}\.\d{4}/g,
  restHovedstol: /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i,
  renter: /Renter\s*:?\s*([\d\s]+,\d{2})/i,
  gebyrer: /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i,
  inkasso: /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i,
  renterAvOmkostninger: /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i,
  oppdragsgiver: /Oppdragsgiver[:\s]+([A-Za-zÆØÅæøå0-9\s\-\.]+?)(?=\s*(?:Opprinnelig\s+oppdragsgiver|Kundenummer|Saksnummer|Avsluttet|Innbetalt|Utestående|Referanse\s+til|Fakturadato|\d{8,}|$))/i,
  opprinneligOppdragsgiver: /Opprinnelig\s+oppdragsgiver[:\s]+(.+?)(?=\s*(?:Kundenummer|Referanse\s+til|Fakturadato|Forfallsdato|\d{8,}|$))/i,
  kundenummer: /Kundenummer[:\s]+(\S+)/i,
  referanse: /Referanse\s+til\s+oppdragsgiver[:\s]+(\S+)/i,
  fakturanummer: /Fakturanummer[:\s]*(\S+)/gi,
};

// Date array indices for fallback case
const DATE_INDICES = {
  utstedetDato: 3, // Fourth date in array (0-indexed)
  forfallsDato: 4,  // Fifth date in array (0-indexed)
};

// Set worker path for Node.js/Electron environment - use require.resolve for cross-system compatibility
try {
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
} catch (e) {
  // Fallback if resolve doesn't work
  pdfjs.GlobalWorkerOptions.workerSrc = path.join(__dirname, FALLBACK_WORKER_PATH);
}

/**
 * Finds the page containing Totalbeløp and extracts its value
 * @param {Object} doc - PDF document object
 * @returns {Promise<{pageNum: number, pageText: string, totalValue: number}>}
 */
async function findTotalbeløpPage(doc) {
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ').replace(/\u00A0/g, ' ');
    
    const totalValue = findFirstValue(pageText, REGEX_PATTERNS.totalbeløp);
    if (totalValue !== null) {
      if (DEBUG_LOGGING) {
        console.log(`Found Totalbeløp on page ${i}:`, totalValue);
      }
      return { pageNum: i, pageText, totalValue };
    }
  }
  
  throw new Error(`Could not find Totalbeløp field in PDF (searched ${doc.numPages} pages)`);
}

/**
 * Extracts text from pages after the totalbeløp page
 * @param {Object} doc - PDF document object
 * @param {number} startPage - Page number to start from
 * @returns {Promise<string>}
 */
async function extractCasesText(doc, startPage) {
  let casesText = '';
  for (let i = startPage + 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    casesText += pageText + '\n';
  }
  
  // Normalize whitespace
  return casesText.replace(/\u00A0/g, ' ');
}

/**
 * Extracts dates from the "Grunnlaget for saken" section
 * @param {string} caseText - Text for a specific case
 * @returns {{fakturadato: string|null, forfallsdato: string|null}}
 */
function extractDatesFromCase(caseText) {
  let fakturadato = null;
  let forfallsdato = null;
  
  const grunnlagIdx = caseText.indexOf("Grunnlaget for saken");
  if (grunnlagIdx !== -1) {
    const afterGrunnlag = caseText.substring(grunnlagIdx + "Grunnlaget for saken".length);
    const dateMatches = afterGrunnlag.match(REGEX_PATTERNS.norwegianDate);
    if (dateMatches && dateMatches.length >= 2) {
      fakturadato = dateMatches[0]; // First date after "Grunnlaget for saken"
      forfallsdato = dateMatches[1]; // Second date
    }
  }
  
  return { fakturadato, forfallsdato };
}

/**
 * Extracts invoices from the "Grunnlaget for saken" section
 * @param {string} caseText - Text for a specific case
 * @returns {Array<Object>} Array of invoice objects
 */
function extractInvoicesFromCase(caseText) {
  const invoices = [];
  
  const grunnlagIdx = caseText.indexOf("Grunnlaget for saken");
  if (grunnlagIdx === -1) {
    return invoices;
  }
  
  // Extract the section after "Grunnlaget for saken"
  const afterGrunnlag = caseText.substring(grunnlagIdx + "Grunnlaget for saken".length);
  
  // Look for "Referanse til saken" section within "Grunnlaget for saken"
  const referanseIdx = afterGrunnlag.indexOf("Referanse til saken");
  let searchText = afterGrunnlag;
  
  if (referanseIdx !== -1) {
    searchText = afterGrunnlag.substring(referanseIdx);
    if (DEBUG_LOGGING) {
      console.log('Found "Referanse til saken" section');
    }
  }
  
  // Find all dates in this section
  const dateMatches = [...searchText.matchAll(REGEX_PATTERNS.norwegianDate)];
  
  if (DEBUG_LOGGING) {
    console.log(`Found ${dateMatches.length} dates in section`);
  }
  
  // Process dates in pairs (invoice date + due date)
  for (let i = 0; i < dateMatches.length; i += 2) {
    if (i + 1 < dateMatches.length) {
      const invoiceDate = dateMatches[i][0];
      const dueDate = dateMatches[i + 1][0];
      
      // Extract invoice number: look backwards from the invoice date
      // It should be the field immediately before "Fakturadato"
      const textBeforeInvoiceDate = searchText.substring(0, dateMatches[i].index);
      
      // Look for a sequence of digits or alphanumeric characters before the date
      // Common patterns: just numbers, or alphanumeric with dashes/underscores
      const invoiceNumberMatch = textBeforeInvoiceDate.match(/(\S+)\s*Fakturadato\s*$/i);
      const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1].trim() : null;
      
      // Alternative: look for any non-whitespace sequence right before the date
      const altMatch = textBeforeInvoiceDate.match(/(\S+)\s*$/);
      const altInvoiceNumber = invoiceNumberMatch ? null : (altMatch ? altMatch[1].trim() : null);
      
      const finalInvoiceNumber = invoiceNumber || altInvoiceNumber;
      
      // Try to find amount AFTER the second date (dueDate)
      // Amount comes after "Forfallsdato" + date
      const contextStart = dateMatches[i + 1].index + dateMatches[i + 1][0].length;
      const contextEnd = Math.min(searchText.length, contextStart + 200);
      const context = searchText.substring(contextStart, contextEnd);
      
      // Match currency amounts: must have comma (not period) for decimal separator
      // Must be at least 3 digits total to avoid matching small numbers
      // Exclude anything that looks like it's followed by year digits
      const amountMatches = [...context.matchAll(/(\d[\d\s]{0,10},\d{2})(?!\.\d{4}|\d)/g)];
      
      // Take the first amount found after the due date
      let amount = null;
      if (amountMatches.length > 0) {
        const firstMatch = amountMatches[0];
        const parsedAmount = parseFloat(firstMatch[1].replace(/\s/g, "").replace(",", "."));
        // Sanity check: invoice amounts should be > 0 and < 1 billion
        if (parsedAmount > 0 && parsedAmount < 1000000000) {
          amount = parsedAmount;
        }
      }
      
      if (DEBUG_LOGGING && finalInvoiceNumber) {
        console.log(`Found invoice: ${finalInvoiceNumber} | ${invoiceDate} | ${dueDate}`);
      }
      
      invoices.push({
        invoiceNumber: finalInvoiceNumber || undefined,
        invoiceDate,
        dueDate,
        amount: amount || undefined,
      });
    }
  }
  
  return invoices;
}

/**
 * Extracts financial fields from case text
 * @param {string} caseText - Text for a specific case
 * @returns {Object} Financial fields object
 */
function extractFinancialFields(caseText) {
  return {
    restHovedstol: findFirstValue(caseText, REGEX_PATTERNS.restHovedstol),
    renter: findFirstValue(caseText, REGEX_PATTERNS.renter),
    gebyrer: findFirstValue(caseText, REGEX_PATTERNS.gebyrer),
    inkasso: findFirstValue(caseText, REGEX_PATTERNS.inkasso),
    renterAvOmkostninger: findFirstValue(caseText, REGEX_PATTERNS.renterAvOmkostninger),
    totalbeløp: findFirstValue(caseText, REGEX_PATTERNS.totalbeløp),
  };
}

/**
 * Extracts creditor information from case text
 * @param {string} caseText - Text for a specific case
 * @returns {{oppdragsgiver: string|null, opprinneligOppdragsgiver: string|null}}
 */
function extractCreditorInfo(caseText) {
  const oppdragsgiverMatch = caseText.match(REGEX_PATTERNS.oppdragsgiver);
  const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
  
  const opprinneligOppdragsgiverMatch = caseText.match(REGEX_PATTERNS.opprinneligOppdragsgiver);
  let opprinneligOppdragsgiver = opprinneligOppdragsgiverMatch ? opprinneligOppdragsgiverMatch[1].trim() : null;
  
  // Remove "Kundenummer" and anything after it if it's still in the text
  if (opprinneligOppdragsgiver) {
    opprinneligOppdragsgiver = opprinneligOppdragsgiver.replace(/\s*Kundenummer.*/i, '').trim();
  }
  
  return { oppdragsgiver, opprinneligOppdragsgiver };
}

/**
 * Extracts case identifiers from case text
 * @param {string} caseText - Text for a specific case
 * @returns {{kundenummer: string|null, referanse: string|null}}
 */
function extractCaseIdentifiers(caseText) {
  const kundenummerMatch = caseText.match(REGEX_PATTERNS.kundenummer);
  const kundenummer = kundenummerMatch ? kundenummerMatch[1].trim() : null;
  
  const referanseMatch = caseText.match(REGEX_PATTERNS.referanse);
  const referanse = referanseMatch ? referanseMatch[1].trim() : null;
  
  return { kundenummer, referanse };
}

/**
 * Detects debt collector from PDF text
 * @param {string} text - PDF text content
 * @returns {string} Debt collector name
 */
function detectDebtCollector(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('kredinor')) return 'Kredinor';
  if (lowerText.includes('intrum')) return 'Intrum';
  if (lowerText.includes('pra group')) return 'PRA Group';
  if (lowerText.includes('statens innkrevingssentral')) return 'SI';
  if (lowerText.includes('zolva')) return 'Zolva AS';
  
  return 'Unknown Debt Collector';
}

/**
 * Transforms raw case data to StructuredDebtDocumentSchema format
 * @param {Array<Object>} allCases - Array of extracted cases
 * @param {string} debtCollectorName - Name of the debt collector
 * @returns {Array<Object>} Array in DocumentCaseSchema format
 */
function transformToStructuredCases(allCases, debtCollectorName) {
  return allCases
    .filter(c => c.type !== 'grandTotal')
    .map(c => {
      // Calculate total amount for the case
      const totalAmount = c.totalbeløp || 0;
      const principalAmount = c.restHovedstol || 0;
      
      const caseData = {
        identifiers: {
          caseNumber: c.saksnummer || '',
          referenceNumber: c.referanse || undefined,
          customerNumber: c.kundenummer || undefined,
        },
        amounts: {
          totalAmount: totalAmount,
          principalAmount: principalAmount,
          interest: c.renter || undefined,
          fees: c.gebyrer || undefined,
          collectionFees: c.inkasso || undefined,
          interestOnCosts: c.renterAvOmkostninger || undefined,
        },
        dates: {
          invoiceDate: c.fakturadato || undefined,
          originalDueDate: c.forfallsdato || undefined,
          issuedDate: c.utstedetDato || undefined,
        },
        parties: {
          debtCollector: debtCollectorName,
          currentCreditor: c.oppdragsgiver || undefined,
          originalCreditor: c.opprinneligOppdragsgiver || undefined,
        },
      };
      
      // Add details if there are invoices
      if (c.invoices && c.invoices.length > 0) {
        caseData.details = {
          basisForClaim: 'Grunnlaget for saken',
          invoices: c.invoices,
        };
      }
      
      return caseData;
    });
}

/**
 * Main extraction function for structured debt documents
 * @param {string} pdfPath - Path to PDF file
 * @param {string} outputPath - Path for output JSON file
 * @param {Object} options - Extraction options
 * @param {string} [options.debtCollectorName] - Override debt collector name (auto-detected if not provided)
 * @param {string} [options.pdfLink] - Optional URL/link to the PDF
 */
export async function extractStructuredDebt(pdfPath, outputPath, options = {}) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    
    // Find the page with Totalbeløp
    const { pageNum: totalbeløpPageNum, pageText: totalbeløpPageText, totalValue: grandTotalMatch } = await findTotalbeløpPage(doc);
    
    // Detect debt collector if not provided
    const debtCollectorName = options.debtCollectorName || detectDebtCollector(totalbeløpPageText);
    
    if (DEBUG_LOGGING) {
      console.log(`Totalbeløp found on page ${totalbeløpPageNum}:`, grandTotalMatch);
      console.log(`Detected debt collector: ${debtCollectorName}`);
    }
    
    // Extract text from subsequent pages
    const casesText = await extractCasesText(doc, totalbeløpPageNum);
    
    if (DEBUG_LOGGING) {
      console.log(`CASES TEXT (from page ${totalbeløpPageNum + 1}+):`, casesText);
    }
    
    // Find all saksnummer occurrences
    const matches = [...casesText.matchAll(REGEX_PATTERNS.saksnummer)];
    
    if (DEBUG_LOGGING) {
      console.log('Found', matches.length, 'saksnummer');
    }
    
    // Start with the grand total as the first "case"
    const allCases = [{
      type: 'grandTotal',
      totalbeløp: grandTotalMatch
    }];
    
    // Process each case
    for (let i = 0; i < matches.length; i++) {
      const saksnummer = matches[i][1];
      const startPos = matches[i].index;
      
      // Extended endPos: handle multi-page invoices where headers repeat
      // Look for the next DIFFERENT saksnummer (same saksnummer may repeat on continuation pages)
      let endPos;
      let nextDifferentCaseIdx = -1;
      
      // Find the next case with a different saksnummer
      for (let j = i + 1; j < matches.length; j++) {
        const nextSaksnummer = matches[j][1];
        if (nextSaksnummer !== saksnummer) {
          nextDifferentCaseIdx = j;
          endPos = matches[j].index;
          break;
        }
      }
      
      // If no different saksnummer found, use end of text
      if (nextDifferentCaseIdx === -1) {
        endPos = casesText.length;
      }
      
      // Skip duplicate entries (when we've already processed this saksnummer)
      // by checking if we've moved past all occurrences of this number
      if (i > 0 && matches[i - 1][1] === saksnummer) {
        if (DEBUG_LOGGING) {
          console.log(`Skipping duplicate header for case: ${saksnummer}`);
        }
        continue;
      }
      
      const caseText = casesText.substring(startPos, endPos);
      
      if (DEBUG_LOGGING) {
        console.log(`\n--- Case ${i + 1}: ${saksnummer} ---`);
        console.log('Case text length:', caseText.length);
        console.log('Text includes repeated headers:', caseText.split(saksnummer).length - 1, 'occurrences');
      }
      
      const { fakturadato, forfallsdato } = extractDatesFromCase(caseText);
      const invoices = extractInvoicesFromCase(caseText);
      const fields = extractFinancialFields(caseText);
      const { oppdragsgiver, opprinneligOppdragsgiver } = extractCreditorInfo(caseText);
      const { kundenummer, referanse } = extractCaseIdentifiers(caseText);
      
      if (DEBUG_LOGGING) {
        console.log('Oppdragsgiver:', oppdragsgiver);
        console.log('Opprinnelig oppdragsgiver:', opprinneligOppdragsgiver);
        console.log('Fields:', fields);
        console.log('Invoices found:', invoices.length);
      }

      allCases.push({
        saksnummer,
        oppdragsgiver,
        opprinneligOppdragsgiver,
        kundenummer,
        referanse,
        fakturadato,
        forfallsdato,
        invoices,
        ...fields,
      });
    }
    
    // Fallback: If no saksnummer found on subsequent pages, extract from totalbeløp page
    if (allCases.length === 1 && totalbeløpPageNum === doc.numPages) {
      const dates = [...totalbeløpPageText.matchAll(REGEX_PATTERNS.norwegianDate)].map(m => m[0]);
      
      // Extract dates at specific indices (4th and 5th dates in the document)
      const utstedetDato = dates[DATE_INDICES.utstedetDato] || null;
      const forfallsDato = dates[DATE_INDICES.forfallsDato] || null;

      const fields = extractFinancialFields(totalbeløpPageText);
      const { oppdragsgiver, opprinneligOppdragsgiver } = extractCreditorInfo(totalbeløpPageText);
      const { kundenummer, referanse } = extractCaseIdentifiers(totalbeløpPageText);

      allCases.push({
        saksnummer: null,
        oppdragsgiver,
        opprinneligOppdragsgiver,
        kundenummer,
        referanse,
        utstedetDato,
        forfallsDato,
        ...fields,
      });
    }

    // Transform to structured format
    const structuredCases = transformToStructuredCases(allCases, debtCollectorName);

    // Build the structured document
    const structuredDocument = {
      documentMetadata: {
        source: debtCollectorName,
        documentType: 'Debt Collection Statement',
        extractionDate: new Date().toISOString(),
        pdfPath: path.resolve(pdfPath),
        pdfLink: options.pdfLink || undefined,
      },
      totalAmount: grandTotalMatch,
      numberOfCases: structuredCases.length,
      debtCollector: debtCollectorName,
      cases: structuredCases,
    };

    // Validate against StructuredDebtDocumentSchema
    const validationResult = StructuredDebtDocumentSchema.safeParse(structuredDocument);
    
    if (!validationResult.success) {
      console.warn('StructuredDebtDocumentSchema validation warning:', validationResult.error.errors);
      
      // Save unvalidated version for debugging
      const unvalidatedPath = outputPath.replace('.json', '_unvalidated.json');
      fs.writeFileSync(unvalidatedPath, JSON.stringify(structuredDocument, null, 2), 'utf-8');
      console.log(`Saved unvalidated data to ${unvalidatedPath}`);
      console.log(`- Debt Collector: ${debtCollectorName}`);
      console.log(`- Cases extracted: ${structuredCases.length}`);
      console.log(`- Total amount: ${grandTotalMatch.toFixed(2)} kr`);
      console.log(`- Validation: FAILED (see warnings above)`);
      
      return structuredDocument;
    }

    // Save the validated document
    fs.writeFileSync(outputPath, JSON.stringify(validationResult.data, null, 2), 'utf-8');
    
    console.log(`Results saved to ${outputPath}`);
    console.log(`- Debt Collector: ${debtCollectorName}`);
    console.log(`- Cases extracted: ${structuredCases.length}`);
    console.log(`- Total amount: ${grandTotalMatch.toFixed(2)} kr`);
    console.log(`- Validation: PASSED`);
    
    return validationResult.data;
  } catch (error) {
    console.error(`Error extracting PDF from "${pdfPath}":`, error.message);
    throw error;
  }
}

/**
 * Extracts and parses the first numeric value matching a regex pattern
 * Handles Norwegian number format (e.g., "4 481,63" -> 4481.63)
 * @param {string} text - Text to search
 * @param {RegExp} regex - Regular expression with a capture group for the number
 * @returns {number|null} Parsed number or null if not found
 */
function findFirstValue(text, regex) {
  const match = text.match(regex);
  return match
    ? parseFloat(match[1].replace(/\s/g, "").replace(",", "."))
    : null;
}
