export class PageInformation {
	static #keyState = {};

	static #template = {
		title    : "",
		url      : "",
		content  : "",
		referrer : "",

		selection : {
			title   : "",
			url     : "",
			content : "",

			sameorigin    : false,
			selected      : false,
			selectionText : "",
			selectionHTML : ""
		},

		key : {
			type : "",

			altKey   : false,
			ctrlKey  : false,
			shiftKey : false,
			metaKey  : false,

			repeat : false,

			code : "",
			key  : "",

			// キー入力の同時押し検知用 >> #eventKeyOnDown() で取得
			simultaneous : {}
		},

		// ページ上で frame 要素有無の判定用
		existFrame : false
	};

	/**
	 *
	 * @param {Window} window
	 * @param {Document} document
	 * @returns {object}
	 */
	static get(window, document) {
		const active       = this.#findActiveElement(window);
		const win          = active?.window;
		const doc          = active?.document;
		const isSameOrigin = this.#checkForSameOrigin(window, win);
		const isSelection  = isSameOrigin ? (win.getSelection().toString() ? true: false) : false;

		const information = {
			title    : document.title,
			url      : document.URL,
			content  : document.documentElement.outerHTML,
			referrer : document.referrer,

			selection : {
				title   : isSelection ? doc.title                     : "",
				url     : isSelection ? doc.URL                       : "",
				content : isSelection ? doc.documentElement.outerHTML : "",

				sameorigin    : isSameOrigin,
				selected      : isSelection,
				selectionText : isSelection ? win.getSelection().toString()    : "",
				selectionHTML : isSelection ? this.#getSelectionHTML(win, doc) : ""
			},

			key : this.#getKeyState(),

			existFrame : document.querySelector("frame") ? true : false
		};

		const result = Object.assign({}, PageInformation.#template, information);

		return result;
	}

	/**
	 * @param {string} title
	 * @param {string} url
	 * @returns {object}
	 */
	static getAlternative(title, url) {
		const information = {
			title : title,
			url   : url
		};
		const result = Object.assign({}, PageInformation.#template, information);

		return result;
	}

	static getKeyState() {
		return this.#getKeyState();
	}

	static addKeyEvent() {
		document.addEventListener("keydown", this.#eventKeyOnDown);
		document.addEventListener("keyup", this.#eventKeyOnUp);
	}

	static removeKeyEvent() {
		document.removeEventListener("keydown", this.#eventKeyOnDown);
		document.removeEventListener("keyup", this.#eventKeyOnUp);
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	static #eventKeyOnDown(event) {
		const simultaneous = PageInformation.#keyState?.simultaneous ? PageInformation.#keyState.simultaneous : {};

		if ( event.code ) {
			simultaneous[event.code] = true;
		}
		if ( event.key ) {
			simultaneous[event.key] = true;
		}

		PageInformation.#keyState = {
			type : event.type,

			altKey   : event.altKey,
			ctrlKey  : event.ctrlKey,
			shiftKey : event.shiftKey,
			metaKey  : event.metaKey,

			repeat : event.repeat,

			code : event.code, // キーボード上の物理的なキー
			key  : event.key,  // キーボードのロケールやレイアウトを反映した値

			simultaneous
		};
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	static #eventKeyOnUp(event) {
		PageInformation.#keyState = {};
	}

	static #getKeyState() {
		const result = Object.keys(PageInformation.#keyState).length ? PageInformation.#keyState : PageInformation.#template.key;

		return result;
	}

	/**
	 * @param {Window} win
	 * @returns {object}
	 */
	static #findActiveElement(win) {
		let result = null;

		try {
			const doc              = win.document;
			const elm              = doc.activeElement; // Frame or iFrame 内の要素にフォーカスがある場合、document.activeElement は、その Frame or iFrame 要素を返す
			const hasContentWindow = elm.contentWindow; // elm 要素が、Frame or iFrame 要素であるなら、contentWindow　or contentDocument プロパティを持つ

			// activeElement で取得した要素に contentDocument があれば再帰処理
			result = (hasContentWindow) ? this.#findActiveElement(elm.contentWindow) : { window: win, document: doc, element: elm };
		} catch (error) {
			console.log("Error, class PageInformation() >> #findActiveElement(), log(1/2) >>", error.message);
			console.log("Error, class PageInformation() >> #findActiveElement(), log(2/2) >>", error);

			result = { error };
		}

		return result;
	}

	/**
	 * @param {Window} window
	 * @param {Window} win
	 */
	static #checkForSameOrigin(window, win) {
		let result = true;

		if ( window === win ) {
			return result;
		}

		if ( !win ) {
			return false;
		}

		// CROSS Origin 検出
		try {
			win.document;
		} catch (error) {
			result = false;
		}

		return result;
	}

	/**
	 * Google Chrome(～Ver 110) は複数のテキスト選択不可@2023/03/21
	 * @param {Window} win
	 * @param {Document} doc
	 */
	static #getSelectionHTML(win, doc) {
		const select = win.getSelection();
		const loop   = select.rangeCount;

		const div = doc.createElement("div");

		for (let i = 0; i < loop; i++) {
			const range = select.getRangeAt(i);
			const node  = range.cloneContents();

			(div).appendChild(node);
		}

		return (div).innerHTML;
	}
}