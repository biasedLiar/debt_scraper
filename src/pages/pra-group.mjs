import { PUP } from "../scraper.mjs";
import { praGroup } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, createExtractedFoldersAndGetName } from "../utilities.mjs";
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";
import { DebtCollectionSchema } from "../schemas.mjs";
const fs = require('fs/promises');

/**
 * Handles the PRA Group login automation flow and extracts account reference and debt amount
 * @param {string} nationalID - The national identity number to use for BankID login
 * @param {(page: import('puppeteer').Page, nationalID: string) => void} setupPageHandlers - Function to setup page response handlers for saving network responses
 * @param {{onComplete?: (status: 'DEBT_FOUND'|'NO_DEBT_FOUND'|'TOO_MANY_FAILED_ATTEMPTS') => void, onTimeout?: (reason: 'HANDLER_TIMEOUT') => void}} callbacks - Callbacks for completion and timeout events
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page}>} - Returns browser and page instances
 */
export async function handlePraGroupLogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
  const { browser, page } = await PUP.openPage(praGroup.url);

  console.log(`Opened ${praGroup.name} at ${praGroup.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Wait for and click the login button
  try {
    await page.waitForSelector("#loginButtonId", { visible: true });
    await page.click("#loginButtonId");
    console.log("Clicked BankID login button");
  } catch (e) {
    console.error("Could not find/click button:", e);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('PRA Group handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  
  // Extract account reference number 
  await page.waitForSelector('.welcome-headline, h1 span span', { visible: true , timeout: 60000});;


  console.log("Found li elements, looking for account reference...");
  const possibleElements = (await page.$$('.validation-summary-errors li'));

  console.log(`Found ${possibleElements.length} possible account reference elements.`);

  for (let index = 0; index < possibleElements.length; index++) {
    const element = possibleElements[index];
    console.log('Element has value:', await page.evaluate(el => el.textContent, element));
    const hasText1 = await page.evaluate(el => el.textContent.includes('For mange mislykkede påloggingsforsøk.'), element);
    if (hasText1) {
      console.log("Detected too many failed login attempts message. Ending execution.");
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (onComplete) {
        setTimeout(() => onComplete("TOO_MANY_FAILED_ATTEMPTS"), 1000);
      }
      return { browser, page };
    }
    const hasText2 = await page.evaluate(el => el.textContent.includes('Opplysningene du har oppgitt stemmer ikke med våre'), element);
    if (hasText2) {
      console.log("No account exists for profile.");
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (onComplete) {
        setTimeout(() => onComplete("NO_DEBT_FOUND"), 1000);
      }
      return { browser, page };
    }
  }
  

  const accountReference = await page.evaluate(() => {
    const element = document.querySelector('#accountReferenceId strong');
    return element ? element.textContent.trim() : null;
  });
  
  console.log("Account reference:", accountReference);

  // Extract amount (second .text--big strong element)
  await page.waitForSelector('.text--big strong', { visible: true });
  const amount = await page.evaluate(() => {
    const elements = document.querySelectorAll('.text--big strong');
    return elements.length > 1 ? elements[1].textContent.trim() : null;
  });

  console.log("Amount:", amount);
  
  // Convert amount text to number (remove spaces, replace comma with period, remove 'kr')
  const amountNumber = amount 
    ? parseFloat(amount.replace(/\s/g, '').replace(',', '.').replace('kr', ''))
    : null;
  
  console.log("Amount as number:", amountNumber);

  // Extract previous owner, current owner, debt collector, and debtor type
  await page.waitForSelector('.account-content__block > div', { visible: true });
  const accountDetails = await page.evaluate(() => {
    const blocks = document.querySelectorAll('.account-content__block > div');
    const details = {};
    
    blocks.forEach(block => {
      const label = block.querySelector('label span');
      const value = block.querySelector('h3');
      
      if (label && value) {
        const key = label.textContent.trim();
        details[key] = value.textContent.trim();
      } else if (label) {
        // Handle debtor type which doesn't have h3
        const labelText = label.textContent.trim();
        if (labelText === 'Skyldnertype') {
          const debtorType = block.querySelectorAll('span')[1];
          if (debtorType) {
            details[labelText] = debtorType.textContent.trim();
          }
        }
      }
    });
    
    return details;
  });

  console.log("Account details:", accountDetails);

  // Save data to JSON file
  //const folderName = userName ? userName : nationalID;
  //const filePath = createFoldersAndGetName("PRA_Group", folderName, "PRA Group", "AccountData", true);
  
  const filePath = createFoldersAndGetName("PRA_Group", nationalID, "PRA Group", "ManuallyFoundDebt", true);
  
  const data = {
    accountReference,
    amount,
    amountNumber,
    accountDetails,
    timestamp: new Date().toISOString()
  };
  
  console.log(`Saving PRA Group data to ${filePath}`);
  
  try {
    // Note: not updated to use schema validation yet due to some bugs
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Failed to write detailed PRA Group info to file "${filePath}" for nationalID ${nationalID}:`, error);
  }


  const debtItem = {
    caseID: accountReference || "N/A",
    totalAmount: amountNumber || 0,
    originalAmount: undefined,
    interestAndFines: undefined,
    originalDueDate: undefined,
    debtCollectorName: "PRA Group",
    originalCreditorName: accountDetails['Tidligere eier'] || accountDetails['Nåværende eier'] || "Unknown",
    debtType: undefined,
    comment: undefined,
  };

  const formattedData = {
    creditSite: "PRA Group",
    debts: [debtItem],
    isCurrent: true,
    totalAmount: amountNumber || 0
  };
  
  // Validate against DebtCollectionSchema
  const filePath2 = createExtractedFoldersAndGetName("PRA Group", nationalID);
  try {
    const validatedData = DebtCollectionSchema.parse(formattedData);
    await fs.writeFile(filePath2, JSON.stringify(validatedData, null, 2));
    console.log(`Successfully saved validated PRA Group data to ${filePath2}`);
  } catch (error) {
    if (error.name === 'ZodError') {
      console.error(`Validation error for PRA Group data (${nationalID}):`, error);
    } else {
      console.error(`Failed to write detailed PRA Group info to file "${filePath2}" for nationalID ${nationalID}:`, error);
    }
  }
    



  console.log('PRA Group data saved successfully');

  // Gjøre manually found debt om til zod-formatert gjeld.

  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('DEBT_FOUND'), 1000);
  }
  return { browser, page };
}
