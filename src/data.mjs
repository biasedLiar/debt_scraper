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

const digiPost = createTargetPage(
  "https://www.digipost.no/innlogging",
  "Digipost"
);

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
const kredinor = createTargetPage("https://minside.kredinor.no", "Kredinor");

//this website url is found in intrums page
const intrum = createTargetPage("https://minesider.intrum.no/", "Intrum");


const praGroup = createTargetPage("https://mypage.pragroup.no/", "PRA Group");

const zolva = createTargetPage(
  "https://portal.zolva.no/minside/Login",
  "Zolva AS"
);

//This ensures these configuration objects cannot be modified
Object.freeze(si);
Object.freeze(digiPost);
Object.freeze(kredinor);
Object.freeze(intrum);
Object.freeze(praGroup);
Object.freeze(zolva);

export { si, digiPost, kredinor, intrum, praGroup, zolva };
