/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button, h1, h2, input, visualizeDebt } from "./dom.mjs";
import { PUP } from "./scraper.mjs";
import { savePage, createFoldersAndGetName } from "./utilities.mjs";
import { U } from "./U.mjs";
import { handleDigipostLogin } from "./pages/digipost.mjs";
import { handleSILogin } from "./pages/statens-innkrevingssentral.mjs";
import { handleKredinorLogin } from "./pages/kredinor.mjs";
import { handleIntrumLogin } from "./pages/intrum.mjs";
import { handleTfBankLogin } from "./pages/tfbank.mjs";
import { handlePraGroupLogin } from "./pages/pra-group.mjs";  
import { handleZolvaLogin } from "./pages/zolva-as.mjs";
import { read_json } from "./json_reader.mjs";

const fs = require("fs");

let currentWebsite = null;

/**
 * Sets up page response handlers to save JSON data
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number
 */
export const setupPageHandlers = (page, nationalID) => {
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
        const data = await r.text();
        const isJson = U.isJson(data);

        const filename = createFoldersAndGetName(
          pageName,
          nationalID,
          currentWebsite,
          r.url(),
          isJson
        );

        console.log("Response data length:", data);
        fs.writeFile(filename, data, function (err) {
          if (err) {
            console.log(err);
          }
        });
      } catch (e) {
        console.error("Error:", e);
      }
    }
  });
};

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const nationalIdInput = document.getElementById("nationalIdInput");
  const nationalID = nationalIdInput
    ? nationalIdInput.value.trim() || "Unknown"
    : "Unknown";

  const { browser, page } = await PUP.openPage(url);

  setupPageHandlers(page, nationalID);
};

const di = div();
di.innerText = "Hello World from dom!";

const heading = h1("Gjeldshjelperen");
const heading2 = h2(
  "Et verktøy for å få oversikt over gjelden din fra forskjellige selskaper"
);
const nationalIdInput = input("Skriv inn fødselsnummer", "nationalIdInput");

const waitForUserInput = () => {
  return new Promise((resolve) => {
    let continueBtn;
    
    const cleanup = () => {
      if (continueBtn && document.body.contains(continueBtn)) {
        document.body.removeChild(continueBtn);
      }
      document.removeEventListener('keydown', keypressHandler);
      resolve();
    };
    
    const keypressHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cleanup();
      }
    };
    
    continueBtn = button("Klikk for å fortsette", cleanup);
    
    document.addEventListener('keydown', keypressHandler);
    continueBtn.style.position = 'fixed';
    continueBtn.style.top = '50%';
    continueBtn.style.left = '50%';
    continueBtn.style.transform = 'translate(-50%, -50%)';
    continueBtn.style.zIndex = '9999';
    continueBtn.style.padding = '20px 40px';
    continueBtn.style.fontSize = '18px';
    document.body.appendChild(continueBtn);
  });
};

const allButton = button("Kjør gjeldssjekk for alle (WIP)", async (ev) => {
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";

  
  currentWebsite = "SI";
  await handleSILogin(nationalID, setupPageHandlers);
  await waitForUserInput();
  await PUP.closeBrowser();
  
  currentWebsite = "Digipost";
  await handleDigipostLogin(nationalID, setupPageHandlers);
  await waitForUserInput();
  await PUP.closeBrowser(); 

  
  currentWebsite = "Kredinor";
  await handleKredinorLogin(nationalID, setupPageHandlers);
  await waitForUserInput();
  await PUP.closeBrowser();

  currentWebsite = "Intrum";
  await handleIntrumLogin(nationalID, setupPageHandlers);
  await waitForUserInput();
  await PUP.closeBrowser();

  currentWebsite = "tfBank";
  await handleTfBankLogin(nationalID, setupPageHandlers);
  await waitForUserInput();
  await PUP.closeBrowser();
});

const tfBankButton = button("tfBank", async (ev) => {
  currentWebsite = "tfBank";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleTfBankLogin(nationalID, setupPageHandlers);
});

const praGroupButton = button("PRA Group", async (ev) => {
  currentWebsite = "PRA Group";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handlePraGroupLogin(nationalID, setupPageHandlers);
});

const siButton = button("Gå til si", async (ev) => {
  currentWebsite = "SI";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleSILogin(nationalID, setupPageHandlers);
});
const digipostButton = button("Digipost", async (ev) => {
  currentWebsite = "Digipost";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleDigipostLogin(nationalID, setupPageHandlers);
});

const intrumButton = button("Intrum", async (ev) => {
  currentWebsite = "Intrum";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleIntrumLogin(nationalID, setupPageHandlers);
});

const kredinorButton = button("Kredinor", async (ev) => {
  currentWebsite = "Kredinor";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleKredinorLogin(nationalID, setupPageHandlers);
});

const zolvaButton = button("Zolva AS", async (ev) => {
  currentWebsite = "Zolva AS";
  const nationalID = nationalIdInput ? nationalIdInput.value.trim() : "";
  await handleZolvaLogin(nationalID, setupPageHandlers);
});

const buttonsContainer = div();
buttonsContainer.append(siButton);
buttonsContainer.append(digipostButton);
buttonsContainer.append(kredinorButton);
buttonsContainer.append(intrumButton);
buttonsContainer.append(tfBankButton);
buttonsContainer.append(praGroupButton);
buttonsContainer.append(zolvaButton);
buttonsContainer.append(allButton);
document.body.append(heading);
document.body.append(heading2);
document.body.append(nationalIdInput);
document.body.append(buttonsContainer);

const { debts_paid, debts_unpaid } = read_json("Statens Innkrevingssentral");
console.log("debtUnpaidVisualization: ", debts_unpaid);

const debtUnpaidVisualization = visualizeDebt(debts_unpaid);

document.body.append(debtUnpaidVisualization);

const debtsPaidVisualization = visualizeDebt(debts_paid);

document.body.append(debtsPaidVisualization);
