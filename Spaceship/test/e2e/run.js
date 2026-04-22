/**
 * Standalone driver for Spaceship E2E tests.
 *
 * Spins up the repo's static server on a free port, launches headless
 * Chrome via puppeteer, runs the test suite, and exits with a non-zero
 * code on failure.
 *
 * Run via: npm run test-e2e-spaceship
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from '../../../utils/server.js';
import { testSpaceshipBuilder } from './spaceship-builder.test.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

const server = createServer({ root: REPO_ROOT });
await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
    server.listen(0);  // OS picks a free port
});
const { port } = server.address();
console.log(`Test server listening on port ${port} (root: ${REPO_ROOT})`);

// Mirror the launch flags used by test/e2e/puppeteer.js — they're known to
// work in CI, give us a stable profile directory, and enable swiftshader so
// WebGL-backed three.js content actually renders in headless mode.
const browser = await puppeteer.launch({
    headless: process.env.VISIBLE ? false : 'new',
    args: [
        '--hide-scrollbars',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--no-sandbox'
    ],
    defaultViewport: { width: 1280, height: 800 },
    handleSIGINT: false,
    protocolTimeout: 0,
    userDataDir: './.puppeteer_profile'
});

let exitCode = 0;
try {
    const page = await browser.newPage();
    await testSpaceshipBuilder(page, { baseUrl: `http://localhost:${port}` });
} catch (err) {
    console.error('\n❌ E2E test failed:\n', err);
    exitCode = 1;
} finally {
    await browser.close();
    server.close();
}

process.exit(exitCode);
