import os
from pauseflow.tts.edge_tts_backend import EdgeTTSBackend
from pauseflow.subtitle_generator import SubtitleGenerator

def test_phase2():
    print("\n--- Testing Phase 2: Edge TTS & Whisper Fallback ---")
    
    # Setup test directory
    output_dir = os.path.join(os.getcwd(), "output", "test_phase2")
    os.makedirs(output_dir, exist_ok=True)
    voice_path = os.path.join(output_dir, "voice.mp3")
    sub_path = os.path.join(output_dir, "subtitles.srt")
    
    # Dummy input representing output from Phase 1 (SceneSplitter)
    test_text = "When was the last time you actually stopped? You don't need a vacation, you just need a moment."
    
    try:
        # Test TTS
        print(f"1. Generating audio for text: '{test_text}'")
        tts = EdgeTTSBackend()
        tts_result = tts.generate_audio(test_text, voice_path)
        print(f"   -> Success! Audio saved to: {voice_path}")
        
        # Test Subtitles (Whisper)
        print("\n2. Generating subtitles using Whisper fallback (since Edge TTS doesn't return word timestamps)...")
        sub_gen = SubtitleGenerator()
        sub_gen.generate_subtitles(tts_result.get("word_timestamps", []), voice_path, sub_path)
        print(f"   -> Success! Subtitles saved to: {sub_path}")
        
        # Show first few lines of subtitle
        print("\n--- Subtitle Output Snippet ---")
        with open(sub_path, 'r', encoding='utf-8') as f:
            print("".join(f.readlines()[:8]))
            
        print("\n--- Phase 2 Test: PASS ---")
    except Exception as e:
        print(f"\n--- Phase 2 Test: FAIL ---")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_phase2()
