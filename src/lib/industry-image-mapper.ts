/**
 * Industry Image Mapper
 *
 * Maps backend verticalName values to template image folders.
 * Provides automatic fallback to "Verticals - General Retail" for unmapped industries.
 *
 * To add new industry templates:
 * 1. Create folder: /public/images/templates/Verticals - [New Industry]/
 * 2. Add 10 subfolders (01-10), each with matching .png (01/01.png, 02/02.png, etc.)
 * 3. Add one line to VERTICAL_TO_FOLDER_MAP below
 */

/**
 * Mapping between backend vertical names and template folder names
 */
const VERTICAL_TO_FOLDER_MAP: Record<string, string> = {
  'fashion': 'Verticals - Fashion & Apparel',
  'fast-food': 'Verticals - Food & Grocery',
  'grocery': 'Verticals - Food & Grocery',
  'food': 'Verticals - Food & Grocery',
  'food-grocery': 'Verticals - Food & Grocery',
  'electronics': 'Verticals - Electronics',
  'baby-products': 'Verticals - Health & Beauty',
  'sports': 'Verticals - Sports & Fitness',
  'fitness': 'Verticals - Sports & Fitness',
  'books': 'Verticals - Books & Media',
  'media': 'Verticals - Books & Media',
}

/**
 * Default fallback folder for unmapped industries or errors
 */
const DEFAULT_FOLDER = 'Verticals - General Retail'

/**
 * Number of template images per industry (01-10 subfolders)
 */
const IMAGE_COUNT = 10

/**
 * Get industry-specific template images based on backend verticalName
 *
 * @param verticalName - The vertical name from backend API (e.g., "fashion", "electronics")
 * @returns Array of image objects with src paths
 *
 * @example
 * const images = getIndustryImages('fashion')
 * // Returns: [
 * //   { src: '/images/templates/Verticals - Fashion & Apparel/01/01.png' },
 * //   { src: '/images/templates/Verticals - Fashion & Apparel/02/02.png' },
 * //   { src: '/images/templates/Verticals - Fashion & Apparel/03/03.png' },
 * //   ...
 * // ]
 */
export function getIndustryImages(verticalName: string): Array<{ src: string }> {
  // Normalize input
  const normalizedVertical = (verticalName || '').toLowerCase().trim()

  // Look up folder mapping, use default if not found
  const folderName = VERTICAL_TO_FOLDER_MAP[normalizedVertical] || DEFAULT_FOLDER

  // Generate image paths for all 10 subfolders
  const images: Array<{ src: string }> = []

  for (let i = 1; i <= IMAGE_COUNT; i++) {
    const folderNumber = i.toString().padStart(2, '0') // "01", "02", etc.
    // Image filename matches folder number (01/01.png, 02/02.png, etc.)
    const imagePath = `/images/templates/${folderName}/${folderNumber}/${folderNumber}.png`
    images.push({ src: imagePath })
  }

  return images
}

/**
 * Get the folder name for a given vertical (useful for debugging)
 *
 * @param verticalName - The vertical name from backend API
 * @returns The template folder name that will be used
 */
export function getIndustryFolderName(verticalName: string): string {
  const normalizedVertical = (verticalName || '').toLowerCase().trim()
  return VERTICAL_TO_FOLDER_MAP[normalizedVertical] || DEFAULT_FOLDER
}
