const fs = require('fs');
const path = require('path');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.mjs');

<<<<<<< HEAD
// Set worker path for Node.js/Electron environment - use require.resolve for cross-system compatibility
try {
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
} catch (e) {
  // Fallback if resolve doesn't work
  pdfjs.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
}
=======
// Set worker path for Node.js/Electron environment
pdfjs.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
>>>>>>> 2e0a1fc9d963e5087ab85178422f56cc4063c770

export async function extractFields(pdfPath, outputPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);
    
    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    let fullText = '';
    
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    
    // Normalize whitespace
    const pageText = fullText.replace(/\u00A0/g, ' ');
    
    // Debug: log the text to see structure
    console.log('PDF TEXT:', pageText);
    
    // Find all dates (dd.mm.yyyy)
    const dateRegex = /\b\d{2}\.\d{2}\.\d{4}\b/g;
    const dates = [...pageText.matchAll(dateRegex)].map(m => m[0]);
    
    const utstedetDato = dates[4] || null;
    const forfallsDato = dates[5] || null;

    // Financial fields (case-insensitive, optional colon, flexible whitespace)
    const fields = {
      restHovedstol: findFirstValue(
        pageText,
        /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i
      ),
      renter: findFirstValue(pageText, /Renter\s*:?\s*([\d\s]+,\d{2})/i),
      gebyrer: findFirstValue(pageText, /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i),
      inkasso: findFirstValue(
        pageText,
        /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i
      ),
      renterAvOmkostninger: findFirstValue(
        pageText,
        /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i
      ),
    };

    // Extract saksnummer (case number) - format like "1689333/22"
    // Find first occurrence of number/number pattern after Saksnummer header
    const saksnummerMatch = pageText.match(/(\d{5,}\/\d{2})/);
    const saksnummer = saksnummerMatch ? saksnummerMatch[1] : null;
    
<<<<<<< HEAD
    // Extract Oppdragsgiver (creditor/client)
    const oppdragsgiverMatch = pageText.match(/Oppdragsgiver:\s*([^\n]+)/i);
    const oppdragsgiver = oppdragsgiverMatch ? oppdragsgiverMatch[1].trim() : null;
    
    // Extract Opprinnelig oppdragsgiver (original creditor/client)
    const opprinneligOppdragsgiverMatch = pageText.match(/Opprinnelig\s+oppdragsgiver:\s*([^\n]+)/i);
    const opprinneligOppdragsgiver = opprinneligOppdragsgiverMatch ? opprinneligOppdragsgiverMatch[1].trim() : null;
    
    console.log('Saksnummer match:', saksnummerMatch);
    console.log('Oppdragsgiver:', oppdragsgiver);
    console.log('Opprinnelig oppdragsgiver:', opprinneligOppdragsgiver);

    const extractedData = {
      saksnummer,
      oppdragsgiver,
      opprinneligOppdragsgiver,
=======
    console.log('Saksnummer match:', saksnummerMatch);

    const extractedData = {
      saksnummer,
>>>>>>> 2e0a1fc9d963e5087ab85178422f56cc4063c770
      utstedetDato,
      forfallsDato,
      ...fields,
    };

    fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2), 'utf-8');
    console.log(`Results saved to ${outputPath}`);
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
