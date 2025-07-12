class PopoverMessageElement extends HTMLDivElement {
	constructor() {
		// コンストラクターでは常に super を最初に呼び出す
		super();
	}
}
customElements.define("component-popover-message", PopoverMessageElement, { extends: "div" });



/**
 * Popover API(https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) を使ったメッセージ表示
 * @lastupdate 2023/06/14
 * @support    Google Chrome 114 or later
 * @original   ポップオーバーの表示/非表示を手動で切り替える(https://ics.media/entry/230530/#ポップオーバーの表示/非表示を手動で切り替える)
 */
export class PopoverMessage {
	constructor () {
		//
	}

	static #information = {
		class : {
			// Retrieve class name from within static method in typescript(https://stackoverflow.com/questions/36426860/retrieve-class-name-from-within-static-method-in-typescript)
			name : (() => { return (this.toString().split("(" || /s+/)[0].split(" " || /s+/)[1]); } )()
		},
		element : {
			name : "component-popover-message"
		}
	};

	static #default = {
		message : {
			max     : 3,
			timeout : 5000,
		},
		style : {
			margin : 8,
			open   : "opacity 0.2s linear",
			close  : "opacity 0.2s linear, translate 0.2s linear"
		}
	};

	// スタイルの優先度 : message.color > message.messagetype > default
	static #message = {
		message     : [],
		timeout     : 5000,
		fontsize    : "16px",
		color       : undefined,
		messagetype : undefined
	};

	static #MessageType = {
		"success" : {
			font       : "white",
			background : "#009933" // Green
		},
		"debug" : {
			font       : "white",
			background : "#333333" // Gray
		},
		"notice" : {
			font       : "white",
			background : "#0066ff" // Blue
		},
		"warning" : {
			font       : "white",
			background : "#ff8c00" // Dark Orange
		},
		"error" : {
			font       : "white",
			background : "#cc0000" // Red
		}
	};

	static #baseStylesheet = `
/*
	CSS Nesting, Google Chrome 112 or later
*/

/*
	shadow dom から custom-dialog 要素自身にスタイルが適用。
	:host とドキュメントの両方から同じ要素へスタイルを指定された場合は、ドキュメントのスタイルが優先される。
*/
:host {
	--c-green:       #009933;
	--c-blue:        #0066ff;
	--c-orange:      #ff8c00;
	--c-red:         #cc3300;
	--c-white:       #fff;
	--c-black:       #000;
	--c-gray:        #606060;
	--c-pale-grey:   #B6B6B6;

	--c-shadow-grey: #e5e5e5;



	all: initial;

	position: fixed;
	top:  20%;
	left: 50%;
	transform: translate(-50%, 0%);

	opacity: 0;

	box-sizing: border-box;

	margin:  0;
	padding: 0;

	border: none;

	font-size: 16px;
	line-height: 1.2;
}

.popover {
	margin: 0;
	/* padding: 0.75em 1.0rem */;

	max-width: 512px;
	min-width: 256px;

	border: 0.5em double var(--c-white);
	border-radius: 0.5em;

	box-shadow: 0 4px 8px var(--c-shadow-grey);

	color: var(--c-black);
	background-color: var(--c-white);

	/*
		CSSで角丸を美しく実装する方法、相対角丸のテクニック(https://coliss.com/articles/build-websites/operation/css/relative-rounded-corners.html)
	*/
	--matched-radius-padding:    0.75rem;
	--matched-radius-inner-size: 0.25rem;
	padding: var(--matched-radius-padding) 1.0rem;
	border-radius: calc(var(--matched-radius-inner-size) + var(--matched-radius-padding));
}

