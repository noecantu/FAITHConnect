import { onRequest } from "firebase-functions/v2/https";
import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

// Add this interface ABOVE your function
interface MonitoringResponse {
  timeSeries?: Array<{
    points?: Array<{
      value?: {
        int64Value?: string;
      };
    }>;
  }>;
}

export const getFirestoreUsage = onRequest(async (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  try {
    const firebaseConfig = process.env.FIREBASE_CONFIG
      ? JSON.parse(process.env.FIREBASE_CONFIG)
      : null;

    const projectId =
      process.env.GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      firebaseConfig?.projectId;

    if (!projectId) {
      res.status(500).json({ error: "Missing project ID" });
      return;
    }

    // Time window: last 24 hours
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const url =
      `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
      "?filter=metric.type=\"firestore.googleapis.com/database/disk/usage\"" +
      `&interval.endTime=${end}` +
      `&interval.startTime=${start}`;

    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    });

    const data = (await response.json()) as MonitoringResponse;

    console.log("Monitoring API response:", JSON.stringify(data, null, 2));

    const usageBytes =
      data.timeSeries?.[0]?.points?.[0]?.value?.int64Value ?? null;

    res.json({ usageBytes });

  } catch (err) {
    console.error("Error fetching Firestore usage:", err);
    res.status(500).json({ error: "Failed to fetch Firestore usage" });
  }
});
