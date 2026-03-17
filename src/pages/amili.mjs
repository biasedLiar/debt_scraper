import { PUP } from "../services/scraper.mjs";
import { amili } from "../services/data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import {
  createExtractedFoldersAndGetName,
  parseNorwegianAmount,
} from "../utils/utilities.mjs";
import { DebtCollectionSchema } from "../utils/schemas.mjs";
import { HANDLER_TIMEOUT_MS } from "../utils/constants.mjs";

const fs = require("fs/promises");
const TEMP_DEV_EXIT_DELAY_MS = 5 * 60 * 1000; // Remove after development

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

    // Click the Amili BankID login button by matching a nested <p> with expected text.
    try {
      await page.waitForSelector("button p", { visible: true });
      const buttons = await page.$$("button");
      let clicked = false;

      for (const button of buttons) {
        console.log("Checking button for BankID text...");
        const hasBankIdText = await button.evaluate((el) => {
          const pElements = Array.from(el.querySelectorAll("p"));
          return pElements.some((p) =>
            (p.textContent || "").includes("Logg inn med BankID")
          );
        });

        if (hasBankIdText) {
          await button.click();

          try {
            // Sometimes button doesn't register the first click (and it not because the page hasn't loaded)
            await button.click();
            await button.click();
          } catch (error) {
            console.log("Additional click attempt unnecessary:");
          }
          console.log(button);
          clicked = true;
          console.log('Clicked "Logg inn med BankID" button');
          break;
        }
      }

      if (!clicked) {
        console.warn('Did not find a button containing p text "Logg inn med BankID"');
      }
    } catch (e) {
      console.error("Could not find/click Amili BankID button:", e);
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

    console.warn("Amili login successful, waiting for main page to load...");

    await page.waitForFunction(() => {
      const h1Elements = Array.from(document.querySelectorAll("h1"));
      return h1Elements.some((h1) =>
        (h1.textContent || "").includes("Velkommen, ")
      );
    });

    await page.waitForSelector("div.css-11h1f6b, .insert_css_selector_for_debt_rows");


    const hasNoDebtMessage = await page.evaluate(() => {
      return document.querySelector("div.css-11h1f6b") !== null;
    });

    console.error("Amili - hasNoDebtMessage:", hasNoDebtMessage);

    const rawRows = hasNoDebtMessage
      ? []
      : await page.evaluate(() => {
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

              const text = (element.textContent || "").replace(/\s+/g, " ").trim();
              const amountMatch = text.match(/-?\d[\d .]*,\d{2}\s*(kr|nok)?/i);

              rows.push({
                caseID:
                  element.getAttribute("data-case-id") ||
                  element.querySelector("[data-case-id]")?.getAttribute("data-case-id") ||
                  element.querySelector("td")?.textContent?.trim() ||
                  "N/A",
                amountText: amountMatch ? amountMatch[0] : "",
                creditorName:
                  element.querySelector(".creditor-name")?.textContent?.trim() ||
                  element.querySelector("[data-creditor]")?.getAttribute("data-creditor") ||
                  "Unknown",
              });
            }
          }

          return rows;
        });

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

    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }

    console.warn(
      `Temporary development delay: waiting ${TEMP_DEV_EXIT_DELAY_MS / 1000} seconds before exit.`
    );
    await new Promise((resolve) => setTimeout(resolve, TEMP_DEV_EXIT_DELAY_MS));

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
