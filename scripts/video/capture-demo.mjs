import { spawn } from "node:child_process";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import("@playwright/test"));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const outDir = path.join(root, "video", "public");
const outFile = path.join(outDir, "demo.webm");
const tmpDir = path.join(root, ".tmp-video-capture");
const port = Number(process.env.VIDEO_PORT || 5176);
const baseURL = `http://localhost:${port}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`El servidor no respondió en ${url} dentro de ${timeoutMs}ms`);
}

async function newestWebm(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await newestWebm(full).catch(() => [])));
    } else if (e.name.endsWith(".webm")) {
      const s = await stat(full);
      files.push({ full, mtime: s.mtimeMs });
    }
  }
  return files.sort((a, b) => b.mtime - a.mtime)[0]?.full;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const dev = spawn(npmCmd, ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      VITE_AUTH_MODE: "demo",
      VITE_DEMO_ROLE: "administrador",
    },
    stdio: "pipe",
  });

  dev.stdout.on("data", (d) => process.stdout.write(`[vite] ${d}`));
  dev.stderr.on("data", (d) => process.stderr.write(`[vite] ${d}`));

  let browser;
  let context;
  try {
    await waitForServer(baseURL);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: tmpDir, size: { width: 1280, height: 720 } },
      locale: "es-ES",
    });
    const page = await context.newPage();

    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);

    // Login demo (usa email válido y contraseña >= 8 chars)
    await page.fill("#username", "admin@cujae.edu.cu");
    await page.fill("#password", "demo12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/$/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const routes = ["/", "/infraestructura", "/estudiantes", "/planificacion-deberes", "/asignacion-cuartos"];
    for (const route of routes) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2500);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(1200);
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(800);
    }

    await context.close();
    context = null;
    await browser.close();
    browser = null;

    const recorded = await newestWebm(tmpDir);
    if (!recorded) throw new Error("No se encontró el video grabado por Playwright.");
    await rm(outFile, { force: true });
    await rename(recorded, outFile);
    console.log(`Video guardado en: ${outFile}`);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    dev.kill();
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(dev.pid), "/f", "/t"], { stdio: "ignore" });
    }
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
