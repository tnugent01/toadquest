import os
from google import genai

# Ensure your GEMINI_API_KEY environment variable is set to your Hackathon API key.
API_KEY = "YOUR_API_KEY_HERE"
client = genai.Client(api_key=API_KEY)

def generate_sprite(prompt, filename):
    print(f"Generating sprite for prompt: '{prompt}'...")
    try:
        # Hitting the specific Imagen 4.0 endpoint using the SDK
        result = client.models.generate_images(
            model='imagen-4.0-generate-001',
            prompt=prompt,
            config=dict(
                number_of_images=1,
                aspect_ratio="1:1",
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
    os.makedirs("assets", exist_ok=True)
    
    # Specific prompts crafted to get the best out of Nano Banana Pro for our retro 2D platformer
    prompts = {
        "hero_turquoise_toad_natural_idle": "A high-quality transparent 32x32 pixel art sprite of a realistic, natural-looking turquoise toad with a smooth back. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "hero_turquoise_toad_natural_jump": "A high-quality transparent 32x32 pixel art sprite of a realistic, natural-looking turquoise toad leaping sharply upwards, body stretched dynamically towards the sky. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_scroll": "A high-quality transparent 32x32 pixel art sprite of an ancient, glowing magical paper scroll tied with a red ribbon. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_portal": "A high-quality transparent 64x64 pixel art sprite of a swirling, mystical purple and blue energy portal doorway. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_glass_case": "A high-quality transparent 32x32 pixel art sprite of a sturdy, transparent glass display case or pedestal with a wooden base, empty inside. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_key": "A high-quality transparent 32x32 pixel art sprite of a shiny golden antique skeleton key. Perfect retro 8-bit style platformer game asset, isolated on transparent background.",
        "item_toad_cider": "A high-quality transparent 32x32 pixel art sprite of an awesome retro aluminum soda can with a golden frog logo on it. Perfect retro 8-bit style platformer game asset, isolated on transparent background."
    }
    
    for filename, prompt in prompts.items():
        if not os.path.exists(f"assets/{filename}.png"):
            generate_sprite(prompt, filename)
        else:
            print(f"Skipping {filename}, already exists.")
        
    print("Asset generation complete.")
