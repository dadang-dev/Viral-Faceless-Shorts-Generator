import os
import subprocess

class FFmpegRenderer:
    def __init__(self, ffmpeg_path: str = "ffmpeg", bg_music_volume: float = 0.15):
        # We enforce using the explicit path from config
        if ffmpeg_path != "ffmpeg" and not ffmpeg_path.startswith("ffmpeg") and os.path.exists(ffmpeg_path):
            self.ffmpeg_path = os.path.abspath(ffmpeg_path)
        else:
            self.ffmpeg_path = ffmpeg_path
        self.bg_music_volume = bg_music_volume

    def render(
        self, video_clips: list, voice_path: str, sub_path: str, music_path: str,
        output_path: str, voice_volume: float = 1.0, subtitle_font_size: int = 20,
        subtitle_margin_bottom: int = 55, subtitle_color: str = "white",
        subtitle_style: str = "outline",
    ):
        print(f"Rendering final video to {output_path}...")
        
        # 1. Create a concat file for videos
        concat_file_path = os.path.join(os.path.dirname(output_path), "concat.txt")
        with open(concat_file_path, "w", encoding="utf-8") as f:
            for clip in video_clips:
                # ffmpeg requires forward slashes or escaped backslashes in concat file
                clip_clean = os.path.abspath(clip).replace('\\', '/')
                f.write(f"file '{clip_clean}'\n")
                
        # To avoid complex filtergraphs with libass which might not be built-in, 
        # we can use subprocess and a filter_complex.
        # We want to:
        # - concat videos
        # - mix voice + music (volume=0.15)
        # - burn subtitles
        
        abs_sub_path = os.path.abspath(sub_path).replace('\\', '/')
        escaped_sub_path = abs_sub_path.replace(':', '\\:')
        
        primary_color = "&H006DE6FF" if subtitle_color == "yellow" else "&H00FFFFFF"
        if subtitle_style == "box":
            border_style = "BorderStyle=3,Outline=0,Shadow=0,BackColour=&H78000000"
        else:
            border_style = "BorderStyle=1,Outline=3,Shadow=1,OutlineColour=&HCC000000"
        force_style = (
            f"FontName=Arial,FontSize={subtitle_font_size},Bold=1,PrimaryColour={primary_color},"
            f"Alignment=2,MarginV={subtitle_margin_bottom},{border_style}"
        )
        sub_filter = f"subtitles='{escaped_sub_path}':force_style='{force_style}'"

        # Build ffmpeg command using subprocess for maximum control
        cmd = [
            self.ffmpeg_path, "-y",
            "-f", "concat", "-safe", "0", "-i", concat_file_path,  # Input 0: Concatenated videos
            "-i", os.path.abspath(voice_path),                     # Input 1: Voice audio
            "-i", os.path.abspath(music_path),                     # Input 2: Background music
            "-filter_complex",
            f"[1:a]volume={voice_volume}[voice];[2:a]volume={self.bg_music_volume}[bg];[voice][bg]amix=inputs=2:duration=first[a_out];[0:v]{sub_filter}[v_out]",
            "-map", "[v_out]",
            "-map", "[a_out]",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-shortest",  # Stop encoding when the shortest stream ends (usually the audio)
            os.path.abspath(output_path)
        ]
        
        print(f"Executing FFmpeg:\n{' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print("Render complete!")
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg render failed: {e}")
            print(f"FFmpeg error output:\n{e.stderr}")
            raise e
        finally:
            if os.path.exists(concat_file_path):
                os.remove(concat_file_path)
