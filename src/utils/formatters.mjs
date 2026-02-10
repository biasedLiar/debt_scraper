/**
 * Data formatting utilities
 * Handles parsing and formatting of Norwegian currency and other data
 */

/**
 * Parses a Norwegian formatted currency string to a number
 * Handles spaces, commas as decimal separators, and various formats
 * @param {string|number|null|undefined} val - The value to parse
 * @returns {number} - Parsed number or 0 if invalid
 * @example
 * parseNorwegianAmount("1 234,56") // returns 1234.56
 * parseNorwegianAmount("1234.56") // returns 1234.56
 * parseNorwegianAmount("1 234,56 kr") // returns 1234.56
 */
export function parseNorwegianAmount(val) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  
  // Remove "kr", "NOK", and other currency symbols, then parse
  const cleaned = String(val)
    .replace(/kr|NOK/gi, "")
    .replace(/\s/g, "")  // Remove spaces
    .replace(",", ".")   // Replace comma with period for decimal
    .trim();
  
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Formats a number as Norwegian currency
 * @param {number} amount - The amount to format
 * @param {boolean} [includeKr=true] - Whether to append "kr"
 * @returns {string} - Formatted currency string
 * @example
 * formatNorwegianCurrency(1234.56) // returns "1 234,56 kr"
 */
export function formatNorwegianCurrency(amount, includeKr = true) {
  const formatted = amount.toLocaleString("no-NO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return includeKr ? `${formatted} kr` : formatted;
}
