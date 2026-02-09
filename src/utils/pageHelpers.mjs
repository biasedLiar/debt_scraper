/**
 * Puppeteer page helper utilities
 * Functions for working with browser pages
 */

const fs = require("fs");
const path = require("path");
import { FILE_DOWNLOAD_MAX_ATTEMPTS, FILE_DOWNLOAD_POLL_INTERVAL_MS, FILE_DOWNLOAD_FINALIZE_DELAY_MS } from "./constants.mjs";

/**
 * Attempts to accept cookie consent banner if present on page
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @param {string} [selector='button.coi-banner__accept'] - CSS selector for cookie accept button
 * @param {number} [timeout=5000] - Maximum time to wait for selector in milliseconds
 * @returns {Promise<boolean>} - True if cookies were accepted, false if banner not found
 */
export async function acceptCookies(page, selector = 'button.coi-banner__accept', timeout = 5000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    console.log('Accepted cookies');
    return true;
  } catch (error) {
    console.log('Cookie banner not found or already accepted');
    return false;
  }
}

/**
 * Safely clears a timeout timer if it exists
 * @param {NodeJS.Timeout|null} timer - The timeout timer to clear
 * @returns {void}
 */
export function clearTimeoutSafely(timer) {
  if (timer) {
    clearTimeout(timer);
  }
}

/**
 * Polls a directory for a new file to appear after a download action
 * @param {string} downloadPath - The directory path to monitor
 * @param {number} [maxAttempts] - Maximum polling attempts
 * @param {number} [pollInterval] - Milliseconds between polls
 * @returns {Promise<string|null>} - Returns the new file name or null if not found
 */
export async function waitForNewDownloadedFile(
  downloadPath, 
  maxAttempts = FILE_DOWNLOAD_MAX_ATTEMPTS, 
  pollInterval = FILE_DOWNLOAD_POLL_INTERVAL_MS
) {
  // Get list of files and their timestamps before download
  const filesBefore = fs.existsSync(downloadPath) ? fs.readdirSync(downloadPath) : [];
  const timestampsBefore = {};
  
  filesBefore.forEach(file => {
    const filePath = path.join(downloadPath, file);
    try {
      timestampsBefore[file] = fs.statSync(filePath).mtimeMs;
    } catch (e) {
      // Ignore errors
    }
  });
  
  // Poll for new files with a timeout
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    if (!fs.existsSync(downloadPath)) {
      continue;
    }
    
    const filesAfter = fs.readdirSync(downloadPath);
    const newFiles = filesAfter.filter(f => {
      // Skip temporary files (.tmp, .crdownload, .part)
      if (f.endsWith('.tmp') || f.endsWith('.crdownload') || f.endsWith('.part')) {
        return false;
      }
      // Check if file is new or modified
      return !filesBefore.includes(f) || 
             (timestampsBefore[f] && fs.statSync(path.join(downloadPath, f)).mtimeMs > timestampsBefore[f]);
    });
    
    if (newFiles.length > 0) {
      // Wait a bit more to ensure download is complete
      await new Promise(resolve => setTimeout(resolve, FILE_DOWNLOAD_FINALIZE_DELAY_MS));
      return newFiles[0];
    }
  }
  
  return null;
}
