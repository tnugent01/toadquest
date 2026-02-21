"""
Generate a pixel-art jump animation for the turquoise toad hero using Veo 3.1.
Strips audio, crops to square, converts to optimised looping GIF.
"""
import os
import time
import requests
from google import genai
from google.genai import types

API_KEY = "YOUR_API_KEY_HERE" # <--- CAUTION: Plug your own Gemini API key in here
client = genai.Client(api_key=API_KEY)
os.makedirs("assets", exist_ok=True)

PROMPT = (
    "A looping retro 8-bit pixel art animation of a small turquoise toad jumping. "
    "Side profile view, toad crouches, leaps cleanly upward, reaches peak, then lands. "
    "Simple flat black background. Clean pixel style, no realistic textures. "
    "The toad is the only subject. Centered in frame. No text."
)

print("Submitting video generation job to Veo 3.1...")
operation = client.models.generate_videos(
    model="veo-3.1-fast-generate-preview",
    prompt=PROMPT,
    config=types.GenerateVideosConfig(
        aspect_ratio="16:9",
        number_of_videos=1,
    ),
)

print("Waiting for Veo to finish...")
while not operation.done:
    time.sleep(8)
    operation = client.operations.get(operation)
    print("  Still generating...")

print("Generation complete!")

video = operation.response.generated_videos[0]
uri = video.video.uri
if not uri:
    print("ERROR: No URI returned.")
    print(operation.response)
    exit(1)

print(f"Downloading video from URI...")
r = requests.get(f"{uri}&key={API_KEY}", stream=True)
mp4_path = "assets/toad_jump_veo_raw.mp4"
with open(mp4_path, "wb") as f:
    for chunk in r.iter_content(chunk_size=8192):
        f.write(chunk)
print(f"Saved raw video to {mp4_path}")

# Crop centre square, strip audio, convert to high-quality GIF
gif_path = "assets/hero_turquoise_toad_natural_jump_anim.gif"
print("Converting to GIF (square crop, no audio)...")
cmd = (
    f"ffmpeg -y -i {mp4_path} "
    "-vf \"crop=min(iw\\,ih):min(iw\\,ih),scale=128:128:flags=neighbor,"
    "fps=12,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer\" "
    f"{gif_path}"
)
os.system(cmd)
print(f"\nDone! GIF saved to {gif_path}")
print("Open assets/hero_turquoise_toad_natural_jump_anim.gif to preview.")
