import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName } from "../utilities.mjs";

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleDigipostLogin(nationalID, setupPageHandlers) {
  const { browser, page } = await PUP.openPage(digiPost.url);

  console.log(`Opened ${digiPost.name} at ${digiPost.url}`);

  // Setup page handlers for saving responses
  if (setupPageHandlers) {
    setupPageHandlers(page, nationalID);
  }

  // Wait for and click the login button
  try {
    await page.waitForSelector(
      "button.dds-button.dds-button--primary.dds-button--size-large",
      { timeout: 5000 }
    );
    await page.click(
      "button.dds-button.dds-button--primary.dds-button--size-large"
    );
    console.log("Clicked login button");
  } catch (e) {
    console.error("Could not find/click button:", e);
  }

  // Use shared BankID login flow
  await loginWithBankID(page, nationalID);

  // Wait for the page to fully load and render after BankID login
  console.log("Waiting for Digipost inbox to load...");
  
  // Wait for message list to load (this implicitly waits for navigation to complete)
  await page.waitForSelector('[aria-labelledby="message-label-3109957961"]', { 
    timeout: 30000, 
    visible: true 
  });
  
//   console.log("Digipost inbox loaded successfully");

// // Get all message links
// const messageLinks = await page.$$eval('a.message-list-item__info[data-testid="document-attachment"]', links => 
//     links.map(link => ({
//         href: link.getAttribute('href'),
//         sender: link.querySelector('.message-creator p')?.textContent?.trim(),
//         subject: link.querySelector('.message-subject-content span')?.textContent?.trim(),
//         date: link.querySelector('time')?.getAttribute('datetime')
//     }))
// );
// console.log(`Found ${messageLinks.length} messages`);








  console.log("Digipost inbox loaded successfully1");
  
// const button = await page.$('[aria-labelledby="message-label-3070544070"]');
const button = await page.$('[aria-labelledby="message-label-3109957961"]');
await button.click();


  console.log("Digipost inbox loaded successfully2");

await page.waitForSelector('[aria-label="Dokumenthandlinger"]', { 
  timeout: 30000, 
  visible: true 
});

const button2 = await page.$('[aria-label="Dokumenthandlinger"]');
if (button2) {
  await button2.click();
} else {
  console.error("Dokumenthandlinger button not found even after waiting");
}

  console.log("Digipost inbox loaded successfully3");

const pdfFilePath = createFoldersAndGetName(digiPost.name, nationalID, "Digipost", "downloadedPDF", false);
await page._client().send('Page.setDownloadBehavior', {behavior: 'allow', 
  downloadPath: pdfFilePath});



await page.waitForSelector('[data-testid="download-document"]', { 
  timeout: 30000, 
  visible: true 
});

const button3 = await page.$('[data-testid="download-document"]');
if (button3) {
  await button3.click();
  console.log("Clicked download document button");
} else {
  console.error("Dokumenthandlinger button not found even after waiting");
}





// data-testid="download-document"



// const newPagePromise = new Promise(resolve => 
//     browser.once('targetcreated', target => resolve(target))
//   );


// const button2 = await page.$('[data-testid="open-document"]');
// if (button2) {
//   await button2.click();
// } else {
//   console.error("Dokumenthandlinger button not found even after waiting");
// }




// console.log("Dokumenthandlinger1");
  
// const newPageTarget = await newPagePromise;
// const newPage = await newPageTarget.page();

// console.log("Dokumenthandlinger2");

// const pdfFilePath = createFoldersAndGetName(digiPost.name, nationalID, "Digipost", "downloadedPDF", false);
// await newPage._client().send('Page.setDownloadBehavior', {behavior: 'allow', 
//   downloadPath: pdfFilePath});

// await newPage.waitForSelector('#save', { 
//   timeout: 30000, 
//   visible: true 
// });
// console.log("Dokumenthandlinger3");
// const button3 = await newPage.$('#save');
// console.log("Dokumenthandlinger4");
// if (button3) {
//   console.log("Dokumenthandlinger5");
//   await button3.click();
//   console.log("Dokumenthandlinger6");
// } else {
//   console.error("Dokumenthandlinger button not found even after waiting");
// }
/* WIP

// Visit each message and extract information
for (const message of messageLinks) {
    if (message.href) {
        console.log(`Opening message: ${message.subject} from ${message.sender}`);
        await page.goto(`${digiPost.url}${message.href}`, { waitUntil: 'networkidle2' });
        
        // Wait for message content to load
        await page.waitForTimeout(2000);
        
        // TODO: Extract message content here
        // Get message content
        const content = await page.evaluate(() => {
            return document.body.innerText;
        });

        // Create filename from sender and subject
        const filename = `${nationalID}_${message.sender}_${message.subject}_${message.date}`.replace(/[^a-z0-9]/gi, '_');

        // Save to letters subfolder
        await PUP.saveToFile(content, `letters/${filename}.txt`);
        console.log(`Saved message to letters/${filename}.txt`);
    }
} */
  return { browser, page };
}
