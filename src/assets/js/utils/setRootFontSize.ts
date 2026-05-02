/**
 * Utility for dynamically applying and enforcing the base font size to the document root and body elements.
 *
 * This utility ensures consistent typography across the extension's UI by programmatically
 * setting CSS variables and style properties, overriding external stylesheets where necessary.
 *
 * @file
 * @lastModified 2026-04-30
 */

/**
 * Validates that the provided value is a valid font size.
 *
 * @remarks
 * The parameter is typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param  {unknown}    fontSize - The value to validate.
 * @throws {TypeError}             If the font size is not an integer.
 * @throws {RangeError}            If the font size is out of a safe positive range.
 */
function validateArguments(fontSize: unknown): void {
	if (typeof fontSize !== "number" || !Number.isInteger(fontSize)) {
		throw new TypeError(`Invalid: argument "fontSize" must be an integer, but received ${typeof fontSize} (${fontSize})`);
	}

	if (fontSize > Number.MAX_SAFE_INTEGER || fontSize <= 0) {
		throw new RangeError(`Invalid: argument "fontSize" out of range (1 ~ MAX_SAFE_INTEGER). Received: ${fontSize}`);
	}
}

/**
 * Dynamically applies the base font size of the page based on settings.
 *
 * This function ensures that the font size change is applied by:
 * 1. Setting the `--base-font-size` CSS variable on the `:root` (html) element.
 * 2. Explicitly setting the `font-size` of the `html` element to use this variable.
 * 3. Setting the `font-size` of the `body` element to `1rem` to synchronize page-wide styles.
 *
 * This approach guarantees that the font size is updated even if the corresponding
 * CSS rules are not explicitly defined in the external stylesheet.
 *
 * @param   {number}     fontSize - The font size in pixels.
 * @returns {void}
 * @throws  {Error}                 If the function is called in an environment where 'document' is not defined.
 * @throws  {TypeError}             If the font size is not an integer.
 * @throws  {RangeError}            If the font size is out of a safe positive range.
 *
 * @example
 * // Resulting inline styles:
 * // <html style="--base-font-size: 16px; font-size: var(--base-font-size) !important;">
 * // <body style="font-size: 1rem !important;">
 *
 * // Equivalent CSS rules:
 * // :root {
 * //	  --base-font-size: 16px;
 * // }
 * // html {
 * //	  font-size: var(--base-font-size) !important;
 * // }
 * // body {
 * //	  font-size: 1rem !important;
 * // }
 */
export function setRootFontSize(fontSize: number): void {
	// Ensure that document is available (this function must be called in a browser environment)
	if (!globalThis || typeof globalThis?.document === "undefined") {
		throw new Error("ERROR(util): 'document' is not defined. This function must be called in a browser environment.");
	}

	validateArguments(fontSize);

	const root = document.documentElement;

	// Set the CSS variable on the root (html) element
	root.style.setProperty("--base-font-size", `${fontSize}px`);

	// Explicitly apply the variable to the html element's font-size
	root.style.setProperty("font-size", "var(--base-font-size)", "important");

	// Synchronize the body element to use rem units based on the root font size
	if (document.body) {
		document.body.style.setProperty("font-size", "1rem", "important");
	}
}