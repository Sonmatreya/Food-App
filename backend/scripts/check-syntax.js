const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const ignoredDirectories = new Set(["node_modules", ".git"]);
const files = [];

function collectJavaScript(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        collectJavaScript(path.join(directory, entry.name));
      }
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.join(directory, entry.name));
    }
  }
}

collectJavaScript(root);
files.sort();

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    failed = true;
    console.error(`\nSyntax check failed: ${path.relative(root, file)}`);
    if (result.stderr) console.error(result.stderr.trim());
    if (result.stdout) console.error(result.stdout.trim());
  }
}

if (failed) {
  console.error("\nBackend syntax check failed.");
  process.exitCode = 1;
} else {
  console.log(`Backend syntax check passed (${files.length} JavaScript files).`);
}
