const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  sbquo: "'",
  bdquo: '"',
  mdash: ' - ',
  ndash: '-',
  hellip: '...',
  bull: ' ',
  middot: ' ',
  pound: '£',
  euro: '€',
  yen: '¥',
  copy: '',
  reg: '',
  trade: '',
  deg: ' degrees',
  times: 'x',
  divide: '/',
  frac12: '1/2',
  frac14: '1/4',
  frac34: '3/4',
  eacute: 'e',
  egrave: 'e',
  ecirc: 'e',
  aacute: 'a',
  agrave: 'a',
  acirc: 'a',
  iacute: 'i',
  oacute: 'o',
  uacute: 'u',
  uuml: 'u',
  ccedil: 'c',
  ntilde: 'n',
};

function decodeEntityPass(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-z0-9]+);/gi, (_, name) => {
      const lower = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, lower) ? NAMED_ENTITIES[lower] : ' ';
    });
}

/**
 * Normalizes scraped football news text into clean, readable plain English
 * free of raw HTML tags, HTML entities, JSON widget fragments, and < > & # symbols.
 */
export function sanitizeNewsText(raw: string | undefined | null, preserveParagraphs = false): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '');

  // Decode twice so double-encoded entities (&amp;#x27; or &amp;lt;p&amp;gt;) unwrap cleanly
  text = decodeEntityPass(text);
  text = decodeEntityPass(text);

  // Preserve paragraph structure from HTML block tags before stripping all tags
  text = text
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr|section|article|figcaption)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(?:[^<>"']|"[^"]*"|'[^']*')*>/g, ' ')
    .replace(/<[^>]*>/g, ' ');

  // Remove leaked JSON attribute/hydration fragments and scraped image-credit clutter
  text = text
    .replace(/[^.\n]{0,160}"\},\s*"articleCount"[\s\S]*?\}">/gi, ' ')
    .replace(/\{"[a-zA-Z0-9_]+":[\s\S]{0,600}?\}(?:"\}>|\}>|">|>)?/g, ' ')
    .replace(/[a-zA-Z0-9_]+":(?:"[^"]*"|\d+|true|false|null|\[[^\]]*\]|\{[^}]*\})[,}\]]*">?/g, ' ')
    .replace(/Image source,\s*[^\n]*?(?=Image caption,|Media caption,|Published\s*\d|\n|$)/gi, '')
    .replace(/(?:Image|Media)\s+caption,\s*/gi, '')
    .replace(/Published\s*\d+\s*(?:second|minute|hour|day|week)s?\s*ago\s*/gi, '')
    .replace(/\n*Full reporting and coverage from .*?Maestro Arena\./gi, '')
    .replace(/\n*Follow live tactical reactions, line-ups, and post-match quotes on Maestro Arena\./gi, '');

  // Eliminate leftover entity tokens and unnecessary < > & # symbols
  text = text
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/#(\d+)\b/g, 'number $1')
    .replace(/#/g, '');

  if (preserveParagraphs) {
    return text
      .split(/\n{2,}/)
      .map((p) => p.replace(/[ \t\n]+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim())
      .filter((p) => p.length > 0)
      .join('\n\n');
  }

  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}
