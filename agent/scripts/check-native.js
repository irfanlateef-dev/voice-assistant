import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bindingPath = join(
  root,
  'node_modules/onnxruntime-node/bin/napi-v6',
  process.platform,
  process.arch,
  'onnxruntime_binding.node',
);

if (!existsSync(bindingPath)) {
  console.error(`
Silero VAD requires a native onnxruntime binary for ${process.platform}/${process.arch},
but it was not found at:
  ${bindingPath}

Fix options:
  1. Reinstall dependencies:
       rm -rf node_modules package-lock.json && npm install

  2. On Apple Silicon Mac, use arm64 Node (recommended):
       node -p process.arch   # should print "arm64"
     Install from https://nodejs.org/ (Apple Silicon installer) or:
       brew install node

  3. On Intel Mac / x64 Node, this project pins onnxruntime-node@1.23.0
     which still ships darwin/x64 binaries.
`);
  process.exit(1);
}
