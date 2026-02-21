from PIL import Image
import os

def remove_background(image_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    
    # We will sample the top-left pixel as the background color
    bg_color = datas[0]
    
    # Sometimes it's slightly off-white or off-black due to generation artifacts, so we need a tolerance
    tolerance = 30
    
    for item in datas:
        # Check if pixel is within tolerance of the background color
        if abs(item[0] - bg_color[0]) <= tolerance and \
           abs(item[1] - bg_color[1]) <= tolerance and \
           abs(item[2] - bg_color[2]) <= tolerance:
            # Change to fully transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(image_path, "PNG")
    print(f"Removed background from {image_path}")

items = [
    "hero_turquoise_toad_natural_idle.png",
    "hero_turquoise_toad_natural_jump.png",
    "jump_f1_crouch.png",
    "jump_f2_launch.png",
    "jump_f3_peak.png",
    "jump_f4_descend.png",
    "jump_f5_land.png"
]

for item in items:
    path = os.path.join("assets", item)
    if os.path.exists(path):
        remove_background(path)
