import { execFileSync } from "node:child_process";
for (const script of ["scripts/verify-site.mjs", "scripts/verify-checkout.mjs"])
  execFileSync(process.execPath, [script], { stdio: "inherit" });
