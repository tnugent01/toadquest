import argparse
import os
from google import genai

# Ensure your GEMINI_API_KEY environment variable is set to your Hackathon API key.
API_KEY = "YOUR_API_KEY_HERE" # <--- CAUTION: Plug your own Gemini API key in here
client = genai.Client(api_key=API_KEY)

def generate_sprite(prompt, filename, aspect_ratio="1:1"):
    print(f"Generating sprite for prompt: '{prompt[:60]}...' (aspect={aspect_ratio})...")
    try:
        result = client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=prompt,
            config=dict(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                output_mime_type="image/png"
            )
        )
        for generated_image in result.generated_images:
            with open(f"assets/{filename}.png", "wb") as f:
                f.write(generated_image.image.image_bytes)
            print(f"-> Successfully generated and saved {filename}.png\n")
            return
    except Exception as e:
        print(f"Error generating {filename}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate game assets via Imagen API")
    parser.add_argument("--regenerate", nargs="*", metavar="NAME",
                        help="Regenerate these assets even if they exist (e.g. swamp_background_vertical). Use 'backgrounds' to regenerate both background assets.")
    args = parser.parse_args()
    force_names = set()
    if args.regenerate is not None:
        for name in args.regenerate or []:
            if name == "backgrounds":
                force_names.update(["swamp_background_vertical", "swamp_background"])
            else:
                force_names.add(name)

    os.makedirs("assets", exist_ok=True)

    # Character & item sprites (1:1)
    prompts = {
        "hero_turquoise_toad_natural_idle": "A high-quality transparent 32x32 pixel art sprite of a realistic, natural-looking turquoise toad with a smooth back. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "hero_turquoise_toad_natural_jump": "A high-quality transparent 32x32 pixel art sprite of a realistic, natural-looking turquoise toad leaping sharply upwards, body stretched dynamically towards the sky. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_scroll": "A high-quality transparent 32x32 pixel art sprite of an ancient, glowing magical paper scroll tied with a red ribbon. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_portal": "A high-quality transparent 64x64 pixel art sprite of a swirling, mystical purple and blue energy portal doorway. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_glass_case": "A high-quality transparent 32x32 pixel art sprite of a sturdy, transparent glass display case or pedestal with a wooden base, empty inside. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_key": "A high-quality transparent 32x32 pixel art sprite of a shiny golden antique skeleton key. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_toad_cider": "A high-quality transparent 32x32 pixel art sprite of an awesome retro aluminum soda can with a golden frog logo on it. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_sack_coins": "A high-quality transparent 32x32 pixel art sprite of a medieval-style burlap sack full of golden coins, tied at the top with rope. Retro 8-bit style, like a classic RPG money bag. Isolated on transparent background.",
        "npc_paranoid_archivist": "A pixel art sprite of a realistic-looking pink toad in a low crouching posture, squatting on the ground. Same pose as a platformer hero toad: compact, ready to spring. Wearing a dark hooded cloak and a small goatee. 32x32 pixel art, clean pixels, sharp edges. Fully transparent background only — no white, no grey, no solid background of any kind. Character isolated on pure transparency. Retro 2D game NPC.",
    }

    # Swamp / froggy world — continuously VERTICAL game: big lily pads at start, vertically expansive
    swamp_prompts = {
        "swamp_background_vertical": (
            "Tall vertical bog background for a 2D platformer. No platforms, no vines. Just atmosphere: "
            "murky stagnant water, wet peat, reeds, soft fog, muddy and boggy. Vertically expansive, no text. Portrait orientation.",
            "9:16"
        ),
        "lilypad_large": (
            "One very large lily pad, round green leaf, viewed from above. No background, no white, transparent only. "
            "Big platform for a 2D game. Isolated on transparent background.",
            "16:9"
        ),
        "lilypad_medium": (
            "Single medium-sized lily pad, round green leaf, top-down view. Same style as a large lily pad but smaller. "
            "Clean edge, no background, no white, fully transparent background. 2D game platform asset.",
            "1:1"
        ),
        "platform_branch": (
            "A sturdy wooden branch or log to land on, floating in swamp. Bark texture, no leaves. "
            "No background, no white, fully transparent. 2D platformer platform asset, horizontal.",
            "16:9"
        ),
        "tile_platform_swamp": (
            "Single 64x64 swamp platform tile. Muddy brown and green, moss, small reeds. No background, transparent. "
            "Horizontally tileable. Isolated on transparent background.",
            "1:1"
        ),
        "tile_ground_swamp": (
            "Single 64x64 swamp ground tile. Wet mud, reeds, dark green and brown. No background, transparent. "
            "Horizontally tileable. Isolated on transparent background.",
            "1:1"
        ),
    }

    for filename, prompt in prompts.items():
        if filename in force_names or not os.path.exists(f"assets/{filename}.png"):
            generate_sprite(prompt, filename)
        else:
            print(f"Skipping {filename}, already exists.")

    for filename, (prompt, aspect_ratio) in swamp_prompts.items():
        if filename in force_names or not os.path.exists(f"assets/{filename}.png"):
            generate_sprite(prompt, filename, aspect_ratio=aspect_ratio)
        else:
            print(f"Skipping {filename}, already exists.")

    print("Asset generation complete.")
