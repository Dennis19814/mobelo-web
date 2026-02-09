# Vertical Template Images System

## Overview

The Vertical Template Images system dynamically displays industry-specific template images in the app-spec page carousel based on the detected industry (`verticalName`) from the user's prompt. This system is designed to be **easily extensible** - adding new industry templates requires only adding a folder and one line of configuration.

## Architecture

### System Flow

```
User Prompt → Backend AI Analysis → verticalName → Industry Mapper → Template Images → Carousel Display
```

1. **User enters prompt** on homepage (e.g., "Build a fashion store app")
2. **Backend analyzes** prompt and returns `verticalName` (e.g., "fashion")
3. **Frontend receives** app spec with `spec.best.verticalName`
4. **Industry Mapper** maps verticalName to template folder
5. **Template images** are loaded from the mapped folder
6. **Carousel displays** industry-specific images

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│  app-spec/page.tsx                                       │
│  ├─ Receives: spec.best.verticalName                    │
│  ├─ Calls: getIndustryImages(verticalName)              │
│  └─ Passes: images array to HomeAppCarousel             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  lib/industry-image-mapper.ts                           │
│  ├─ Maps: verticalName → folder name                    │
│  ├─ Generates: image paths (01-10)                      │
│  └─ Returns: Array<{src: string}>                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  components/HomeAppCarousel.tsx                          │
│  ├─ Receives: images prop                               │
│  ├─ Displays: carousel with provided images             │
│  └─ Fallback: default mockups if no images provided     │
└─────────────────────────────────────────────────────────┘
```

## File Structure

### Template Images Directory

```
/public/images/templates/
├── Verticals - Fashion & Apparel/
│   ├── 01/
│   │   └── 01.png
│   ├── 02/
│   │   └── 02.png
│   ├── 03/
│   │   └── 03.png
│   ├── ...
│   └── 10/
│       └── 10.png
├── Verticals - Food & Grocery/
│   ├── 01/01.png
│   ├── 02/02.png
│   └── ... (10 total)
├── Verticals - Electronics/
├── Verticals - Health & Beauty/
├── Verticals - General Retail/  ← DEFAULT FALLBACK
├── Verticals - Books & Media/  ← Available for future use
└── Verticals - Sports & Fitness/  ← Available for future use
```

**Important Notes:**
- Each vertical folder contains **10 numbered subfolders** (01, 02, 03, ... 10)
- Each subfolder contains a PNG file **matching the folder number**: `01/01.png`, `02/02.png`, `03/03.png`, etc.
- All images **must be PNG format**
- Folder names **must match exactly** (case-sensitive, include spaces and hyphens)

## Current Mappings

| Backend Vertical | Template Folder | Status |
|-----------------|-----------------|--------|
| `fashion` | Verticals - Fashion & Apparel | ✅ Active |
| `fast-food` | Verticals - Food & Grocery | ✅ Active |
| `electronics` | Verticals - Electronics | ✅ Active |
| `baby-products` | Verticals - Health & Beauty | ✅ Active |
| `automobile` | Verticals - General Retail | 🔄 Fallback |
| `luxary` | Verticals - General Retail | 🔄 Fallback |
| `base` | Verticals - General Retail | 🔄 Fallback |
| **All others** | **Verticals - General Retail** | 🔄 Fallback |

## How It Works

### 1. Backend Returns verticalName

When a user submits a prompt, the backend AI analyzes it and returns an app spec with:

```json
{
  "best": {
    "verticalName": "fashion",
    "confidence": 0.95
  },
  "concept": { ... },
  "explanation": { ... }
}
```

### 2. Industry Mapper Processes verticalName

The `getIndustryImages()` function:

```typescript
// Input
const verticalName = "fashion"

// Lookup in mapping
const VERTICAL_TO_FOLDER_MAP = {
  'fashion': 'Verticals - Fashion & Apparel',
  'fast-food': 'Verticals - Food & Grocery',
  'electronics': 'Verticals - Electronics',
  'baby-products': 'Verticals - Health & Beauty',
}

// If found → use mapped folder
// If NOT found → use "Verticals - General Retail"

const folderName = "Verticals - Fashion & Apparel"

