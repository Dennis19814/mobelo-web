import DOMPurify from 'dompurify'

export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: remove script tags and event handlers with regex
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
  }
  
  // Client-side: use DOMPurify for comprehensive sanitization
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'button', 'input', 'form',
      'label', 'select', 'option', 'textarea', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'section', 'article', 'header',
      'footer', 'nav', 'main', 'aside', 'figure', 'figcaption',
      'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'blockquote',
      'code', 'pre', 'small', 'svg', 'path', 'circle', 'rect',
      'line', 'polygon', 'polyline', 'ellipse'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'href', 'src', 'alt', 'title',
      'width', 'height', 'type', 'placeholder', 'value', 'name',
      'for', 'role', 'aria-label', 'aria-hidden', 'aria-expanded',
      'aria-controls', 'aria-describedby', 'data-*', 'viewBox',
      'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r',
      'x', 'y', 'x1', 'x2', 'y1', 'y2', 'points', 'rx', 'ry',
      'target', 'rel'
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
  })
}