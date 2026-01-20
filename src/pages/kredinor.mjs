import { PUP } from "../scraper.mjs";
import { kredinor } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";
import { saveValidatedJSON, KredinorManualDebtSchema, KredinorFullDebtDetailsSchema } from "../schemas.mjs";
import { extractFields } from "../extract_kredinor.mjs";
const fs = require('fs');
const path = require('path');

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {() => string} getUserName - Function to get the user name
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleKredinorLogin(nationalID, getUserName, setupPageHandlers, scrapingCompleteCallback) {
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

 

  await page.waitForSelector('.info-row-item-group', { visible: true }).catch(() => {
    console.log('No debt information found or page took too long to load');
  });
  const [debtAmount, activeCases] = await page.$$eval('.info-row-item-title', els => 
    els.map(el => el.textContent.trim())
  );


  const folderName = userName ? userName : nationalID;
  const filePath = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "ManuallyFoundDebt", true);
  console.log(`Saving debt data to ${filePath}\n\n\n----------------`);
  const data = { debtAmount, activeCases, timestamp: new Date().toISOString() };
  await saveValidatedJSON(filePath, data, KredinorManualDebtSchema);
  console.log(`Debt amount: ${debtAmount}`);
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

  // Click button to download PDF of closed cases
  // active for active cases, closed for closed cases
    try {
      const downloadButton = await page.waitForSelector('span[data-text-key="claims.closed.overview_report.download.button"]', { visible: true });
      
      // Set download path for this specific download - CDP requires absolute path
      const client = await page.createCDPSession();
      const pdfFolderRelative = createFoldersAndGetName(kredinor.name, folderName, "KredinorPDF", "", false).replace(/[^\/\\]+$/, '');
      const pdfFolder = path.resolve(pdfFolderRelative);
      
      // Ensure folder exists
      if (!fs.existsSync(pdfFolder)) {
        fs.mkdirSync(pdfFolder, { recursive: true });
      }
      
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: pdfFolder
      });
      
      console.log(`Download path set to: ${pdfFolder}`);
      
      await downloadButton.click();
      console.log('Clicked download button');
      
      // Wait for download to complete  //TODO, prøv å gjøre dette mer deterministisk
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('PDF download completed');
      
      // Extract data from the downloaded PDF
      try {
        // Find the downloaded PDF file
        const files = fs.readdirSync(pdfFolderRelative);
        const pdfFile = files.find(f => f.endsWith('.pdf'));
        
        if (pdfFile) {
          const pdfPath = path.join(pdfFolderRelative, pdfFile);
          const outputPath = path.join(pdfFolderRelative, 'extracted_data.json');
          
          console.log(`Extracting data from ${pdfFile}...`);
          await extractFields(pdfPath, outputPath);
          console.log('PDF extraction completed');
        } else {
          console.log('No PDF file found in download folder');
        }
      } catch (extractError) {
        console.log('Error extracting PDF data:', extractError.message);
      }

      
      
    } catch (error) {
      console.log('Could not download closed cases PDF:', error.message);
    }

  console.log("Debt List:", debtList);
  console.log("Creditor List:", creditorList);
  console.log("Saksnummer List:", saksnummerList);

  const filePath2 = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "FullDebtDetails", true);
  await saveValidatedJSON(filePath2, {debtList, creditorList, saksnummerList}, KredinorFullDebtDetailsSchema);

  
  setTimeout(() => scrapingCompleteCallback(), 2000);

  return { browser, page };
}