import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const licenses = new Set([
  "MIT",
  "Apache-2.0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "(MIT OR Apache-2.0)",
  "MIT OR Apache-2.0",
  "0BSD",
]);
let count = 0;
for (const [name, item] of Object.entries(lock.packages)) {
  if (name === "") continue;
  if (
    !licenses.has(item.license) ||
    !item.resolved?.startsWith("https://registry.npmjs.org/") ||
    !/^sha512-[A-Za-z0-9+/=]+$/.test(item.integrity ?? "") ||
    item.hasInstallScript
  )
    throw new Error(`Review dependency: ${name}`);
  count++;
}
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/,
  /mfa\.[A-Za-z0-9_-]{60,}/,
  /[A-Za-z0-9_-]{23,30}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,}/,
];
let files = 0;
function scan(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(item.name)) continue;
    const file = join(directory, item.name);
    if (item.name === ".env" || (item.name.startsWith(".env.") && item.name !== ".env.example"))
      throw new Error("Private environment file present; do not publish it");
    if (item.isDirectory()) {
      scan(file);
      continue;
    }
    if (item.isSymbolicLink()) throw new Error("Unexpected symlink");
    const text = readFileSync(file, "utf8");
    if (patterns.some((pattern) => pattern.test(text)))
      throw new Error(`Possible credential in ${file}`);
    files++;
  }
}
scan(".");
console.log(
  `Supply check: ${count} license/registry/SHA-512/no-install-script entries; ${files} source files scanned for credential patterns.`,
);
