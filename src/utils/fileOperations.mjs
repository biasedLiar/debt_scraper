/**
 * File and folder operations
 * Handles path creation, file saving, and directory management
 */

const fs = require("fs");
const path = require("path");
import { handleError, ErrorType, ErrorSeverity } from "./errorHandler.mjs";

/**
 * Checks if a string is valid JSON
 * @param {any} obj - Value to check if it's valid JSON
 * @returns {boolean} - True if valid JSON, false otherwise
 */
export function isJson(obj) {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Determines if a page should be saved based on its name
 * @param {string} [pageName] - Name of the page to check
 * @returns {boolean} - True if page should be saved, false otherwise
 */
export function savePage(pageName) {
  const unsavedPages = ["bankid", "id-porten"];
  if (unsavedPages.includes(pageName)) {
    return false;
  }
  console.log("Saving page:", pageName);
  return true;
}

/**
 * Returns the current date formatted as YYYY_MM_DD
 * @returns {string}
 */
function getDateString() {
  const dateObj = new Date();
  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getUTCDate().toString().padStart(2, "0");
  const year = dateObj.getUTCFullYear();
  return `${year}_${month}_${day}`;
}

/**
 * Creates folder structure and returns full file path for saving data
 * @param {string} [pageName] - Name of the page/section
 * @param {string} [name] - User identifier or name
 * @param {string} [currentWebsite] - Name of the current website
 * @param {string} [url] - URL or file descriptor
 * @param {boolean} [isJsonFile=true] - Whether the file should have .json extension
 * @returns {string} - Full path to the file
 */
export function createFoldersAndGetName(
  pageName,
  name,
  currentWebsite,
  url,
  isJsonFile = true
) {
  try {
    const newDate = getDateString();

    if (!pageName) pageName = "no_page_name";
    if (!name) name = "Unknown";
    if (!currentWebsite) currentWebsite = "Unknown";

    // Create directory structure using recursive mkdir
    const baseDir = `./exports/${name}/${newDate}/${currentWebsite}/${pageName}`;
    
    fs.mkdirSync(baseDir, { recursive: true });
    
    if (!isJsonFile) {
      fs.mkdirSync(`${baseDir}/not_json`, { recursive: true });
    }

    const url_name = url
      .replace("https://", "")
      .replace(".json", "")
      .replace(/[^a-zA-Z0-9.]/g, "_")
      .toLowerCase();
    
    let dirname = `${baseDir}/`;
    dirname += isJsonFile ? url_name + ".json" : "not_json/" + url_name + ".txt";
    
    return dirname;
  } catch (error) {
    handleError(error, ErrorType.FILE_SYSTEM, ErrorSeverity.ERROR, { 
      pageName, 
      name, 
      currentWebsite 
    });
    throw error;
  }
}

/**
 * Creates folder structure for extracted data
 * @param {string} [currentWebsite] - Name of the current website
 * @param {string} [name] - User identifier or name
 * @returns {string} - Full path to the extracted data file
 */
export function createExtractedFoldersAndGetName(currentWebsite, name) {
  const newDate = getDateString();

  if (!currentWebsite) currentWebsite = "no_page_name";
  if (!name) name = "Unknown";

  const baseDir = `./extracted_data/${name}/${newDate}`;
  fs.mkdirSync(baseDir, { recursive: true });

  return `${baseDir}/${currentWebsite}_extracted_data.json`;
}

/**
 * Creates folder structure for extracted detailed documents
 * @param {string} [currentWebsite] - Name of the current website
 * @param {string} [name] - User identifier or name
 * @returns {string} - Full path to the extracted detailed document file
 */
export function createExtractedDetailedDocumentFoldersAndGetName(currentWebsite, name) {
  const newDate = getDateString();

  if (!currentWebsite) currentWebsite = "no_page_name";
  if (!name) name = "Unknown";

  const baseDir = `./extracted_detailed_document/${name}/${newDate}`;
  fs.mkdirSync(baseDir, { recursive: true });

  return `${baseDir}/${currentWebsite}_detailed_document.json`;
}

/**
 * Creates folder structure for downloaded files
 * @param {string} [pageName] - Name of the page/section
 * @param {string} [name] - User identifier or name
 * @param {string} [currentWebsite] - Name of the current website
 * @returns {string} - Full path to the download folder
 */
export function createDownloadFoldersAndGetName(pageName, name, currentWebsite) {
  const newDate = getDateString();

  if (!pageName) pageName = "no_page_name";
  if (!name) name = "Unknown";
  if (!currentWebsite) currentWebsite = "Unknown";

  const dirname = `./exports/${name}/${newDate}/${currentWebsite}/${pageName}`;
  fs.mkdirSync(dirname, { recursive: true });

  return dirname;
}

/**
 * Transfers files after login (from nationalId folder to name folder)
 * @param {string} [pageName] - Name of the page/section
 * @param {string} [name] - User identifier or name
 * @param {string} [currentWebsite] - Name of the current website
 * @param {string} [nationalId] - National ID to move files from
 */
export function transferFilesAfterLogin(pageName, name, currentWebsite, nationalId) {
  const newDate = getDateString();

  if (!pageName) pageName = "no_page_name";
  if (!name) name = "Unknown";
  if (!currentWebsite) currentWebsite = "Unknown";

  // Create destination directories
  const destBase = `./exports/${name}/${newDate}/${currentWebsite}/${pageName}`;
  fs.mkdirSync(destBase, { recursive: true });
  fs.mkdirSync(`${destBase}/not_json`, { recursive: true });

  // Move files from source to destination
  const sourceBase = `./exports/${nationalId}/${newDate}/${currentWebsite}/${pageName}`;
  
  moveFiles(`${sourceBase}/`, `${destBase}/`);
  moveFiles(`${sourceBase}/not_json/`, `${destBase}/not_json/`);
}

/**
 * Moves files from source to destination directory
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 */
export function moveFiles(sourceDir, destDir) {
  try {
    if (!fs.existsSync(sourceDir)) {
      return;
    }
    
    fs.readdir(sourceDir, (err, files) => {
      if (err) {
        handleError(err, ErrorType.FILE_SYSTEM, ErrorSeverity.ERROR, { sourceDir });
        return;
      }

      files.forEach((file) => {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);

        fs.rename(sourcePath, destPath, (err) => {
          if (err) {
            handleError(err, ErrorType.FILE_SYSTEM, ErrorSeverity.WARNING, { 
              file, 
              sourcePath, 
              destPath 
            });
          } else {
            console.log(`Moved: ${file}`);
          }
        });
      });
    });
  } catch (error) {
    handleError(error, ErrorType.FILE_SYSTEM, ErrorSeverity.ERROR, { 
      sourceDir, 
      destDir,
      action: 'moveFiles'
    });
  }
}

/**
 * Checks if a filename is known to contain user name information
 * @param {string} [name] - Filename to check
 * @returns {boolean}
 */
export function fileKnownToContainName(name) {
  return name.includes(
    "skatt.skatteetaten.no_api_mii_skyldnerportal_om_meg_api_v1_basisinfo.json"
  );
}