.popover p {
	line-break: strict;
	user-select: none;
}
.popover p:first-child {
	margin-top: 0;
}
.popover p:last-child {
	margin-bottom: 0;
}
`;

	static create(message) {
		this.#main(message);
	}

	static #main(message) {
		const popoverMessage = this.#preprocess(message);

		if ( !popoverMessage ) {
			return;
		}

		this.#setupPopoverMessage(popoverMessage);
	}

	static #setupPopoverMessage(popoverMessage) {
		// ポップオーバーをDOM(document.body)に追加する
		const popover = this.#createPopoverElement(popoverMessage);
		const root    = document.body;
		root.appendChild(popover);

		// showPopoverメソッドで表示する
		popover.showPopover();

		// 一定数以上、ポップオーバーが表示されている場合、古いポップオーバーから削除する
		this.#limitPopoverMessage();

		// setTimeoutで一定時間経ったら自動的にポップオーバーを消す
		const timeout = popoverMessage.timeout;
		const timer   = setTimeout(() => this.#removePopoverElement(popover), timeout);

		// timeoutを解除するためのtimerをdataset要素として設定する
		popover.dataset.timer = timer;

		// ポップオーバーの表示時と非表示時に並び替える
		popover.addEventListener("toggle", (event) => {
			const isOpen = (event.newState === "open");

			this.#alignPopoverMessage(isOpen);
		});
	}

	/**
	 * ポップオーバーを作成します。
	 * @param {object} popoverMessage
	 */
	static #createPopoverElement(popoverMessage) {
		const { message } = popoverMessage;

		const popover = document.createElement(this.#information.element.name);
		popover.popover = "manual";

		// スタイルシートの挿入
		const shadow    = (popover).attachShadow({ mode: "open" });
		const baseStyle = document.createElement("style");
		baseStyle.textContent = this.#baseStylesheet;
		(shadow).appendChild(baseStyle);

		// 設定上書き用のスタイルシートを追加挿入
		const addStyle = this.#getStylesheet(popoverMessage);
		(shadow).appendChild(addStyle);

		// Create Inner Component
		const contentBody = this.#getInnerComponent(message);

		shadow.appendChild(contentBody);

		return popover;
	}

	static #alignPopoverMessage(isOpen) {
		const popovers = document.querySelectorAll(this.#information.element.name);
		const array  = Array.from(popovers).reverse();
		// ポップオーバーを順番に縦に並べる
		// isOpen : true  >> opacityのアニメーション
		// isOpen : false >> opacityとtranslateのアニメーション
		(array).forEach((popover, index) => {
			popover.style.transition = isOpen
				? this.#default.style.open
				: this.#default.style.close;

			const margin = this.#default.style.margin;
			// const moveHeight = popover.clientHeight * index;
			let sum  = 0;
			for (let i = 0; i < index; i++) {
				sum += (array[i].clientHeight) + margin;
			}
			const moveHeight = sum;

			popover.style.translate = `0px ${moveHeight}px`;
			popover.style.opacity   = 1;
		});
	}

	static #limitPopoverMessage() {
		const popovers = document.querySelectorAll(this.#information.element.name);

		//
		if ( popovers.length > this.#default.message.max ) {
			this.#removePopoverElement(popovers[0]);
		}
	}

	/**
	 * ポップオーバーを削除します。
	 * @param {HTMLDivElement} popover 削除したいポップオーバー
	 */
	static #removePopoverElement(popover) {
		// hidePopoverメソッドで非表示にする
		popover.hidePopover();

		// 非表示にした後にDOMから削除する
		popover.remove();

		// setTimeoutを解除する
		clearTimeout(popover.dataset.timer);
	}




	static #preprocess(message) {
		// Check Argument
		const pass = this.#checkArgument(message);
		if ( !pass ) {
			return false;
		}

		const popoverMessage = Object.assign({}, this.#message, message);

		// Verify Message Text
		let warning = "";
		if ( !popoverMessage.message ) { // !popoverMessage.message === undefined or null or ""
			warning = "このテキストは確認用メッセージです。これが表示されている場合は、フラッシュメッセージ用に空のテキストが渡されている可能性があります。";
			popoverMessage.message = [ warning ];
		}
		if ( Array.isArray(popoverMessage.message) && !(popoverMessage.message).length ) {
			popoverMessage.message = [ warning ];
		}

		return popoverMessage;
	}

	static #checkArgument(argument) {
		const template = `Error, The Argument passed to #checkArgument() in class ${this.#information.class.name}() is invalid.`;

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

	static #getStylesheet(popoverMessage) {
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
/* --------------------------------------------------- */
.popover {
	color: ${prop.fontColor} !important;
	background-color: ${prop.backgroundColor} !important;
}
.popover p {
	font-size: ${prop.fontsize} !important;
}
/* --------------------------------------------------- */
`;

		return style;
	};

	static #getInnerComponent(message) {
		// Create Element
		const div = document.createElement("div");
		(div).setAttribute("class", "popover");

		// Create Inner Content
		const msg = this.#createMessage(message);

		// Add Element
		div.appendChild(msg);

		return div;
	}

	static #createMessage(message) {
		const parseMessage = (msg) => {
			const fragment = document.createDocumentFragment();

			if ( Array.isArray(msg) ) {
				const loop = msg.length;

				for (let i = 0; i < loop; i++) {
					const elm = document.createElement("p");

					elm.innerHTML = this.#escapeHTML(msg[i]);
					fragment.appendChild(elm);
				}
			}
			if ( typeof msg === "string" ) {
				const elm = document.createElement("p");

				elm.innerHTML = this.#escapeHTML(msg);
				fragment.appendChild(elm);
			}

			return fragment;
		};
		const result = parseMessage(message);

		return result;
	}

	static #escapeHTML(target) {
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
}