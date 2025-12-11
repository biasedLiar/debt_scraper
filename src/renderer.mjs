/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input } from "./dom.mjs";
import { si, digiPost, kredinor, intrum, tfBank } from "./data.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName } from "./utilies.mjs";
import { U } from "./U.mjs";

const fs = require("fs");

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nationalIdInput = document.getElementById("nationalIdInput");
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() || "Unknown" : "Unknown";

  const { browser, page } = await PUP.openPage(url);

  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());

    var pageName = (await page.title()).replace(/\s+/g, "_").toLowerCase();
    if (savePage(pageName)) {
      try {
        const filename = createFoldersAndGetName(pageName, nationalID);

        const data = await r.text();
        if (U.isJson(data)) {
          console.log(data);
          fs.writeFile(filename, data, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }
      } catch (e) {
        console.error("Error:", e);
      }
    }
  });
};

const kredinorButton = button("Kredinor", () => openPage(kredinor.url));
const intrumButton = button("Intrum", () => openPage(intrum.url));
const tfBankButton = button("tfBank", () => openPage(tfBank.url));
const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper"
);
const nationalIdInput = input("Skriv inn fødselsnummer", "nationalIdInput");
const siButton = button("Gå til si", (ev) => {
  openPage(si.url);
});
const digipostButton = button("Digipost", async (ev) => {
  const { browser, page } = await PUP.openPage(digiPost.url);
  
  console.log(`Opened ${digiPost.name} at ${digiPost.url}`);
  
  // Wait for and click the login button
  try {
    await page.waitForSelector('button.dds-button.dds-button--primary.dds-button--size-large', { timeout: 5000 });
    await page.click('button.dds-button.dds-button--primary.dds-button--size-large');
    console.log('Clicked login button');
  } catch (e) {
    console.error('Could not find/click button:', e);
  }

  // Wait for and click the BankID link
  try {
    await page.waitForSelector('a[href="/authorize/bankid"]', { timeout: 5000 });
    await page.click('a[href="/authorize/bankid"]');
    console.log('Clicked BankID link');
  } catch (e) {
    console.error('Could not find/click BankID link:', e);
  }
  
  //Needs to be optimized, improvised solution for now
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait for navigation
  // Wait for and fill in the national identity number input
  try {
    // Wait for navigation after clicking BankID link
    
    const nationalID = nationalIdInput ? nationalIdInput.value.trim() : '';
    if (nationalID) {
      await page.type('input#nnin', nationalID);
      console.log('Filled in national identity number');
    } else {
      console.log('No value to enter in national identity number field');
    }
  } catch (e) {
    console.error('Could not find/fill national identity number input:', e);
  }
  // Wait for and click the continue button
  try {
    await page.waitForSelector('button#nnin-next-button', { timeout: 5000 });
    await page.click('button#nnin-next-button');
    console.log('Clicked continue button');
  } catch (e) {
    console.error('Could not find/click continue button:', e);
  }

  
  
});

const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(digipostButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(tfBankButton);

document.body.append(heading);
document.body.append(heading2);
document.body.append(nationalIdInput);
document.body.append(buttonsContainer);
