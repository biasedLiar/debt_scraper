import { LIBS } from "./libs.mjs";
const { z } = LIBS;
/**
 * @typedef {Object} Person
 * @property {string} name
 * @property {number} age
 */

/** @type {Person[]} */

/**
 * @type {Array<{ id: number, email: string }>}
 */

/**
 *
 * @param url {string}
 * @param name {string}
 * @returns {{url: string, name: string, description: string, manifestUrl: string, instructions: string, apiData: Array<{url: import("zod").ZodURL, data: import("zod").ZodJSONSchema}>}}
 */
const createTargetPage = (url, name) => {
  return {
    url,
    name,
    description: "",
    manifestUrl: "",
    instructions: "",
    apiData: [],
  };
};

/**
 *
 * @param url {string}
 * @returns {{url: import("zod").ZodURL, data: import("zod").ZodJSONSchema}}}
 */
const createJsonData = (url) => {
  return { url: z.url().startsWith(url), data: z.json() };
};

const si = createTargetPage(
  "https://skatt.skatteetaten.no/web/skyldnerportal/krav",
  "Statens Innkrevingssentral"
);

si.apiData = [
  {
    url: z
      .url(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-om-meg-api/v1/basisinfo"
      )
      .includes("basisinfo"),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-api/v1/utlegg"
      ),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-api/v1/krav"
      ),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-om-meg-api/v1//mineopplysninger"
      ),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-api/v1/krav/ferdige"
      ),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith(
        "https://skatt.skatteetaten.no/api/mii-skyldnerportal-api/v1/betalingsordning"
      ),
    data: z.json(),
  },
];

const digiPost = createTargetPage("https://www.digipost.no/innlogging", "Digipost");

digiPost.manifestUrl = "https://www.digipost.no/postkasse/manifest.json";


digiPost.apiData = [
  {
    url: z
      .url()
      .startsWith("https://www.digipost.no/post/api/private/accounts")
      .includes("mailboxsettings"),
    data: z.json(),
  },
  {
    url: z
      .url()
      .startsWith("https://www.digipost.no/post/api/private/mailbox")
      .includes("documents/inbox"),
    data: z.json(),
  },
];

// this website url is found in kredinors page
const kredinor = createTargetPage("https://www.ident.nets.eu/its/index.html?forcepkivendor=no_bankid&acr_values=urn:bankid:bis&mid=KRAEAXIFGDWK&TARGET=https%3A%2F%2Fminside.kredinor.no%2F%3Flocale%3Dnb%26login&locale=nb-NO&status=https%3A%2F%2Flogin.kredinor.no%2Flogin%2Fstatus%3FreturnUrlbtoa%3DaHR0cHM6Ly9taW5zaWRlLmtyZWRpbm9yLm5vLz9sb2NhbGU9bmImbG9naW4-%26errorCode%3D", "Kredinor");

//this wesite url is found in intrums page
const intrum = createTargetPage(
  "https://mine-sider.app.signicat.com/auth/open/connect/authorize?ui_locales=nb&scope=openid nin profile&acr_values=idp:nbid nbid_idp:BID&response_type=code&client_id=prod-poised-cake-655&redirect_uri=https://identity.lindorff.com/Tupas/NO/SignicatOIDC/Verify&state=20251210170959021115_idp:nbid nbid_idp:BID",
  "Intrum"
);

const tfBank = createTargetPage("https://tfbank.no/", "tfBank");

//This ensures these configuration objects cannot be modified
Object.freeze(si);
Object.freeze(digiPost);
Object.freeze(kredinor);
Object.freeze(intrum);
Object.freeze(tfBank);

export { si, digiPost, kredinor, intrum, tfBank };
