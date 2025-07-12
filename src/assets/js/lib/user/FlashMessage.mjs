/**
 * @lastupdate 2021/08/05
 */
export class FlashMessage {
	static CustomElement = {
		name : "component-flashmessage"
	};

	// スタイルの優先度 : message.color > message.messagetype > default
	static message = {
		message     : [],
		timeout     : 5000,
		fontsize    : "16px",
		color       : undefined,
		messagetype : undefined
	};

	static MessageType = {
		"notice" : {
			font       : "white",
			background : "#009933" // green
		},
		"success" : {
			font       : "white",
			background : "#0066ff" // blue
		},
		"warning" : {
			font       : "white",
			background : "#e96d19" // orange >> Material UI v5 準拠
		},
		"error" : {
			font       : "white",
			background : "#ce2e32" // red >> Material UI v5 準拠
		}
	};

	static show(message) {
		this._show(message);
	}

	// -----------------------------------------------------------------------------------------
	static _show(message) {
		const flashMessage = this._preprocess(message);

		if ( !flashMessage ) {
			return;
		}

		this._render(flashMessage);
	}

	static _preprocess(message) {
		// Check if you have already displayed the Message
		const elm = document.querySelector(this.CustomElement.name);
		if ( elm ) {
			console.log("Another Message is displayed.");

			return false;
		}

		// Check Argument
		const check = this._checkArgument(message);
		if ( !check ) {
			return false;
		}

		// Set Option >> "_" is lodash(https://lodash.com/)
		const flashMessage = ("_" in window && "merge" in window._) ? (_.merge({}, this.message, message)) : (Object.assign({}, this.message, message));

		// Verify Message Text
		const warning = "このテキストは確認用メッセージです。これが表示されている場合は、フラッシュメッセージ用に空のテキストが渡されている可能性があります。";
		if ( !flashMessage.message ) { // !flashMessage.message === undefined or null or ""
			flashMessage.message = [ warning ];
		}
		if ( Array.isArray(flashMessage.message) && !(flashMessage.message).length ) {
			flashMessage.message = [ warning ];
		}

		return flashMessage;
	}

	static _checkArgument(argument) {
		const template = "Error, The Argument passed to _checkArgument() in class FlashMessage() is invalid.";

		if ( typeof argument !== "object" ) {
			// debug
			console.log(`${template} Arguments is not an Object >>`, argument);
			return false;
		}

		// message
		if ( ("message" in argument) && (Array.isArray(argument.message) || typeof argument.message === "string") ) {
			// OK
		} else {
			// debug
			console.log(`${template} Arguments(message) >>`, argument?.message);
			return false;
		}

		// message type
		const regex_MessageType = /^(notice|success|warning|error)$/i;
		if ( ("messagetype" in argument) && (!argument.messagetype || typeof argument.messagetype !== "string" || !(regex_MessageType).test(argument.messagetype)) ) {
			// debug
			console.log(`${template} Arguments(message type) >>`, argument?.messagetype);
			return false;
		}

		// timeout
		if ( ("timeout" in argument) && (!argument.timeout || typeof argument.timeout !== "number" || argument.timeout <= 0) ) {
			// debug
			console.log(`${template} Arguments(timeout) >>`, argument?.timeout);
			return false;
		}

		// font size
		if ( ("fontsize" in argument) && (!argument.fontsize || typeof argument.fontsize !== "string") ) {
			// debug
			console.log(`${template} Arguments(font size) >>`, argument?.fontsize);
			return false;
		}

		// color >> font
		if ( ("color" in argument) && ("font" in argument.color) && (!argument.color.font || typeof argument.color.font !== "string") ) {
			// debug
			console.log(`${template} Arguments(font color) >>`, argument?.color?.font);
			return false;
		}
		// color >> background
		if ( ("color" in argument) && ("background" in argument.color) && (!argument.color.background || typeof argument.color.background !== "string") ) {
			// debug
			console.log(`${template} Arguments(background color) >>`, argument?.color?.background);
			return false;
		}

		return true;
	}

