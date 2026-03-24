/**
 * Calculates the display width of a string. Counts half-width characters as 1 and full-width characters as 2. Line breaks are not counted.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Calculates the display width of a string. Counts half-width characters as 1 and full-width characters as 2. Line breaks are not counted.
 *
 * @param   {string} str - The string whose width is to be calculated
 * @returns {number}       The calculated display width of the string
 *
 * @see https://zenn.dev/koojy/articles/javascript-2byte-length
 */
export function getWidthOfStringLength(str: string): number {
	let count = 0;
	const loop = str.length;

	for (let i = 0; i < loop; i++) {
		const char = str.charCodeAt(i);

		if (!str[i].match(/\r?\n/g)) {  // Skip line break characters
			if (char >= 0x0 && char <= 0x7f) {  // Distinguish between half-width and full-width
				count += 1;  // Half-width = 1 (display width)
			} else {
				count += 2;  // Full-width = 2 (display width)
			}
		}
	}

	return count;
}