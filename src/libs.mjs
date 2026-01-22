const puppeteer = require("puppeteer-extra");
const { z } = require("zod");

puppeteer.use(require('puppeteer-extra-plugin-user-preferences')({
  userPrefs: {
    download: {
      prompt_for_download: false,
      open_pdf_in_system_reader: true
    },
    plugins: {
      always_open_pdf_externally: true
    }
  }
}));

export const LIBS = {
  puppeteer,
  z,
};
