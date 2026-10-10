/**
 * @file Character-substitution "rich text" for LinkedIn.
 *
 * LinkedIn's post API takes a plain string — there's no bold/italic
 * markup it renders. What every LinkedIn formatting tool actually does
 * is swap normal letters for visually-bold/italic Unicode code points
 * from the Mathematical Alphanumeric Symbols block. That's genuinely
 * what LinkedIn will display, so the editor works directly on the plain
 * string LinkedIn will receive — what you see in the textarea is
 * character-for-character what gets published, no lossy conversion step
 * at publish time.
 *
 * Only letters and digits have bold/italic variants in Unicode; anything
 * else (spaces, punctuation, emoji, non-Latin scripts) is left as-is.
 */

const RANGES = {
  bold: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italic: { upper: 0x1d434, lower: 0x1d44e, digit: null },
  boldItalic: { upper: 0x1d468, lower: 0x1d482, digit: null },
};

/**
 * @param {string} text
 * @param {'bold'|'italic'|'boldItalic'} style
 * @returns {string}
 */
function toStyled(text, style) {
  const { upper, lower, digit } = RANGES[style];
  return Array.from(text)
    .map((char) => {
      const code = char.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(upper + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(lower + (code - 97));
      if (digit !== null && code >= 48 && code <= 57) return String.fromCodePoint(digit + (code - 48));
      return char;
    })
    .join('');
}

export const toBold = (text) => toStyled(text, 'bold');
export const toItalic = (text) => toStyled(text, 'italic');
export const toBoldItalic = (text) => toStyled(text, 'boldItalic');

/**
 * Underline/strikethrough have no letter-substitution equivalent — they
 * use a combining character inserted after every character instead.
 * @param {string} text
 * @param {string} combiningChar
 */
function withCombining(text, combiningChar) {
  return Array.from(text)
    .map((char) => (char.trim() ? char + combiningChar : char))
    .join('');
}

export const toUnderline = (text) => withCombining(text, '\u0332');
export const toStrikethrough = (text) => withCombining(text, '\u0336');

/**
 * Applies a transform to the selected substring of `text` (by index),
 * returning the new full string plus where the selection now ends, so
 * the caller can restore cursor focus after the DOM updates.
 * @param {string} text
 * @param {number} selectionStart
 * @param {number} selectionEnd
 * @param {(selected: string) => string} transform
 * @returns {{ text: string, selectionStart: number, selectionEnd: number }}
 */
export function applyToSelection(text, selectionStart, selectionEnd, transform) {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);
  const transformed = transform(selected);
  return {
    text: before + transformed + after,
    selectionStart,
    selectionEnd: selectionStart + transformed.length,
  };
}

/**
 * Inserts a bullet-point prefix before the line(s) containing the
 * current selection — no Unicode trick needed, "•" is a plain character.
 * @param {string} text
 * @param {number} selectionStart
 * @param {number} selectionEnd
 */
export function toggleBulletList(text, selectionStart, selectionEnd) {
  const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEndIndex = text.indexOf('\n', selectionEnd);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;

  const block = text.slice(lineStart, lineEnd);
  const lines = block.split('\n');
  const allBulleted = lines.every((line) => line.startsWith('• ') || line.trim() === '');
  const nextLines = lines.map((line) => {
    if (line.trim() === '') return line;
    return allBulleted ? line.replace(/^•\s/, '') : `• ${line}`;
  });
  const nextBlock = nextLines.join('\n');

  return {
    text: text.slice(0, lineStart) + nextBlock + text.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length,
  };
}