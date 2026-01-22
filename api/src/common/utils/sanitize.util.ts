import DOMPurify from 'isomorphic-dompurify';

/**
 * =====================================================================
 * HTML SANITIZATION UTILITY - XSS PREVENTION
 * =====================================================================
 * 
 * 📚 PURPOSE:
 * Làm sạch HTML input từ user để ngăn chặn XSS (Cross-Site Scripting) attacks
 * 
 * 🔒 SECURITY:
 * - Strip tất cả các thẻ nguy hiểm: <script>, <iframe>, <object>
 * - Chỉ cho phép các thẻ an toàn cho rich text (p, strong, em, ul, ol, li)
 * - Remove tất cả event handlers (onclick, onerror, etc.)
 * 
 * 🎯 USE CASES:
 * - Product descriptions
 * - Blog post content
 * - User reviews
 * - Any user-generated HTML content
 * =====================================================================
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Raw HTML string from user input
 * @returns Cleaned HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    // Allowed HTML tags (safe for rich text)
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
    ],
    // Allowed attributes
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Force target="_blank" to open in new tab for security
    ADD_ATTR: ['target'],
  });
}

/**
 * Strict sanitization - remove ALL HTML tags
 * Use for: titles, short descriptions, metadata
 */
export function stripHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No tags allowed
    ALLOWED_ATTR: [],
  });
}
