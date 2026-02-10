const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
import { DebtSchema } from '../utils/schemas.mjs';

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
 * Transforms raw case data to DebtSchema format
 * @param {Array<Object>} allCases - Array of extracted cases
 * @returns {Array<Object>} Array in DebtSchema format
 */
function transformToDebtSchema(allCases) {
  return allCases
    .filter(c => c.type !== 'grandTotal')
    .map(c => {
      // Sum up interest and fines
      const interestAndFines = [
        c.renter,
        c.gebyrer,
        c.inkasso,
        c.renterAvOmkostninger
      ].filter(v => v !== null && v !== undefined)
       .reduce((sum, v) => sum + v, 0);

      // Parse forfallsdato to Date if available
      let originalDueDate = null;
      if (c.forfallsdato) {
        const [day, month, year] = c.forfallsdato.split('.');
        originalDueDate = new Date(`${year}-${month}-${day}`);
      }

      return {
        caseID: c.saksnummer || '',
        totalAmount: c.totalbeløp || 0,
        originalAmount: c.restHovedstol || 0,
        interestAndFines: interestAndFines || undefined,
        originalDueDate: originalDueDate,
        debtCollectorName: 'Kredinor',
        originalCreditorName: c.opprinneligOppdragsgiver || c.oppdragsgiver || '',
        debtType: undefined,
        comment: undefined,
      };
    });
}

/**
 * Main extraction function
 * @param {string} pdfPath - Path to PDF file
 * @param {string} outputPath - Path for output JSON file
 */
export async function extractFields(pdfPath, outputPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    
    // Find the page with Totalbeløp
    const { pageNum: totalbeløpPageNum, pageText: totalbeløpPageText, totalValue: grandTotalMatch } = await findTotalbeløpPage(doc);
    
    if (DEBUG_LOGGING) {
      console.log(`Totalbeløp found on page ${totalbeløpPageNum}:`, grandTotalMatch);
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
      const endPos = i < matches.length - 1 ? matches[i + 1].index : casesText.length;
      
      const caseText = casesText.substring(startPos, endPos);
      
      if (DEBUG_LOGGING) {
        console.log(`\n--- Case ${i + 1}: ${saksnummer} ---`);
        console.log('Case text length:', caseText.length);
        console.log('Case text preview:', caseText.substring(0, 500));
      }
      
      const { fakturadato, forfallsdato } = extractDatesFromCase(caseText);
      const fields = extractFinancialFields(caseText);
      const { oppdragsgiver, opprinneligOppdragsgiver } = extractCreditorInfo(caseText);
      
      if (DEBUG_LOGGING) {
        console.log('Oppdragsgiver:', oppdragsgiver);
        console.log('Opprinnelig oppdragsgiver:', opprinneligOppdragsgiver);
        console.log('Fields:', fields);
      }

      allCases.push({
        saksnummer,
        oppdragsgiver,
        opprinneligOppdragsgiver,
        fakturadato,
        forfallsdato,
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

      allCases.push({
        saksnummer: null,
        oppdragsgiver,
        opprinneligOppdragsgiver,
        utstedetDato,
        forfallsDato,
        ...fields,
      });
    }

    // Transform to DebtSchema format
    const debtSchemaData = transformToDebtSchema(allCases);

    // Validate each entry against DebtSchema
    const validatedData = debtSchemaData.map((debt, index) => {
      const result = DebtSchema.safeParse(debt);
      if (!result.success) {
        console.warn(`Validation warning for case ${index + 1} (caseID: ${debt.caseID || 'N/A'}):`, result.error.errors);
        return debt; // Return unvalidated if validation fails
      }
      return result.data;
    });

    fs.writeFileSync(outputPath, JSON.stringify(validatedData, null, 2), 'utf-8');
    console.log(`Results saved to ${outputPath} - ${validatedData.length} case(s) extracted in DebtSchema format`);
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


