/**
 * Automatically adjusts the height of a `textarea` element to fit its content.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Automatically adjusts the height of a `textarea` element to fit its content.
 * Intended to be used as an event listener for `input` or `change` events.
 *
 * @param   {Event} event - The event object dispatched from the `textarea` element
 * @returns {void}
 *
 * @see https://web-dev.tech/front-end/javascript/textarea-auto-height/
 */
export function setTextareaHeightAutomatically(event: Event): void {
	const self = event.currentTarget as HTMLTextAreaElement;

	self.style.height = "auto";
	self.style.height = `${self.scrollHeight}px`;
}