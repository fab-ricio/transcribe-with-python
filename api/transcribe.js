const multer = require("multer");
const path = require("path");
const { PythonShell } = require("python-shell");
const fs = require("fs");

// Vercel serverless handler
module.exports = async (req, res) => {
  // Ajout des headers CORS pour toutes les réponses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  // Utilisation de multer en mémoire (pas de stockage disque sur Vercel)
  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage }).single("audio");

  upload(req, res, function (err) {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de l'upload" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier audio fourni" });
    }

    // Enregistrer le fichier temporairement dans /tmp (seul dossier en écriture sur Vercel)
    const tempPath = `/tmp/${Date.now()}_${req.file.originalname}`;
    fs.writeFileSync(tempPath, req.file.buffer);

    // Exécuter le script Python
    const pythonScriptPath = path.join(__dirname, "..", "transcribe_to_srt.py");
    if (!fs.existsSync(pythonScriptPath)) {
      return res.status(500).json({ error: "Script Python introuvable" });
    }

    let options = {
      args: [tempPath],
      pythonOptions: ["-u"],
    };

    PythonShell.run(pythonScriptPath, options, function (err, results) {
      fs.unlinkSync(tempPath); // Nettoyer le fichier temporaire
      if (err) {
        return res.status(500).json({ error: "Erreur Python", details: err });
      }
      // Retourner la sortie du script Python
      res.status(200).json({ result: results });
    });
  });
};
