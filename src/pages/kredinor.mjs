import { PUP } from "../scraper.mjs";
import { kredinor } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, waitForNewDownloadedFile, parseNorwegianAmount } from "../utilities.mjs";
import { saveValidatedJSON, KredinorManualDebtSchema, KredinorFullDebtDetailsSchema } from "../schemas.mjs";
import { extractFields } from "../extract_kredinor.mjs";
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

/**
 * Handles the Kredinor login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {() => string} getUserName - Function to get the user name
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks object with onComplete and onTimeout functions
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleKredinorLogin(nationalID, getUserName, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(kredinor.url);
  
  console.log(`Opened ${kredinor.name} at ${kredinor.url}`);

  const userName = getUserName();
  
  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }


// Accept cookies first
  try {
    await page.waitForSelector('button.coi-banner__accept', {visible: true });
    await page.click('button.coi-banner__accept');
    console.log('Accepted cookies');
  } catch (error) {
    console.log('Cookie banner not found or already accepted:', error.message);
  }
  
  try {
    await page.waitForSelector('button.login-button', { visible: true});
    await page.click('button.login-button');
  } catch (error) {
    console.error('Error clicking login button:', error.message);
    throw new Error('Failed to find or click login button');
  }
  
  
  
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('Kredinor handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  await page.waitForSelector('.info-row-item-group', { visible: true, timeout: 120000 }).catch(() => {
    console.log('No debt information found or page took too long to load');
  });
  
  // Extract debt overview information
  const [debtAmountRaw, activeCasesRaw] = await page.$$eval('.info-row-item-title', els => 
    els.map(el => el.textContent.trim())
  );
  
  const debtAmount = parseNorwegianAmount(debtAmountRaw);
  const activeCases = parseInt(activeCasesRaw) || 0;


  const folderName = userName ? userName : nationalID;
  const filePath = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "ManuallyFoundDebt", true);
  console.log(`Saving debt data to ${filePath}\n\n\n----------------`);
  
  const data = { debtAmount, activeCases, timestamp: new Date().toISOString() };
  
  // Check if no debt found
  if (debtAmount === 0 && activeCases === 0) {
    data.note = "No debt information found on page.";
    await saveValidatedJSON(filePath, data, KredinorManualDebtSchema);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
    }
    return { browser, page };
  }
  
  await saveValidatedJSON(filePath, data, KredinorManualDebtSchema);
  console.log(`Debt amount: ${debtAmount} kr`);
  console.log(`Active cases: ${activeCases}`);

  const debtList =  await page.$$eval('.total-amount-value', els => 
    els.map(el => el.textContent.trim())
  );
  const creditorList =  await page.$$eval('.creditor', els => 
    els.map(el => el.textContent.trim())
  );
  const saksnummerList =  await page.$$eval('.main-info-value', els => 
    els.map(el => el.textContent.trim())
  );

  // Download PDF report (active or closed cases)
    try {
      const downloadButton = await page.waitForSelector(
        'span[data-text-key="claims.active.overview_report.download.button"], span[data-text-key="claims.closed.overview_report.download.button"]', 
        { visible: true }
      );
      
      // Set download path - CDP requires absolute path
      const client = await page.createCDPSession();
      const pdfFolderRelative = createFoldersAndGetName(kredinor.name, folderName, "KredinorPDF", "", false).replace(/[^\/\\]+$/, '');
      const pdfFolder = path.resolve(pdfFolderRelative);
      
      // Ensure folder exists using sync fs for directory creation
      if (!fsSync.existsSync(pdfFolder)) {
        fsSync.mkdirSync(pdfFolder, { recursive: true });
      }
      
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: pdfFolder
      });
      
      console.log(`Download path set to: ${pdfFolder}`);
      
      // Trigger download
      await downloadButton.click();
      console.log('Clicked download button');
      
      // Wait for the file to appear in the download folder
      const downloadedFile = await waitForNewDownloadedFile(pdfFolder);
      
      if (downloadedFile) {
        console.log(`PDF downloaded: ${downloadedFile}`);
        
        // Extract data from the downloaded PDF
        try {
          const pdfPath = path.join(pdfFolder, downloadedFile);
          const outputPath = path.join(pdfFolder, 'extracted_data.json');
          
          console.log(`Extracting data from PDF...`);
          await extractFields(pdfPath, outputPath);
          console.log('PDF extraction completed');
        } catch (extractError) {
          console.error('Failed to extract PDF data:', extractError.message);
        }
      } else {
        console.warn('PDF download timed out - file not detected in download folder');
      }

      
      
    } catch (error) {
      console.log('Could not download closed cases PDF:', error);
    }

  console.log("Debt List:", debtList);
  console.log("Creditor List:", creditorList);
  console.log("Saksnummer List:", saksnummerList);

  const filePath2 = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "FullDebtDetails", true);
  await saveValidatedJSON(filePath2, {debtList, creditorList, saksnummerList}, KredinorFullDebtDetailsSchema);

  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('DEBT_FOUND'), 1000);
  }
  return { browser, page };
}