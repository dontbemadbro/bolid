document.addEventListener("DOMContentLoaded", function() {
    const inputField = document.getElementById("plaqueInput");
    const scanButton = document.getElementById("button1");
    const loader = document.getElementById("loader");
    const result = document.getElementById("result");

    scanButton.addEventListener("click", function() {
        const plaqueValue = inputField.value.trim();

        if (!plaqueValue) {
            result.innerHTML = "<p style='color: red;'>Veuillez entrer une plaque valide.</p>";
            return;
        }

        console.log("Plaque entrée :", plaqueValue);
        

        loader.style.display = "block";
        result.innerHTML = "";

        fetch("https://flask-render-s822.onrender.com/api/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(plaqueValue)
        })
        .then(response => response.json())
        .then(data => {
            let infoVehicule = "";

            const addLineIfValid = (label, value) => {
                if (value !== null && value !== undefined && value !== "None" && value !== "None€") {
                    infoVehicule += `<p style="color:white;"><strong>${label} :</strong> ${value}</p>`;
                }
            };

            if (Array.isArray(data) && data.length > 0) {
                addLineIfValid("Marque", data[0]["Marque du véhicule"]);
                addLineIfValid("Modèle", data[0]["Modèle du véhicule"]);
                addLineIfValid("Année", data[0]["Date de construction du véhicule"]);
                addLineIfValid("Boîte", data[0]["Boite vitesse"]);
                addLineIfValid("Chevaux", data[0]["Chevaux"] ? data[0]["Chevaux"] + " ch" : null);
                addLineIfValid("Couleur", data[1]["Couleur"]);
                addLineIfValid("Prix original", data[1]["Prix original"]);
                addLineIfValid("Numéro de série", data[2]["Numéro de série"]);
                addLineIfValid("Poids du véhicule", data[2]["poids du véhicule"]);
                addLineIfValid("Nombre de portes", data[1]["Nombre de portes"])
                addLineIfValid("Emission CO2", data[2]["Emission CO2"] + " g/km")
                addLineIfValid("Propulsion", data[2]["Propulsion"])
                addLineIfValid("Puissance Fiscal", data[1]["Puissance Fiscal"])
            } else {
                infoVehicule = "<p style='color: red;'>Cette plaque n'existe pas !</p>";
            }

            result.innerHTML = infoVehicule;
        })
        .catch(error => {
            console.error("Erreur lors de la requête :", error);
            result.innerHTML = "<p style='color: red;'>Une erreur est survenue. Veuillez réessayer.</p>";
        })
        .finally(() => {
            loader.style.display = "none";
        });
    });
});
