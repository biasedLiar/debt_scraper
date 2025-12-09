/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
import { div, button } from "./dom.mjs";
import { si, digiPost, kredinor, intrum, tfBank } from "./data.mjs";
import { PUP } from "./scraper.mjs";
import { U } from "./U.mjs";
import { extractFieldFromJsonFiles } from "./json-searcher.mjs";

const fs = require("fs");
const path = require("path");

// Create output directory
const outputDir = path.join(process.cwd(), "scraped-data");
try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log("Created directory:", outputDir);
  } else {
    console.log("Directory exists:", outputDir);
  }
} catch (err) {
  console.error("Error creating directory:", err);
}

/**
 *
 * @param url {string}
 * @returns {Promise<void>}
 */
const openPage = async (url) => {
  const { browser, page } = await PUP.openPage(url);

  // @ts-ignore
  page.on("request", (r) => {
    console.log(r.url());
  });
  // @ts-ignore
  page.on("response", async (r) => {
    console.log(r.url());
    console.log(r.ok());

    try {
      const data = await r.text();
      if (U.isJson(data)) {
        console.log(data);
        const timestamp = Date.now();
        const filename = path.join(outputDir, `data-${timestamp}.json`);
        console.log("Writing to file:", filename);
        fs.writeFileSync(filename, data);
        console.log("✓ File saved!");
      }
    } catch (e) {
      console.error("Error:", e);
    }
  });
};



const siButton = button("Gå til SI", () => openPage(si.url));
const digipostButton = button("Digipost", () => openPage(digiPost.url));
const kredinorButton = button("Kredinor", () => openPage(kredinor.url));
const intrumButton = button("Intrum", () => openPage(intrum.url) );
const tfBankButton = button("tfBank", () => openPage(tfBank.url))
const di = div();

//TODO put css in own file
const buttonStyle = "margin: 10px; font-size: 16px; padding: 10px;";
[siButton, digipostButton, kredinorButton, intrumButton, tfBankButton].forEach(btn => {
  btn.style = buttonStyle;
});



di.style = "margin: 10px; padding: 10px;";

// Run json-searcher on page load
const allKrav = extractFieldFromJsonFiles('krav');

if (allKrav.length > 0) {
  di.innerHTML = `<h3>Dine gjeldskrav (${allKrav.length} totalt)</h3>` +
    allKrav.map((krav, index) => {
      const fields = Object.entries(krav)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join('<br>');
      return `<div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 5px;">Krav #${index + 1}</div>
        ${fields}
      </div>`;
    }).join('');
} else {
  di.innerText = "Ingen gjeldskrav funnet.";
}

document.body.append(siButton, digipostButton, kredinorButton, intrumButton, tfBankButton, di);
