# App Icon Generation Guide

## Overview

This directory contains SVG templates for the Gnanalytica PM app icons. Two PNG files are required for the PWA manifest:
- `icon-192.png` (192x192) - for home screen tiles and app switcher
- `icon-512.png` (512x512) - for splash screens and high-resolution displays

## SVG Templates

- `icon-192.svg` - 192x192 SVG template with brand color (#FF6B35)
- `icon-512.svg` - 512x512 SVG template with brand color (#FF6B35)

The SVG templates feature:
- Bold "G" letter design in brand coral (#FF6B35)
- Light gray/white background with subtle shadow
- Circular layout suitable for maskable icons
- Safe zone indicator (80% center - dashed outline)
- Proper scaling for both sizes

## Converting SVG to PNG

### Option 1: ImageMagick (Recommended - Best Quality)

Requires ImageMagick installation:

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# Convert 192x192
convert public/icons/icon-192.svg -background none -density 192 -resize 192x192 public/icons/icon-192.png

# Convert 512x512
convert public/icons/icon-512.svg -background none -density 512 -resize 512x512 public/icons/icon-512.png
```

### Option 2: Using Inkscape (Alternative)

```bash
# macOS
brew install inkscape

# Convert 192x192
inkscape --export-filename=public/icons/icon-192.png --export-width=192 --export-height=192 public/icons/icon-192.svg

# Convert 512x512
inkscape --export-filename=public/icons/icon-512.png --export-width=512 --export-height=512 public/icons/icon-512.svg
```

### Option 3: Online Tools (No Installation Required)

Use free online conversion tools:

1. **CloudConvert** (https://cloudconvert.com)
   - Upload SVG file
   - Select PNG as output format
   - Set dimensions (192x192 or 512x512)
   - Download PNG

2. **Convertio** (https://convertio.co)
   - Drag and drop SVG
   - Select PNG format
   - Set size to 192x192 or 512x512
   - Download

3. **SVG to PNG** (https://svg2png.com)
   - Upload SVG
   - Specify dimensions
   - Download PNG

4. **Pixlr** (https://pixlr.com)
   - Open SVG
   - Export as PNG with specified dimensions

## Important Notes

### Transparency
- Generated PNG files should have transparent backgrounds
- Use `-background none` with ImageMagick to preserve transparency
- Verify transparency in preview before deployment

### Quality
- ImageMagick provides the best quality conversion
- Use appropriate density matching target size
- Verify converted images look crisp and colors are accurate

### Maskable Icons
The SVG includes a safe zone indicator (dashed circle at 80% radius):
- Keep all critical design within this zone
- The safe zone ensures icons display correctly when masked on Android
- Outer 10% padding may be clipped on maskable icon displays

### Testing
After conversion, verify:
```bash
# Check file sizes
ls -lh public/icons/icon-*.png

# Verify dimensions using ImageMagick
identify public/icons/icon-*.png

# Preview with file manager or image viewer
open public/icons/icon-192.png
open public/icons/icon-512.png
```

## PWA Manifest Integration

Once PNG files are generated, they're referenced in `public/manifest.json`:

```json
{
  "name": "Gnanalytica PM",
  "short_name": "Gnanalytica",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Design Details

### Colors
- Background: White (#FFFFFF) with subtle gray gradient
- Accent: Brand coral (#FF6B35)
- Shadow: Subtle drop shadow for depth

### Typography
- Letter "G" - bold, rounded sans-serif inspired
- Stroke-based design for scalability
- Rounded line caps and joins for modern aesthetic

### Safe Zone
The dashed circle at 80% radius (77px for 192px, 205px for 512px) indicates the maskable icon safe zone. Design elements outside this zone may be clipped on devices that use icon masking.

## Troubleshooting

### ImageMagick Not Found
```bash
# Verify installation
convert --version

# Reinstall if needed
brew reinstall imagemagick
```

### Poor Quality Conversion
- Increase density: `-density 384` for 192x192 size (2x density)
- Ensure SVG file is valid XML
- Check for complex filters in SVG that may not convert well

### File Size Too Large
- Verify PNG is compressed (use `pngquant` or image optimization tools)
- Remove unnecessary metadata: `convert input.png -strip output.png`

### Transparency Issues
- Always use `-background none` with ImageMagick
- Verify output PNG with transparency viewer
- Some online tools may require explicit transparency selection

## Next Steps

1. Generate PNG files using one of the conversion methods above
2. Run tests: `npm run test` (if PWA tests are configured)
3. Verify manifest references: `npm run build`
4. Test on Android: `npm install -g serve && serve -s out` (if static export configured)
5. Test on iOS: Use Safari dev tools to add to home screen

## References

- [PWA Icons Best Practices](https://web.dev/maskable-icon/)
- [Web App Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [ImageMagick Documentation](https://imagemagick.org/)
