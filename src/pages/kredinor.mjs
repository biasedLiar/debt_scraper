import { PUP } from "../scraper.mjs";
import { kredinor } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";
import { saveValidatedJSON, KredinorManualDebtSchema, KredinorFullDebtDetailsSchema } from "../schemas.mjs";
const fs = require('fs/promises');

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {() => string} getUserName - Function to get the user name
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleKredinorLogin(nationalID, getUserName, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(kredinor.url);
  
  console.log(`Opened ${kredinor.name} at ${kredinor.url}`);

  console.log("Starting Kredinor login process, at step 1");  

  const userName = getUserName();
  
  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }


// Accept cookies first
  try {
    await page.waitForSelector('button.coi-banner__accept', { timeout: 5000, visible: true });
    await page.click('button.coi-banner__accept');
    console.log('Accepted cookies');
  } catch (error) {
    console.log('Cookie banner not found or already accepted:', error.message);
  }
  
  try {
    await page.waitForSelector('button.login-button', { timeout: 10000 });
    await page.click('button.login-button');
  } catch (error) {
    console.error('Error clicking login button:', error.message);
    throw new Error('Failed to find or click login button');
  }
  
  
  
  await loginWithBankID(page, nationalID);
  console.log("Starting Kredinor login process, at step 3");  

 

  await page.waitForSelector('.info-row-item-group', { timeout: 10000, visible: true }).catch(() => {
    console.log('No debt information found or page took too long to load');
  });
  const [debtAmount, activeCases] = await page.$$eval('.info-row-item-title', els => 
    els.map(el => el.textContent.trim())
  );
  console.log("Starting Kredinor login process, at step 5");  


  const folderName = userName ? userName : nationalID;
  const filePath = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "ManuallyFoundDebt", true);
  console.log(`Saving debt data to ${filePath}\n\n\n----------------`);
  const data = { debtAmount, activeCases, timestamp: new Date().toISOString() };
  await saveValidatedJSON(filePath, data, KredinorManualDebtSchema);
  console.log(`Debt amount: ${debtAmount}`);
  console.log(`Active cases: ${activeCases}`);

  
  const newPagePromise = browser.waitForTarget(target => target.opener() === page);



  const pdfFilePath = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "downloadedPDF", false);
  await page._client().send('Page.setDownloadBehavior', {behavior: 'allow', 
    downloadPath: pdfFilePath});
  
  const button = await page.$('.pdf-attachment-btn');
  await button.click();

  
  const newPageTarget = await newPagePromise;
  const newPage = await newPageTarget.page();



  

  const debtList =  await page.$$eval('.total-amount-value', els => 
    els.map(el => el.textContent.trim())
  );
  const creditorList =  await page.$$eval('.creditor', els => 
    els.map(el => el.textContent.trim())
  );
  const saksnummerList =  await page.$$eval('.main-info-value', els => 
    els.map(el => el.textContent.trim())
  );

  console.log("Debt List:", debtList);
  console.log("Creditor List:", creditorList);
  console.log("Saksnummer List:", saksnummerList);

  const filePath2 = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "FullDebtDetails", true);
  await saveValidatedJSON(filePath2, {debtList, creditorList, saksnummerList}, KredinorFullDebtDetailsSchema);

  return { browser, page };
}
