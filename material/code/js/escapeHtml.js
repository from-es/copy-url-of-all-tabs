/**
 * Escapes special HTML characters to prevent XSS or rendering issues.
 *
 * @param {string} target - The string to escape.
 * @returns {string} The escaped HTML string.
 * @see https://aloerina01.github.io/blog/2017-04-28-1
 */
function escapeHtml(target) {
	if (typeof target !== 'string') {
		return target;
	}
	return target.replace(/[&'`"<>]/g, (match) => {
		return {
			'&': '&amp;',
			"'": '&#x27;',
			'`': '&#x60;',
			'"': '&quot;',
			'<': '&lt;',
			'>': '&gt;',
		}[match]
	});
}