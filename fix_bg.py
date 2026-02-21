from PIL import Image
import os

def remove_background(image_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    new_data = []
    bg_color = datas[0]
    tolerance = 30
    # Also strip any near-white (gets rid of white space everywhere)
    white_thresh = 240
    for item in datas:
        is_bg = (
            abs(item[0] - bg_color[0]) <= tolerance and
            abs(item[1] - bg_color[1]) <= tolerance and
            abs(item[2] - bg_color[2]) <= tolerance
        )
        is_white = item[0] >= white_thresh and item[1] >= white_thresh and item[2] >= white_thresh
        if is_bg or is_white:
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
    "jump_f5_land.png",
    "item_scroll.png",
    "item_portal.png",
    "item_glass_case.png",
    "item_key.png",
    "item_toad_cider.png",
    "lilypad_large.png",
    "lilypad_medium.png",
    "platform_branch.png",
    "tile_platform_swamp.png",
    "tile_ground_swamp.png",
]

for item in items:
    path = os.path.join("assets", item)
    if os.path.exists(path):
        remove_background(path)
