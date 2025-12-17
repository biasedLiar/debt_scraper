import { PUP } from "../scraper.mjs";
import { kredinor } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";
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
  console.log("Starting Kredinor login process, at step 2");  
  
  await loginWithBankID(page, nationalID);
  console.log("Starting Kredinor login process, at step 3");  

  // Not sure how long page needs to wait, so erred on side of caution
  await new Promise(resolve => setTimeout(resolve, 15000)); 
  console.log("Starting Kredinor login process, at step 4");  
  await page.waitForSelector('.info-row-item-group');
  const [debtAmount, activeCases] = await page.$$eval('.info-row-item-title', els => 
    els.map(el => el.textContent.trim())
  );
  console.log("Starting Kredinor login process, at step 5");  


  const folderName = userName ? userName : nationalID;
  const filePath = createFoldersAndGetName(kredinor.name, folderName, "Kredinor", "ManuallyFoundDebt", true);
  console.log(`Saving debt data to ${filePath}\n\n\n----------------`);
  const data = { debtAmount, activeCases, timestamp: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`Debt amount: ${debtAmount}`);
  console.log(`Active cases: ${activeCases}`);
  console.log(`Saved to ${filePath}`);

  
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
  await fs.writeFile(filePath2, JSON.stringify({debtList, creditorList, saksnummerList}, null, 2));

  return { browser, page };
}
