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
        r, g, b = item[0], item[1], item[2]
        is_bg = (
            abs(r - bg_color[0]) <= tolerance and
            abs(g - bg_color[1]) <= tolerance and
            abs(b - bg_color[2]) <= tolerance
        )
        is_white = r >= white_thresh and g >= white_thresh and b >= white_thresh
        # Strip light grey (uniform, bright) as well
        mx, mn = max(r, g, b), min(r, g, b)
        is_light_grey = (mx - mn <= 40) and ((r + g + b) / 3 >= 180)
        if is_bg or is_white or is_light_grey:
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
    "npc_paranoid_archivist1.png",
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
