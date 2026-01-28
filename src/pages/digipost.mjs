import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, createDownloadFoldersAndGetName } from "../utilities.mjs";

// Local function to sanitize folder and file names (Windows-safe)
function safe(name) {
  return String(name).replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}
import { HANDLER_TIMEOUT_MS } from "../constants.mjs";

/**
 * Handles the Digipost login automation flow
 * @param {string} nationalID - The national identity number to use for login
 * @param {Function} setupPageHandlers - Function to setup page response handlers
 * @param {{onComplete?: Function, onTimeout?: Function}} callbacks - Callbacks object with onComplete and onTimeout functions
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function handleDigipostLogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;
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

  // Start 60-second timeout timer after BankID login
  if (onTimeout) {
    timeoutTimer = setTimeout(() => {
      console.log('Digipost handler timed out after ' + (HANDLER_TIMEOUT_MS / 1000) + ' seconds');
      onTimeout('HANDLER_TIMEOUT');
    }, HANDLER_TIMEOUT_MS);
  }

  // Wait for the page to fully load and render after BankID login
  console.log("Waiting for Digipost inbox to load...");

  // Wait for message list to load
  await page.waitForSelector('.message-list-item__info', { visible: true });
  const messageLinks = await page.$$('.message-list-item__info');
  console.log(`Found ${messageLinks.length} messages in inbox`);

  // Set up download folder and behavior ONCE before the loop, using sanitized names
  const safeDigiPostName = safe(digiPost.name);
  const safeNationalID = safe(nationalID);
  const safeWebsite = safe("Digipost");
  const pdfFolder = createDownloadFoldersAndGetName(safeDigiPostName, safeNationalID, safeWebsite);
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: pdfFolder,
  });
  console.log("Set download behavior for Digipost, downloading to:", pdfFolder);


  for (let i = 0; i < messageLinks.length; i++) {
    const message = messageLinks[i];
    // Open message
    await message.click();

    // Click the menu button to reveal the download option, then click the download button
    try {
      await page.waitForSelector('[aria-label="Dokumenthandlinger"]', { visible: true });
      const button2 = await page.$('[aria-label="Dokumenthandlinger"]');
      if (button2) {
        await button2.click();
      } else {
        console.error("Dokumenthandlinger button not found even after waiting");
      }

      // 2. Click the download option from the revealed menu
      await page.waitForSelector('[data-testid="download-document"]', { visible: true });
      const button3 = await page.$('[data-testid="download-document"]');
      if (button3) {
        try {
          button3.click();
          console.log("Clicked download document button (DOM click)");
        } catch (err) {
          console.error("Both click methods failed for download button", err);
        }
      } else {
        console.error("Download button not found even after waiting");
      }

      // Wait for the download to start with a timeout (resolve if download starts or timeout reached)
      await new Promise(resolve => setTimeout(resolve, 3000));

     
    } catch (e) {
      console.error("Error clicking menu/download for message", i + 1, e);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Optionally: go back to inbox if needed
    try {
      await page.goBack({ waitUntil: 'networkidle2' });
    } catch (e) {
      console.error('Error going back to inbox after message', i + 1, e);
    }
  }




// const pdfFilePath = createFoldersAndGetName(digiPost.name, nationalID, "Digipost", "downloadedPDF", false);
// await newPage._client().send('Page.setDownloadBehavior', {behavior: 'allow', 
//   downloadPath: pdfFilePath});

// await newPage.waitForSelector('#save', { 
//   timeout: 30000, 
//   visible: true 
// });
// const button3 = await newPage.$('#save');
// if (button3) {
//   await button3.click();
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
