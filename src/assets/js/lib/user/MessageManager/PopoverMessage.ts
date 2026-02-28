export type MessageType = "success" | "debug" | "notice" | "warning" | "error";

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

// #preprocess メソッドの出力型を定義
interface ProcessedMessageOptions extends PopoverMessageOptions {
	timeout  : number;
	fontsize : string;
	max      : number; // #default.message.max から来るプロパティ
};



class PopoverMessageElement extends HTMLDivElement {
	constructor() {
		// コンストラクターでは常に super を最初に呼び出す
		super();
	}
}
customElements.define("component-popover-message", PopoverMessageElement, { extends: "div" });



/**
 * Popover API(https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) を使ったメッセージ表示。
 * 複数のメッセージをスタック表示し、ダブルクリックで閉じる機能を持つ。
 * @lastModified 2026-02-27
 * @support      Google Chrome 114+, Mozilla Firefox 125+ (dependent on Popover API compatibility)
 * @original     ポップオーバーの表示/非表示を手動で切り替える (https://ics.media/entry/230530/#ポップオーバーの表示/非表示を手動で切り替える)
 */
export class PopoverMessage {
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
	 * デフォルト設定
	 */
	static #default = {
		message: {
			max        : 5,                         // 同時に表示するメッセージの最大数
			timeout    : 5000,                      // メッセージが自動的に消えるまでの時間（ミリ秒）
			message    : [] as (string | string[]), // 表示するメッセージのテキスト（文字列または文字列の配列）
			fontsize   : "1.0rem",                  // フォントサイズ
			color      : undefined,                 // { font: string, background: string } メッセージの文字色と背景色
			messagetype: undefined                  // "success", "debug", "notice", "warning", "error" のいずれか
		},
		style: {
			margin: 0.5,                                         // メッセージ間の縦方向の間隔を、<html> 要素のフォントサイズを基準にした割合で指定 >> 0.5 ≒ 0.5rem
			open  : "opacity 0.2s linear",                       // 表示時のトランジション
			close : "opacity 0.2s linear, translate 0.2s linear" // 非表示時のトランジション
		}
	};

	/**
	 * メッセージタイプごとのスタイル定義
	 */
	static #MessageType = {
		"success": {
			font      : "white",
			background: "#009933" // Green
		},
		"debug": {
			font      : "white",
			background: "#333333" // Gray
		},
		"notice": {
			font      : "white",
			background: "#0066ff" // Blue
		},
		"warning": {
			font      : "white",
			background: "#ff8c00" // Dark Orange
		},
		"error": {
			font      : "white",
			background: "#cc0000" // Red
		}
	};

	/**
	 * 基本となるスタイルシート
	 */
	static #baseStylesheet = `
/*
	CSS Nesting, Google Chrome 112 or later
*/

