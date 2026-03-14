console.log("Starting server script...");
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

console.log("Initializing database...");
const db = new Database("overlays.db");

// Initialize database with migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS overlays (
    id TEXT PRIMARY KEY,
    name TEXT,
    title TEXT,
    subtitle TEXT,
    color TEXT,
    active INTEGER DEFAULT 0
  )
`);

// Migration: Add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(overlays)").all() as any[];
const columnNames = columns.map(c => c.name);

const migrations = [
  { name: 'fontSizeTitle', type: 'INTEGER DEFAULT 36' },
  { name: 'fontSizeSubtitle', type: 'INTEGER DEFAULT 20' },
  { name: 'bgColor', type: 'TEXT DEFAULT "#18181b"' },
  { name: 'textColor', type: 'TEXT DEFAULT "#ffffff"' },
  { name: 'positionX', type: 'INTEGER DEFAULT 5' },
  { name: 'positionY', type: 'INTEGER DEFAULT 85' },
  { name: 'animationType', type: 'TEXT DEFAULT "slide-left"' },
  { name: 'fontFamily', type: 'TEXT DEFAULT "sans"' },
  { name: 'borderRadius', type: 'INTEGER DEFAULT 16' },
  { name: 'width', type: 'INTEGER DEFAULT 0' },
  { name: 'height', type: 'INTEGER DEFAULT 0' },
  { name: 'rotation', type: 'INTEGER DEFAULT 0' },
  { name: 'bgImage', type: 'TEXT DEFAULT ""' },
  { name: 'shortcut', type: 'TEXT DEFAULT ""' },
  { name: 'layoutType', type: 'TEXT DEFAULT "standard"' },
  { name: 'styleVariant', type: 'TEXT DEFAULT "default"' },
  { name: 'customData', type: 'TEXT DEFAULT "{}"' },
  { name: 'titleX', type: 'INTEGER DEFAULT 0' },
  { name: 'titleY', type: 'INTEGER DEFAULT 0' },
  { name: 'subtitleX', type: 'INTEGER DEFAULT 0' },
  { name: 'subtitleY', type: 'INTEGER DEFAULT 0' },
  { name: 'textAlign', type: 'TEXT DEFAULT "left"' }
];

migrations.forEach(m => {
  if (!columnNames.includes(m.name)) {
    db.exec(`ALTER TABLE overlays ADD COLUMN ${m.name} ${m.type}`);
  }
});

// Helper to check if two overlays overlap
function checkOverlap(o1: any, o2: any) {
  const getRect = (o: any) => {
    const w = o.width || 800;
    const h = o.height || 120;
    
    // Tickers are always at the bottom, full width
    if (o.layoutType === 'ticker') {
      return { x: 0, y: 1080 - h, w: 1920, h: h };
    }
    
    // Standard layouts use positionX/Y as center percentages
    const cx = (1920 * (o.positionX || 0)) / 100;
    const cy = (1080 * (o.positionY || 0)) / 100;
    
    return {
      x: cx - w / 2,
      y: cy - h / 2,
      w: w,
      h: h
    };
  };

  const r1 = getRect(o1);
  const r2 = getRect(o2);

  // Check if rectangles intersect
  return !(r2.x >= r1.x + r1.w || 
           r2.x + r2.w <= r1.x || 
           r2.y >= r1.y + r1.h ||
           r2.y + r2.h <= r1.y);
}

import fs from "fs";

async function startServer() {
  try {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

  // API Routes
  app.get("/api/overlays", (req, res) => {
    const overlays = db.prepare("SELECT * FROM overlays").all() as any[];
    res.json(overlays.map(o => ({ 
      ...o, 
      active: !!o.active,
      customData: o.customData ? JSON.parse(o.customData) : {}
    })));
  });

  app.post("/api/overlays", (req, res) => {
    const { 
      id, name, title, subtitle, color, shortcut,
      fontSizeTitle, fontSizeSubtitle, bgColor, textColor, 
      positionX, positionY, animationType, layoutType, styleVariant, fontFamily, borderRadius,
      width, height, rotation, bgImage, customData,
      titleX, titleY, subtitleX, subtitleY, textAlign
    } = req.body;
    
    db.prepare(`
      INSERT OR REPLACE INTO overlays (
        id, name, title, subtitle, color, active, shortcut,
        fontSizeTitle, fontSizeSubtitle, bgColor, textColor,
        positionX, positionY, animationType, layoutType, styleVariant, fontFamily, borderRadius,
        width, height, rotation, bgImage, customData,
        titleX, titleY, subtitleX, subtitleY, textAlign
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, title, subtitle, color, 0, shortcut || '',
      fontSizeTitle || 36, fontSizeSubtitle || 20, bgColor || '#18181b', textColor || '#ffffff',
      positionX || 5, positionY || 85, animationType || 'slide-left', layoutType || 'standard', styleVariant || 'default', fontFamily || 'sans', borderRadius || 16,
      width || 0, height || 0, rotation || 0, bgImage || '', customData ? JSON.stringify(customData) : '{}',
      titleX || 0, titleY || 0, subtitleX || 0, subtitleY || 0, textAlign || 'left'
    );
    
    res.json({ success: true });
    io.emit("overlays_updated");
  });

  app.delete("/api/overlays/:id", (req, res) => {
    db.prepare("DELETE FROM overlays WHERE id = ?").run(req.params.id);
    res.json({ success: true });
    io.emit("overlays_updated");
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("toggle_overlay", ({ id, active }) => {
      try {
        if (active) {
          // Get the overlay we are trying to activate
          const newOverlay = db.prepare("SELECT * FROM overlays WHERE id = ?").get(id) as any;
          if (newOverlay) {
            // Get all currently active overlays
            const activeOverlays = db.prepare("SELECT * FROM overlays WHERE active = 1").all() as any[];
            
            // Check for overlaps
            for (const existing of activeOverlays) {
              if (existing.id !== id && checkOverlap(newOverlay, existing)) {
                // Deactivate overlapping overlay
                db.prepare("UPDATE overlays SET active = 0 WHERE id = ?").run(existing.id);
                io.emit("overlay_toggled", { id: existing.id, active: false });
              }
            }
          }
        }

        db.prepare("UPDATE overlays SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
        io.emit("overlay_toggled", { id, active });
      } catch (error) {
        console.error("Error in toggle_overlay:", error);
      }
    });

    socket.on("update_overlay", (overlay) => {
      try {
        db.prepare(`
          UPDATE overlays SET 
            name = ?, title = ?, subtitle = ?, color = ?, shortcut = ?,
            fontSizeTitle = ?, fontSizeSubtitle = ?, bgColor = ?, textColor = ?,
            positionX = ?, positionY = ?, animationType = ?, layoutType = ?, styleVariant = ?, fontFamily = ?, borderRadius = ?,
            width = ?, height = ?, rotation = ?, bgImage = ?, customData = ?,
            titleX = ?, titleY = ?, subtitleX = ?, subtitleY = ?, textAlign = ?
          WHERE id = ?
        `).run(
          overlay.name, overlay.title, overlay.subtitle, overlay.color, overlay.shortcut || '',
          overlay.fontSizeTitle, overlay.fontSizeSubtitle, overlay.bgColor, overlay.textColor,
          overlay.positionX, overlay.positionY, overlay.animationType, overlay.layoutType, overlay.styleVariant, overlay.fontFamily, overlay.borderRadius,
          overlay.width, overlay.height, overlay.rotation, overlay.bgImage, overlay.customData ? JSON.stringify(overlay.customData) : '{}',
          overlay.titleX || 0, overlay.titleY || 0, overlay.subtitleX || 0, overlay.subtitleY || 0, overlay.textAlign || 'left',
          overlay.id
        );
        io.emit("overlays_updated");
      } catch (error) {
        console.error("Error in update_overlay:", error);
      }
    });
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
  console.log(`Attempting to listen on port ${PORT}...`);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully running on http://localhost:${PORT}`);
  });
} catch (error: any) {
  fs.writeFileSync("server_error.log", error.stack || error.message);
  console.error("Server failed to start:", error);
}
}

startServer();
