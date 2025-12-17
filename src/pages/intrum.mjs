import { PUP } from "../scraper.mjs";
import { intrum } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";


//Denne funksjonen trenger mest sannsynlig noen timeouts e.l for å vente på at nettsiden oppdaterer seg
// Ikke testet enda, fordi vi ikke har hatt gjeld på intrum / mulighet til å teste med noen med gjeld


/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleIntrumLogin(nationalID, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(intrum.url);

  console.log(`Opened ${intrum.name} at ${intrum.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // need to check and extract debt information here

  // check these:
  // Extract debt information from the page
  const debtCases = await page.evaluate(() => {
    const cases = [];
    
    // Find all case containers (adjust selector based on actual page structure)
    const caseElements = document.querySelectorAll('.case-container, .debt-case, [class*="case"]');
    
    caseElements.forEach(caseEl => {
      const caseData = {};
      
      // Extract case number
      const caseNumberEl = caseEl.querySelector('.label');
      if (caseNumberEl) {
        const match = caseNumberEl.textContent.match(/Saksnummer\s+(\d+)/);
        caseData.caseNumber = match ? match[1] : null;
      }
      
      // Extract total amount
      const totalAmountEl = caseEl.querySelector('.case-total-amount-value');
      if (totalAmountEl) {
        caseData.totalAmount = totalAmountEl.textContent.replace(/\s/g, '').replace(',', '.');
      }
      
      // Extract creditor name
      const creditorEl = caseEl.querySelector('.creditor-name');
      if (creditorEl) {
        caseData.creditorName = creditorEl.textContent.trim();
      }
      
      if (Object.keys(caseData).length > 0) {
        cases.push(caseData);
      }
    });
    
    return cases;
  });
  
  console.log('Extracted debt cases:', debtCases);

  const filePath = createFoldersAndGetName(intrum.name, nationalID, "Intrum", "ManuallyFoundDebt", true);
  const data = { debtCases, timestamp: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  // Find all "Detaljer på sak" buttons and process each one
  const detailsButtons = await page.$$('span.button-text');
  const detailsButtonsToClick = [];
  
  for (const button of detailsButtons) {
    const text = await button.evaluate(el => el.textContent.trim());
    if (text === 'Detaljer på sak') {
      detailsButtonsToClick.push(button);
    }
  }
  
  console.log(`Found ${detailsButtonsToClick.length} detail buttons to process`);
  
  const allDetailedInfo = [];
  

  for (let i = 0; i < detailsButtonsToClick.length; i++) {
    console.log(`Processing case ${i + 1}/${detailsButtonsToClick.length}`);
    
    try {

      const clickableElement = await detailsButtonsToClick[i].evaluateHandle(el => el.closest('button, a, [role="button"]'));
      await clickableElement.click();

      await new Promise(r => setTimeout(r, 2000));

      const detailedInfo = await page.evaluate(() => {
        const details = {};
        const rows = document.querySelectorAll('.global-table tr');
        
        rows.forEach(row => {
          const label = row.querySelector('.table-label, .bold');
          const amount = row.querySelector('.table-amount');
          
          if (label && amount) {
            const labelText = label.textContent.trim();
            const amountText = amount.textContent.replace(/\s/g, '').replace(',', '.').replace('NOK', '').trim();
            details[labelText] = amountText;
          }
        });
        
        return details;
      });
      
      allDetailedInfo.push(detailedInfo);
      console.log(`Case ${i + 1} details:`, detailedInfo);
      

      await page.goBack();
      await new Promise(r => setTimeout(r, 1000));
      
      if (i < detailsButtonsToClick.length - 1) {
        const newButtons = await page.$$('span.button-text');
        detailsButtonsToClick.length = 0;
        for (const button of newButtons) {
          const text = await button.evaluate(el => el.textContent.trim());
          if (text === 'Detaljer på sak') {
            detailsButtonsToClick.push(button);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to process case ${i + 1}:`, e);
    }
  }
  
  console.log('All detailed case information:', allDetailedInfo);

  const detailedInfoFilePath = createFoldersAndGetName(intrum.name, nationalID, "Intrum", "DetailedDebtInfo", true);
  const detailedData = { allDetailedInfo, timestamp: new Date().toISOString() };
  await fs.writeFile(detailedInfoFilePath, JSON.stringify(detailedData, null, 2));



  return { browser, page };
}
