import whisperx
import os
import sys
import subprocess

# Configuration de FFmpeg
os.environ["PATH"] = r"C:\Users\ACTUTEC\scoop\apps\ffmpeg\current\bin;" + os.environ["PATH"]

def format_time(seconds):
    """Convertit les secondes en format SRT (HH:MM:SS,mmm)"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def main():
    try:
        # Vérifier que FFmpeg est accessible
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
            print("✅ FFmpeg est correctement installé")
        except Exception as e:
            print("❌ Erreur : FFmpeg n'est pas accessible")
            print("Veuillez vérifier l'installation de FFmpeg")
            sys.exit(1)

        # Chemin du fichier audio
        audio_path = "C:/Users/ACTUTEC/Desktop/raymond 3.wav"

        # Vérifier si le fichier existe
        if not os.path.exists(audio_path):
            print(f"❌ Erreur : Le fichier {audio_path} n'existe pas.")
            print("Veuillez vérifier le chemin du fichier audio.")
            sys.exit(1)

        print(f"✅ Fichier audio trouvé : {audio_path}")

        # Charger le modèle avec compute_type="float32" et langue française
        print("🔄 Chargement du modèle en français...")
        model = whisperx.load_model("small", device="cpu", compute_type="float32", language="fr")

        # Transcription de base avec langue française forcée
        print("🔄 Transcription en français...")
        result = model.transcribe(audio_path, language="fr", task="transcribe")

        # Aligner les mots pour avoir des timestamps précis mot par mot
        print("🔄 Alignement des mots en français...")
        model_a, metadata = whisperx.load_align_model(language_code="fr", device="cpu")
        aligned_result = whisperx.align(result["segments"], model_a, metadata, audio_path, device="cpu")

        # Générer le fichier SRT avec deux mots par ligne
        print("🔄 Génération du fichier SRT...")
        output_file = "output_word_by_word.srt"
        with open(output_file, "w", encoding="utf-8") as f:
            words = aligned_result["word_segments"]
            for i in range(0, len(words), 2):
                # Obtenir les deux mots actuels
                word1 = words[i]
                word2 = words[i + 1] if i + 1 < len(words) else None

                # Déterminer le début et la fin
                start = word1['start']
                end = word2['end'] if word2 else word1['end']

                # Combiner les textes
                text = word1['word'].strip()
                if word2:
                    text += " " + word2['word'].strip()

                # Écrire dans le fichier SRT
                f.write(f"{i//2 + 1}\n")
                f.write(f"{format_time(start)} --> {format_time(end)}\n")
                f.write(f"{text}\n\n")

        print(f"✅ Fichier SRT généré avec succès : {output_file}")

    except Exception as e:
        print(f"❌ Une erreur est survenue : {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
