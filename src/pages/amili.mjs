import { PUP } from "../services/scraper.mjs";
import { amili } from "../services/data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import {
  createExtractedFoldersAndGetName,
  parseNorwegianAmount,
} from "../utils/utilities.mjs";
import { DebtCollectionSchema } from "../utils/schemas.mjs";
import { HANDLER_TIMEOUT_MS } from "../utils/constants.mjs";
import { waitForContinue } from "../utils/pageHelpers.mjs";

const fs = require("fs/promises");
const CASE_CONTAINER_SELECTOR = "table.css-qxn47u tbody tr";

function extractAmountFromText(text) {
  if (!text) {
    return "";
  }
  const amountMatch = String(text).match(/-?\d[\d .]*,\d{2}\s*(kr|nok)?/i);
  return amountMatch ? amountMatch[0] : "";
}

function buildCollection(debts) {
  const totalAmount = debts.reduce((sum, debt) => sum + (debt.totalAmount || 0), 0);
  return {
    creditSite: "Amili",
    debts,
    isCurrent: true,
    totalAmount,
  };
}

export async function handleAmiliLogin(nationalID, setupPageHandlers, callbacks = {}) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;

  try {
    const { browser, page } = await PUP.openPage(amili.url);
    console.log(`Opened ${amili.name} at ${amili.url}`);

    if (setupPageHandlers) {
      setupPageHandlers(page, nationalID);
    }

    // Click the Amili BankID login button directly via known class.
    // The site requires two real clicks (same behaviour observed when visiting manually).
    if (!SLOW_DOWN_BANK_ID) {
      try {
        await page.bringToFront();
        await page.waitForSelector("button.css-1ea8c4f", { visible: true });

        // First click – activates/focuses the button
        await page.click("button.css-1ea8c4f");
        console.log("Amili: first click on BankID login button");

        // Brief pause then second click – actually triggers the navigation
        await new Promise((resolve) => setTimeout(resolve, 500));
        try{
          await page.click("button.css-1ea8c4f");
          console.log("Amili: second click on BankID login button");
        } catch (e) {
          console.log("Secondary click not necessary.");
        }

        // BankID opens in the same tab; wait for navigation to complete
      } catch (e) {
        console.error("Could not find/click Amili BankID button:", e);
      }
    }

    await loginWithBankID(page, nationalID);

    // Handle GDPR modal shown after BankID login.
    try {
      await page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll("button"));
          return buttons.some((button) => {
            const spans = Array.from(button.querySelectorAll("span"));
            return spans.some((span) => (span.textContent || "").trim() === "OK");
          });
        },
        { timeout: 30000 }
      );

      const gdprAccepted = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const okButton = buttons.find((button) => {
          const spans = Array.from(button.querySelectorAll("span"));
          return spans.some((span) => (span.textContent || "").trim() === "OK");
        });

        if (!okButton) {
          return false;
        }

        okButton.click();
        return true;
      });

      if (gdprAccepted) {
        console.log('Clicked GDPR "OK" button');
      } else {
        console.warn('GDPR "OK" button was not clickable');
      }
    } catch (error) {
      console.warn('GDPR "OK" button not found within timeout; continuing:', error);
    }

    

    if (onTimeout) {
      timeoutTimer = setTimeout(() => {
        console.log(
          "Amili handler timed out after " + (HANDLER_TIMEOUT_MS / 1000) + " seconds"
        );
        onTimeout("HANDLER_TIMEOUT");
      }, HANDLER_TIMEOUT_MS);
    }

    await page.waitForSelector(".css-1ohpwqt", {visible: true});
    const totalAmount = await page.$eval(".css-1ohpwqt", (el) => el.textContent);
    console.log("Amili - totalAmount element found:", totalAmount);

    await page.waitForFunction(() => {
      const h1Elements = Array.from(document.querySelectorAll("h1"));
      return h1Elements.some((h1) =>
        (h1.textContent || "").includes("Velkommen, ")
      );
    });



    const hasNoDebtMessage = await page.evaluate(() => {
      return document.querySelector("div.css-11h1f6b") !== null;
    });

    console.log("Amili - hasNoDebtMessage:", hasNoDebtMessage);

    const rawRows = [];

    if (!hasNoDebtMessage) {
      // Extract debt data directly from the main page without clicking into individual cases
      const pageRows = await page.evaluate(() => {
        const rowSelectors = [
          "table tbody tr",
          ".debt-card",
          ".case-container",
          ".account",
        ];

        const rows = [];
        const visited = new Set();

        for (const selector of rowSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (visited.has(element)) {
              continue;
            }
            visited.add(element);

            const rawText = element.innerText || element.textContent || "";
            const text = rawText.replace(/\s+/g, " ").trim();

            const sakSplit = rawText.split("Sak #");
            const creditorNameFromSak =
              sakSplit.length > 1
                ? (sakSplit[0] || "").replace(/\s+/g, " ").trim() || "Unknown"
                : "";
            const caseIdFromSak =
              sakSplit.length > 1
                ? (() => {
                    const afterSakLines = (sakSplit[1] || "")
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    const firstLine = afterSakLines[0] || "";
                    return firstLine || "";
                  })()
                : "";

            rows.push({
              caseID:
                caseIdFromSak ||
                "N/A",
              amountText: text,
              creditorName:
                creditorNameFromSak ||
                "Unknown",
            });
          }
        }

        return rows;
      });

      rawRows.push(
        ...pageRows.map((row) => ({
          ...row,
          amountText: extractAmountFromText(row.amountText),
        }))
      );
    }

    const debts = rawRows
      .map((row) => ({
        caseID: String(row.caseID || "N/A"),
        totalAmount: parseNorwegianAmount(row.amountText || 0),
        originalAmount: undefined,
        interestAndFines: undefined,
        originalDueDate: undefined,
        debtCollectorName: "Amili",
        originalCreditorName: String(row.creditorName || "Unknown"),
        debtType: undefined,
        comment: undefined,
      }))
      .filter((debt) => Number.isFinite(debt.totalAmount) && debt.totalAmount > 0);

    const outputPath = createExtractedFoldersAndGetName("Amili", nationalID);
    const collectionObj = buildCollection(debts);
    const parsedCollection = DebtCollectionSchema.safeParse(collectionObj);
    const dataToWrite = parsedCollection.success ? parsedCollection.data : collectionObj;

    await fs.writeFile(outputPath, JSON.stringify(dataToWrite, null, 2), "utf-8");
    console.log(`Saved Amili extracted data to ${outputPath}`);

    await waitForContinue(`Paused after operations on ${amili.name}`);

    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }

    if (onComplete) {
      setTimeout(() => onComplete(debts.length > 0 ? "DEBT_FOUND" : "NO_DEBT_FOUND"), 1000);
    }

    return { browser, page };
  } catch (error) {
    console.error("Error in Amili handler:", error);
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
    if (onTimeout) {
      onTimeout("ERROR");
    }
    throw error;
  }
}