// Generate 10 image paths
const images = [
  { src: '/images/templates/Verticals - Fashion & Apparel/01/01.png' },
  { src: '/images/templates/Verticals - Fashion & Apparel/02/02.png' },
  { src: '/images/templates/Verticals - Fashion & Apparel/03/03.png' },
  // ... (10 total)
]
```

### 3. Carousel Displays Images

The `HomeAppCarousel` component receives the images and displays them in a 3D carousel with navigation.

## Adding New Vertical Image Sets

### Quick Guide

**Time Required:** 5-10 minutes
**Difficulty:** Easy
**Files Modified:** 1

### Step-by-Step Instructions

#### Step 1: Prepare Your Template Images

1. **Collect 10 template images** for the new industry
2. **Prepare for numbered folders**: Each image will go in its corresponding folder (image 01 in folder 01, etc.)
3. **Ensure they are PNG format**
4. **Recommended dimensions**: 750 x 1624 pixels (iPhone aspect ratio)

#### Step 2: Create Folder Structure

Navigate to: `/public/images/templates/`

Create the following structure:

```bash
mkdir -p "Verticals - [Industry Name]"
cd "Verticals - [Industry Name]"

# Create 10 numbered subfolders
for i in {01..10}; do mkdir "$i"; done
```

**Example for "Sports & Fitness":**

```bash
cd /public/images/templates/
mkdir -p "Verticals - Sports & Fitness"
cd "Verticals - Sports & Fitness"
for i in {01..10}; do mkdir "$i"; done
```

#### Step 3: Add Images to Subfolders

Place each image in its corresponding numbered subfolder with a matching filename:

```
Verticals - Sports & Fitness/
├── 01/
│   └── 01.png  ← Your first template image
├── 02/
│   └── 02.png  ← Your second template image
├── 03/
│   └── 03.png  ← Your third template image
...
└── 10/
    └── 10.png  ← Your tenth template image
```

**Critical:** The filename must match the folder number!

#### Step 4: Add Mapping to Code

Open file: `/src/lib/industry-image-mapper.ts`

Add **one line** to the `VERTICAL_TO_FOLDER_MAP` object:

```typescript
const VERTICAL_TO_FOLDER_MAP: Record<string, string> = {
  'fashion': 'Verticals - Fashion & Apparel',
  'fast-food': 'Verticals - Food & Grocery',
  'electronics': 'Verticals - Electronics',
  'baby-products': 'Verticals - Health & Beauty',
  'sports': 'Verticals - Sports & Fitness',  // ← ADD THIS LINE
  // Future additions: add one line per new template
}
```

**Mapping Format:**
- **Key** (left side): Backend verticalName (lowercase, from database)
- **Value** (right side): Exact folder name (case-sensitive, matches filesystem)

#### Step 5: Test the Implementation

1. **Restart development server** (if running)
2. **Create test prompt** that triggers the new vertical:
   ```
   Build a sports equipment store app for selling athletic wear and gear
   ```
3. **Navigate to /app-spec page**
4. **Verify carousel shows** your new template images
5. **Check browser console** for any 404 errors on images

### Complete Example: Adding "Books & Media"

**Scenario:** Backend has a `books` vertical, and we want to add book store templates.

**Step 1:** Prepare 10 book store template images

**Step 2:** Create folder structure
```bash
cd /public/images/templates/
mkdir -p "Verticals - Books & Media"
cd "Verticals - Books & Media"
for i in {01..10}; do mkdir "$i"; done
```

**Step 3:** Add images
```
Verticals - Books & Media/
├── 01/01.png
├── 02/02.png
├── 03/03.png
├── ...
└── 10/10.png
```

**Step 4:** Update mapper
```typescript
const VERTICAL_TO_FOLDER_MAP: Record<string, string> = {
  'fashion': 'Verticals - Fashion & Apparel',
  'fast-food': 'Verticals - Food & Grocery',
  'electronics': 'Verticals - Electronics',
  'baby-products': 'Verticals - Health & Beauty',
  'books': 'Verticals - Books & Media',  // ← NEW MAPPING
}
```

**Step 5:** Test with prompt like "Build a bookstore mobile app"

✅ **Done!** The system automatically picks up the new mapping.

## Fallback Behavior

### When Does Fallback Occur?

The system falls back to **"Verticals - General Retail"** in these cases:

1. **Unmapped vertical**: Backend returns a verticalName not in the mapping
   - Example: `automobile`, `luxary`, `jewelry`

2. **Missing verticalName**: API response has `null` or `undefined` verticalName
   - System defaults to `"base"` → which maps to General Retail

3. **Invalid/corrupted data**: Any unexpected data type or format

### Fallback Examples

```typescript
// Example 1: Unmapped vertical
getIndustryImages('automobile')
// → Returns: Verticals - General Retail images

