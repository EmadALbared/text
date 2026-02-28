// 1. Wir holen uns die HTML-Elemente
const btnA = document.getElementById('btn-a');
const btnEqual = document.getElementById('btn-equal');
const btnB = document.getElementById('btn-b');
const btnNext = document.getElementById('btn-next'); // NEU: Unser neuer Button!

const vornameA = document.getElementById('vorname-a');
const vornameB = document.getElementById('vorname-b');
const nachnameA = document.getElementById('nachname-a');
const nachnameB = document.getElementById('nachname-b');

let currentComparisonId = null;

// 2. Funktion: Ein neues Duell vom Backend laden
async function loadComparison() {
    try {
        const response = await fetch('/comparison');
        const data = await response.json();

        currentComparisonId = data.comparison_id;

        vornameA.textContent = data.vorname_a;
        nachnameA.textContent = data.nachname_a;
        vornameB.textContent = data.vorname_b;
        nachnameB.textContent = data.nachname_b;

    } catch (error) {
        console.error("Fehler beim Laden des Duells:", error);
    }
}

// 3. Funktion: Die Abstimmung absenden
async function handleVote(gewinner) {
    // Vornamen sichtbar machen
    vornameA.style.display = 'inline';
    vornameB.style.display = 'inline';

    // Buttons deaktivieren
    btnA.disabled = true;
    btnEqual.disabled = true;
    btnB.disabled = true;

    // NEU: Den "Nächstes Duell"-Button sichtbar machen
    btnNext.style.display = 'inline-block';

    const voteDaten = {
        comparison_id: currentComparisonId,
        winner: gewinner 
    };

    try {
        const response = await fetch('/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(voteDaten) 
        });

        const result = await response.json();
        console.log("Antwort vom Server:", result);

    } catch (error) {
        console.error("Fehler beim Abstimmen:", error);
    }
}

// 4. NEU: Was passiert, wenn man auf "Nächstes Duell" klickt?
btnNext.addEventListener('click', function() {
    // Die Vornamen wieder verstecken
    vornameA.style.display = 'none';
    vornameB.style.display = 'none';

    // Die Abstimmungs-Buttons wieder aktivieren
    btnA.disabled = false;
    btnEqual.disabled = false;
    btnB.disabled = false;

    // Den "Nächstes Duell"-Button wieder verstecken
    btnNext.style.display = 'none';

    // Ein neues Duell aus der Datenbank laden!
    loadComparison();
});

// 5. Wir sagen den Buttons, was sie beim Klicken tun sollen
btnA.addEventListener('click', function() { handleVote('A'); });
btnB.addEventListener('click', function() { handleVote('B'); });
btnEqual.addEventListener('click', function() { handleVote('tie'); }); 

// 6. Sobald die Seite lädt, rufen wir direkt das erste Duell ab!
loadComparison();