	static _render(flashMessage) {
		// Attach the Autonomous Custom Element
		const component = document.createElement(this.CustomElement.name);
		const shadow    = (component).attachShadow({ mode: "open" });

		// Create & Attach CSS
		const style = this._getStylesheet(flashMessage);
		(shadow).appendChild(style);

		// Create Inner Component
		const inner = this._getInnerComponent(flashMessage.message);

		// Attach the created elements to the shadow dom
		(shadow).appendChild(inner);

		// Add event, on double click close
		component.addEventListener("dblclick", () => { component.remove(); });

		// Add "Custom Modal Dialog" to document
		(document.body).appendChild(component);

		// Remove the "component-flashmessage" of Custom Element
		const removeMessage = () => {
			const elm = document.querySelector(this.CustomElement.name);

			if ( elm ) {
				elm.remove();
			}
		};
		setTimeout(removeMessage, flashMessage.timeout);
	}

	static _getStylesheet(flashMessage) {
		const style = document.createElement("style");
		const getStyleValue = (obj) => {
			const style = {
				// Default Color Setting
				fontsize        : "16px",
				fontColor       : "#fff",
				backgroundColor : "#000"
			};

			if ( obj.fontsize ) {
				style.fontsize = obj.fontsize ? obj.fontsize : style.fontsize;
			}

			// スタイルの優先度 : message.color > message.messagetype > default
			if ( obj.messagetype ) {
				style.fontColor       = this.MessageType[obj.messagetype].font;
				style.backgroundColor = this.MessageType[obj.messagetype].background;
			}
			if ( obj.color ) {
				style.fontColor       = obj.color.font       ? obj.color.font       : style.fontColor;
				style.backgroundColor = obj.color.background ? obj.color.background : style.backgroundColor;
			}

			return style;
		};
		const prop = getStyleValue(flashMessage);

		style.textContent = `
		/* ------------------------------------------------------------------------------------------------------------------------- */
		:host {
			all: initial;

			line-height: 1.2;
		}

		.flash-message {
			z-index: 2147483647;

			position: fixed;
			top:  40%;
			left: 50%;
			transform: translate(-50%, -50%);

			margin: 0; padding: 0.75em 1.0em;

			box-sizing: border-box;

			max-width: 512px;
			min-width: 256px;

			border: 0.5em double #fff;
			border-radius: 0.5em;

			font-size: ${prop.fontsize};

			color: ${prop.fontColor};
			background-color: ${prop.backgroundColor};
		}

		.flash-message p {
			line-break: strict;
		}

		.flash-message p:first-child {
			margin-top: 0;
		}
		.flash-message p:last-child {
			margin-bottom: 0;
		}

		.flash-message, .flash-message p {
			user-select: none;
		}
		/* ------------------------------------------------------------------------------------------------------------------------- */
`;

		return style;
	};

	static _getInnerComponent(message) {
		const msg = this._createMessage(message);

		// Create Element
		const boxes = document.createElement("div");

		// Set Attribute
		(boxes).setAttribute("class", "flash-message");

		// Add Element
		boxes.appendChild(msg);

		return boxes;
	}

	static _createMessage(message) {
		const parseMessage = (msg) => {
			const fragment = document.createDocumentFragment();

			if ( Array.isArray(msg) ) {
				const loop = msg.length;

				for (let i = 0; i < loop; i++) {
					const elm = document.createElement("p");

					elm.innerHTML = this._escapeHTML(msg[i]);
					fragment.appendChild(elm);
				}
			}
			if ( typeof msg === "string" ) {
				const elm = document.createElement("p");

				elm.innerHTML = this._escapeHTML(msg);
				fragment.appendChild(elm);
			}

			return fragment;
		};
		const result = parseMessage(message);

		return result;
	}

	static _escapeHTML(target) {
		if (typeof target !== "string") {
			return target;
		}

		return (target).replace(/[&'`"<>]/g, (match) => {
			return {
				"&" : "&amp;",
				"'" : "&#x27;",
				"`" : "&#x60;",
				'"' : "&quot;",
				"<" : "&lt;",
				">" : "&gt;"
			}[match];
		});
	}
	// -----------------------------------------------------------------------------------------
}