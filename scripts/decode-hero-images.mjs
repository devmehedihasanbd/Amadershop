// Decodes the hero banner images from their base64 text form into public/.
//
// Why this exists: the GitHub snapshot-push API used to deploy this repo only
// accepts UTF-8 text files, so binary JPGs cannot be committed directly. The
// images live in scripts/hero-images.base64.json as text, and this script
// restores them. It runs automatically via the "postinstall" npm hook, so both
// local installs and Vercel builds get the images without any manual step.
// Idempotent: skips files that already exist.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

const data = JSON.parse(
  readFileSync(join(root, "scripts", "hero-images.base64.json"), "utf8")
);

let wrote = 0;
for (const [name, b64] of Object.entries(data)) {
  const out = join(publicDir, name);
  if (existsSync(out)) continue;
  writeFileSync(out, Buffer.from(b64, "base64"));
  wrote++;
  console.log(`[hero-images] decoded ${name}`);
}
if (!wrote) console.log("[hero-images] already present, nothing to do.");
