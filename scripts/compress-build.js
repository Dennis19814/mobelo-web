#!/usr/bin/env node
/**
 * Build Compression Script
 * Pre-compresses static files with Brotli and Gzip for optimal performance
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { promisify } = require('util')

const brotli = promisify(zlib.brotliCompress)
const gzip = promisify(zlib.gzip)
const stat = promisify(fs.stat)
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

// File extensions to compress
const COMPRESSIBLE_EXTENSIONS = ['.js', '.css', '.html', '.svg', '.json', '.xml', '.txt']

// Minimum file size to compress (1KB)
const MIN_SIZE = 1024

// Brotli compression options (quality 11 = best compression)
const BROTLI_OPTIONS = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
  },
}

// Gzip compression options (level 9 = best compression)
const GZIP_OPTIONS = { level: 9 }

let filesProcessed = 0
let totalOriginalSize = 0
let totalBrotliSize = 0
let totalGzipSize = 0

/**
 * Recursively find all files in a directory
 */
async function* walkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })

  for (const file of files) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      yield* walkDir(filePath)
    } else {
      yield filePath
    }
  }
}

/**
 * Check if file should be compressed
 */
function shouldCompress(filePath, fileSize) {
  const ext = path.extname(filePath).toLowerCase()
  return COMPRESSIBLE_EXTENSIONS.includes(ext) && fileSize >= MIN_SIZE
}

/**
 * Compress a single file
 */
async function compressFile(filePath) {
  try {
    const fileSize = (await stat(filePath)).size

    if (!shouldCompress(filePath, fileSize)) {
      return
    }

    const content = await readFile(filePath)

    // Compress with Brotli
    const brotliCompressed = await brotli(content, BROTLI_OPTIONS)
    const brotliPath = `${filePath}.br`
    await writeFile(brotliPath, brotliCompressed)

    // Compress with Gzip
    const gzipCompressed = await gzip(content, GZIP_OPTIONS)
    const gzipPath = `${filePath}.gz`
    await writeFile(gzipPath, gzipCompressed)

    // Update stats
    filesProcessed++
    totalOriginalSize += fileSize
    totalBrotliSize += brotliCompressed.length
    totalGzipSize += gzipCompressed.length

    const brotliReduction = ((1 - brotliCompressed.length / fileSize) * 100).toFixed(1)
    const gzipReduction = ((1 - gzipCompressed.length / fileSize) * 100).toFixed(1)

    console.log(`✓ ${path.basename(filePath)}: ${formatBytes(fileSize)} → Brotli: ${formatBytes(brotliCompressed.length)} (-${brotliReduction}%) | Gzip: ${formatBytes(gzipCompressed.length)} (-${gzipReduction}%)`)
  } catch (error) {
    console.error(`✗ Error compressing ${filePath}:`, error.message)
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Main compression function
 */
async function compressBuild() {
  console.log('🔄 Starting build compression...\n')

  const buildDir = path.join(__dirname, '..', '.next')

  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run `npm run build` first.')
    process.exit(1)
  }

  const startTime = Date.now()

  // Compress all files in the build directory
  for await (const filePath of walkDir(buildDir)) {
    await compressFile(filePath)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  // Print summary
  console.log('\n📊 Compression Summary:')
  console.log(`─────────────────────────────────────────────`)
  console.log(`Files processed: ${filesProcessed}`)
  console.log(`Original size:   ${formatBytes(totalOriginalSize)}`)
  console.log(`Brotli size:     ${formatBytes(totalBrotliSize)} (-${((1 - totalBrotliSize / totalOriginalSize) * 100).toFixed(1)}%)`)
  console.log(`Gzip size:       ${formatBytes(totalGzipSize)} (-${((1 - totalGzipSize / totalOriginalSize) * 100).toFixed(1)}%)`)
  console.log(`Duration:        ${duration}s`)
  console.log(`─────────────────────────────────────────────`)
  console.log('✅ Build compression complete!')
}

// Run compression
compressBuild().catch((error) => {
  console.error('❌ Compression failed:', error)
  process.exit(1)
})
