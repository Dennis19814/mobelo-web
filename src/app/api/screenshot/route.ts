import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export async function POST(request: NextRequest) {
  let browser = null
  let screenshot: Buffer
  
  try {
    const { html, device } = await request.json()
    
    // Debug info for development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Screenshot API debug:', {
        hasHtml: !!html,
        htmlLength: html?.length || 0,
        device,
        isFullDocument: html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')
      })
    }
    
    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    // Device configurations matching the preview
    const deviceConfigs = {
      iphone16: {
        width: 393,
        height: 852,
        deviceScaleFactor: 3
      },
      galaxys24: {
        width: 360,
        height: 780,
        deviceScaleFactor: 3
      }
    }

    const config = deviceConfigs[device as keyof typeof deviceConfigs] || deviceConfigs.iphone16

    // Launch browser
    browser = await chromium.launch({
      headless: true
    })

    const context = await browser.newContext({
      viewport: {
        width: 800,
        height: 1200
      },
      deviceScaleFactor: 1
    })

    const page = await context.newPage()

    // Create full HTML with phone frame
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .phone-frame {
            background: ${device === 'galaxys24' ? '#000' : '#1f2937'};
            border-radius: ${device === 'galaxys24' ? '2.5rem' : '3rem'};
            padding: ${device === 'galaxys24' ? '6px' : '8px'};
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
          .screen {
            background: white;
            border-radius: ${device === 'galaxys24' ? '2.3rem' : '2.8rem'};
            overflow: hidden;
            position: relative;
            width: 375px;
            height: 700px;
          }
          .status-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 24px;
            background: black;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
          }
          .notch {
            width: 80px;
            height: 12px;
            background: black;
            border-radius: 6px;
          }
          .content {
            position: absolute;
            top: 24px;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="phone" class="phone-frame">
          <div class="screen">
            <div class="status-bar">
              <div class="notch"></div>
            </div>
            <div class="content">
              ${html}
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Check if the HTML is a complete document or just content
    const isFullDocument = html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')
    
    if (isFullDocument) {
      // If it's a full HTML document, create a phone frame wrapper around it
      const phoneFrameHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f3f4f6;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .phone-container {
              position: relative;
              background: ${device === 'galaxys24' ? '#000' : '#1f2937'};
              border-radius: ${device === 'galaxys24' ? '2.5rem' : '3rem'};
              padding: ${device === 'galaxys24' ? '8px' : '12px'};
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              width: 400px;
              height: 750px;
            }
            .phone-screen {
              background: white;
              border-radius: ${device === 'galaxys24' ? '2.3rem' : '2.8rem'};
              overflow: hidden;
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .status-bar {
              height: 30px;
              background: black;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0 16px;
              color: white;
              font-size: 12px;
              flex-shrink: 0;
            }
            .app-iframe {
              flex: 1;
              border: none;
              width: 100%;
              background: white;
            }
            .home-indicator {
              position: absolute;
              bottom: 8px;
              left: 50%;
              transform: translateX(-50%);
              width: 134px;
              height: 4px;
              background: #9ca3af;
              border-radius: 2px;
              ${device !== 'iphone16' ? 'display: none;' : ''}
            }
          </style>
        </head>
        <body>
          <div id="phone-frame" class="phone-container">
            <div class="phone-screen">
              <div class="status-bar">
                <span>9:41</span>
                <span>●●●</span>
              </div>
              <iframe class="app-iframe" srcdoc="${html.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"></iframe>
            </div>
            <div class="home-indicator"></div>
          </div>
        </body>
        </html>
      `
      
      await page.setContent(phoneFrameHTML, { waitUntil: 'networkidle' })
      
      // Wait for iframe to load
      await page.waitForTimeout(2000)
      
      // Take screenshot of the phone frame
      const phoneElement = await page.$('#phone-frame')
      if (!phoneElement) {
        throw new Error('Phone frame not found')
      }
      
      screenshot = await phoneElement.screenshot({
        type: 'png',
        omitBackground: true
      })
      
    } else {
      // Original logic for content-only HTML
      await page.setContent(fullHTML, { waitUntil: 'networkidle' })

      // Take screenshot of the phone element
      const phoneElement = await page.$('#phone')
      if (!phoneElement) {
        throw new Error('Phone element not found')
      }

      screenshot = await phoneElement.screenshot({
        type: 'png',
        omitBackground: true
      })
    }

    await browser.close()

    // Return the PNG as a response - convert Buffer to Uint8Array for NextResponse
    const buffer = Buffer.from(screenshot)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="preview-${Date.now()}.png"`
      }
    })
  } catch (error) {
    logger.error('Screenshot error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    })
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        logger.error('Error closing browser:', {
          error: closeError instanceof Error ? closeError.message : String(closeError),
          stack: closeError instanceof Error ? closeError.stack : undefined
        })
      }
    }
    return NextResponse.json(
      { 
        error: 'Failed to generate screenshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}