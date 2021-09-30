import * as functions from "firebase-functions";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

let ssrServerServer: any;
export const ssrServer = functions.region("us-central1")
    .https.onRequest(async (request, response) => {
      if (!ssrServerServer) {
        functions.logger.info("Initialising SvelteKit SSR entry");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        ssrServerServer = require("./ssrServer/index").default;
        functions.logger.info("SvelteKit SSR entry initialised!");
      }
      functions.logger.info("Requested resource: " + request.originalUrl);
      return ssrServerServer(request, response);
    });
