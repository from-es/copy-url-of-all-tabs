/**
 * Utility for displaying messages on the screen using the Popover API.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

type MessageType = "success" | "debug" | "notice" | "warning" | "error";

interface PopoverMessageOptions {
	message  : string | string[];
	timeout ?: number;
	fontsize?: string;
	color   ?: {
		font      ?: string;
		background?: string;
	};
	messagetype?: MessageType;
};

/**
 * Defines the output type of the #preprocess method.
 */
interface ProcessedMessageOptions extends PopoverMessageOptions {
	timeout  : number;
	fontsize : string;
	max      : number; // Property derived from #default.message.max
};



/**
 * Custom HTML element for displaying popover messages.
 */
class PopoverMessageElement extends HTMLDivElement {
	constructor() {
		// Always call super() first in the constructor.
		super();
	}
}
customElements.define("component-popover-message", PopoverMessageElement, { extends: "div" });

/**
 * Message display using the Popover API.
 * Features include stacked display of multiple messages and closing via double-click.
 *
 * @support Google Chrome 114+, Mozilla Firefox 125+ (dependent on Popover API compatibility)
 *
 * @see Popover API (https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * @see Manually toggling popover visibility (https://ics.media/entry/230530/#%E3%83%9D%E3%83%83%E3%83%97%E3%82%AA%E3%83%BC%E3%83%90%E3%83%BC%E3%81%AE%E8%A1%A8%E7%A4%BA/%E9%9D%9E%E8%A1%A8%E7%A4%BA%E3%82%92%E6%89%8B%E5%8B%95%E3%81%A7%E5%88%87%E3%82%8A%E6%9B%BF%E3%81%88%E3%82%8B)
 */
class PopoverMessage {
	constructor () {
		//
	}

	static #information = {
		class: {
			name: "PopoverMessage"
		},
		element: {
			name: "component-popover-message"
		}
	};

	/**
	 * Default settings
	 */
	static #default = {
		message: {
			max        : 5,                          // Maximum number of messages to display simultaneously
			timeout    : 5000,                       // Time until the message automatically disappears (ms)
			message    : [] as (string | string[]),  // Text of the message to display (string or string array)
			fontsize   : "1.0rem",                   // Font size
			color      : undefined,                  // { font: string, background: string } Font and background colors of the message
			messagetype: undefined                   // One of "success", "debug", "notice", "warning", or "error"
		},
		style: {
			margin: 0.5,                                          // Vertical spacing between messages as a ratio of the <html> element's font size >> 0.5 ≈ 0.5rem
			open  : "opacity 0.2s linear",                        // Transition when showing
			close : "opacity 0.2s linear, translate 0.2s linear"  // Transition when hiding
		}
	};

	/**
	 * Style definitions for each message type
	 */
	static #MessageType = {
		"success": {
			font      : "white",
			background: "#009933"  // Green
		},
		"debug": {
			font      : "white",
			background: "#333333"  // Gray
		},
		"notice": {
			font      : "white",
			background: "#0066ff"  // Blue
		},
		"warning": {
			font      : "white",
			background: "#ff8c00"  // Dark Orange
		},
		"error": {
			font      : "white",
			background: "#cc0000"  // Red
		}
	};

	/**
	 * Base stylesheet
	 */
	static #baseStylesheet = `
/*
	CSS Nesting, Google Chrome 112 or later
*/

/*
	Styles applied from the shadow DOM to the custom-dialog element itself.
	If styles are specified for the same element from both :host and the document, the document style takes precedence.
*/
:host {
	--c-green      : #009933;
	--c-blue       : #0066ff;
	--c-orange     : #ff8c00;
	--c-red        : #cc3300;
	--c-white      : #fff;
	--c-black      : #000;
	--c-gray       : #606060;
	--c-pale-grey  : #B6B6B6;
	--c-shadow-grey: #e5e5e5;

	--message-width-max-upper-limit: 1024px;
	--message-width-max-lower-limit:  512px;
	--message-width-min-lower-limit:  256px;

	all: initial;

	position : fixed;
	top      : 20%;
	left     : 50%;
	transform: translate(-50%, 0%);

	opacity: 0;

	box-sizing: border-box;

	margin:  0;
	padding: 0;

	border: none;

	font-size  : 1.0rem;
	line-height: 1.2;
}

