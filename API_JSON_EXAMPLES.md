# API JSON Examples for Build Mobile App

## Current Endpoint JSON (What's Currently Sent)

**Endpoint:** `POST /v1/platform/apps/with-spec`

**Current Request Body:**
```json
{
  "appIdea": "Create a fashion e-commerce app",
  "specData": {
    "best": {
      "verticalName": "Fashion",
      "confidence": 0.95,
      "suggestedThemes": [...]
    },
    "explanation": {
      "keyFeatures": [...],
      "pages": [...]
    },
    "concept": {
      "appName": "FashionHub",
      "oneLiner": "Your fashion destination",
      "heroTagline": "Discover the latest trends",
      "homepageSections": [...],
      "recommendedPages": [...]
    },
    "theme": {
      "id": "bold-fashion-luxe",
      "displayName": "Bold Fashion Luxe",
      "colors": {
        "primary": "#D4AF37",
        "secondary": "#6B2C91",
        "accent": "#FFD700",
        "background": "#FFFFFF",
        "text": "#000000"
      },
      "usage": {
        "primary": "Buttons and highlights",
        "secondary": "Secondary actions",
        "accent": "Accent elements"
      },
      "isDark": false
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "menuItems": [...],
    "shortDescription": "..."
  }
}
```

**Note:** 
- Currently, `customizations` are stored in sessionStorage but NOT sent to the API.
- The `specData.theme` object comes from the API response (AI-generated theme suggestion).
- The `customizations.theme` object is the user-selected theme from the dropdown (from THEME_NAMES).

---

## Updated Endpoint JSON (What Should Be Sent)

**Endpoint:** `POST /v1/platform/apps/with-spec`

**Updated Request Body:**
```json
{
  "appIdea": "Create a fashion e-commerce app",
  "specData": {
    "best": {
      "verticalName": "Fashion",
      "confidence": 0.95,
      "suggestedThemes": [...]
    },
    "explanation": {
      "keyFeatures": [...],
      "pages": [...]
    },
    "concept": {
      "appName": "FashionHub",
      "oneLiner": "Your fashion destination",
      "heroTagline": "Discover the latest trends",
      "homepageSections": [...],
      "recommendedPages": [...]
    },
    "theme": {
      "id": "bold-fashion-luxe",
      "displayName": "Bold Fashion Luxe",
      "colors": {
        "primary": "#D4AF37",
        "secondary": "#6B2C91",
        "accent": "#FFD700",
        "background": "#FFFFFF",
        "text": "#000000"
      },
      "usage": {
        "primary": "Buttons and highlights",
        "secondary": "Secondary actions",
        "accent": "Accent elements"
      },
      "isDark": false
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "menuItems": [...],
    "shortDescription": "..."
  },
  "customizations": {
    "theme": {
      "id": 12,
      "value": "cyber-minimal",
      "label": "Cyber Minimal",
      "colors": [
        "#000000",
        "#00FF00",
        "#00CED1",
        "#1A1A1A",
        "#2D2D2D",
        "#4A4A4A",
        "#808080",
        "#FFFFFF"
      ]
    },
    "fontFamily": {
      "id": 3,
      "value": "Poppins",
      "label": "Poppins"
    },
    "iconLibrary": {
      "id": 1,
      "value": "feather",
      "label": "Feather"
    }
  }
}
```

---

## Alternative: Include Customizations in specData

If you prefer to include customizations inside `specData`:

```json
{
  "appIdea": "Create a fashion e-commerce app",
  "specData": {
    "best": {...},
    "explanation": {...},
    "concept": {...},
    "theme": {
      "id": "bold-fashion-luxe",
      "displayName": "Bold Fashion Luxe",
      "colors": {
        "primary": "#D4AF37",
        "secondary": "#6B2C91",
        "accent": "#FFD700",
        "background": "#FFFFFF",
        "text": "#000000"
      },
      "usage": {
        "primary": "Buttons and highlights",
        "secondary": "Secondary actions",
        "accent": "Accent elements"
      },
      "isDark": false
    },
    "fonts": {...},
    "menuItems": [...],
    "shortDescription": "...",
    "customizations": {
      "theme": {
        "id": 12,
        "value": "cyber-minimal",
        "label": "Cyber Minimal",
        "colors": [
          "#000000",
          "#00FF00",
          "#00CED1",
          "#1A1A1A",
          "#2D2D2D",
          "#4A4A4A",
          "#808080",
          "#FFFFFF"
        ]
      },
      "fontFamily": {
        "id": 3,
        "value": "Poppins",
        "label": "Poppins"
      },
      "iconLibrary": {
        "id": 1,
        "value": "feather",
        "label": "Feather"
      }
    }
  }
}
```

---

## Example Values

### Theme Example (Cyber Minimal):
```json
{
  "id": 12,
  "value": "cyber-minimal",
  "label": "Cyber Minimal",
  "colors": [
    "#000000",  // Black
    "#00FF00",  // Neon Green
    "#00CED1",  // Cyan
    "#1A1A1A",  // Dark Gray
    "#2D2D2D",  // Medium Dark Gray
    "#4A4A4A",  // Medium Gray
    "#808080",  // Light Gray
    "#FFFFFF"   // White
  ]
}
```

### Font Family Example:
```json
{
  "id": 3,
  "value": "Poppins",
  "label": "Poppins"
}
```

### Icon Library Example:
```json
{
  "id": 1,
  "value": "feather",
  "label": "Feather"
}
```

---

---

## Important Notes

### Difference Between `specData.theme` and `customizations.theme`:

1. **`specData.theme`** (from API):
   - Comes from the AI-generated app spec
   - Structure: `{ id: string, displayName: string, colors: {...}, usage?: {...}, isDark?: boolean }`
   - This is the theme suggested by the AI based on the app idea

2. **`customizations.theme`** (user-selected):
   - Selected by the user from the theme dropdown
   - Structure: `{ id: number, value: string, label: string, colors: string[] }`
   - This is the theme the user actually wants to use for their app
   - Contains 8 colors in an array format

---

## Summary

**Current:** Only sends `appIdea` and `specData` (no customizations)

**Updated:** Should send `appIdea`, `specData`, and `customizations` object containing:
- `theme` (user-selected theme with id, value, label, and colors array)
- `fontFamily` (user-selected font with id, value, label)
- `iconLibrary` (user-selected icon library with id, value, label)
