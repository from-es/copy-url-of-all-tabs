/**
 * Escapes HTML special characters to prevent Cross-Site Scripting (XSS).
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Escapes HTML special characters to prevent Cross-Site Scripting (XSS).
 *
 * Converts `&`, `'`, `` ` ``, `"`, `<`, `>` to their corresponding HTML entities.
 *
 * @template T                     The type of the value to escape
 * @param    {T}          target - The value to escape. If not a string, it is returned as is
 * @returns  {T | string}          The escaped safe HTML string, or the original value
 * @throws   {TypeError}           Thrown if the argument is not a string
 *
 * @see https://aloerina01.github.io/blog/2017-04-28-1
 */
export function escapeHTML<T>(target: T): T | string {
	if (typeof target !== "string") {
		console.debug("DEBUG(string): Invalid: argument 'target' must be a string", { target });
		throw new TypeError("Invalid: argument 'target' must be a string");
	}

	const escapeRegex = /[&'`"<>]/g;
	const escapes: { [key: string]: string } = {
		"&" : "&amp;",
		"'" : "&#x27;",
		"`" : "&#x60;",
		"\"": "&quot;",
		"<" : "&lt;",
		">" : "&gt;"
	};

	return target.replace(escapeRegex, (match) => escapes[match]);
}