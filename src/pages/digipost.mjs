import { PUP } from "../scraper.mjs";
import { digiPost } from "../data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import { createFoldersAndGetName, createDownloadFoldersAndGetName } from "../utilities.mjs";

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
      { visible: true }
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
  // TODO dont hardcode single message
  await page.waitForSelector('[aria-labelledby="message-label-3070544070"]', { 
    visible: true 
  });

// TODO dont hardcode single message
const button = await page.$('[aria-labelledby="message-label-3070544070"] .message-list-item__info');
await button.click();



await page.waitForSelector('[aria-label="Dokumenthandlinger"]', {
  visible: true 
});

const button2 = await page.$('[aria-label="Dokumenthandlinger"]');

if (button2) {
  await 
  button2.click();
} else {
  console.error("Dokumenthandlinger button not found even after waiting");
}


const pdfFilePath = createDownloadFoldersAndGetName(digiPost.name, nationalID, "Digipost");

const client = await page.target().createCDPSession()
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: pdfFilePath,
})

console.log("Set download behavior for Digipost, downloading to:", pdfFilePath);
// await page._client().send('Page.setDownloadBehavior', {behavior: 'allow', 
//   downloadPath: pdfFilePath});



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

    console.log(`Opening message: ${message.subject} from ${message.sender}`);

    //await page.waitForNavigation({ waitUntil: "networkidle2" });

    await page.waitForSelector('[aria-label="Dokumenthandlinger"]', {
      visible: true,
    });

    const button2 = await page.$('[aria-label="Dokumenthandlinger"]');

    if (button2) {
      await button2.click();
    } else {
      console.error("Dokumenthandlinger button not found even after waiting");
    }

    const pdfFilePath = createFoldersAndGetName(
      digiPost.name,
      nationalID,
      "Digipost",
      "downloadedPDF",
      false
    );
    await page
      ._client()
      .send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: pdfFilePath,
      });

    await page.waitForSelector('[data-testid="download-document"]', {
      visible: true,
    });

    const button3 = await page.$('[data-testid="download-document"]');
    if (button3) {
      await button3.click();
      console.log("Clicked download document button");
    } else {
      console.error("Dokumenthandlinger button not found even after waiting");
    }

    //console.log("Clicked download button");

    // Wait for download to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // TODO: Extract message content here
    // Get message content
    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Create filename from sender and subject
    const filename =
      `${nationalID}_${message.sender}_${message.subject}_${message.date}`.replace(
        /[^a-z0-9]/gi,
        "_"
      );

    // Save to letters subfolder
    /*
    await PUP.saveToFile(content, `letters/${filename}.txt`);
    console.log(`Saved message to letters/${filename}.txt`); */

    // Go back to message list
    await page.goBack();
    console.log("Returned to message list");

    /*
    // Click back to inbox button
    await page.waitForSelector("span.dds-button--link-text", { visible: true });
    await page.evaluate(() => {
      const spans = Array.from(
        document.querySelectorAll("span.dds-button--link-text")
      );
      const backButton = spans.find((span) =>
        span.textContent.includes("Tilbake til Innboks")
      );
      if (backButton) {
        backButton.closest("button, a").click();
      }
    });
    console.log("Clicked back to inbox button");
    await new Promise((resolve) => setTimeout(resolve, 1000)); */
  }
  return { browser, page };
}
