const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');
import { DebtSchema } from './schemas.mjs';

// Set worker path for Node.js/Electron environment - use require.resolve for cross-system compatibility
try {
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
} catch (e) {
  // Fallback if resolve doesn't work
  pdfjs.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
}

export async function extractFields(pdfPath, outputPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    
    // First, search all pages to find where Totalbeløp appears
    let totalbeløpPageNum = null;
    let totalbeløpPageText = '';
    let grandTotalMatch = null;
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ').replace(/\u00A0/g, ' ');
      
      // Check if this page contains Totalbeløp
      const totalMatch = findFirstValue(pageText, /Totalbeløp\s*:?\s*([\d\s]+,\d{2})/i);
      if (totalMatch !== null) {
        totalbeløpPageNum = i;
        totalbeløpPageText = pageText;
        grandTotalMatch = totalMatch;
        console.log(`Found Totalbeløp on page ${i}:`, grandTotalMatch);
        break;
      }
    }
    
    if (!totalbeløpPageNum) {
      throw new Error('Could not find Totalbeløp in PDF');
    }
    
    console.log(`Totalbeløp found on page ${totalbeløpPageNum}:`, grandTotalMatch);
    
    // Now extract text from pages after the Totalbeløp page for individual cases
    let casesText = '';
    for (let i = totalbeløpPageNum + 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      casesText += pageText + '\n';
    }
    
    // Normalize whitespace
    casesText = casesText.replace(/\u00A0/g, ' ');
    
    console.log(`CASES TEXT (from page ${totalbeløpPageNum + 1}+):`, casesText);
    
    // Find all saksnummer occurrences with their positions
    const saksnummerRegex = /(\d{5,}\/\d{2})/g;
    const matches = [...casesText.matchAll(saksnummerRegex)];
    
    console.log('Found', matches.length, 'saksnummer');
    
    // Start with the grand total as the first "case"
    const allCases = [{
      type: 'grandTotal',
      totalbeløp: grandTotalMatch
    }];
    
    for (let i = 0; i < matches.length; i++) {
      const saksnummer = matches[i][1];
      const startPos = matches[i].index;
      const endPos = i < matches.length - 1 ? matches[i + 1].index : casesText.length;
      
      // Get text section for this specific case
      const caseText = casesText.substring(startPos, endPos);
      
      console.log(`\n--- Case ${i + 1}: ${saksnummer} ---`);
      console.log('Case text length:', caseText.length);
      console.log('Case text preview:', caseText.substring(0, 500));
      
      // Extract Fakturadato and Forfallsdato from the table section
        // Find the first two dates after the title "Grunnlaget for saken"
        let fakturadato = null;
        let forfallsdato = null;
        const grunnlagIdx = caseText.indexOf("Grunnlaget for saken");
        if (grunnlagIdx !== -1) {
          // Get substring after the title
          const afterGrunnlag = caseText.substring(grunnlagIdx + "Grunnlaget for saken".length);
          // Find all dates in Norwegian format
          const dateMatches = afterGrunnlag.match(/\d{2}\.\d{2}\.\d{4}/g);
          if (dateMatches && dateMatches.length >= 2) {
            fakturadato = dateMatches[0];
            forfallsdato = dateMatches[1];
          }
        }

      // Financial fields from this case section only
      const fields = {
        restHovedstol: findFirstValue(
          caseText,
          /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i
        ),
        renter: findFirstValue(caseText, /Renter\s*:?\s*([\d\s]+,\d{2})/i),
        gebyrer: findFirstValue(caseText, /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i),
        inkasso: findFirstValue(
          caseText,
          /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i
        ),
        renterAvOmkostninger: findFirstValue(
          caseText,
          /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i
        ),
        totalbeløp: findFirstValue(
          caseText,
          /Totalbeløp\s*:?\s*([\d\s]+,\d{2})/i
        ),
      };
      
      // Extract Oppdragsgiver from this case section
      const oppdragsgiverMatch = caseText.match(/Oppdragsgiver[:\s]+([A-Za-zÆØÅæøå0-9\s\-\.]+?)(?=\s*(?:Opprinnelig\s+oppdragsgiver|Kundenummer|Saksnummer|Avsluttet|Innbetalt|Utestående|Referanse\s+til|Fakturadato|\d{8,}|$))/i);
      const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
      console.log('Oppdragsgiver match:', oppdragsgiverMatch);
      console.log('Oppdragsgiver:', oppdragsgiver);
      
      // Extract Opprinnelig oppdragsgiver from this case section
      // More flexible regex - match everything until we hit "Kundenummer", "Referanse" header or table markers
      const opprinneligOppdragsgiverMatch = caseText.match(/Opprinnelig\s+oppdragsgiver[:\s]+(.+?)(?=\s*(?:Kundenummer|Referanse\s+til|Fakturadato|Forfallsdato|\d{8,}|$))/i);
      let opprinneligOppdragsgiver = opprinneligOppdragsgiverMatch ? opprinneligOppdragsgiverMatch[1].trim() : null;
      
      // Remove "Kundenummer" and anything after it if it's still in the text
      if (opprinneligOppdragsgiver) {
        opprinneligOppdragsgiver = opprinneligOppdragsgiver.replace(/\s*Kundenummer.*/i, '').trim();
      }
      console.log('Oppdragsgiver:', oppdragsgiver);
      console.log('Opprinnelig oppdragsgiver match:', opprinneligOppdragsgiverMatch);
      console.log('Fields:', fields);

      allCases.push({
        saksnummer,
        oppdragsgiver,
        opprinneligOppdragsgiver,
        fakturadato,
        forfallsdato,
        ...fields,
      });
    }
    
    // If no saksnummer found on subsequent pages, check if Totalbeløp is the only thing
    if (allCases.length === 1 && totalbeløpPageNum === doc.numPages) {
      const dateRegex = /\b\d{2}\.\d{2}\.\d{4}\b/g;
      const dates = [...totalbeløpPageText.matchAll(dateRegex)].map(m => m[0]);
      
      const utstedetDato = dates[3] || null;
      const forfallsDato = dates[4] || null;

      const fields = {
        restHovedstol: findFirstValue(totalbeløpPageText, /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i),
        renter: findFirstValue(totalbeløpPageText, /Renter\s*:?\s*([\d\s]+,\d{2})/i),
        gebyrer: findFirstValue(totalbeløpPageText, /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i),
        inkasso: findFirstValue(totalbeløpPageText, /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i),
        renterAvOmkostninger: findFirstValue(totalbeløpPageText, /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i),
      };
      
      const oppdragsgiverMatch = totalbeløpPageText.match(/Oppdragsgiver:\s*([^\n]+)/i);
      const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
      
      const opprinneligOppdragsgiverMatch = totalbeløpPageText.match(/Opprinnelig\s+oppdragsgiver:\s*([^\n]+)/i);
      const opprinneligOppdragsgiver = opprinneligOppdragsgiverMatch ? opprinneligOppdragsgiverMatch[1].trim() : null;

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
    const debtSchemaData = allCases
      .filter(c => c.type !== 'grandTotal') // Skip grandTotal entry
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
        let originalDueDate = undefined;
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

    // Validate each entry against DebtSchema
    const validatedData = debtSchemaData.map((debt, index) => {
      const result = DebtSchema.safeParse(debt);
      if (!result.success) {
        console.warn(`Validation warning for case ${index + 1}:`, result.error.errors);
        return debt; // Return unvalidated if validation fails
      }
      return result.data;
    });

    fs.writeFileSync(outputPath, JSON.stringify(validatedData, null, 2), 'utf-8');
    console.log(`Results saved to ${outputPath} - ${validatedData.length} case(s) extracted in DebtSchema format`);
  } catch (error) {
    console.error('Error extracting PDF:', error.message);
    throw error;
  }
}

// Helper: return the first numeric capture as Number (handles "4 481,63")
function findFirstValue(text, regex) {
  const match = text.match(regex);
  return match
    ? parseFloat(match[1].replace(/\s/g, "").replace(",", "."))
    : null;
}