// Example 2: Missing verticalName
getIndustryImages(null)
// → Returns: Verticals - General Retail images

// Example 3: Unknown vertical
getIndustryImages('pet-supplies')  // Not in mapping
// → Returns: Verticals - General Retail images
```

### Why General Retail as Default?

- **Universal fit**: General retail templates work for most industries
- **Prevents broken UI**: Always shows valid images instead of 404 errors
- **Graceful degradation**: Users see professional templates even if mapping is missing

## Technical Details

### Image Loading

**Images are loaded by browser's native `<img>` tag:**
- If image exists: Displays correctly
- If image missing (404): Browser shows broken image icon
- **No JavaScript errors** are thrown for missing images

**Flexible image count:**
- System requests 10 images by default
- If folder has fewer images: Shows available images, empty slots for missing
- Each subfolder must have a matching numbered .png file (01/01.png, 02/02.png, etc.)

### Path Generation Logic

```typescript
function getIndustryImages(verticalName: string) {
  const folderName = VERTICAL_TO_FOLDER_MAP[verticalName] || DEFAULT_FOLDER

  const images = []
  for (let i = 1; i <= 10; i++) {
    const folderNumber = i.toString().padStart(2, '0') // "01", "02", etc.
    // Image filename matches folder number
    const imagePath = `/images/templates/${folderName}/${folderNumber}/${folderNumber}.png`
    images.push({ src: imagePath })
  }

  return images
}
```

**Generated paths example (fashion):**
```
/images/templates/Verticals - Fashion & Apparel/01/01.png
/images/templates/Verticals - Fashion & Apparel/02/02.png
/images/templates/Verticals - Fashion & Apparel/03/03.png
...
/images/templates/Verticals - Fashion & Apparel/10/10.png
```

### Why This Structure?

**Design Decision:** Why numbered subfolders instead of flat structure?

```
❌ Flat structure (NOT used):
Verticals - Fashion/
├── 01.png
├── 02.png
└── 03.png

