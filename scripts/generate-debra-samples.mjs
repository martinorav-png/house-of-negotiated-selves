#!/usr/bin/env node
/**
 * Generate one Debra intro clip per voice ID (for A/B testing candidates).
 *
 * Debra is pre-recorded (not live). Only the final hexagon avatar uses real-time TTS.
 * This script uses eleven_v3 so emotion tags in debra-intro.txt are honored.
 *
 * Usage:
 *   npm run samples:debra -- OYTbf65OHHFELVut7v2H kdmDKE6EkgrWrrykO9Qt
 *   npm run samples:debra                    # defaults to Hope
 *
 * Pass ElevenLabs voice IDs as arguments. Names are fetched for filenames.
 * Optional label override: VOICE_ID:my-label → my-label_intro.mp3
 *
 * Requires ELEVENLABS_API_KEY in .env or environment.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "samples", "debra-votes");

const MODEL_ID = "eleven_v3"; // Debra is pre-recorded; v3 supports [happy], [chuckles], etc.
const DEFAULT_VOICE_IDS = ["OYTbf65OHHFELVut7v2H"]; // Hope

const VOICE_SETTINGS = {
  stability: 0.6,
  similarity_boost: 0.75,
  speed: 1.1,
};

const INTRO = `[happy] Well, hello there! Look at you, walking right in - [chuckles] I love that already. I'm Debra, and I'll be with you the whole way through. See, we've been thinking a lot about the little ways technology gets to know us, sometimes better than we know ourselves, and what happens when it starts... offering things back. [thoughtful] Nothing to worry about, of course - this is just you, being seen, being understood. So go on, follow the lights ahead, and let's see who you really are. Together.`;

function slugify(name) {
  return name
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function parseVoiceArg(arg) {
  const sep = arg.indexOf(":");
  if (sep === -1) {
    return { id: arg.trim(), label: null };
  }
  return {
    id: arg.slice(0, sep).trim(),
    label: arg.slice(sep + 1).trim() || null,
  };
}

async function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function getVoice(apiKey, voiceId) {
  const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Voice lookup failed (${res.status}): ${detail}`);
  }

  return res.json();
}

async function resolveVoice(apiKey, { id, label }) {
  if (!id) {
    throw new Error("Empty voice ID");
  }

  if (label) {
    return { id, name: label, slug: slugify(label) };
  }

  try {
    const meta = await getVoice(apiKey, id);
    const name = meta.name ?? id;
    return {
      id,
      name,
      slug: slugify(name),
    };
  } catch (err) {
    // Library voices may fail metadata lookup but still work for TTS
    console.warn(`    lookup failed (${err.message}) - will try TTS anyway`);
    return { id, name: id, slug: id.slice(0, 8).toLowerCase() };
  }
}

async function synthesize(apiKey, voiceId, text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`TTS failed (${res.status}): ${detail}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await loadEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    console.error(
      "Missing ELEVENLABS_API_KEY. Copy .env.example to .env and paste your key."
    );
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const voiceArgs =
    args.length > 0
      ? args.map(parseVoiceArg)
      : DEFAULT_VOICE_IDS.map((id) => ({ id, label: null }));

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Voice IDs: ${voiceArgs.map((v) => v.id).join(", ")}\n`);

  const voices = [];
  for (const voiceArg of voiceArgs) {
    process.stdout.write(`  ${voiceArg.id}... `);
    const voice = await resolveVoice(apiKey, voiceArg);
    voices.push(voice);
    console.log(`→ ${voice.name}`);
  }

  if (voices.length === 0) {
    console.error("\nNo voices resolved. Check IDs and API key scopes.");
    process.exit(1);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    model: MODEL_ID,
    voiceSettings: VOICE_SETTINGS,
    intro: INTRO,
    voices,
    files: [],
  };

  let ok = 0;
  let failed = 0;

  console.log("");

  for (const [index, voice] of voices.entries()) {
    const number = index + 1;
    const filename = `${number}-${voice.slug}_intro.mp3`;
    const outPath = path.join(OUT_DIR, filename);
    process.stdout.write(`Generating ${number}. ${voice.name} (${voice.id})... `);

    try {
      const audio = await synthesize(apiKey, voice.id, INTRO);
      await writeFile(outPath, audio);
      manifest.files.push({
        number,
        voiceId: voice.id,
        name: voice.name,
        slug: voice.slug,
        file: filename,
        reaction: ["one", "two", "three", "four", "five", "six", "seven", "eight"][index] ?? String(number),
      });
      console.log("done");
      ok++;
    } catch (err) {
      console.log("FAILED");
      console.error(`  ${err.message}`);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nFinished: ${ok} ok, ${failed} failed`);
  console.log(`Samples in: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
