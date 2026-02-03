import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, createDownloadFoldersAndGetName, waitForNewDownloadedFile } from "../utilities.mjs";

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

  // Filter out thread/conversation items (keep only individual messages)
  const allLinks = await page.$$('.message-list-item__info');
  const filterPromises = allLinks.map(async (element) => {
    const containsMessage = await element.$('.message-list-item__thread-icon-container').catch(() => null);
    return containsMessage == null;
  });
  const filterResults = await Promise.all(filterPromises);
  const messageLinks = allLinks.filter((_, index) => filterResults[index]);
  console.warn(`Found ${messageLinks.length} messages in inbox`);


  
  // Prepare target folder for organized files
  const safeDigiPostName = safe(digiPost.name);
  const safeNationalID = safe(nationalID);
  const safeWebsite = safe("Digipost");
  const targetFolder = createDownloadFoldersAndGetName(safeDigiPostName, safeNationalID, safeWebsite);
  console.log("Will move downloaded files to:", targetFolder);

  // Get default download path
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const defaultDownloadsPath = path.join(os.homedir(), 'Downloads');
  console.log("Default downloads path:", defaultDownloadsPath);

  // Set up CDP to handle downloads and prevent PDFs from opening in new tabs
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: defaultDownloadsPath
  });

  // Block navigation to PDF files to prevent them from opening in new tabs
  await page.setRequestInterception(true);
  
  // Store handler reference for cleanup
  const requestHandler = (request) => {
    const url = request.url();
    // Allow the initial download request but block subsequent navigation
    if (request.isNavigationRequest() && url.includes('.pdf')) {
      request.abort();
    } else {
      request.continue();
    }
  };
  
  page.on('request', requestHandler);


  for (let i = 0; i < messageLinks.length; i++) {
    const newAllLinks = await page.$$('.message-list-item__info');
    const newFilterPromises = newAllLinks.map(async (element) => {
      const containsMessage = await element.$('.message-list-item__thread-icon-container').catch(() => null);
      return containsMessage == null;
    });
    
    const newFilterResults = await Promise.all(newFilterPromises);
    const newListOfMessages = newAllLinks.filter((_, index) => newFilterResults[index]);


    const message = newListOfMessages[i];
    
    // Extract message metadata before opening
    const messageInfo = await message.evaluate(el => {
      const senderEl = el.querySelector('.message-list-item__sender');
      const subjectEl = el.querySelector('.message-list-item__subject');
      const dateEl = el.querySelector('.message-list-item__date');
      return {
        sender: senderEl ? senderEl.textContent.trim() : 'Unknown',
        subject: subjectEl ? subjectEl.textContent.trim() : 'No_Subject',
        date: dateEl ? dateEl.textContent.trim() : ''
      };
    });
    
    console.log(`Processing message ${i + 1}: ${messageInfo.subject} from ${messageInfo.sender}`);
    
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
          await button3.click();
          console.log("Clicked download document button");
          
          // Wait for new file to appear in downloads
          const downloadedFile = await waitForNewDownloadedFile(defaultDownloadsPath);
          
          if (downloadedFile) {
            const oldPath = path.join(defaultDownloadsPath, downloadedFile);
            const extension = path.extname(downloadedFile);
            const baseName = path.basename(downloadedFile, extension);
            
            // Create custom filename
            const safeSender = safe(messageInfo.sender);
            const safeSubject = safe(messageInfo.subject);
            const safeDate = safe(messageInfo.date);
            const preModifiedName = (await page.$eval('.bZV0z', element => element.textContent.trim())).replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
            const newFileName = `${preModifiedName}_${i}${extension}`;
            // const newFileName = `${safeSender}_${safeSubject}_${safeDate}${extension}`;
            const newPath = path.join(targetFolder, newFileName);
            
            console.log(`Moved file to: ${newPath} from ${oldPath}`);

            // Move and rename file
            fs.renameSync(oldPath, newPath);
          } else {
            console.warn("No new file detected in Downloads folder");
          }
        } catch (err) {
          console.error("Error downloading/moving document", err);
        }
      } else {
        console.error("Download button not found even after waiting");
      }

      // Small delay before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));

     
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

  console.log('Digipost operations completed successfully');

  // Clean up request interception to prevent memory leaks
  page.off('request', requestHandler);
  await page.setRequestInterception(false);

  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (onComplete) {
    setTimeout(() => onComplete('MESSAGES_PROCESSED'), 1000);
  }
  return { browser, page };
}