✅ Nested structure (USED):
Verticals - Fashion/
├── 01/01.png
├── 02/02.png
└── 03/03.png
```

**Reasons:**
1. **Extensibility**: Easy to add multiple images per template in future
2. **Organization**: Each template can have metadata files (README.md)
3. **Consistency**: Matches existing template structure in codebase
4. **Scalability**: Can add variations without breaking paths

## Troubleshooting

### Images Not Displaying

**Problem:** Carousel shows broken image icons

**Solutions:**

1. **Check folder name spelling:**
   ```bash
   # List all template folders
   ls /public/images/templates/

   # Verify exact name matches mapping
   # Case-sensitive! "Electronics" ≠ "electronics"
   ```

2. **Verify image paths:**
   ```bash
   # Check first image exists
   ls /public/images/templates/Verticals\ -\ Fashion\ \&\ Apparel/01/

   # Should show: 01.png

   # Check all images with correct naming
   for i in {01..10}; do
     ls /public/images/templates/Verticals\ -\ Fashion\ \&\ Apparel/$i/$i.png 2>/dev/null || echo "Missing: $i/$i.png"
   done
   ```

3. **Check file extension:**
   - Must be `.png` (lowercase)
   - Not `.PNG`, `.jpg`, or other formats

4. **Verify 10 subfolders exist:**
   ```bash
   ls /public/images/templates/Verticals\ -\ Fashion\ \&\ Apparel/

   # Should show: 01  02  03  04  05  06  07  08  09  10
   ```

### Wrong Template Showing

**Problem:** Fashion prompt shows General Retail templates

**Solutions:**

1. **Check backend verticalName:**
   - Open browser DevTools → Network tab
   - Find app-spec API call
   - Check `response.data.best.verticalName` value

2. **Verify mapping exists:**
   ```typescript
   // In industry-image-mapper.ts
   // Check if verticalName is in the map
   const VERTICAL_TO_FOLDER_MAP = {
     'fashion': 'Verticals - Fashion & Apparel',  // ← Does this exist?
   }
   ```

3. **Case sensitivity:**
   - Backend sends: `"Fashion"` (capitalized)
   - Mapper expects: `"fashion"` (lowercase)
   - **Solution:** Mapper automatically normalizes to lowercase

### Mapping Not Working

**Problem:** Added mapping but still shows fallback

**Checklist:**

- [ ] Restarted development server after editing `industry-image-mapper.ts`
- [ ] Mapping key matches backend verticalName exactly (after lowercase)
- [ ] Mapping value matches folder name exactly (case-sensitive)
- [ ] No typos in folder name or mapping
- [ ] Images actually exist in the folder

**Debug steps:**

```typescript
// Add temporary console.log in industry-image-mapper.ts
export function getIndustryImages(verticalName: string) {
  console.log('Input verticalName:', verticalName)

  const normalizedVertical = (verticalName || '').toLowerCase().trim()
  console.log('Normalized:', normalizedVertical)

  const folderName = VERTICAL_TO_FOLDER_MAP[normalizedVertical] || DEFAULT_FOLDER
  console.log('Selected folder:', folderName)

  // ... rest of function
}
```

## Best Practices

### Image Guidelines

1. **Dimensions**: 750 x 1624 pixels (iPhone 15 Pro Max aspect ratio)
2. **Format**: PNG with transparency support
3. **File size**: Optimize to < 200KB per image for performance
4. **Content**: Show actual app UI, not marketing graphics
5. **Consistency**: Use same visual style across all 10 images
6. **Quality**: High-resolution, crisp text, no blur

### Naming Conventions

1. **Folder names**: Use "Verticals - [Industry Name]" format
2. **Capitalization**: Proper title case for readability
3. **Mapping keys**: Always lowercase, match backend exactly
4. **File names**: Must match folder number (`01.png` in folder `01`, `02.png` in folder `02`, etc.)

### Organization Tips

1. **Document your mappings**: Add comments in mapper for context
   ```typescript
   'fashion': 'Verticals - Fashion & Apparel',  // Covers: clothing, accessories, apparel
   ```

2. **Group related verticals**: Keep similar industries together in the map
   ```typescript
   // Food & Dining
   'fast-food': 'Verticals - Food & Grocery',
   'restaurant': 'Verticals - Food & Grocery',
   'cafe': 'Verticals - Food & Grocery',
   ```

3. **README per folder**: Add README.md in each template folder explaining the templates

## Maintenance

### Regular Checks

**Monthly:**
- [ ] Verify all image links work (no 404s)
- [ ] Check for unused template folders
- [ ] Review and update mappings based on new backend verticals

**When Adding Backend Verticals:**
- [ ] Create corresponding template folder
- [ ] Add mapping to `industry-image-mapper.ts`
- [ ] Test with real prompts

### Updating Templates

To update existing template images:

1. Replace image files in subfolders (keep same names)
2. **No code changes needed**
3. Clear browser cache to see updates
4. Images are served directly from `/public` (Next.js static files)

## FAQ

**Q: Can I have more than 10 images per vertical?**
A: Currently limited to 10. To change, update `IMAGE_COUNT` constant in `industry-image-mapper.ts` and create additional numbered folders.

**Q: Can I use different image formats (JPG, WebP)?**
A: No, system expects PNG only. This ensures transparency support and consistency.

**Q: What if I don't have 10 images yet?**
A: Create fewer subfolders (e.g., 01-05). Carousel will show available images and may have empty slots.

**Q: Can multiple verticals share the same template folder?**
A: Yes! Map multiple keys to same folder:
```typescript
'restaurant': 'Verticals - Food & Grocery',
'cafe': 'Verticals - Food & Grocery',
'bakery': 'Verticals - Food & Grocery',
```

**Q: How do I test my changes locally?**
A:
1. Add images to `/public/images/templates/`
2. Update mapping
3. Restart dev server: `npm run dev`
4. Test with appropriate prompt

**Q: Do images need to be uploaded to CDN?**
A: No, images are served from Next.js `/public` directory automatically.

## Related Files

| File | Purpose |
|------|---------|
| `/src/lib/industry-image-mapper.ts` | Mapping logic & image path generation |
| `/src/components/HomeAppCarousel.tsx` | Carousel component that displays images |
| `/src/app/app-spec/page.tsx` | Page that uses the industry images |
| `/public/images/templates/` | Template image storage directory |

## Support

For questions or issues:
1. Check this documentation first
2. Review troubleshooting section
3. Check browser console for errors
4. Verify folder structure matches exactly

---

**Last Updated:** February 2026
**Version:** 1.0
**Maintainer:** Development Team
