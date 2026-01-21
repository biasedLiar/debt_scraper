import { PUP } from "../scraper.mjs";
import { praGroup } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";
const fs = require('fs/promises');

/**
 * Handles the PRA Group login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handlePraGroupLogin(nationalID, setupPageHandlers) {
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

  
  // Extract account reference number 
  await page.waitForSelector('.welcome-headline', { visible: true });


  console.log("Found li elements, looking for account reference...");
  const possibleElements = (await page.$$('.validation-summary-errors li'));

  console.log(`Found ${possibleElements.length} possible account reference elements.`);

  const repeatedLoginElements = possibleElements.filter(async (el) => {
    console.log('Element has value:', await page.evaluate(el => el.textContent, element));
    const text = await page.evaluate(element => element.textContent, el);
    // return text.includes('For mange mislykkede påloggingsforsøk');
    return text.includes('For mange mislykkede påloggingsforsøk.');
  });
  console.log(`Found ${repeatedLoginElements.length} possible account repeatedLoginElements elements.`);

  const noAccountElements = possibleElements.filter(async (el) => {
    console.log('Element has value:', await page.evaluate(el => el.textContent, element));
    const text = await page.evaluate(element => element.textContent, el);
    // return text.includes('For mange mislykkede påloggingsforsøk');
    return text.includes('Opplysningene du har oppgitt stemmer ikke med våre');
  });
  console.log(`Found ${noAccountElements.length} possible account noAccountElements elements.`);

  for (let index = 0; index < possibleElements.length; index++) {
    const element = possibleElements[index];
    console.log('Element has value:', await page.evaluate(el => el.textContent, element));
    
  }
  if (possibleElements.length === 0) {
    console.log("Could not find account reference element");
    throw new Error("Account reference element not found");
  }
  
  
  await page.waitForSelector('#accountReferenceId strong, .validation-summary-errors > li[contains(text(), "Opplysningene du har oppgitt stemmer ikke med våre. Vennligst prøv på nytt.")]', { visible: true });
  const accountReference = await page.evaluate(() => {
    const element = document.querySelector('#accountReferenceId strong');
    return element ? element.textContent.trim() : null;
  });
  
  console.log("Account reference:", accountReference);

  // Extract amount
  await page.waitForSelector('.text--big strong', { visible: true });
  const amount = await page.evaluate(() => {
    const element = document.querySelector('.text--big strong');
    return element ? element.textContent.trim() : null;
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
  
  const filePath = createFoldersAndGetName("Pra_Group", nationalID, "PRA Group", "ManuallyFoundDebt", true);
  
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



  console.log('PRA Group data saved successfully');

  return { browser, page };
}
