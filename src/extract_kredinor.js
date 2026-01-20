const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

export async function extractFields(pdfPath, outputPath) {
  try {
    const buffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    
    // Extract text from result - result.text contains all text
    const fullText = result.text || '';
    
    // Normalize whitespace
    const pageText = fullText.replace(/\u00A0/g, ' ');
    
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

    const extractedData = {
      utstedetDato,
      forfallsDato,
      ...fields,
    };

    fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2), 'utf-8');
    console.log(`✅ Results saved to ${outputPath}`);
    
    await parser.destroy();
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
