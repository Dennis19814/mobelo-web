// Central configuration for predefined variant types and helpers

export type VariantTypeKey =
  | 'colour'
  | 'size'
  | 'storage'
  | 'ram'
  | 'weight'
  | 'volume'
  | 'length'
  | 'material'
  | 'pattern'
  | 'style'
  | 'shoe_size'
  | 'waist'
  | 'age_range'
  | 'brand'
  | 'model'
  | 'fit'
  | 'finish'
  | 'dimensions'
  | 'flavor'
  | 'scent'
  | 'other';

export interface VariantTypeDef {
  key: VariantTypeKey;
  label: string;
  synonyms?: string[]; // for detecting from free-text names
  suggestions?: string[]; // quick chips for common values
  valueHint?: string; // short inline helper
  placeholder?: string; // input placeholder
}

export const VARIANT_TYPES: VariantTypeDef[] = [
  {
    key: 'colour',
    label: 'Colour',
    synonyms: ['color', 'colour'],
    valueHint: 'Enter as Name and #Hex (e.g., Red | #FF0000).',
  },
  {
    key: 'size',
    label: 'Size',
    suggestions: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    valueHint: 'Common sizes: XS, S, M, L, XL, 2XL, 3XL.',
    placeholder: 'e.g., M',
  },
  {
    key: 'storage',
    label: 'Storage Capacity',
    suggestions: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
    valueHint: 'Use units (e.g., 128GB, 1TB).',
  },
  {
    key: 'ram',
    label: 'RAM',
    suggestions: ['4GB', '8GB', '16GB', '32GB'],
    valueHint: 'Use units (e.g., 8GB).',
  },
  { key: 'weight', label: 'Weight', valueHint: 'Include units (e.g., 500g).', placeholder: 'e.g., 500g' },
  { key: 'volume', label: 'Volume', valueHint: 'Include units (e.g., 250ml).', placeholder: 'e.g., 250ml' },
  { key: 'length', label: 'Length', valueHint: 'Include units (e.g., 20cm).', placeholder: 'e.g., 20cm' },
  { key: 'material', label: 'Material', valueHint: 'e.g., Cotton, Leather' },
  { key: 'pattern', label: 'Pattern', valueHint: 'e.g., Solid, Stripes, Floral' },
  { key: 'style', label: 'Style', valueHint: 'e.g., Casual, Formal, Sport' },
  { key: 'shoe_size', label: 'Shoe Size', valueHint: 'e.g., 8, 8.5, 42EU' },
  { key: 'waist', label: 'Waist', valueHint: 'e.g., 32, 34' },
  { key: 'age_range', label: 'Age Range', valueHint: 'e.g., 0-3M, 3-6M, 6-12M' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'fit', label: 'Fit', valueHint: 'e.g., Slim, Regular, Relaxed' },
  { key: 'finish', label: 'Finish', valueHint: 'e.g., Matte, Glossy' },
  { key: 'dimensions', label: 'Dimensions', valueHint: 'e.g., 10x20x5 cm' },
  { key: 'flavor', label: 'Flavor', valueHint: 'e.g., Vanilla, Chocolate' },
  { key: 'scent', label: 'Scent', valueHint: 'e.g., Lavender, Citrus' },
  { key: 'other', label: 'Other (custom)' },
];

export function getTypeByName(name?: string): VariantTypeDef {
  const n = (name || '').trim().toLowerCase();
  if (!n) return VARIANT_TYPES[0];
  // Direct match on label or synonyms
  for (const t of VARIANT_TYPES) {
    if (t.label.toLowerCase() === n) return t;
    if (t.synonyms?.some((s) => s.toLowerCase() === n)) return t;
  }
  // Contains match for colour/color
  if (n.includes('color') || n.includes('colour')) return VARIANT_TYPES.find((t) => t.key === 'colour')!;
  return VARIANT_TYPES.find((t) => t.key === 'other')!;
}

export function isColourType(name?: string): boolean {
  const t = getTypeByName(name);
  return t.key === 'colour';
}

export function parseColour(value?: string): { label: string; code: string } {
  const raw = (value || '').trim();
  if (!raw) return { label: '', code: '' };
  if (raw.includes('|')) {
    const [label, code] = raw.split('|');
    return { label: (label || '').trim(), code: (code || '').trim() };
  }
  const isHex = /^#?[0-9A-Fa-f]{3,8}$/.test(raw);
  return { label: isHex ? '' : raw, code: isHex ? (raw.startsWith('#') ? raw : `#${raw}`) : '' };
}

export function composeColour(label: string, code: string): string {
  const l = (label || '').trim();
  let c = (code || '').trim();
  if (c && !c.startsWith('#')) c = `#${c}`;
  return l && c ? `${l}|${c}` : l || c;
}

