# How To Add A New Creditor

This guide explains exactly how to add support for a new creditor in this project.

Use existing files like `src/pages/intrum.mjs` and `src/pages/kredinor.mjs` as references while implementing.

## 1. Decide Basic Integration Details

Before coding, define:

- Creditor display name (example: `Example Creditor`)
- Page module filename (example: `example-creditor.mjs`)
- Login URL
- Whether the flow needs only `nationalID` or also `userName`
- Expected completion statuses (`DEBT_FOUND`, `NO_DEBT_FOUND`, `HANDLER_TIMEOUT`, `ERROR`)
- Which output(s) you will save (`exports/...`, `extracted_data/...`, `extracted_detailed_document/...`)

## 2. Register Creditor In `src/services/data.mjs`

Add a new `createTargetPage(...)` entry, freeze it, and export it.

Example:

```js
const exampleCreditor = createTargetPage(
  "https://example-creditor.no/login",
  "Example Creditor"
);

Object.freeze(exampleCreditor);

export { si, digiPost, kredinor, intrum, praGroup, zolva, exampleCreditor };
```

If needed, add `apiData` URL matchers for response-based capture, same pattern as SI/Digipost.

## 3. Create A New Page Handler In `src/pages/`

Create `src/pages/example-creditor.mjs` and export one function:

- `handleExampleCreditorLogin(nationalID, setupPageHandlers, callbacks = {})`
- Or include `getUserName` parameter if username-dependent paths are required.

Use this structure:

```js
import { PUP } from "../services/scraper.mjs";
import { exampleCreditor } from "../services/data.mjs";
import { loginWithBankID } from "./bankid-login.mjs";
import {
  createFoldersAndGetName,
  createExtractedFoldersAndGetName,
} from "../utils/utilities.mjs";
import { saveValidatedJSON, DebtCollectionSchema } from "../utils/schemas.mjs";
import { HANDLER_TIMEOUT_MS } from "../utils/constants.mjs";
const fs = require("fs/promises");

export async function handleExampleCreditorLogin(
  nationalID,
  setupPageHandlers,
  callbacks = {}
) {
  const { onComplete, onTimeout } = callbacks;
  let timeoutTimer = null;

  try {
    const { browser, page } = await PUP.openPage(exampleCreditor.url);

    if (setupPageHandlers) {
      setupPageHandlers(page, nationalID);
    }

    // 1) Click login entrypoint
    // 2) Run BankID flow
    await loginWithBankID(page, nationalID);

    // Start timeout timer after BankID login
    if (onTimeout) {
      timeoutTimer = setTimeout(() => {
        onTimeout("HANDLER_TIMEOUT");
      }, HANDLER_TIMEOUT_MS);
    }

    // Optional: Extract data and save manual/raw JSON for debugging/auditing
    // const manualOutputPath = createFoldersAndGetName(
    //   exampleCreditor.name,
    //   nationalID,
    //   "Example Creditor",
    //   "ManuallyFoundDebt",
    //   true
    // );
    //
    // const manualData = {
    //   timestamp: new Date().toISOString(),
    //   // ... creditor-specific fields
    // };
    //
    // await saveValidatedJSON(manualOutputPath, manualData, /* your schema */);

    // Save normalized data used by UI totals
    const extractedOutputPath = createExtractedFoldersAndGetName(
      "Example Creditor",
      nationalID
    );

    const normalizedData = {
      creditSite: "Example Creditor",
      debts: [
        // ... map extracted records to DebtSchema-compatible objects
      ],
      isCurrent: true,
      totalAmount: 0, // replace with computed sum
    };

    const validatedNormalizedData = DebtCollectionSchema.parse(normalizedData);
    await fs.writeFile(
      extractedOutputPath,
      JSON.stringify(validatedNormalizedData, null, 2),
      "utf-8"
    );

    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onComplete) setTimeout(() => onComplete("DEBT_FOUND"), 1000);

    return { browser, page };
  } catch (error) {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (onTimeout) onTimeout("ERROR");
    throw error;
  }
}
```

Important behavior:

- Always call `setupPageHandlers(page, nationalID)` if API-response capture is useful.
- Always resolve either `onComplete(...)` or `onTimeout(...)`.
- Use `DEBT_FOUND` and `NO_DEBT_FOUND` consistently so button/UI state updates correctly.

## 4. Add/Reuse Validation Schemas In `src/utils/schemas.mjs`

Create creditor-specific schemas if current schemas do not fit.
If you skip manual/raw JSON output, this step is optional unless another extractor/output needs validation.

Example:

```js
export const ExampleCreditorManualSchema = z.object({
  debtAmount: z.number(),
  activeCases: z.int(),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val))),
});
```

Then use `saveValidatedJSON(...)` in the page handler.

## 5. Wire The Creditor Into The UI In `src/renderer.mjs`

### 5.1 Import the new page handler

```js
import { handleExampleCreditorLogin } from "./pages/example-creditor.mjs";
```

### 5.2 Create creditor button

```js
const exampleCreditorButton = button(
  "Example Creditor",
  createHandler("Example Creditor", handleExampleCreditorLogin)
);
```

If username callback is required, use:

```js
createHandler("Example Creditor", handleExampleCreditorLogin, {
  requiresUserName: true,
});
```

### 5.3 Add to `getActiveWebsites()`

```js
{
  name: "Example Creditor",
  button: exampleCreditorButton,
  handler: (cb) =>
    handleExampleCreditorLogin(getNationalID(), setupPageHandlersWithDisplay, cb),
}
```

If it needs username callback, match Kredinor pattern:

```js
handler: (cb) =>
  handleExampleCreditorLogin(
    getNationalID(),
    () => sessionState.userName,
    setupPageHandlersWithDisplay,
    cb
  ),
```

### 5.4 Add button to layout

Append the new button in `buttonsContainer.append(...)` (or where it should be visible).

## 6. Ensure Data Is Written In Expected Locations

For consistency with existing tooling/UI:

- Optional raw/manual creditor data: `exports/<person>/<date>/...`
- Normalized debt totals for loading: `extracted_data/<person>/<date>/...`
- Optional structured document extraction: `extracted_detailed_document/<person>/<date>/...`

Use helper functions in:

- `src/utils/utilities.mjs`
- `src/utils/fileOperations.mjs`

## 7. Validate End-To-End Behavior

Run the app:

```bash
npm start
```

Manual test checklist:

1. New creditor button appears.
2. Single-creditor flow works with valid fødselsnummer.
3. `Start` (visit-all) flow includes the new creditor in expected order.
4. Timeout path marks button as failed and shows error notification.
5. Success path marks button as visited and updates summary totals.
6. Files are created in `exports/` and `extracted_data/`.
7. Browser closes after completion/error.

## 8. Common Pitfalls

- Forgetting to call `onComplete` or `onTimeout` causes hanging workflows.
- Returning non-standard status strings breaks result handling in `handleScrapingResult(...)`.
- Skipping extracted output means debt totals may not show in UI.
- Missing `requiresUserName: true` for handlers expecting `getUserName` causes argument mismatch.

## 9. Recommended Minimal PR Scope

For a clean change set, include:

- `src/pages/<new-creditor>.mjs`
- `src/services/data.mjs`
- `src/renderer.mjs`
- `src/utils/schemas.mjs` (only if needed)
- Optional extraction/parser services for creditor-specific formats
- This documentation update if process changed
