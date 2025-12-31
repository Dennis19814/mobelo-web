# Merchant Panel Design System

## Typography

### Headings
- **Page Title (H1)**: `text-2xl font-bold text-gray-900`
- **Section Title (H2)**: `text-xl font-semibold text-gray-900`
- **Subsection (H3)**: `text-lg font-medium text-gray-900`
- **Card Title**: `text-base font-medium text-gray-900`
- **Description Text**: `text-sm text-gray-600`
- **Label Text**: `text-xs font-medium text-gray-700 uppercase tracking-wide`

## Buttons

### Primary Button (CTA)
```tsx
className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
```

### Secondary Button
```tsx
className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
```

### Danger Button
```tsx
className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors font-medium text-sm"
```

### Icon Button
```tsx
className="p-2 text-gray-600 hover:text-orange-600 transition-colors rounded-lg hover:bg-orange-50"
```

### Responsive Button
```tsx
className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm whitespace-nowrap"
```

## Forms

### Input Field
```tsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
```

### Select Field
```tsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
```

### Label
```tsx
className="block text-sm font-medium text-gray-700 mb-1"
```

## Cards & Containers

### Main Card
```tsx
className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
```

### Compact Card
```tsx
className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
```

### Hover Card
```tsx
className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
```

## Icons

### Standard Size
- Small: `w-4 h-4`
- Medium: `w-5 h-5`
- Large: `w-6 h-6`

### Icon in Button
```tsx
<Icon className="w-4 h-4" />
```

## Badges & Status

### Status Badge
```tsx
// Success
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"

// Warning
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"

// Error
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"

// Info
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"

// Orange (Active)
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
```

## Tabs

### Tab Button
```tsx
// Active
className="flex items-center gap-2 py-4 px-1 border-b-2 border-orange-500 text-orange-600 font-medium text-sm"

// Inactive
className="flex items-center gap-2 py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
```

## Tables

### Table Header
```tsx
className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
```

### Table Cell
```tsx
className="px-4 py-3 text-sm text-gray-900"
```

### Table Row
```tsx
className="hover:bg-gray-50 transition-colors"
```

## Spacing

### Section Spacing
- Between sections: `space-y-6`
- Within cards: `space-y-4`
- Form fields: `space-y-3`

### Padding
- Page: `px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6`
- Card: `p-4 md:p-6`
- Compact: `p-3 md:p-4`

## Responsive Patterns

### Container
```tsx
className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
```

### Grid
```tsx
// 1-2-3-4 columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6"

// 1-2-3 columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
```

### Flex Header
```tsx
className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
```

## Colors

### Brand (Orange)
- Primary: `orange-600` (buttons, links)
- Hover: `orange-700`
- Light: `orange-50` (backgrounds)
- Lighter: `orange-100` (badges)

### Neutral
- Text: `gray-900` (headings), `gray-700` (body), `gray-600` (muted), `gray-500` (placeholder)
- Borders: `gray-200`, `gray-300`
- Backgrounds: `gray-50`, `gray-100`

### Semantic
- Success: `green-600`, `green-100`
- Warning: `yellow-600`, `yellow-100`
- Error: `red-600`, `red-100`
- Info: `blue-600`, `blue-100`

## Shadows

- Light: `shadow-sm`
- Medium: `shadow-md`
- Card Hover: `hover:shadow-lg`

## Borders

- Default: `border border-gray-200`
- Focus: `focus:ring-2 focus:ring-orange-500`
- Rounded: `rounded-lg` (most elements), `rounded-xl` (cards on hover), `rounded-full` (badges)
