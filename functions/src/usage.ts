import { onRequest } from "firebase-functions/v2/https";

export const getFirestoreUsage = onRequest(async (req, res) => {
  res.send("Firestore usage endpoint is running.");
});