/*
	shadow dom から custom-dialog 要素自身にスタイルが適用。
	:host とドキュメントの両方から同じ要素へスタイルを指定された場合は、ドキュメントのスタイルが優先される。
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
		CSSで角丸を美しく実装する方法、相対角丸のテクニック(https://coliss.com/articles/build-websites/operation/css/relative-rounded-corners.html)
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
	 * メッセージを表示
	 * @param {PopoverMessageOptions} options - 表示するメッセージの設定オブジェクト
	 */
	static create(options: PopoverMessageOptions): void {
		console.debug("DEBUG(ui): PopoverMessage.create called");

		this.#main(options);
	}

	/**
	 * メッセージ表示のメイン処理
	 * @param {PopoverMessageOptions} options - 表示するメッセージの設定オブジェクト
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
	 * ポップオーバーメッセージのセットアップと表示を行う
	 * @param {ProcessedMessageOptions} popoverMessage - 処理済みのメッセージ設定オブジェクト
	 */
	static #setupPopoverMessage(popoverMessage: ProcessedMessageOptions): void {
		console.debug("DEBUG(ui): PopoverMessage.setupPopoverMessage: setting up new popover");

		// ポップオーバーをDOM(document.body)に追加する
		const popover = this.#createPopoverElement(popoverMessage);
		const root    = document.body;
		root.appendChild(popover);

		// showPopoverメソッドで表示
		(popover as HTMLDivElement & { showPopover: () => void }).showPopover();

		// 一定数以上、ポップオーバーが表示されている場合、古いポップオーバーから削除
		this.#limitPopoverMessage();

		// setTimeoutで一定時間経ったら自動的にポップオーバーを消す
		const timeout = popoverMessage.timeout;
		const timer   = setTimeout(() => this.#removePopoverElement(popover), timeout);

		// timeoutを解除するためのtimerをdataset要素として設定
		(popover as HTMLDivElement & { dataset: { timer: NodeJS.Timeout } }).dataset.timer = timer;

		// ポップオーバーの表示時と非表示時に並び替える
		popover.addEventListener("toggle", (event: Event) => {
			const customEvent = event as ToggleEvent; // ToggleEvent にキャスト
			const isOpen = (customEvent.newState === "open");

			console.debug("DEBUG(ui): PopoverMessage: popover toggle event", { isOpen, newState: customEvent.newState });

			this.#alignPopoverMessage(isOpen);
		});
	}

	/**
	 * ポップオーバー要素を作成
	 * @param   {ProcessedMessageOptions} popoverMessage - メッセージ設定オブジェクト
	 * @returns {HTMLDivElement}                         - 作成されたポップオーバー要素
	 */
	static #createPopoverElement(popoverMessage: ProcessedMessageOptions): HTMLDivElement {
		const { message } = popoverMessage;

		const popover = document.createElement(this.#information.element.name) as HTMLDivElement;
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

		// ダブルクリックで閉じるイベントを追加
		popover.addEventListener("dblclick", () => {
			this.#removePopoverElement(popover);
		});

		return popover;
	}

	/**
	 * 表示されているポップオーバーメッセージを整列
	 * @param {boolean} isOpen - ポップオーバーが開いているか閉じているか
	 */
	static #alignPopoverMessage(isOpen: boolean): void {
		const popovers = document.querySelectorAll(this.#information.element.name) as NodeListOf<HTMLDivElement>;
		const array  = Array.from(popovers).reverse();
		/*
			ポップオーバーを順番に縦に並べる
			isOpen: true  >> opacity のアニメーション
			isOpen: false >> opacity と translate のアニメーション
		*/
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
	 * 表示されるポップオーバーメッセージの数を制限し、古いメッセージを削除
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
	 * ポップオーバーを削除
	 * @param {HTMLDivElement} popover - 削除対象のポップオーバー要素
	 */
	static #removePopoverElement(popover: HTMLDivElement): void {
		console.debug("DEBUG(ui): PopoverMessage.removePopoverElement: removing popover");

		// hidePopoverメソッドで非表示にする
		(popover as HTMLDivElement & { hidePopover: () => void }).hidePopover();

		// 非表示にした後にDOMから削除する
		popover.remove();

		// setTimeoutを解除する
		clearTimeout((popover as HTMLDivElement & { dataset: { timer: NodeJS.Timeout } }).dataset.timer);
	}

	/**
	 * メッセージ設定を前処理
	 * @param   {PopoverMessageOptions}           options - 元のメッセージ設定オブジェクト。
	 * @returns {ProcessedMessageOptions | false}         - 処理済みのメッセージ設定オブジェクト、または処理失敗の場合は false。
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
	 * 引数の妥当性をチェック
	 * @param   {PopoverMessageOptions} argument - チェックする引数オブジェクト。
	 * @returns {boolean}                        - 引数が有効な場合は true、そうでない場合は false。
	 */
	static #checkArgument(argument: PopoverMessageOptions): boolean {
		// 引数がオブジェクトであること
		if (typeof argument !== "object" || argument === null) {
			console.error("ERROR(ui): Invalid: argument is not an object or is null", argument);
			return false;
		}

		// message プロパティの検証
		if (!Object.hasOwn(argument, "message")) {
			console.error("ERROR(ui): Invalid: 'message' property is missing");
			return false;
		}
		if (typeof argument.message === "string") {
			// 文字列なのでOK
		} else if (Array.isArray(argument.message)) {
			// 配列の場合、全要素が文字列でなければNG
			if (!(argument.message).every(item => typeof item === "string")) {
				console.error("ERROR(ui): Invalid: 'message' array contains non-string elements", argument.message);
				return false;
			}
		} else {
			// 文字列でも配列でもない場合はNG
			console.error("ERROR(ui): Invalid: 'message' is not a string or an array", argument.message);
			return false;
		}

		// messagetype プロパティの検証
		const regex_MessageType = /^(notice|success|warning|error|debug)$/i;
		if (Object.hasOwn(argument, "messagetype") && (!argument.messagetype || typeof argument.messagetype !== "string" || !(regex_MessageType).test(argument.messagetype))) {
			console.error("ERROR(ui): Invalid: 'messagetype' is invalid", argument?.messagetype);
			return false;
		}

		// timeout プロパティの検証
		if (Object.hasOwn(argument, "timeout") && (!argument.timeout || typeof argument.timeout !== "number" || argument.timeout <= 0)) {
			console.error("ERROR(ui): Invalid: 'timeout' is invalid", argument?.timeout);
			return false;
		}

		// fontsize プロパティの検証
		if (Object.hasOwn(argument, "fontsize") && (!argument.fontsize || typeof argument.fontsize !== "string")) {
			console.error("ERROR(ui): Invalid: 'fontsize' is invalid", argument?.fontsize);
			return false;
		}

		// color プロパティの検証 (font と background)
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
	 * メッセージのスタイルシートを作成
	 * @param   {ProcessedMessageOptions} popoverMessage - メッセージ設定オブジェクト
	 * @returns {HTMLStyleElement}                       - 作成されたスタイル要素
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
	 * ポップオーバーの内部コンポーネントを作成
	 * @param   {string|string[]} message - 表示するメッセージのテキスト
	 * @returns {HTMLDivElement}          - 作成された内部コンポーネント要素
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
	 * メッセージテキストからHTMLフラグメントを作成
	 * @param   {string | string[]} message - メッセージテキスト(Not HTML Text)
	 * @returns {DocumentFragment}          - 作成されたHTMLフラグメント
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
	 * html 要素からフォントサイズの数値を取得
	 */
	static #getFontSizeNumberOfRoot(): number {
		const rootElement      = document.documentElement;
		const rootFontSize     = window.getComputedStyle(rootElement).getPropertyValue("font-size");
		const fontSize         = rootFontSize.replace(/(px)$/, "");
		const isValid          = (fontSize && typeof fontSize === "string" && /^([0-9]+)$/.test(fontSize));
		const numberOfFontSize = (isValid && typeof Number(fontSize) === "number") ? Number(fontSize) : 16; // falsy な値の場合は 16 を適応

		console.debug("DEBUG(ui): font size of root elements", { rootElement, rootFontSize, isValid, numberOfFontSize });

		return numberOfFontSize;
	}
}