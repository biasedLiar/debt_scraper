import { si } from '../data.mjs';
import { PUP } from '../scraper.mjs';

// Open Statens Innkrevingssentral page - same as renderer button
const { browser, page } = await PUP.openPage(si.url);

console.log(`Opened ${si.name} at ${si.url}`);

// Page will stay open for user interaction
// Add any additional automation here if needed