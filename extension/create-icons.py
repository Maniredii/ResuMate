from PIL import Image, ImageDraw
import os

# Create icons directory if it doesn't exist
icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(icons_dir, exist_ok=True)

def create_icon(size):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (simplified)
    for i in range(size):
        r = int(102 + (118 - 102) * i / size)
        g = int(126 + (75 - 126) * i / size)
        b = int(234 + (162 - 234) * i / size)
        draw.line([(0, i), (size, i)], fill=(r, g, b))
    
    # Draw lightning bolt
    scale = size / 16
    points = [
        (9 * scale, 2 * scale),
        (4 * scale, 9 * scale),
        (7 * scale, 9 * scale),
        (7 * scale, 14 * scale),
        (12 * scale, 7 * scale),
        (9 * scale, 7 * scale)
    ]
    draw.polygon(points, fill='white')
    
    return img

# Generate icons
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(os.path.join(icons_dir, f'icon{size}.png'))
    print(f'Created icon{size}.png')

print('All icons generated successfully!')
