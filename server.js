import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { nanoid } from "nanoid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3004;
const ADMIN_KEY = process.env.ADMIN_KEY || "changeme";
const ORIGIN = process.env.ORIGIN || "*";

const app = express();
app.use(helmet({
  contentSecurityPolicy: false // wir lassen es simpel; kann bei Bedarf gehärtet werden
}));
app.use(cors({ origin: ORIGIN === "*" ? true : ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

// DB init
let db;
async function initDb() {
  db = await open({
    filename: path.join(__dirname, "data", "rsvps.db"),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rsvp (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      guests TEXT,            -- kommaseparierte Namen der Begleitung
      kids_count INTEGER,     -- Anzahl Kinder
      attendance TEXT NOT NULL CHECK (attendance IN ('yes','no','friday')),
      notes TEXT,
      user_agent TEXT,
      ip TEXT
    );
  `);
}
await initDb();

// Helpers
function requireAdmin(req, res, next) {
  const key = req.query.key || req.header("x-admin-key");
  if (key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// API: RSVP speichern
app.post("/api/rsvp", async (req, res) => {
  try {
    const { name, guests, kidsCount, attendance, notes } = req.body || {};

    // kleine Validierung
    const attMap = { "wir_kommen": "yes", "wir_kommen_nicht": "no", "wir_kommen_am_freitag": "friday" };
    const att = attMap[attendance];

    if (!name || !att) {
      return res.status(400).json({ error: "Bitte Name & Auswahl angeben." });
    }

    const id = nanoid(12);
    const created_at = new Date().toISOString();
    const user_agent = req.get("user-agent") || "";
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress;

    await db.run(
      `INSERT INTO rsvp (id, created_at, name, guests, kids_count, attendance, notes, user_agent, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        created_at,
        String(name).trim(),
        guests ? String(guests).trim() : null,
        Number.isFinite(+kidsCount) ? +kidsCount : null,
        att,
        notes ? String(notes).trim() : null,
        user_agent,
        ip
      ]
    );

    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// API: Admin – alle RSVPs
app.get("/api/admin/rsvps", requireAdmin, async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM rsvp ORDER BY datetime(created_at) DESC`);
    res.json({ rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// API: Admin – Stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const get = async (val) => (await db.get(`SELECT COUNT(*) as c FROM rsvp WHERE attendance = ?`, [val])).c;
    const yes = await get("yes");
    const no = await get("no");
    const friday = await get("friday");
    const total = (await db.get(`SELECT COUNT(*) as c FROM rsvp`)).c;
    const kids = (await db.get(`SELECT COALESCE(SUM(kids_count),0) as k FROM rsvp`)).k;
    res.json({ total, yes, no, friday, kids });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// API: Admin – CSV Export
app.get("/api/admin/export.csv", requireAdmin, async (req, res) => {
  try {
    const rows = await db.all(`SELECT * FROM rsvp ORDER BY datetime(created_at) DESC`);
    const header = ["id","created_at","name","guests","kids_count","attendance","notes","user_agent","ip"];
    const csv = [
      header.join(","),
      ...rows.map(r => header.map(h => {
        const v = r[h] ?? "";
        const s = String(v).replaceAll('"','""');
        return `"${s}"`;
      }).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="rsvps_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).send("Serverfehler");
  }
});

// Fallback -> index.html (für schöne URLs)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server läuft auf http://127.0.0.1:${PORT}`);
});
