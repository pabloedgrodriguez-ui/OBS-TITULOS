import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);

    app.use(express.json({ limit: '10mb' }));

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Explicit route for overlay to avoid 404s on some proxies
    app.get("/overlay", (req, res, next) => {
      if (process.env.NODE_ENV === "production") {
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
      } else {
        next(); // Let Vite handle it
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    const PORT = 3000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error: any) {
    fs.writeFileSync("server_error.log", error.stack || error.message);
    console.error("Server failed to start:", error);
  }
}

startServer();
