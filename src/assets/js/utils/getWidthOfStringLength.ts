/**
 * Calculates the display width of a string. Counts half-width characters as 1 and full-width characters as 2. Line breaks are not counted.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Calculates the display width of a string. Counts half-width characters as 1 and full-width characters as 2. Line breaks are not counted.
 *
 * @param   {string}    str - The string whose width is to be calculated
 * @returns {number}          The calculated display width of the string
 * @throws  {TypeError}       Thrown if the argument is not a string
 *
 * @see https://zenn.dev/koojy/articles/javascript-2byte-length
 */
export function getWidthOfStringLength(str: string): number {
	if (typeof str !== "string") {
		throw new TypeError("Invalid: argument 'str' must be a string");
	}

	let   count                  = 0;
	const regex_break_characters = /[\r\n]/g;

	// Use for...of to correctly handle surrogate pairs (emojis, etc.) by iterating over code points
	for (const char of str) {
		const codePoint = char.codePointAt(0) || 0;

		if (!char.match(regex_break_characters)) {  // Skip line break characters
			if (codePoint >= 0x0 && codePoint <= 0x7f) {  // Distinguish between half-width and full-width
				count += 1;  // Half-width = 1 (display width)
			} else {
				count += 2;  // Full-width = 2 (display width)
			}
		}
	}

	return count;
}