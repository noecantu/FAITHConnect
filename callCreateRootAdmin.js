/**
 * One‑time script to call the createRootAdmin Cloud Function.
 * Run with: node callCreateRootAdmin.js
 */

import fetch from "node-fetch";

// Replace with your actual function URL from Firebase Console
const FUNCTION_URL = "https://createrootadmin-nn2kyrzdaa-uc.a.run.app";

async function callCreateRootAdmin() {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Callable functions expect a JSON body with a "data" field
      body: JSON.stringify({ data: {} }),
    });

    const result = await response.json();
    console.log("Function response:", result);
  } catch (err) {
    console.error("Error calling createRootAdmin:", err);
  }
}

callCreateRootAdmin();
