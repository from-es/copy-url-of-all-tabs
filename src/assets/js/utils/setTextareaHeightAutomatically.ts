/**
 * Automatically adjusts the height of a `textarea` element to fit its content.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Automatically adjusts the height of a `textarea` element to fit its content.
 * Intended to be used as an event listener for `input` or `change` events.
 *
 * @param   {Event} event - The event object dispatched from the `textarea` element
 * @returns {void}
 * @throws  {TypeError}     Thrown if the event or its currentTarget is invalid
 *
 * @see https://web-dev.tech/front-end/javascript/textarea-auto-height/
 */
export function setTextareaHeightAutomatically(event: Event): void {
	if (!(event instanceof Event)) {
		throw new TypeError("Invalid: argument 'event' must be an instance of Event");
	}

	const self = event.currentTarget as HTMLTextAreaElement;

	if (!(self instanceof HTMLTextAreaElement)) {
		throw new TypeError("Invalid: event.currentTarget must be an instance of HTMLTextAreaElement");
	}

	self.style.height = "auto";
	self.style.height = `${self.scrollHeight}px`;
}