/**
 * Theme Names with IDs and Color Palettes
 * Matches mobelo-QuickCart themes (theme/allThemes.ts, theme/additionalThemes.ts) for app customization.
 * Colors array (8): [primary, secondary, accent, background, backgroundSecondary, text.primary, text.secondary, border]
 */
export const THEME_NAMES = [
  { id: 1, value: 'nordic-minimal', label: 'Nordic Minimal', isDark: false, colors: ['#4A5C6A', '#B8A99A', '#7A9299', '#F8F9FA', '#FFFFFF', '#1A1A1A', '#6B7280', '#E8EAED'] },
  { id: 2, value: 'bold-fashion-luxe', label: 'Bold Fashion Luxe', isDark: true, colors: ['#D4AF37', '#8B4789', '#E6B980', '#0A0A0A', '#1A1A1A', '#FFFFFF', '#B8B8B8', '#3A3A3A'] },
  { id: 3, value: 'organic-green-eco', label: 'Organic Green Eco', isDark: false, colors: ['#6B8E23', '#8B7355', '#C8B560', '#F5F3EE', '#FAFAF7', '#2C3E1F', '#5A6B4A', '#D8E3C8'] },
  { id: 4, value: 'candy-pop', label: 'Candy Pop', isDark: false, colors: ['#FF1493', '#00CED1', '#FFD700', '#FFF5F7', '#FFFFFF', '#2D1B2E', '#7A5980', '#FFD6E8'] },
  { id: 5, value: 'futuristic-neon', label: 'Futuristic Neon', isDark: true, colors: ['#00FFFF', '#FF00FF', '#39FF14', '#0D0D0D', '#1A1A1A', '#FFFFFF', '#B0B0B0', '#00FFFF'] },
  { id: 6, value: 'boho-desert', label: 'Boho Desert', isDark: false, colors: ['#CD7F32', '#DEB887', '#E97451', '#FDF6E3', '#FFFEF9', '#4A3728', '#8B7355', '#E8DCC8'] },
  { id: 7, value: 'ocean-breeze', label: 'Ocean Breeze', isDark: false, colors: ['#0EA5E9', '#06B6D4', '#7DD3C0', '#F0F9FF', '#FFFFFF', '#0C4A6E', '#64748B', '#BAE6FD'] },
  { id: 8, value: 'monochrome-editorial', label: 'Monochrome Editorial', isDark: false, colors: ['#000000', '#4A4A4A', '#808080', '#FFFFFF', '#F8F8F8', '#000000', '#666666', '#E0E0E0'] },
  { id: 9, value: 'pastel-dream', label: 'Pastel Dream', isDark: false, colors: ['#B19CD9', '#B2F5EA', '#FFB3BA', '#FAF7FC', '#FFFFFF', '#4A3F5C', '#7B6F8E', '#E9E0F0'] },
  { id: 10, value: 'urban-streetwear', label: 'Urban Streetwear', isDark: false, colors: ['#FF3838', '#20C997', '#FFD93D', '#F8F9FA', '#FFFFFF', '#1A1A1A', '#4A4A4A', '#E5E5E5'] },
  { id: 11, value: 'royal-heritage', label: 'Royal Heritage', isDark: false, colors: ['#800020', '#D4AF37', '#F5E6D3', '#FFF8F0', '#FFFFFF', '#2C1810', '#6B5447', '#E8DCC8'] },
  { id: 12, value: 'cyber-minimal', label: 'Cyber Minimal', isDark: true, colors: ['#CCFF00', '#B026FF', '#00F5FF', '#0F0F0F', '#1A1A1A', '#FFFFFF', '#A0A0A0', '#333333'] },
  { id: 13, value: 'vintage-retro', label: 'Vintage Retro', isDark: false, colors: ['#E89B3C', '#20B2AA', '#FF7F50', '#FDF8F3', '#FFFFFF', '#3A2D1F', '#6B5B47', '#E8D8C8'] },
  { id: 14, value: 'marble-luxury', label: 'Marble Luxury', isDark: false, colors: ['#C9B037', '#E8E8E8', '#B8986F', '#FAFAFA', '#FFFFFF', '#1A1A1A', '#6B6B6B', '#E0E0E0'] },
  { id: 15, value: 'sport-dynamic', label: 'Sport Dynamic', isDark: false, colors: ['#E81C24', '#0080FF', '#2B2B2B', '#F5F5F5', '#FFFFFF', '#1A1A1A', '#4A4A4A', '#E0E0E0'] },
  { id: 16, value: 'anime-kawaii', label: 'Anime Kawaii', isDark: false, colors: ['#FFB3D9', '#A8D8FF', '#FFFACD', '#FFF9FB', '#FFFFFF', '#4A2D3E', '#7B5F73', '#FFDEEB'] },
  { id: 17, value: 'cyberpunk-pulse', label: 'Cyberpunk Pulse', isDark: true, colors: ['#BD00FF', '#00F5FF', '#FF006E', '#0A0A0A', '#151515', '#FFFFFF', '#B0B0B0', '#BD00FF'] },
  { id: 18, value: 'apple-clean', label: 'Apple Clean', isDark: false, colors: ['#007AFF', '#5AC8FA', '#FF9500', '#FFFFFF', '#F2F2F7', '#000000', '#8E8E93', '#D1D1D6'] },
  { id: 19, value: 'ethnic-festival', label: 'Ethnic Festival', isDark: false, colors: ['#FF6B35', '#004E89', '#8C1C13', '#FFF8F0', '#FFFFFF', '#2C1810', '#6B5447', '#E8DCC8'] },
  { id: 20, value: 'dark-matte-industrial', label: 'Dark Matte Industrial', isDark: true, colors: ['#808080', '#B87333', '#7A9299', '#1A1A1A', '#242424', '#E0E0E0', '#A0A0A0', '#404040'] },
  { id: 21, value: 'finance-blue', label: 'Finance Blue', isDark: false, colors: ['#003F7F', '#B0C4DE', '#C0C0C0', '#F8FAFB', '#FFFFFF', '#1A2632', '#5B6B7A', '#D8DFE6'] },
  { id: 22, value: 'pet-paradise', label: 'Pet Paradise', isDark: false, colors: ['#FF9E44', '#4ECDC4', '#8B5A3C', '#FFF9F2', '#FFFFFF', '#3A2D1F', '#6B5B47', '#E8DCC8'] },
  { id: 23, value: 'grocery-fresh', label: 'Grocery Fresh', isDark: false, colors: ['#4CAF50', '#FF5722', '#FFC107', '#F9FBF7', '#FFFFFF', '#1B3B1C', '#5A6B4A', '#D8E3C8'] },
  { id: 24, value: 'music-noir', label: 'Music Noir', isDark: true, colors: ['#D4AF37', '#2C2C2C', '#8B7355', '#0D0D0D', '#1A1A1A', '#FFFFFF', '#B8B8B8', '#3A3A3A'] },
  { id: 25, value: 'professional-grey', label: 'Professional Grey', isDark: false, colors: ['#475569', '#94A3B8', '#60A5FA', '#F8FAFC', '#FFFFFF', '#1E293B', '#64748B', '#D8DFE6'] },
] as const;

