const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json()); 
app.use(express.static(__dirname)); 

// Datenbank-Verbindung herstellen
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Fehler beim Erstellen der Datenbank:', err.message);
    } else {
        console.log('Erfolgreich mit der SQLite-Datenbank verbunden.');
        
        // db.serialize sorgt dafür, dass die Befehle schön nacheinander ausgeführt werden
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS personen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vorname TEXT NOT NULL,
                nachname TEXT NOT NULL,
                votes INTEGER DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS vergleiche (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person_a_id INTEGER NOT NULL,
                person_b_id INTEGER NOT NULL,
                FOREIGN KEY (person_a_id) REFERENCES personen (id),
                FOREIGN KEY (person_b_id) REFERENCES personen (id)
            )`);

            // Wir prüfen, ob schon Personen in der Tabelle sind
            db.get("SELECT COUNT(*) AS count FROM personen", (err, row) => {
                if (row.count === 0) {
                    console.log("Datenbank ist leer. Füge Testdaten ein...");
                    // Personen einfügen
                    db.run(`INSERT INTO personen (vorname, nachname) VALUES 
                        ('Max', 'Müller'), 
                        ('Arnold', 'Schwarzenegger'), 
                        ('Lisa', 'Kurz'), 
                        ('Annegret', 'Kramp-Karrenbauer')`);
                    
                    // Duelle einfügen (1 vs 2, und 3 vs 4)
                    db.run(`INSERT INTO vergleiche (person_a_id, person_b_id) VALUES (1, 2), (3, 4)`);
                }
            });
        });
    }
});

// --- UNSERE API-ROUTEN ---

// 1. GET /comparison - Holt ein zufälliges Duell
app.get('/comparison', (req, res) => {
    // Dieser SQL-Befehl verknüpft (JOIN) die Duelle mit den echten Namen der Personen
    const query = `
        SELECT 
            v.id AS comparison_id,
            p1.vorname AS vorname_a,
            p1.nachname AS nachname_a,
            p2.vorname AS vorname_b,
            p2.nachname AS nachname_b
        FROM vergleiche v
        JOIN personen p1 ON v.person_a_id = p1.id
        JOIN personen p2 ON v.person_b_id = p2.id
        ORDER BY RANDOM() LIMIT 1
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Schickt die Daten im JSON-Format zurück ans Frontend
        res.json(row); 
    });
});

// 2. POST /vote - Speichert die Abstimmung
app.post('/vote', (req, res) => {
    // Diese Daten erwarten wir vom Frontend
    const comparison_id = req.body.comparison_id;
    const winner = req.body.winner; 

    // 1. Zuerst holen wir uns die IDs der beiden Personen aus dem gespielten Duell
    db.get(`SELECT person_a_id, person_b_id FROM vergleiche WHERE id = ?`, [comparison_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Duell nicht gefunden" });

        // 2. Wer soll den Punkt bekommen?
        let gewinner_id = null;
        if (winner === 'A') {
            gewinner_id = row.person_a_id;
        } else if (winner === 'B') {
            gewinner_id = row.person_b_id;
        }

        // 3. Wenn es einen klaren Gewinner gibt, aktualisieren wir die Votes
        if (gewinner_id) {
            db.run(`UPDATE personen SET votes = votes + 1 WHERE id = ?`, [gewinner_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                // 4. Wie gewünscht: Die neuen Votes auslesen und zurückgeben
                db.get(`SELECT votes FROM personen WHERE id = ?`, [gewinner_id], (err, personRow) => {
                    res.json({ success: true, updated_votes: personRow.votes });
                });
            });
        } else {
            // Bei einem Unentschieden (tie / gleich) verteilen wir keine Punkte
            res.json({ success: true, message: "Unentschieden gespeichert (keine Punkte verteilt)." });
        }
    });
});

// 3. GET /leaderboard - Gibt die Rangliste zurück
app.get('/leaderboard', (req, res) => {
    // Wir holen alle Personen und sortieren sie absteigend (DESC) nach ihren Stimmen
    const query = `
        SELECT vorname, nachname, votes 
        FROM personen 
        ORDER BY votes DESC
    `;

    // db.all() holt mehrere Zeilen auf einmal (im Gegensatz zu db.get für nur eine Zeile)
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Schickt die fertige Liste als JSON ans Frontend
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server läuft: http://localhost:${port}`);
});