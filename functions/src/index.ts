import * as functions from "firebase-functions";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ignore = () => {};

const deleteCodeDoc = (uid: string) => functions.app.admin.firestore()
    .collection("codes").where("test", "==", uid).get().then(
        (codes) => codes.forEach((code) => code.ref.delete())
    ).catch(ignore);

export const deleteUserRelatedDoc = functions.auth.user().onDelete(
    async (user) => {
      const collection = user.email ? "testers" : "tests";
      const db = functions.app.admin.firestore();
      db.collection(collection).doc(user.uid).delete().catch(ignore);

      if (collection === "tests") deleteCodeDoc(user.uid);
    }
);

export const docRelatedUser = functions.firestore
    .document("{collection}/{uid}").onDelete(
        async (_, context) => {
          const {collection, uid} = context.params as { [key: string]: string };
          if (!collection.startsWith("test")) return;
          const auth = functions.app.admin.auth();
          auth.deleteUser(uid).catch(ignore);

          if (collection === "tests") deleteCodeDoc(uid);
        }
    );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
