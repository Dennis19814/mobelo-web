/**
 * Template Metadata Extraction Script
 *
 * Reads all README.md files from template folders and generates
 * a TypeScript constant file with theme/icon IDs for carousel-dropdown sync.
 *
 * Run with: npx ts-node src/scripts/extract-template-metadata.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Import constants for ID mapping
import { THEME_NAMES, ICON_LIBRARIES } from '../lib/web-app-constants'

type TemplateMetadata = {
  vertical: string
  themeId: number
  iconLibraryId: number
  borderRadius: string
}

type VerticalMetadata = Record<string, TemplateMetadata[]>

const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'images', 'templates')
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'lib', 'template-metadata.ts')

/**
 * Parse a README.md file and extract metadata
 */
function parseReadme(readmePath: string): Omit<TemplateMetadata, 'themeId' | 'iconLibraryId'> & { colorTheme: string; iconFamily: string } {
  const content = fs.readFileSync(readmePath, 'utf-8')

  // Extract values using regex
  const verticalMatch = content.match(/\*\*Vertical:\*\*\s*\n?([^\n]+)/i)
  const colorThemeMatch = content.match(/\*\*Color theme:\*\*\s*\n?([^\n]+)/i)
  const borderRadiusMatch = content.match(/\*\*Border Radius:\*\*\s*\n?([^\n]+)/i)
  const iconFamilyMatch = content.match(/\*\*Icon family:\*\*\s*\n?([^\n]+)/i)

  return {
    vertical: verticalMatch?.[1]?.trim() || '',
    colorTheme: colorThemeMatch?.[1]?.trim() || '',
    borderRadius: borderRadiusMatch?.[1]?.trim() || '',
    iconFamily: iconFamilyMatch?.[1]?.trim() || '',
  }
}

/**
 * Map color theme string to theme ID
 */
function getThemeId(colorTheme: string): number {
  const theme = THEME_NAMES.find(t => t.value === colorTheme)
  if (!theme) {
    console.warn(`⚠️  Warning: Theme "${colorTheme}" not found in THEME_NAMES. Using default (1).`)
    return 1
  }
  return theme.id
}

/**
 * Map icon family string to icon library ID
 */
function getIconLibraryId(iconFamily: string): number {
  const iconLib = ICON_LIBRARIES.find(i => i.value === iconFamily)
  if (!iconLib) {
    console.warn(`⚠️  Warning: Icon library "${iconFamily}" not found in ICON_LIBRARIES. Using default (1).`)
    return 1
  }
  return iconLib.id
}

/**
 * Extract metadata from all template folders
 */
function extractAllMetadata(): VerticalMetadata {
  const result: VerticalMetadata = {}

  // Get all vertical folders
  const verticalFolders = fs.readdirSync(TEMPLATES_DIR)
    .filter(name => fs.statSync(path.join(TEMPLATES_DIR, name)).isDirectory())
    .filter(name => name.startsWith('Verticals - '))
    .sort()

  console.log(`\n📂 Found ${verticalFolders.length} vertical folders\n`)

  for (const verticalFolder of verticalFolders) {
    const verticalPath = path.join(TEMPLATES_DIR, verticalFolder)
    const templates: TemplateMetadata[] = []

    // Get numbered subfolders (01, 02, etc.)
    const subfolders = fs.readdirSync(verticalPath)
      .filter(name => /^\d+$/.test(name))
      .sort()

    console.log(`  ${verticalFolder}: ${subfolders.length} templates`)

    for (const subfolder of subfolders) {
      const readmePath = path.join(verticalPath, subfolder, 'README.md')

      if (fs.existsSync(readmePath)) {
        const parsed = parseReadme(readmePath)
        const metadata: TemplateMetadata = {
          vertical: parsed.vertical,
          themeId: getThemeId(parsed.colorTheme),
          iconLibraryId: getIconLibraryId(parsed.iconFamily),
          borderRadius: parsed.borderRadius,
        }

        templates.push(metadata)
      } else {
        console.warn(`    ⚠️  Missing README: ${subfolder}/README.md`)
      }
    }

    result[verticalFolder] = templates
  }

  return result
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(metadata: VerticalMetadata): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * Template Metadata')
  lines.push(' *')
  lines.push(' * Auto-generated from README.md files in /public/images/templates/')
  lines.push(' * Maps each template image to its theme ID, icon library ID, and border radius.')
  lines.push(' *')
  lines.push(' * DO NOT EDIT MANUALLY - Regenerate with: npx ts-node src/scripts/extract-template-metadata.ts')
  lines.push(' */')
  lines.push('')
  lines.push('export type TemplateMetadata = {')
  lines.push('  vertical: string')
  lines.push('  themeId: number')
  lines.push('  iconLibraryId: number')
  lines.push('  borderRadius: string')
  lines.push('}')
  lines.push('')
  lines.push('export const TEMPLATE_METADATA: Record<string, TemplateMetadata[]> = {')

  const verticalFolders = Object.keys(metadata).sort()

  for (let i = 0; i < verticalFolders.length; i++) {
    const verticalFolder = verticalFolders[i]
    const templates = metadata[verticalFolder]

    lines.push(`  '${verticalFolder}': [`)

    for (let j = 0; j < templates.length; j++) {
      const t = templates[j]
      const isLast = j === templates.length - 1
      lines.push(`    { vertical: '${t.vertical}', themeId: ${t.themeId}, iconLibraryId: ${t.iconLibraryId}, borderRadius: '${t.borderRadius}' }${isLast ? '' : ','}`)
    }

    const isLastVertical = i === verticalFolders.length - 1
    lines.push(`  ]${isLastVertical ? '' : ','}`)
  }

  lines.push('}')
  lines.push('')
  lines.push('/**')
  lines.push(' * Get template metadata by vertical folder and index')
  lines.push(' *')
  lines.push(' * @param verticalFolder - The vertical folder name (e.g., "Verticals - Fashion & Apparel")')
  lines.push(' * @param index - The template index (0-based)')
  lines.push(' * @returns The template metadata or null if not found')
  lines.push(' */')
  lines.push('export function getTemplateMetadata(verticalFolder: string, index: number): TemplateMetadata | null {')
  lines.push('  const templates = TEMPLATE_METADATA[verticalFolder]')
  lines.push('  if (!templates || index < 0 || index >= templates.length) {')
  lines.push('    return null')
  lines.push('  }')
  lines.push('  return templates[index]')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Template Metadata Extraction Script')
  console.log('=====================================\n')

  // Extract metadata
  const metadata = extractAllMetadata()

  // Count total templates
  const totalTemplates = Object.values(metadata).reduce((sum, arr) => sum + arr.length, 0)
  console.log(`\n✅ Extracted metadata from ${totalTemplates} templates\n`)

  // Generate TypeScript file
  const tsContent = generateTypeScriptFile(metadata)

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8')
  console.log(`✅ Generated: ${path.relative(process.cwd(), OUTPUT_FILE)}\n`)

  // Summary
  console.log('📊 Summary:')
  Object.entries(metadata).forEach(([vertical, templates]) => {
    console.log(`   ${vertical}: ${templates.length} templates`)
  })

  console.log('\n🎉 Done!\n')
}

// Run the script
main()
