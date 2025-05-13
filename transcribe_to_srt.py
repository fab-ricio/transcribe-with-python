import whisperx
import os

# Chemin du fichier audio
audio_path = "C:/Users/ACTUTEC/Desktop/raymond 3.wav"

# Vérifier si le fichier existe
if not os.path.exists(audio_path):
    print(f"❌ Erreur : Le fichier {audio_path} n'existe pas dans le répertoire courant.")
    print("Veuillez placer le fichier audio dans le même dossier que ce script.")
    exit(1)

print(f"✅ Fichier audio trouvé : {audio_path}")

# Charger le modèle avec compute_type="float32"
print("🔄 Chargement du modèle...")
model = whisperx.load_model("small", device="cpu", compute_type="float32")

# Transcription de base avec langue française spécifiée
print("🔄 Transcription en cours...")
result = model.transcribe(audio_path, language="fr")

# Aligner les mots pour avoir des timestamps précis mot par mot
print("🔄 Alignement des mots...")
model_a, metadata = whisperx.load_align_model(language_code="fr", device="cpu")
aligned_result = whisperx.align(result["segments"], model_a, metadata, audio_path, device="cpu")

# Générer le fichier SRT mot par mot
print("🔄 Génération du fichier SRT...")
with open("output_word_by_word.srt", "w", encoding="utf-8") as f:
    for i, word in enumerate(aligned_result["word_segments"], 1):
        start = word['start']
        end = word['end']
        text = word['word'].strip()

        # Format des timestamps
        def format_time(seconds):
            h = int(seconds // 3600)
            m = int((seconds % 3600) // 60)
            s = int(seconds % 60)
            ms = int((seconds % 1) * 1000)
            return f"{h:02}:{m:02}:{s:02},{ms:03}"

        f.write(f"{i}\n")
        f.write(f"{format_time(start)} --> {format_time(end)}\n")
        f.write(f"{text}\n\n")

print("✅ Fichier SRT généré : output_word_by_word.srt")
