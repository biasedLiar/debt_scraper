/**
 *
 * @param url {string}
 * @returns {string}
 */
const shortenUrl = (url) => {
  return url.split("?")[0];
};

const excludeUrl = (url) => {
  if (typeof url !== "string") return true;
  if (url.endsWith(".js")) return true;
  if (url.endsWith(".mjs")) return true;
  if (url.endsWith(".css")) return true;
  if (url.endsWith(".html")) return true;
  if (url.endsWith("/js")) return true;
  if (url.endsWith("/css")) return true;
  if (url.endsWith(".php")) return true;
  if (url.endsWith(".svg")) return true;
  if (url.endsWith(".png")) return true;
  if (url.endsWith(".jpg")) return true;
  if (url.endsWith(".woff")) return true;
  if (url.endsWith(".woff2")) return true;
  if (url.endsWith(".webp")) return true;
  if (url.endsWith(".ttf")) return true;
  if (url.endsWith(".gif")) return true;
  if (url.endsWith(".txt")) return true;
  if (url.endsWith("jsx-runtime")) return true;
  if (url.includes("google-analytics")) return true;
  return url.length === 0;
};

// const webRequest = session.defaultSession.webRequest;
// w.webContents.debugger.attach("1.3");
// await w.webContents.debugger.sendCommand("Network.enable");
// w.webContents.debugger.on("message", (event, message, params) => {
//   if (message === "Network.responseReceived") {
//     const requestId = params.requestId;
//     // console.log(params.requestId);
//     // const _shortUrl = shortenUrl(params.response.url);
//     // console.log("85:" + url);
//
//     if (typeof requestId === "string" && requestId.length > 0) {
//       w.webContents.debugger
//         .sendCommand("Network.getResponseBody", { requestId })
//         .then((response) => {
//           const isEncoded = response.base64Encoded;
//           const body = response.body;
//           if (isEncoded) {
//             // console.log("CHECK FOR BACE64");
//           }
//           if (isJson(body)) {
//             const json = JSON.parse(body);
//             // console.log(json);
//           }
//         })
//         .catch((err) => {
//           // console.log(err);
//         });
//     }
//   }
// });