/**
 * Icon Libraries with IDs
 * 8 available icon libraries for mobile app customization
 */
export const ICON_LIBRARIES = [
  { id: 1, value: 'feather', label: 'Feather' },
  { id: 2, value: 'material', label: 'Material' },
  { id: 3, value: 'ionicons', label: 'Ionicons' },
  { id: 4, value: 'fontawesome', label: 'Font Awesome' },
  { id: 5, value: 'antdesign', label: 'Ant Design' },
  { id: 6, value: 'octicons', label: 'Octicons' },
  { id: 7, value: 'entypo', label: 'Entypo' },
  { id: 8, value: 'simpleline', label: 'Simple Line' },
] as const;

/**
 * Font Families with IDs
 * Available font families for mobile app customization
 *
 * NOTE: Custom fonts (Poppins, Inter, etc.) are not yet loaded in the template.
 * Font customization is temporarily disabled in the worker.
 * All apps will use 'System' font until custom fonts are loaded.
 */
export const FONT_FAMILIES = [
  { id: 1, value: 'System', label: 'System Default' },
  { id: 2, value: 'Courier', label: 'Courier' },
  { id: 3, value: 'Poppins', label: 'Poppins' },
  { id: 4, value: 'Inter', label: 'Inter' },
  { id: 5, value: 'Montserrat', label: 'Montserrat' },
  { id: 6, value: 'Source Sans 3', label: 'Source Sans 3' },
] as const;

/**
 * Type definitions
 */
export type ThemeName = typeof THEME_NAMES[number];
export type IconLibrary = typeof ICON_LIBRARIES[number];
export type FontFamily = typeof FONT_FAMILIES[number];

/**
 * Get theme colors by theme ID
 */
export const getThemeColors = (themeId: number | null): string[] => {
  if (!themeId) return [...THEME_NAMES[0].colors];
  const theme = getThemeById(themeId);
  return theme?.colors ? [...theme.colors] : [...THEME_NAMES[0].colors];
};

/**
 * Helper functions
 */
export const getThemeById = (id: number) => THEME_NAMES.find(t => t.id === id);
export const getThemeByValue = (value: string) => THEME_NAMES.find(t => t.value === value);
export const getIconLibraryById = (id: number) => ICON_LIBRARIES.find(i => i.id === id);
export const getIconLibraryByValue = (value: string) => ICON_LIBRARIES.find(i => i.value === value);
export const getFontFamilyById = (id: number) => FONT_FAMILIES.find(f => f.id === id);
export const getFontFamilyByValue = (value: string) => FONT_FAMILIES.find(f => f.value === value);

/**
 * Check if a theme is dark (matches mobelo-QuickCart theme.metadata.isDark)
 */
export const isDarkTheme = (themeId: number | null): boolean => {
  if (themeId == null) return false;
  const theme = getThemeById(themeId);
  return theme?.isDark ?? false;
};
