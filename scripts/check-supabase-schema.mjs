#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!projectUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const requiredTables = ["users", "churches"];

async function tableExists(table) {
  const url = `${projectUrl}/rest/v1/${table}?select=id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (res.ok) return { exists: true };

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = { message: `HTTP ${res.status}` };
  }

  const code = String(body?.code ?? "").toUpperCase();
  const message = String(body?.message ?? "");

  const missing = code === "PGRST205" || message.includes("Could not find the table");
  return { exists: false, missing, code, message };
}

(async () => {
  const results = await Promise.all(requiredTables.map((t) => tableExists(t)));

  let hasMissing = false;

  for (let i = 0; i < requiredTables.length; i += 1) {
    const table = requiredTables[i];
    const result = results[i];

    if (result.exists) {
      console.log(`OK: public.${table}`);
      continue;
    }

    if (result.missing) {
      hasMissing = true;
      console.log(`MISSING: public.${table}`);
      continue;
    }

    console.log(`ERROR: public.${table} -> ${result.code || "UNKNOWN"} ${result.message || ""}`.trim());
  }

  if (hasMissing) {
    console.log("\nSchema not initialized for this project.");
    console.log("Run supabase-schema.sql in Supabase SQL Editor for your project.");
    process.exit(2);
  }

  console.log("\nSchema check passed.");
})();
