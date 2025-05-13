import whisperx

# Remplace ceci par le chemin de ton fichier
audio_path = "raymond 3.wav"

# Charger le modèle
model = whisperx.load_model("small", device="cpu")

# Transcription de base
result = model.transcribe(audio_path)

# Aligner les mots pour avoir des timestamps précis mot par mot
model_a, metadata = whisperx.load_align_model(language_code=result["language"], device="cpu")
aligned_result = whisperx.align(result["segments"], model_a, metadata, audio_path, device="cpu")

# Générer le fichier SRT mot par mot
with open("output_word_by_word.srt", "w", encoding="utf-8") as f:
    for i, word in enumerate(aligned_result["word_segments"], 1):
        start = word['start']
        end = word['end']
        text = word['text'].strip()

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