.popover {
	margin: 0;
	/* padding: 0.75em 1.0rem */;

	max-width: clamp(var(--message-width-max-lower-limit), 32rem, var(--message-width-max-upper-limit));
	min-width: max(var(--message-width-min-lower-limit), 16rem);

	border       : 0.5em double var(--c-white);
	border-radius: 0.5em;

	box-shadow: 0 0.25rem 0.5rem var(--c-shadow-grey);

	color           : var(--c-black);
	background-color: var(--c-white);

	/*
		How to beautifully implement rounded corners in CSS, relative rounded corner techniques (https://coliss.com/articles/build-websites/operation/css/relative-rounded-corners.html)
	*/
	--matched-radius-padding   : 0.75rem;
	--matched-radius-inner-size: 0.25rem;
	padding                    : var(--matched-radius-padding) 1.0rem;
	border-radius              : calc(var(--matched-radius-inner-size) + var(--matched-radius-padding));

	p {
		line-break : strict;
		user-select: none;

		&:first-child {
			margin-top: 0;
		}

		&:last-child {
			margin-bottom: 0;
		}
	}
}
`;

	/**
	 * Displays a message.
	 *
	 * @param {PopoverMessageOptions} options - Configuration object for the message to display.
	 */
	static create(options: PopoverMessageOptions): void {
		console.debug("DEBUG(ui): PopoverMessage.create called");

		this.#main(options);
	}

	/**
	 * Main process for displaying a message.
	 *
	 * @param {PopoverMessageOptions} options - Configuration object for the message to display.
	 */
	static #main(options: PopoverMessageOptions): void {
		const popoverMessage = this.#preprocess(options);

		if ( !popoverMessage ) {
			console.error("ERROR(ui): Failure: preprocessing failed or message already displayed");
			return;
		}

		this.#setupPopoverMessage(popoverMessage);
	}

	/**
	 * Sets up and displays a popover message.
	 *
	 * @param {ProcessedMessageOptions} popoverMessage - Processed configuration object for the message.
	 */
	static #setupPopoverMessage(popoverMessage: ProcessedMessageOptions): void {
		console.debug("DEBUG(ui): PopoverMessage.setupPopoverMessage: setting up new popover");

		// Add the popover to the DOM (document.body).
		const popover = this.#createPopoverElement(popoverMessage);
		const root    = document.body;
		root.appendChild(popover);

		// Display using the showPopover method.
		(popover as HTMLDivElement & { showPopover: () => void }).showPopover();

		// If the number of displayed popovers exceeds the limit, remove the oldest one.
		this.#limitPopoverMessage();

		// Automatically hide the popover after a set period using setTimeout.
		const timeout = popoverMessage.timeout;
		const timer   = setTimeout(() => this.#removePopoverElement(popover), timeout);

		// Set the timer as a dataset element to allow clearing the timeout.
		(popover as HTMLDivElement & { dataset: { timer: NodeJS.Timeout } }).dataset.timer = timer;

		// Reorder popovers when they are shown or hidden.
		popover.addEventListener("toggle", (event: Event) => {
			const customEvent = event as ToggleEvent;  // Cast to ToggleEvent
			const isOpen = (customEvent.newState === "open");

			console.debug("DEBUG(ui): PopoverMessage: popover toggle event", { isOpen, newState: customEvent.newState });

			this.#alignPopoverMessage(isOpen);
		});
	}

	/**
	 * Creates a popover element.
	 *
	 * @param   {ProcessedMessageOptions} popoverMessage - Configuration object for the message.
	 * @returns {HTMLDivElement}                           The created popover element.
	 */
	static #createPopoverElement(popoverMessage: ProcessedMessageOptions): HTMLDivElement {
		const { message } = popoverMessage;

		const popover = document.createElement(this.#information.element.name) as HTMLDivElement;
		popover.popover = "manual";

		// Insert stylesheet.
		const shadow    = (popover).attachShadow({ mode: "open" });
		const baseStyle = document.createElement("style");
		baseStyle.textContent = this.#baseStylesheet;
		(shadow).appendChild(baseStyle);

		// Insert additional stylesheet for overriding settings.
		const addStyle = this.#getStylesheet(popoverMessage);
		(shadow).appendChild(addStyle);

		// Create Inner Component
		const contentBody = this.#getInnerComponent(message);

		shadow.appendChild(contentBody);

		// Add event to close on double-click.
		popover.addEventListener("dblclick", () => {
			this.#removePopoverElement(popover);
		});

		return popover;
	}

	/**
	 * Aligns currently displayed popover messages.
	 *
	 * @param {boolean} isOpen - Whether the popover is being opened or closed.
	 */
	static #alignPopoverMessage(isOpen: boolean): void {
		const popovers = document.querySelectorAll(this.#information.element.name) as NodeListOf<HTMLDivElement>;
		const array  = Array.from(popovers).reverse();

		// Stack popovers vertically.
		//	  - isOpen: true  >> opacity transition
		//	  - isOpen: false >> opacity and translate transition
		(array).forEach((popover, index) => {
			popover.style.transition = isOpen
				? this.#default.style.open
				: this.#default.style.close;

			const rootNumberOfFontSize = this.#getFontSizeNumberOfRoot();
			const margin               = rootNumberOfFontSize * this.#default.style.margin;
			let   sum                  = 0;
			for (let i = 0; i < index; i++) {
				sum += (array[i].clientHeight) + margin;
			}
			const moveHeight = sum;

			popover.style.translate = `0px ${moveHeight}px`;
			popover.style.opacity   = "1";
		});
	}

	/**
	 * Limits the number of displayed popover messages and removes the oldest message.
	 */
	static #limitPopoverMessage(): void {
		const popovers = document.querySelectorAll(this.#information.element.name) as NodeListOf<HTMLDivElement>;
		console.debug("DEBUG(ui): PopoverMessage.limitPopoverMessage: current popovers count", { count: popovers.length });

		//
		if ( popovers.length > this.#default.message.max ) {
			console.debug("DEBUG(ui): PopoverMessage.limitPopoverMessage: removing oldest popover");

			this.#removePopoverElement(popovers[0]);
		}
	}

	/**
	 * Removes a popover.
	 *
	 * @param {HTMLDivElement} popover - The popover element to be removed.
	 */
	static #removePopoverElement(popover: HTMLDivElement): void {
		console.debug("DEBUG(ui): PopoverMessage.removePopoverElement: removing popover");

		// Hide using the hidePopover method.
		(popover as HTMLDivElement & { hidePopover: () => void }).hidePopover();

		// Remove from DOM after hiding.
		popover.remove();

		// Clear the timeout.
		clearTimeout((popover as HTMLDivElement & { dataset: { timer: NodeJS.Timeout } }).dataset.timer);
	}

	/**
	 * Preprocesses the message configuration.
	 *
	 * @param   {PopoverMessageOptions}           options - The original configuration object for the message.
	 * @returns {ProcessedMessageOptions | false}           The processed configuration object, or false if processing failed.
	 */
	static #preprocess(options: PopoverMessageOptions): ProcessedMessageOptions | false {
		// Check Argument
		const pass = this.#checkArgument(options);
		if ( !pass ) {
			return false;
		}

		const popoverMessage = Object.assign({}, this.#default.message, options) as ProcessedMessageOptions;

		// Verify Message Text
		let warning = "";
		if ( !popoverMessage.message ) { // !popoverMessage.message === undefined or null or ""
			warning = "Message text missing. This is a developer debug message. The message text may be empty or incorrectly provided.";
			popoverMessage.message = [ warning ];
		}
		if ( Array.isArray(popoverMessage.message) && !(popoverMessage.message).length ) {
			popoverMessage.message = [ warning ];
		}

		return popoverMessage;
	}

	/**
	 * Validates the arguments.
	 *
	 * @param   {PopoverMessageOptions} argument - The argument object to check.
	 * @returns {boolean}                          True if the argument is valid, false otherwise.
	 */
	static #checkArgument(argument: PopoverMessageOptions): boolean {
		// Ensure the argument is an object.
		if (typeof argument !== "object" || argument === null) {
			console.error("ERROR(ui): Invalid: argument is not an object or is null", argument);
			return false;
		}

		// Validate 'message' property
		if (!Object.hasOwn(argument, "message")) {
			console.error("ERROR(ui): Invalid: 'message' property is missing");
			return false;
		}
		if (typeof argument.message === "string") {
			// String is OK
		} else if (Array.isArray(argument.message)) {
			// If array, all elements must be strings.
			if (!(argument.message).every(item => typeof item === "string")) {
				console.error("ERROR(ui): Invalid: 'message' array contains non-string elements", argument.message);
				return false;
			}
		} else {
			// Must be a string or an array.
			console.error("ERROR(ui): Invalid: 'message' is not a string or an array", argument.message);
			return false;
		}

		// Validate 'messagetype' property
		const regex_MessageType = /^(notice|success|warning|error|debug)$/i;
		if (Object.hasOwn(argument, "messagetype") && (!argument.messagetype || typeof argument.messagetype !== "string" || !(regex_MessageType).test(argument.messagetype))) {
			console.error("ERROR(ui): Invalid: 'messagetype' is invalid", argument?.messagetype);
			return false;
		}

		// Validate 'timeout' property
		if (Object.hasOwn(argument, "timeout") && (!argument.timeout || typeof argument.timeout !== "number" || argument.timeout <= 0)) {
			console.error("ERROR(ui): Invalid: 'timeout' is invalid", argument?.timeout);
			return false;
		}

		// Validate 'fontsize' property
		if (Object.hasOwn(argument, "fontsize") && (!argument.fontsize || typeof argument.fontsize !== "string")) {
			console.error("ERROR(ui): Invalid: 'fontsize' is invalid", argument?.fontsize);
			return false;
		}

		// Validate 'color' property (font and background)
		if (Object.hasOwn(argument, "color")) {
			if (typeof argument.color !== "object" || argument.color === null) {
				console.error("ERROR(ui): Invalid: 'color' is not an object or is null", argument?.color);
				return false;
			}
			if (Object.hasOwn(argument.color, "font") && (!argument.color.font || typeof argument.color.font !== "string")) {
				console.error("ERROR(ui): Invalid: font color is invalid", argument?.color?.font);
				return false;
			}
			if (Object.hasOwn(argument.color, "background") && (!argument.color.background || typeof argument.color.background !== "string")) {
				console.error("ERROR(ui): Invalid: background color is invalid", argument?.color?.background);
				return false;
			}
		}

		return true;
	}

	/**
	 * Creates a stylesheet for the message.
	 *
	 * @param   {ProcessedMessageOptions} popoverMessage - Configuration object for the message.
	 * @returns {HTMLStyleElement}                         The created style element.
	 */
	static #getStylesheet(popoverMessage: ProcessedMessageOptions): HTMLStyleElement {
		const style = document.createElement("style");
		const getStyleValue = (obj: ProcessedMessageOptions) => {
			const style = {
				// Default Color Setting
				fontsize        : "1.0rem",
				fontColor       : "#fff",
				backgroundColor : "#000"
			};

			if ( obj.fontsize ) {
				style.fontsize = obj.fontsize ? obj.fontsize : style.fontsize;
			}

			// Style Priority: message.color > message.messagetype > default
			if ( obj.messagetype ) {
				style.fontColor       = this.#MessageType[obj.messagetype].font;
				style.backgroundColor = this.#MessageType[obj.messagetype].background;
			}
			if ( obj.color ) {
				style.fontColor       = obj.color.font       ? obj.color.font       : style.fontColor;
				style.backgroundColor = obj.color.background ? obj.color.background : style.backgroundColor;
			}

			return style;
		};
		const prop = getStyleValue(popoverMessage);

		style.textContent =
`
.popover {
	color           : ${prop.fontColor} !important;
	background-color: ${prop.backgroundColor} !important;

	p {
		font-size: ${prop.fontsize} !important;
	}
}
`;

		return style;
	}

	/**
	 * Creates internal components for the popover.
	 *
	 * @param   {string|string[]} message - Text of the message to display.
	 * @returns {HTMLDivElement}            The created internal component element.
	 */
	static #getInnerComponent(message: string | string[]): HTMLDivElement {
		// Create Element
		const div = document.createElement("div");
		(div).setAttribute("class", "popover");

		// Create Inner Content
		const msg = this.#createMessage(message);

		// Add Element
		div.appendChild(msg);

		return div;
	}

	/**
	 * Creates an HTML fragment from message text.
	 *
	 * @param   {string | string[]} message - Message text (not HTML text).
	 * @returns {DocumentFragment}            The created HTML fragment.
	 */
	static #createMessage(message: string | string[]): DocumentFragment {
		const fragment = document.createDocumentFragment();
		const messages = Array.isArray(message) ? message : [ message ];

		for (const msg of messages) {
			const paragraph = document.createElement("p");

			paragraph.textContent = msg;
			fragment.appendChild(paragraph);
		}

		return fragment;
	}

	/**
	 * Retrieves the numerical font size from the html element.
	 */
	static #getFontSizeNumberOfRoot(): number {
		const rootElement      = document.documentElement;
		const rootFontSize     = window.getComputedStyle(rootElement).getPropertyValue("font-size");
		const fontSize         = rootFontSize.replace(/(px)$/, "");
		const isValid          = (fontSize && typeof fontSize === "string" && /^([0-9]+)$/.test(fontSize));
		const numberOfFontSize = (isValid && typeof Number(fontSize) === "number") ? Number(fontSize) : 16;  // Use 16 as a fallback for falsy values.

		console.debug("DEBUG(ui): font size of root elements", { rootElement, rootFontSize, isValid, numberOfFontSize });

		return numberOfFontSize;
	}
}



export {
	PopoverMessage
};
export type {
	MessageType
};