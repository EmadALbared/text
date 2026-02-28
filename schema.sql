-- 1. Tabelle für die Personen
CREATE TABLE IF NOT EXISTS personen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    votes INTEGER DEFAULT 0
);

-- 2. Tabelle für die Duelle (Vergleiche)
CREATE TABLE IF NOT EXISTS vergleiche (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_a_id INTEGER NOT NULL,
    person_b_id INTEGER NOT NULL,
    -- Hier sind die "proper relationships" (Fremdschlüssel):
    FOREIGN KEY (person_a_id) REFERENCES personen (id),
    FOREIGN KEY (person_b_id) REFERENCES personen (id)
);

-- 3. Ein paar Test-Daten einfügen, damit wir gleich was zu sehen haben!
INSERT INTO personen (vorname, nachname, votes) VALUES ('Max', 'Müller', 0);
INSERT INTO personen (vorname, nachname, votes) VALUES ('Arnold', 'Schwarzenegger', 0);
INSERT INTO personen (vorname, nachname, votes) VALUES ('Lisa', 'Kurz', 0);
INSERT INTO personen (vorname, nachname, votes) VALUES ('Annegret', 'Kramp-Karrenbauer', 0);

-- 4. Ein paar Duelle erstellen (verknüpft über die IDs der Personen)
-- Duell 1: Max (ID 1) gegen Arnold (ID 2)
INSERT INTO vergleiche (person_a_id, person_b_id) VALUES (1, 2);
-- Duell 2: Lisa (ID 3) gegen Annegret (ID 4)
INSERT INTO vergleiche (person_a_id, person_b_id) VALUES (3, 4);