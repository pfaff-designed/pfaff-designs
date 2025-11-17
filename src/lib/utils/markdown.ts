/**
 * Simple markdown to HTML converter
 * Currently only handles **bold** text
 */
export function markdownToHtml(markdown: string): string {
  // Convert **bold** to <strong>bold</strong>
  return markdown.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

