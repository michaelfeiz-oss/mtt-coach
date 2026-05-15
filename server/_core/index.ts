import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "node:path";
import { listCharts } from "../local-study/db";
import { importTypedSeedsIntoLocalDb } from "../local-study/seedImport";
import { registerLocalStudyRoutes } from "../local-study/routes";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerLocalStudyRoutes(app);
  if (process.env.LOCAL_AUTO_IMPORT_SEEDS !== "false" && listCharts().length === 0) {
    const result = importTypedSeedsIntoLocalDb();
    console.log(
      `[Local Study] Imported typed seeds: ${result.imported} imported, ${result.skipped} skipped.`
    );
  }
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    const importDevServer = new Function("specifier", "return import(specifier)") as (
      specifier: string
    ) => Promise<typeof import("./vite")>;
    const { setupVite } = await importDevServer("./vite");
    await setupVite(app, server);
  } else {
    serveStaticLocal(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

function serveStaticLocal(app: express.Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

startServer().catch(console.error);
