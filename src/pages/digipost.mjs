import { digiPost } from '../data.mjs';
import { PUP } from '../scraper.mjs';

// Open Digipost page - same as renderer button
const { browser, page } = await PUP.openPage(digiPost.url);

console.log(`Opened ${digiPost.name} at ${digiPost.url}`);

// Wait for and click the login button
await page.waitForSelector('button.dds-button.dds-button--primary.dds-button--size-large');
await page.click('button.dds-button.dds-button--primary.dds-button--size-large');
console.log('Clicked login button');
// Wait for navigation to complete and then wait for BankID link

//Does not work now
await page.waitForNavigation({ waitUntil: 'networkidle2' });
await page.waitForSelector('a[href="/authorize/bankid"]', { visible: true });
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('a[href="/authorize/bankid"]')
]);
console.log('Clicked BankID link');

