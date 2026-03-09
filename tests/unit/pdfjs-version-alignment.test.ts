import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { expect, test } from "vitest";

const require = createRequire(import.meta.url);

function readPackageVersion(relativePath: string) {
  const packageJson = JSON.parse(
    readFileSync(path.join(process.cwd(), relativePath), "utf8"),
  ) as { version: string };

  return packageJson.version;
}

test("top-level pdfjs-dist matches the version used by react-pdf", () => {
  const appVersion = readPackageVersion("node_modules/pdfjs-dist/package.json");
  const reactPdfVersion = JSON.parse(
    readFileSync(
      require.resolve("pdfjs-dist/package.json", {
        paths: [path.dirname(require.resolve("react-pdf/package.json"))],
      }),
      "utf8",
    ),
  ) as { version: string };

  expect(appVersion).toBe(reactPdfVersion.version);
});
