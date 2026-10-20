document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("plaqueInput");
    const button = document.getElementById("button1");
    const loader = document.getElementById("loader");
    const result = document.getElementById("result");

    const API_URL = "https://bolid-backend.onrender.com/api/data";

    // Majuscules automatiques pendant la saisie
    input.addEventListener("input", function () {
        const start = input.selectionStart;
        input.value = input.value.toUpperCase();
        input.setSelectionRange(start, start);
    });

    // Entrée = scan
    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            scan();
        }
    });

    button.addEventListener("click", scan);

    function setLoading(on) {
        loader.hidden = !on;
        button.disabled = on;
        button.classList.toggle("is-loading", on);
    }

    function notice(message, kind) {
        result.innerHTML = '<div class="notice notice--' + kind + '">' + message + "</div>";
    }

    function scan() {
        // Normalise : majuscules, uniquement lettres et chiffres
        const plate = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

        if (!plate) {
            notice("Entrez une plaque d'immatriculation valide.", "warn");
            input.focus();
            return;
        }

        result.innerHTML = "";
        setLoading(true);

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(plate)
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (Array.isArray(data) && data.length >= 3) {
                    render(data, plate);
                } else {
                    notice("Aucun véhicule trouvé pour cette plaque.", "warn");
                }
            })
            .catch(function (err) {
                console.error("Erreur lors de la requête :", err);
                notice(
                    "Une erreur est survenue. Le serveur se réveille peut-être — réessayez dans quelques secondes.",
                    "error"
                );
            })
            .finally(function () {
                setLoading(false);
            });
    }

    function render(data, plate) {
        const get = function (i, key) { return data[i] ? data[i][key] : undefined; };
        const valid = function (v) {
            return v !== null && v !== undefined && v !== "" &&
                v !== "None" && v !== "None€" && v !== "nullkg" && v !== "null";
        };
        const withUnit = function (v, unit) { return valid(v) ? v + unit : null; };
        const esc = function (s) {
            return String(s).replace(/[&<>"]/g, function (c) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
            });
        };

        const brand = get(0, "Marque du véhicule");
        const model = get(0, "Modèle du véhicule");
        const year = get(0, "Date de construction du véhicule");
        const vin = get(2, "Numéro de série");

        const specs = [
            ["🐎", "Puissance", withUnit(get(0, "Chevaux"), " ch")],
            ["⚙️", "Boîte de vitesse", get(0, "Boite vitesse")],
            ["🎨", "Couleur", get(1, "Couleur")],
            ["🚪", "Portes", get(1, "Nombre de portes")],
            ["💶", "Prix d'origine", get(1, "Prix original")],
            ["🏛️", "Puissance fiscale", withUnit(get(1, "Puissance Fiscal"), " CV")],
            ["🧭", "Propulsion", get(2, "Propulsion")],
            ["🛢️", "Cylindrée", withUnit(get(2, "Volume du véhicule"), " cm³")],
            ["🌫️", "Émissions CO₂", withUnit(get(2, "Emission CO2"), " g/km")],
            ["⚖️", "Poids", get(2, "poids du véhicule")]
        ];

        const specCards = specs
            .filter(function (s) { return valid(s[2]); })
            .map(function (s, i) {
                return '<div class="spec" style="--i:' + i + '">' +
                    '<span class="spec-ico">' + s[0] + "</span>" +
                    '<span class="spec-body">' +
                    '<span class="spec-label">' + esc(s[1]) + "</span>" +
                    '<span class="spec-value">' + esc(s[2]) + "</span>" +
                    "</span></div>";
            })
            .join("");

        const chips = [];
        if (valid(year)) chips.push('<span class="chip">' + esc(year) + "</span>");
        chips.push('<span class="chip chip--plate">' + esc(formatPlate(plate)) + "</span>");

        const vinBlock = valid(vin)
            ? '<div class="vin"><span class="spec-label">Numéro de série (VIN)</span>' +
              '<span class="vin-value">' + esc(vin) + "</span></div>"
            : "";

        const noData = specCards === "" && !valid(vin);
        if (noData && !valid(brand)) {
            notice("Aucune caractéristique disponible pour cette plaque.", "warn");
            return;
        }

        result.innerHTML =
            '<article class="card">' +
                '<div class="card-head">' +
                    '<div class="card-id">' +
                        '<span class="card-brand">' + esc(valid(brand) ? brand : "Véhicule") + "</span>" +
                        (valid(model) ? '<span class="card-model">' + esc(model) + "</span>" : "") +
                    "</div>" +
                    '<div class="card-chips">' + chips.join("") + "</div>" +
                "</div>" +
                '<div class="spec-grid">' + specCards + "</div>" +
                vinBlock +
            "</article>";
    }

    // AA123AA -> AA-123-AA (format SIV), sinon renvoie tel quel
    function formatPlate(p) {
        const m = p.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
        return m ? m[1] + "-" + m[2] + "-" + m[3] : p;
    }
});
