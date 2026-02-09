/**
 * Utilities - Re-exports from focused modules
 * 
 * This file provides backward compatibility by re-exporting all utility functions
 * from their respective modules. New code should import directly from:
 * - ./fileOperations.mjs - File and folder operations
 * - ./formatters.mjs - Data formatting utilities
 * - ./pageHelpers.mjs - Puppeteer page helpers
 * - ./debtReader.mjs - Debt data reading
 */

// File operations
export {
  isJson,
  savePage,
  createFoldersAndGetName,
  createExtractedFoldersAndGetName,
  createDownloadFoldersAndGetName,
  transferFilesAfterLogin,
  moveFiles,
  fileKnownToContainName
} from "./fileOperations.mjs";

// Formatters
export {
  parseNorwegianAmount,
  formatNorwegianCurrency
} from "./formatters.mjs";

// Page helpers
export {
  acceptCookies,
  clearTimeoutSafely,
  waitForNewDownloadedFile
} from "./pageHelpers.mjs";

// Debt reader
export {
  readAllDebtForPerson
} from "./debtReader.mjs";
