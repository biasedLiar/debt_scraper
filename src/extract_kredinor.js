
import fs from 'fs';
import { PDFParse } from 'pdf-parse'; // ✅ Correct import

async function extractFields(pdfPath, outputPath) {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });

  // getText() returns a TextResult with .text and .pages[].text in v2+
  // We'll iterate result.pages to be page-accurate.  [1](https://deepwiki.com/mehmet-kozan/pdf-parse/2.2-quick-start-examples)
  const result = await parser.getText();

  // Fallback: if pages are missing for any reason, treat whole doc as one page
  const pages = (result.pages && Array.isArray(result.pages) && result.pages.length > 0)
    ? result.pages.map(p => (typeof p === 'string' ? p : p.text || ''))
    : [result.text || ''];

  const allResults = pages.map((rawPageText, index) => {
    // Normalize NBSP and other odd whitespaces to regular spaces
    const pageText = rawPageText.replace(/\u00A0/g, ' ');

    // Find all dates on this page (dd.mm.yyyy)
    const dateRegex = /\b\d{2}\.\d{2}\.\d{4}\b/g;
    const dates = [...pageText.matchAll(dateRegex)].map(m => m[0]);

    // First date = utstedetDato, 6th date = forfallsDato
    const utstedetDato = dates[4] || null;
    const forfallsDato = dates[5] || null; // <- 6th date (0-based index)

    // Financial fields (case-insensitive, optional colon, flexible whitespace)
    const fields = {
      restHovedstol: findFirstValue(
        pageText,
        /Rest\s+hovedstol\s*:?\s*([\d\s]+,\d{2})/i
      ),
      renter: findFirstValue(
        pageText,
        /Renter\s*:?\s*([\d\s]+,\d{2})/i
      ),
      gebyrer: findFirstValue(
        pageText,
        /Gebyrer\s*:?\s*([\d\s]+,\d{2})/i
      ),
      inkasso: findFirstValue(
        pageText,
        /Inkassosalær\s*\/\s*Omkostninger\s*:?\s*([\d\s]+,\d{2})/i
      ),
      renterAvOmkostninger: findFirstValue(
        pageText,
        /Renter\s+av\s+omkostninger\s*:?\s*([\d\s]+,\d{2})/i
      ),
    };

    return {
      page: index + 1,
      utstedetDato,
      forfallsDato,
      ...fields,
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`✅ Results saved to ${outputPath}`);
}

// Helper: return the first numeric capture as Number (handles "4 481,63")
function findFirstValue(text, regex) {
  const match = text.match(regex);
  return match
    ? parseFloat(match[1].replace(/\s/g, '').replace(',', '.'))
    : null;
}

// Run the function
extractFields(
  'testpdf',
  'results.json'
);
