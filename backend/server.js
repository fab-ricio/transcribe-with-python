const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { PythonShell } = require("python-shell");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Vérifier que le script Python existe
const pythonScriptPath = path.join(__dirname, "..", "transcribe_to_srt.py");
if (!fs.existsSync(pythonScriptPath)) {
  console.error("❌ Le script Python n'existe pas à:", pythonScriptPath);
  process.exit(1);
}
console.log("✅ Script Python trouvé à:", pythonScriptPath);

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Aucun fichier audio n'a été fourni" });
    }

    console.log("📁 Fichier reçu:", req.file.path);
    console.log(
      "📁 Taille du fichier:",
      fs.statSync(req.file.path).size,
      "bytes"
    );

    // Créer un nom de fichier unique pour le SRT
    const srtFileName = `output_${Date.now()}.srt`;
    const srtPath = path.join(__dirname, "..", srtFileName);

    const options = {
      mode: "text",
      pythonPath: "py",
      pythonOptions: ["-3.12", "-u"],
      scriptPath: path.join(__dirname, ".."),
      args: [req.file.path, srtPath], // Passer le chemin du fichier SRT en argument
    };

    console.log("⚙️ Options Python:", JSON.stringify(options, null, 2));

    PythonShell.run("transcribe_to_srt.py", options)
      .then((messages) => {
        console.log("📝 Messages Python:", messages);

        if (!fs.existsSync(srtPath)) {
          throw new Error("Le fichier SRT n'a pas été généré");
        }

        const srtContent = fs.readFileSync(srtPath, "utf-8");
        console.log(
          "✅ Transcription réussie, taille du fichier SRT:",
          srtContent.length
        );

        // Nettoyer les fichiers temporaires
        fs.unlinkSync(req.file.path); // Supprimer le fichier audio
        fs.unlinkSync(srtPath); // Supprimer le fichier SRT temporaire

        res.json({ srt: srtContent });
      })
      .catch((err) => {
        console.error("❌ Erreur Python:", err);
        // Nettoyer en cas d'erreur
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        if (fs.existsSync(srtPath)) {
          fs.unlinkSync(srtPath);
        }
        res.status(500).json({
          error: "Erreur lors de la transcription",
          details:
            err.message ||
            "Erreur inconnue lors de l'exécution du script Python",
        });
      });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message || "Une erreur inconnue est survenue",
    });
  }
});

// Route de test pour vérifier que le serveur fonctionne
app.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Le serveur fonctionne correctement" });
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log("📁 Dossier des uploads:", path.join(__dirname, "uploads"));
  console.log("📁 Script Python:", pythonScriptPath);
});
