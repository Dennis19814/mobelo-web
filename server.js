const express = require('express')
const next = require('next')
const compression = require('compression')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 5173

app.prepare().then(() => {
  const server = express()

  // Compression middleware with Brotli support
  server.use(
    compression({
      // Enable Brotli compression
      brotli: {
        enabled: true,
        zlib: {
          params: {
            // Brotli compression quality (0-11, higher is better but slower)
            // Use 11 for pre-compressed static assets
            // Use 4 for dynamic content (good balance of speed and compression)
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: dev ? 4 : 11,
          },
        },
      },
      // Set compression threshold (only compress files larger than 1kb)
      threshold: 1024,
      // Compression level for gzip fallback (1-9, higher is better but slower)
      level: dev ? 6 : 9,
      // Filter function to determine what to compress
      filter: (req, res) => {
        // Don't compress responses with the no-transform cache control directive
        if (res.getHeader('Cache-Control')?.includes('no-transform')) {
          return false
        }

        // Compress all compressible content types
        return compression.filter(req, res)
      },
    })
  )

  // Serve Next.js static assets directly from filesystem (CSS, JS chunks, etc.)
  server.use('/_next/static', express.static(path.join(__dirname, '.next/static'), {
    maxAge: '1y',
    immutable: true,
  }))

  // Serve pre-compressed static files if they exist
  server.get(/\.(js|css|html|svg|json|xml|txt)$/, (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || ''
    // Fix: strip /_next/static/ prefix to resolve the correct file path
    const staticRelPath = req.path.replace(/^\/_next\/static\//, '')
    const filePath = path.join(__dirname, '.next', 'static', staticRelPath)

    // Try to serve pre-compressed Brotli file
    if (acceptEncoding.includes('br')) {
      const brPath = filePath + '.br'
      if (fs.existsSync(brPath)) {
        res.setHeader('Content-Encoding', 'br')
        res.setHeader('Content-Type', getContentType(req.path))
        return res.sendFile(brPath)
      }
    }

    // Try to serve pre-compressed Gzip file as fallback
    if (acceptEncoding.includes('gzip')) {
      const gzPath = filePath + '.gz'
      if (fs.existsSync(gzPath)) {
        res.setHeader('Content-Encoding', 'gzip')
        res.setHeader('Content-Type', getContentType(req.path))
        return res.sendFile(gzPath)
      }
    }

    // Fall back to regular file
    next()
  })

  // Security headers
  server.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    next()
  })

  // Handle all other requests with Next.js
  server.use((req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
    console.log(`> Compression: Brotli + Gzip enabled`)
    console.log(`> Environment: ${dev ? 'development' : 'production'}`)
  })
})

// Helper function to determine content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.txt': 'text/plain',
  }
  return types[ext] || 'application/octet-stream'
}

// Handle server errors gracefully
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
