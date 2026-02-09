import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, createDownloadFoldersAndGetName, waitForNewDownloadedFile } from "../utilities.mjs";

// Local function to sanitize folder and file names (Windows-safe)
function safe(name) {
  return String(name).replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

// Local function to filter out thread/conversation items (keep only individual messages)
async function filterIndividualMessages(page) {
  const allLinks = await page.$$('.message-list-item__info');
  const filterPromises = allLinks.map(async (element) => {
    const containsMessage = await element.$('.message-list-item__thread-icon-container').catch(() => null);
    return containsMessage == null;
  });
  const filterResults = await Promise.all(filterPromises);
  return allLinks.filter((_, index) => filterResults[index]);
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
  try {
    await page.waitForSelector('.message-list-item__info', { visible: true});
  } catch (error) {
    console.warn('Failed to load Digipost inbox - message list not found:', error.message);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
    }
    return { browser, page };
  }

  // Filter out thread/conversation items (keep only individual messages)
  const messageLinks = await filterIndividualMessages(page);
  console.warn(`Found ${messageLinks.length} messages in inbox`);

  if (messageLinks.length === 0) {
    console.log('No individual messages found in inbox');
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete('NO_DEBT_FOUND'), 1000);
    }
    return { browser, page };
  }


  
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
  let client;
  try {
    client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: defaultDownloadsPath
    });
  } catch (error) {
    console.error('Failed to set up download behavior:', error.message);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) {
      setTimeout(() => onComplete('HANDLER_TIMEOUT'), 1000);
    }
    return { browser, page };
  }

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
    // Re-query and filter messages to get updated element references
    const newListOfMessages = await filterIndividualMessages(page);

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
        console.error(`Message ${i + 1}: Dokumenthandlinger button not found`);
        continue; // Skip to next message
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
            try {
              const oldPath = path.join(defaultDownloadsPath, downloadedFile);
              const extension = path.extname(downloadedFile);
              const baseName = path.basename(downloadedFile, extension);
              
              // Create custom filename
              const safeSender = safe(messageInfo.sender);
              const safeSubject = safe(messageInfo.subject);
              const safeDate = safe(messageInfo.date);
              const preModifiedName = (await page.$eval('.bZV0z', element => element.textContent.trim())).replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
              const newFileName = `${preModifiedName}_${i}${extension}`;
              const newPath = path.join(targetFolder, newFileName);
              
              // Move and rename file
              fs.renameSync(oldPath, newPath);
              console.log(`Successfully moved file to: ${newPath}`);
            } catch (moveError) {
              console.error(`Message ${i + 1}: Failed to move/rename file:`, moveError.message);
            }
          } else {
            console.warn(`Message ${i + 1}: No new file detected in Downloads folder - download may have failed`);
          }
        } catch (downloadError) {
          console.error(`Message ${i + 1}: Error during download process:`, downloadError.message);
        }
      } else {
        console.error(`Message ${i + 1}: Download button not found`);
        continue; // Skip to next message
      }

      // Small delay before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));

     
    } catch (e) {
      console.error(`Message ${i + 1} (${messageInfo.subject}): Failed to access menu/download -`, e.message);
      // Continue to next message
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Go back to inbox
    try {
      await page.goBack({ waitUntil: 'networkidle2', timeout: 10000 });
    } catch (e) {
      console.error(`Message ${i + 1}: Failed to navigate back to inbox -`, e.message);
      // Try to continue anyway
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
