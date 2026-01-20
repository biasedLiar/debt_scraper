const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

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
    
    // Extract first page separately to get the grand total
    const firstPage = await doc.getPage(1);
    const firstPageContent = await firstPage.getTextContent();
    const firstPageText = firstPageContent.items.map(item => item.str).join(' ').replace(/\u00A0/g, ' ');
    
    console.log('FIRST PAGE TEXT:', firstPageText);
    
    // Extract grand total from first page
    const grandTotalMatch = findFirstValue(firstPageText, /Totalbeløp\s*:?\s*([\d\s]+,\d{2})/i);
    console.log('Grand total from page 1:', grandTotalMatch);
    
    // Now extract text from page 2 onwards for individual cases
    let casesText = '';
    for (let i = 2; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      casesText += pageText + '\n';
    }
    
    // Normalize whitespace
    casesText = casesText.replace(/\u00A0/g, ' ');
    
    console.log('CASES TEXT (from page 2+):', casesText);
    
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
      
      // Extract Fakturadato and Forfallsdato from the table section
      // Look for dates after a reference number (8+ digits followed by two dates)
      const dateTableMatch = caseText.match(/(\d{8,})\s*(\d{2}\.\d{2}\.\d{4})\s*(\d{2}\.\d{2}\.\d{4})/);
      
      const fakturadato = dateTableMatch ? dateTableMatch[2] : null;
      const forfallsdato = dateTableMatch ? dateTableMatch[3] : null;

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
      const oppdragsgiverMatch = caseText.match(/Oppdragsgiver[:\s]+([A-Za-zÆØÅæøå0-9\s\-\.]+?)(?=\s*(?:Opprinnelig|Saksnummer|Avsluttet|Innbetalt|Utestående|$))/i);
      const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
      
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
    
    // If no saksnummer found on pages 2+, check if there's only the first page
    if (allCases.length === 1 && doc.numPages === 1) {
      const dateRegex = /\b\d{2}\.\d{2}\.\d{4}\b/g;
      const dates = [...firstPageText.matchAll(dateRegex)].map(m => m[0]);
      
      const utstedetDato = dates[3] || null;
      const forfallsDato = dates[4] || null;

      const fields = {
        restHovedstol: findFirstValue(firstPageText, /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i),
        renter: findFirstValue(firstPageText, /Renter\s*:?\s*([\d\s]+,\d{2})/i),
        gebyrer: findFirstValue(firstPageText, /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i),
        inkasso: findFirstValue(firstPageText, /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i),
        renterAvOmkostninger: findFirstValue(firstPageText, /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i),
      };
      
      const oppdragsgiverMatch = firstPageText.match(/Oppdragsgiver:\s*([^\n]+)/i);
      const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
      
      const opprinneligOppdragsgiverMatch = firstPageText.match(/Opprinnelig\s+oppdragsgiver:\s*([^\n]+)/i);
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

    fs.writeFileSync(outputPath, JSON.stringify(allCases, null, 2), 'utf-8');
    console.log(`Results saved to ${outputPath} - ${allCases.length} case(s) extracted`);
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


