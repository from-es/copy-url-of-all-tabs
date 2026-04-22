/**
 * Safely sets an HTML string to an element using sanitization and replaceChildren instead of innerHTML.
 *
 * @file
 * @lastModified 2026-04-18
 */

// Import NPM Package
import DOMPurify from "dompurify";

// Import Types
import type { Config as DOMPurifyConfig } from "dompurify";



/**
 * Determines whether a value is empty (null, undefined, an empty string, or whitespace-only).
 *
 * @param   {unknown} value - The value to check
 * @returns {boolean}         true if empty, otherwise false
 */
function isEmptyString(value: unknown): boolean {
	const isEmpty = !value || (typeof value === "string" && value.trim().length === 0);

	return isEmpty;
}

/**
 * Validates that the provided value is a valid Element.
 *
 * @remarks
 * Both parameters are typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param  {unknown}   element      - The value to validate
 * @param  {string}    functionName - The name of the calling function
 * @throws {TypeError}                If validation fails
 */
function validateElement(element: unknown): void {
	if (!element) {
		throw new TypeError(`Invalid: target element is not provided`);
	}
	if (!(element instanceof Element)) {
		throw new TypeError(`Invalid: target element must be an instance of Element`);
	}
}

/**
 * Validates the arguments passed to createSafeHTML().
 *
 * @remarks
 * Both parameters are typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param  {unknown}   htmlString - The HTML string to be sanitized
 * @param  {unknown}   options    - DOMPurify configuration options
 * @throws {TypeError}              Throws if htmlString is not a string, or if options is not an object
 */
function validateArguments(htmlString: unknown, options: unknown): void {
	// htmlString: Check if it's a string
	if (typeof htmlString !== "string") {
		throw new TypeError(`Invalid: argument "htmlString" must be a string, but received type ${typeof htmlString}`);
	}

	// options: Check if it's valid as DOMPurify configuration options
	// Since typeof [] is "object", a check using Array.isArray is necessary to exclude arrays
	if (options !== undefined && (typeof options !== "object" || options === null || Array.isArray(options))) {
		throw new TypeError(`Invalid: argument "options" must be an object, but received ${options === null ? "null" : `type ${typeof options}`}`);
	}
}

/**
 * Safely sets an HTML string to an element using sanitization and replaceChildren instead of innerHTML.
 *
 * @param   {Element}                   element    - The target DOM element to set the content. Replaces the child elements of the target
 * @param   {string | null | undefined} htmlString - The HTML string to render. If null, undefined, or an empty string, the element gets cleared
 * @param   {DOMPurifyConfig}           options    - DOMPurify configuration options
 * @returns {void}
 */
function setSafeHTML(element: Element, htmlString: string | null | undefined, options?: DOMPurifyConfig): void {
	validateElement(element);

	const isEmpty = isEmptyString(htmlString);

	// Clear the child elements if null, undefined, an empty string, or whitespaces only is passed as the 2nd argument
	if (isEmpty) {
		element.replaceChildren();

		return;
	}

	const sanitizedDocument = createSafeDOM(htmlString, options);

	element.replaceChildren(...sanitizedDocument.body.childNodes);
}

/**
 * Sanitizes an HTML string and parses it into a Document object.
 *
 * Used when the DOM structure needs to be manipulated before insertion into the page.
 *
 * @param   {string | null | undefined} htmlString - The HTML string to sanitize. Returns an empty Document if null, undefined, empty, or whitespace-only
 * @param   {DOMPurifyConfig}           options    - DOMPurify configuration options
 * @returns {Document}                               The sanitized document object
 */
function createSafeDOM(htmlString: string | null | undefined, options?: DOMPurifyConfig): Document {
	const sanitizedHTML = createSafeHTML(htmlString, options);
	const parser        = new DOMParser();
	const doc           = parser.parseFromString(sanitizedHTML, "text/html");

	return doc;
}

/**
 * Sanitizes an HTML string and returns the sanitized HTML string.
 *
 * @param   {string | null | undefined} htmlString - The HTML string to sanitize. Returns an empty string if null, undefined, empty, or whitespace-only
 * @param   {DOMPurifyConfig}           options    - DOMPurify configuration options
 * @returns {string}                                 The sanitized HTML string
 */
function createSafeHTML(htmlString: string | null | undefined, options?: DOMPurifyConfig): string {
	const isEmpty = isEmptyString(htmlString);

	if (isEmpty) {
		return "";
	}

	validateArguments(htmlString, options);

	const sanitizedHTML = DOMPurify.sanitize(htmlString as string, options ?? {});

	return sanitizedHTML;
}

export {
	setSafeHTML,
	createSafeDOM,
	createSafeHTML
};