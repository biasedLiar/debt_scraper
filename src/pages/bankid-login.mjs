/**
 * Reusable BankID login flow
 * @param {any} page - Puppeteer page object
 * @param {string} nationalID - The national identity number to use for login
 */
export async function loginWithBankID(page, nationalID) {
  // Wait for and click the BankID link
  try {
    await page.waitForSelector('a[href="/authorize/bankid"]', {
      timeout: 2000
    });
    await page.click('a[href="/authorize/bankid"]');
    console.log("Clicked BankID link");
  } catch (e) {
    console.log("Could not find/click BankID link:", e);
  }

  // Wait for and fill in the national identity number input
  try {
    if (nationalID) {
      await page.waitForSelector("input#nnin", { visible: true });

      await page.type("input#nnin", nationalID);
      console.log("Filled in national identity number");
    } else {
      console.log("No value to enter in national identity number field");
    }
  } catch (e) {
    console.error("Could not find/fill national identity number input:", e);
  }

  // Wait for and click the continue button
  try {
    await page.waitForSelector("button#nnin-next-button", { visible: true });
    await page.click("button#nnin-next-button");
    console.log("Clicked continue button");
  } catch (e) {
    console.error("Could not find/click continue button:", e);
  }


  // Wait for and click the "Bekreft innlogging" button if it appears
  try {
    const loginButton = await page.$('button#login-button');
    if (loginButton) {
      await page.waitForSelector('button#login-button', { visible: true, timeout: 3000 });
      await page.click('button#login-button');
      console.log('Clicked Bekreft innlogging button');
    } else {
      console.log('Bekreft innlogging button not found, skipping');
    } 
  } catch (e) {
    console.error('Could not find/click Bekreft innlogging button:', e);
  }


  await page.bringToFront()
}
