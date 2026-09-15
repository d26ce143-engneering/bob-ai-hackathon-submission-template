const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite database
const dbPath = path.join(__dirname, "maintenance.db");
const db = new Database(dbPath);

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,
    tail TEXT NOT NULL,
    model TEXT,
    component TEXT,
    maintenance_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    maintenance_date TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Scheduled',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// GET all maintenance records
app.get("/api/maintenance", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM maintenance
      ORDER BY maintenance_date ASC, id DESC
    `).all();

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to load maintenance records"
    });
  }
});

// ADD maintenance record
app.post("/api/maintenance", (req, res) => {
  try {
    const {
      assetId,
      tail,
      model,
      component,
      type,
      priority,
      date,
      notes
    } = req.body;

    if (!assetId || !tail || !type || !priority || !date) {
      return res.status(400).json({
        error: "Required maintenance information is missing"
      });
    }

    const result = db.prepare(`
      INSERT INTO maintenance
      (
        asset_id,
        tail,
        model,
        component,
        maintenance_type,
        priority,
        maintenance_date,
        notes,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assetId,
      tail,
      model || "",
      component || "",
      type,
      priority,
      date,
      notes || "",
      "Scheduled"
    );

    const newRecord = db.prepare(`
      SELECT *
      FROM maintenance
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newRecord);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to save maintenance record"
    });
  }
});

// DELETE maintenance record
app.delete("/api/maintenance/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    db.prepare(`
      DELETE FROM maintenance
      WHERE id = ?
    `).run(id);

    res.json({
      message: "Maintenance record deleted"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete maintenance record"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});