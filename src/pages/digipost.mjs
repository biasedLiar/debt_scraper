import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";

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

  // Wait for message list to load
  await page.waitForSelector(
    'a.message-list-item__info[data-testid="document-attachment"]',
    { timeout: 10000 }
  );

  // Get all message links
  const messageLinks = await page.$$eval(
    'a.message-list-item__info[data-testid="document-attachment"]',
    (links) =>
      links.map((link) => ({
        href: link.getAttribute("href"),
        sender: link.querySelector(".message-creator p")?.textContent?.trim(),
        subject: link
          .querySelector(".message-subject-content span")
          ?.textContent?.trim(),
        date: link.querySelector("time")?.getAttribute("datetime"),
      }))
  );

  console.log(`Found ${messageLinks.length} messages`);

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
