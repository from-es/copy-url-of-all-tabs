<script lang="ts">
	// WXT provided cross-browser compatible API and types.
	import { browser } from "wxt/browser";

	// Import Types
	import { type Config, type Define, type Status } from "@/assets/js/types/";
	import { type MimeType, type ExportResult }      from "@/assets/js/lib/user/ConfigManager";
	import { type MessageType }                      from "@/assets/js/lib/user/MessageManager/PopoverMessage";

	// Import Svelte
	import { onMount } from "svelte";

	// Import NPM Package
	import dayjs        from "dayjs";
	import { debounce } from "lodash-es";

	// Import from Script
	import { initializeConfig }                              from "@/assets/js/initializeConfig";
	import { logging }                                       from "@/assets/js/logging";
	import { selectTab }                                     from "@/assets/js/select-tab";
	import { cloneObject }                                   from "@/assets/js/lib/user/CloneObject";
	import { StorageManager }                                from "@/assets/js/lib/user/StorageManager";
	import { PopoverMessage }                                from "@/assets/js/lib/user/MessageManager/PopoverMessage";
	import { sortable }                                      from "@/assets/js/lib/user/sortable";
	import { createSafeHTML }                                from "@/assets/js/utils/setSafeHTML";
	import { ConfigManager, MIME_TO_EXT_MAP }                from "@/assets/js/lib/user/ConfigManager";
	import { addRowForCustomDelay, deleteRowForCustomDelay } from "./customDelay";
	import { DynamicContent }                                from "./dynamicContent";

	let { status = $bindable() }: { status: Status } = $props();

	const dynamicContent = new DynamicContent(status);

	onMount(() => {
		console.log("The Component, On mount");

		initialize();
	});


	// ---------------------------------------------------------------------------------------------
	async function initialize() {
		console.log("The Component, Initialize");

		document.title = `Options - ${status.define.Information.name}`;

		setFontSizeForOptionsPage();

		selectTab();
	}

	async function reInitialize() {
		const { config, define } = status;

		logging(config, define);

		setFontSizeForOptionsPage();
	}

	function setFontSizeForOptionsPage() {
		// スタイル(options.css >> :root要素)の動的書き換え
		const fontSize = status.config.OptionsPage.fontsize;

		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
	}

	function getInformationOfConfig() {
		const manifest = browser.runtime.getManifest();
		const now      = Date.now();

		const result = {
			name   : manifest.name,
			version: manifest.version,
			date   : {
				timestamp: now,
				iso8601  : new Date(now).toISOString()
			}
		};

		return result;
	}

	function getChromiumBasedBrowserList() {
		const list = status.define.ChromiumBasedBrowser;
		const text = (list).join(", ");

		return text;
	}

	/**
	 * 渡されたHTML要素を一定時間無効化、主に連打防止対策用として使用
	 * @param {HTMLElement} element  - 無効化するHTML要素
	 * @param {number}      duration - 無効化する時間 (milliseconds)
	 */
	function disableElementTemporarily(element: HTMLElement, duration: number): void {
		const hasDisabledProperty = (element instanceof HTMLElement && "disabled" in element); // "disabled" プロパティがあるHTML要素のみ無効化 >> (HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement)
		const isValidNumber       = (typeof duration === "number" && duration > 0);

		if ( !(hasDisabledProperty && isValidNumber) ) {
			return;
		}

		element.setAttribute("disabled", "true");
		setTimeout((elm) => { elm.removeAttribute("disabled"); }, duration, element);
	}

	/**
	 * 指定された範囲内であるか数値入力を検証
	 * @param   {string} currentValue - 入力イベントからの現在の値
	 * @param   {number} min          - 許容される最小値
	 * @param   {number} max          - 許容される最大値
	 * @param   {number} defaultValue - 範囲外の場合に設定するデフォルト値
	 * @returns {number}              - 検証された数値
	 */
	function validateNumericInput(currentValue: string, min: number, max: number, defaultValue: number): number {
		const num = parseFloat(currentValue);

		if (isNaN(num) || num < min || num > max) {
			const message = {
				message    : [ `A value out of range has been entered. Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "1rem",
				messagetype: "warning" as MessageType
			};
			PopoverMessage.create(message);
			return defaultValue;
		}
		return num;
	}

	/**
	 * デバウンスされたバリデーション関数を格納する変数
	 */
	const debouncedValidation = debounce(
		(input: HTMLInputElement, min: number, max: number, defaultValue: number, updateFn: (value: number) => void) => {
			const validatedValue = validateNumericInput(input.value, min, max, defaultValue);

			if (input.value !== validatedValue.toString()) {
				input.value = validatedValue.toString();
			}

			updateFn(validatedValue);
		},
		status.define.OptionsPageInputDebounceTime
	);
	// --------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Save & Reset

	async function eventSettingSave() {
		const config = cloneObject(status.config);

		// Add, Information Of Config
		config.Information = getInformationOfConfig();

		// Save to Local Storage
		const keyname = status.define.Storage.keyname;
		const item    = { [keyname]: config };
		StorageManager.save(item);

		// Reinitialize, List of User Script
		await reInitialize();

		// Show, Message
		PopoverMessage.create(status.define.Message.Setting_OnClick_SaveButton_Success);

		// debug
		console.log("Save to Storage.", config);
	}

	async function eventSettingReset(event: MouseEvent) {
		// ボタンの連打防止対策
		const element = event.currentTarget as HTMLElement;
		disableElementTemporarily(element, status.define.DisabledTimeoutValue);

		status.config = cloneObject(status.define.Config);

		// Reinitialize, List of User Script
		await reInitialize();

		// Show, Message
		PopoverMessage.create(status.define.Message.Setting_OnClick_ResetButton);

		// debug
		console.log("Reset Config Data.", status.config);
	}

	// ---------------------------------------------------------------------------------------------
	// Options Page

	function eventOptionsPageFontSize(event: Event) {
		const input = event.currentTarget as HTMLInputElement;

		debouncedValidation(
			input,
			status.define.OptionsPageFontSizeValueMin,
			status.define.OptionsPageFontSizeValueMax,
			status.define.Config.OptionsPage.fontsize,
			(value) => { status.config.OptionsPage.fontsize = value; }
		);
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Popup Menu

	function eventPopupMenuClearMessageEnable() {
		status.config.PopupMenu.ClearMessage.enable = !(status.config.PopupMenu.ClearMessage.enable);
	}

	function eventPopupMenuClearMessageTimeout(event: Event) {
		const input = event.currentTarget as HTMLInputElement;

		debouncedValidation(
			input,
			status.define.PopupMenuClearMessageTimeoutValueMin,
			status.define.PopupMenuClearMessageTimeoutValueMax,
			status.define.Config.PopupMenu.ClearMessage.timeout,
			(value) => { status.config.PopupMenu.ClearMessage.timeout = value; }
		);
	}

	function eventPopupOnClickCloseEnable() {
		status.config.PopupMenu.OnClickClose.enable = !(status.config.PopupMenu.OnClickClose.enable);
	}

	function eventPopupOnClickCloseTimeout(event: Event) {
		const input = event.currentTarget as HTMLInputElement;

		debouncedValidation(
			input,
			status.define.PopupMenuOnClickCloseTimeoutValueMin,
			status.define.PopupMenuOnClickCloseTimeoutValueMax,
			status.define.Config.PopupMenu.OnClickClose.timeout,
			(value) => { status.config.PopupMenu.OnClickClose.timeout = value; }
		);
	}

	function eventPopupMenuFontSize(event: Event) {
		const input = event.currentTarget as HTMLInputElement;

		debouncedValidation(
			input,
			status.define.PopupMenuFontSizeValueMin,
			status.define.PopupMenuFontSizeValueMax,
			status.define.Config.PopupMenu.fontsize,
			(value) => { status.config.PopupMenu.fontsize = value; }
		);
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Search

	function eventSearchRegex() {
		status.config.Search.regex = !(status.config.Search.regex);
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Filtering

	function eventFilteringEnable(event: Event) {
		const elm    = event.currentTarget as HTMLInputElement;
		const action = elm.getAttribute("data-action");
		let   key    = "";

		switch (action) {
			case "copy":
				key = "Copy";
				break;
			case "paste":
				key = "Paste";
				break;
			default:
				// debug
				console.error("Error, Invalid argument passed to eventFilteringEnable() >> action >>", action);

				return;
		}

		status.config.Filtering[key].enable = !(status.config.Filtering[key].enable);
	}

	function eventFilteringProtocol(event: Event) {
		const elm      = event.currentTarget as HTMLInputElement;
		const protocol = elm.getAttribute("data-type");

		if (protocol && typeof protocol === "string" && Object.hasOwn(status.config.Filtering.Protocol, protocol)) {
			status.config.Filtering.Protocol[protocol] = !(status.config.Filtering.Protocol[protocol]);

			// debug
			console.log(`eventGetFilteringProtocol() >> protocol: ${protocol} >>`, { protocol, bool: status.config.Filtering.Protocol[protocol]} );
		} else {
			// debug
			console.error("Error, The 'data-type' attribute is missing or its value is not a string:", { protocol });
		}
	}

	function showNoticeMessageForPaste() {
		const message = `<p class="notice-paste"><span class="notice-highlight">Notice</span>: If <b>Search URL of the text in the clipboard</b> option is enabled, filtering is only valid for "http & https" items.</p>`;

		return message;
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Format

	function eventFormatType(event: Event) {
		const elm = event.currentTarget as HTMLInputElement;

		status.config.Format.type = elm.value;
	}

	function eventFormatCustomTemplate(event: Event) {
		const elm = event.currentTarget as HTMLInputElement;

		status.config.Format.template = elm.value;
	}

	function eventFormatSelectMimetype(event: Event) {
		const elm = event.currentTarget as HTMLInputElement;

		status.config.Format.mimetype = elm.value;
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Tab

	function eventTabReverse() {
		status.config.Tab.reverse = !(status.config.Tab.reverse);
	}

	function eventTabActive() {
		status.config.Tab.active = !(status.config.Tab.active);
	}

	function eventTabPosition(event: Event) {
		const elm = event.currentTarget as HTMLInputElement;

		status.config.Tab.position = elm.value;
	}

	function eventTabDelay(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		debouncedValidation(
			input,
			status.define.TabOpenDelayValueMin,
			status.define.TabOpenDelayValueMax,
			status.define.Config.Tab.delay,
			(value) => { status.config.Tab.delay = value; }
		);
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	// Debug

	function eventDebugLogging() {
		status.config.Debug.logging = !(status.config.Debug.logging);
	}

	function eventDebugTimestamp() {
		status.config.Debug.timestamp = !(status.config.Debug.timestamp);
	}

	function eventDebugTimecoordinate(event: Event) {
		const elm = event.currentTarget as HTMLInputElement;

		status.config.Debug.timecoordinate = elm.value;
	}
	// ---------------------------------------------------------------------------------------------

	// ---------------------------------------------------------------------------------------------
	async function eventImportConfig() {
		await importConfig(status, "application/json");
	}

	async function eventExportConfig() {
		await exportConfig(status, "application/json", "YYYY-MM-DD_HH-mm-ss");
	}

	/**
	 * Imports a configuration file, updates the application's state, and displays a status message.
	 * @param {object} currentStatus - The current status object of the application, containing config and define.
	 * @param {string} mimetype      - The expected MIME type of the file to import.
	 */
	async function importConfig(currentStatus: { config: Config, define: Define }, mimetype: MimeType) {
		const result = await ConfigManager.importFile(mimetype);
		let   message;

		// Terminate without a message if the user cancels.
		if (result.isUserCancel) {
			return;
		}

		// On successful file read
		if (result.success && typeof result.content === "string") {
			try {
				// Parse and initialize the configuration
				const _config    = JSON.parse(result.content);
				const { config } = await initializeConfig(_config);

				// Update status and perform post-processing
				/*
				  Note:
				    Since objects are passed by reference in JavaScript, the `currentStatus`
				    parameter holds a reference to the original `status` object (the bindable prop).
				    Therefore, assigning a new value to `currentStatus.config` directly modifies
				    the `status` prop, updating the component's state.
				*/
				currentStatus.config = config;
				await reInitialize();

				message = currentStatus.define.Message.Setting_ImportConfig_Success;
			} catch (error) {
				const err      = error as Error;
				const template = currentStatus.define.Message.Setting_ImportConfig_Error;

				message = cloneObject(template);
				message.message.push(`Failed to process configuration: ${err.message}`);

				// debug
				console.log("Failed to load configuration:", { error });

				// Add supplementary message if JSON.parse fails (SyntaxError)
				if (err instanceof SyntaxError) {
					const errorMessages = [
						"The file may be corrupted or the character encoding may not be UTF-8.",
						"Please check the file format and encoding."
					];
					message.message.push(...errorMessages);
				}
			}
		} else {
			// On file read failure
			const template = currentStatus.define.Message.Setting_ImportConfig_Error;

			message = cloneObject(template);
			message.message.push(result.message);
		}

		PopoverMessage.create(message);
	}

	/**
	 * Exports the current application configuration to a JSON file and initiates a download.
	 * @param {object} currentStatus - The current status object of the application, containing config and define.
	 * @param {string} mimetype      - The MIME type for the exported file.
	 * @param {string} timeFormat    - The `dayjs` format string to use for the timestamp in the filename.
	 */
	async function exportConfig(currentStatus: { config: Config, define: Define }, mimetype: MimeType, timeFormat: string) {
		/**
		 * 設定をストレージから読み込む。設定が存在しない場合はエラーをスローする
		 * @returns {Promise<Config>} - 読み込まれた設定オブジェクト
		 */
		const getSetting = async (): Promise<Config> => {
			const keyname = define.Storage.keyname;
			const data    = await StorageManager.load<{ [key: string]: Config }>(keyname);
			const setting = data?.[keyname];

			if (!setting) {
				throw new Error("Failed to load settings from storage.");
			}

			return setting;
		};
		/**
		 * エクスポート用のファイル名を生成
		 * @returns {string} - 生成されたファイル名
		 */
		const getFileName = (): string => {
			const getFilenameExtension = (): string => {
				const extensions     = MIME_TO_EXT_MAP[mimetype]; // 存在しない mimetype の文字列を指定されていた場合は undefined が返値として渡される
				const firstCandidate = extensions?.[0];
				const extension      = firstCandidate ?? "txt";
				const result         = extension.replace(/^\./, "");

				if (!firstCandidate) {
					console.warn(`exportConfig() >> getFilenameExtension: No extension found for mimetype: "${mimetype}". Defaulting to "txt".`, { availableMimeTypes: MIME_TO_EXT_MAP });
				}

				return result;
			};

			const appName    = define.Information.name.replace(/\s/g, "-");
			const appVersion = define.Information.version;
			const datestr    = dayjs().format(timeFormat);

			return `${appName}_v${appVersion}_${datestr}.${getFilenameExtension()}`;
		};
		/**
		 * データ取得からエクスポート実行までの一連の処理をまとめた関数
		 * @returns {Promise<ExportResult>}
		 */
		const performExport = async (): Promise<ExportResult> => {
			const setting  = await getSetting();
			const filename = getFileName();
			const content  = JSON.stringify(setting, null, "\t");

			return ConfigManager.exportFile(content, filename, mimetype);
		};

		const define = currentStatus.define;
		let   message;

		try {
			// データ処理を実行
			const result = await performExport();

			// 結果に基づいてUIメッセージを準備
			const template = result.success ? define.Message.Setting_ExportConfig_Success : define.Message.Setting_ExportConfig_Error;
			message = cloneObject(template);

			if (!result.success) {
				message.message.push(result.message);
			}
		} catch (error) {
			// エラー発生時のUIメッセージを準備
			const err      = error as Error;
			const template = define.Message.Setting_ExportConfig_Error;

			message = cloneObject(template);
			message.message.push(`Failed to export configuration: ${err.message}`);
		}

		PopoverMessage.create(message);
	}
	// ---------------------------------------------------------------------------------------------
</script>



<!-- contents -->
<main>
	<div id="sidebar">
		<article>
			<ul id="tabnav">
				<li><a href="#about"   title="About">About</a></li>
				<li><a href="#setting" title="Setting">Setting</a></li>
				<li><a href="#config"  title="Setting, Import &#47; Export">Import &#47; Export</a></li>
			 </ul>
		</article>

		<article>
			<!-- Setting : Save & Reset, AdvancedSettings : Change to Settings(Basic ⇔ Advanced) -->
			<ul id="setting-action">
				<li><button id="SaveButton"  title="Save Extension Settings."              onclick={ eventSettingSave  }>Save</button></li>
				<li><button id="ResetButton" title="Reset, Extension Settings to Default." onclick={ eventSettingReset }>Reset</button></li>
			</ul>
		</article>
	</div>

	<div id="contents">
		<!-- About -->
		<article id="about">
			<h1>About</h1>

			<dl>
				<dt>Description</dt>
				<dd id="about-description">{ status.define.Information.description }</dd>
			</dl>

			<dl>
				<dt>Version</dt>
				<dd id="about-version">{ status.define.Information.version }</dd>
			</dl>

			<dl>
				<dt>Author</dt>
				<dd id="about-author">{ status.define.Information.author }</dd>
			</dl>

			<dl>
				<dt>Update History</dt>
				<dd id="update-history"><a href="{ status.define.Information.updatehistory.url }" title="{ status.define.Information.updatehistory.title }" target="_blank" rel="noopener noreferrer">{ status.define.Information.updatehistory.title }</a></dd>
			</dl>

			<dl>
				<dt>Browser Extension Store</dt>
				<dd id="browser-extension-store">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html createSafeHTML(dynamicContent.getBrowserExtensionStoreContent(), { ADD_ATTR: [ "target" ] }) }

				</dd>
			</dl>

			<dl>
				<dt>Source Code</dt>
				<dd id="sourcecode "><a href="{ status.define.Information.github.url }" title="{ status.define.Information.github.title }" target="_blank" rel="noopener noreferrer">{ status.define.Information.github.title }</a></dd>
			</dl>

			<h2>Documents</h2>

			<p>For detailed documentation on this extension, please refer to
				the <a href={ status.define.Information.document.default.url } title={ status.define.Information.document.default.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.document.default.title }</a>
				 or
				the <a href={ status.define.Information.document.ja.url } title={ status.define.Information.document.ja.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.document.ja.title }</a>.</p>

			<h2>Support</h2>

			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html createSafeHTML(dynamicContent.getWarningMessage()) }

			<p>Please note that as this is a free extension we are unable to provide personalized support.</p>

			<p>If you have issue or feature requests, please report them at issues (<a href="https://github.com/from-es/copy-url-of-all-tabs/issues" title="Support" target="_blank" rel="noopener noreferrer">https://github.com/from-es/copy-url-of-all-tabs/issues</a>).</p>

			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p id="copyright">{@html createSafeHTML(dynamicContent.getCopyright()) }</p>
		</article>
		<!-- close id="about" -->

		<!-- Setting -->
		<article id="setting">
			<h1>Setting</h1>

			<!-- Copy -->
			<fieldset id="setting-copy">
				<legend>Copy</legend>

				<!-- Format -->
				<section class="container">
					<div class="flex-side">
						<h3>Format</h3>
					</div>

					<div class="flex-main" id="Format">
						<fieldset>
							<legend>Format type</legend>
							<form id="Format-type">
								<label data-description="URL">
									<input type="radio" name="Format-type" value="text" checked={ status.config.Format.type === "text" ? true : false } onchange={ eventFormatType }>
									text
								</label>
								<label data-description="JSON format Text with title & url as object key names">
									<input type="radio" name="Format-type" value="json" checked={ status.config.Format.type === "json" ? true : false } onchange={ eventFormatType }>
									json
								</label>
								<label data-description="You can specify a template with your own format">
									<input type="radio" name="Format-type" value="custom" checked={ status.config.Format.type === "custom" ? true : false } onchange={ eventFormatType }>
									custom
								</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>Custom Template</legend>
							<!-- イベント経由で変更を即反映 -->
							<p>You can specify a template with your own format. Use <b>$title</b> &amp; <b>$url</b> variables.</p>
							<textarea id="Format-template" spellcheck="false" value={ status.config.Format.template } oninput={ eventFormatCustomTemplate }></textarea>
						</fieldset>

						<fieldset>
							<legend>MIME Type</legend>

							<p>Specifies the MIME type when copying data to the clipboard. This only affects <b>custom</b> formats.</p>

							<select id="Format-mimetype" onchange={ eventFormatSelectMimetype }>
								<option value="text/plain" selected={ status.config.Format.mimetype === "text/plain" ? true : false }>text/plain</option>
								<option value="text/html"  selected={ status.config.Format.mimetype === "text/html"  ? true : false }>text/html</option>
							</select>
						</fieldset>
					</div>
				</section>
			</fieldset>

			<!-- Paste -->
			<fieldset id="setting-paste">
				<legend>Paste</legend>

				<!-- Search -->
				<section class="container">
					<div class="flex-side">
						<h3>Search</h3>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Search for URLs in the clipboard text</legend>
							<form id="Search-regex">
								<input id="Search-regex" type="checkbox" checked={ status.config.Search.regex } onchange={ eventSearchRegex }>
								<label for="Search-regex">Search for URLs in the clipboard text using a regular expression. This option only applies to "<b>http://</b> & <b>https://</b>".</label>
							</form>
						</fieldset>
					</div>
				</section>

				<!-- Tab -->
				<section class="container">
					<div class="flex-side">
						<h3>Tab</h3>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Option</legend>
							<form id="Tab-reverse">
								<input id="Tab-reverse-input" type="checkbox" checked={ status.config.Tab.reverse } onchange={ eventTabReverse }>
								<label for="Tab-reverse-input">Open tabs in reverse order</label>
							</form>

							<form id="Tab-active">
								<input id="Tab-active-input" type="checkbox" checked={ status.config.Tab.active } onchange={ eventTabActive }>
								<label for="Tab-active-input">Open in active tab</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>New tab position</legend>
							<form id="Tab-position">
								<label data-description="Follow your browser settings">
									<input type="radio" name="Tab-position-type" value="default" checked={ status.config.Tab.position === "default" ? true : false } onchange={ eventTabPosition }>
									default
								</label>
								<label data-description="To the first of the tab bar">
									<input type="radio" name="Tab-position-type" value="first" checked={ status.config.Tab.position === "first" ? true : false } onchange={ eventTabPosition }>
									first
								</label>
								<label data-description="To the left of the active tab">
									<input type="radio" name="Tab-position-type" value="left" checked={ status.config.Tab.position === "left" ? true : false } onchange={ eventTabPosition }>
									left
								</label>
								<label data-description="To the right of the active tab">
									<input type="radio" name="Tab-position-type" value="right" checked={ status.config.Tab.position === "right" ? true : false } onchange={ eventTabPosition }>
									right
								</label>
								<label data-description="To the last of the tab bar">
									<input type="radio" name="Tab-position-type" value="last" checked={ status.config.Tab.position === "last" ? true : false } onchange={ eventTabPosition }>
									last
								</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>Delay</legend>
							<form>
								<input id="Tab-delay-number" name="Tab-delay-number" type="number"
									min={ status.define.TabOpenDelayValueMin }
									max={ status.define.TabOpenDelayValueMax }
									step={ status.define.TabOpenDelayValueStep }
									value={ status.config.Tab.delay }
									oninput={ eventTabDelay }
								>
								<label for="Tab-delay-number">wait time before opening the next tab ({ status.define.TabOpenDelayValueMin } ~ { status.define.TabOpenDelayValueMax } milliseconds)</label>
							</form>
						</fieldset>

						<fieldset id="Tab-custom-delay">
							<legend>Custom Delay</legend>

							<form>
								<label>
									<input id="Tab-custom-delay-enable" type="checkbox" bind:checked={ status.config.Tab.customDelay.enable }>
									Custom Delay
								</label>
							</form>

							<div>
								<table id="Tab-custom-delay-table">
									<thead>
										<tr>
											<th>Sort</th>
											<th>URL</th>
											<th>Delay</th>
											<th>Delete</th>
										</tr>
									</thead>

									<tbody
										id="Tab-custom-delay-list"
										use:sortable={{
											list  : status.config.Tab.customDelay.list,
											onSort: (newList) => {
												status.config.Tab.customDelay.list = newList;
											}
										}}
									>
										{#snippet customDelayList(item: { id: string; pattern: string; delay: number; })}
											<tr>
												<td data-cell-type="sort" class="sortable" title="Drag to sort">✠</td>
												<td data-cell-type="url"><input class="blank-field-warning" type="url" bind:value={ item.pattern } placeholder="Only URL strings are supported. Regular expressions and wildcards are not. (e.g., https://example.com/)" required></td>
												<td data-cell-type="delay"><input type="number" bind:value={ item.delay } min={ status.define.TabOpenDelayValueMin } max={ status.define.TabOpenDelayValueMax } placeholder={ status.define.TabOpenCustomDelayValue } required></td>
												<td data-cell-type="delete"><input class="delete-button" type="button" value="✖" title="Delete this item." onclick={ () => { deleteRowForCustomDelay(status.config.Tab.customDelay.list, item.id); } }></td>
											</tr>
										{/snippet}

										{#each status.config.Tab.customDelay.list as item (item.id)}
											{@render customDelayList(item)}
										{:else}
											<tr>
												<td data-cell-type="empty" colspan="4">
													<p>No custom delays are set. Click the "Add" button to create one.</p>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>

								<div id="custom-delay-add-button">
									<button class="button-add-row" title="Add" onclick={ () => { addRowForCustomDelay(status.config.Tab.customDelay.list); } }>Add</button>
								</div>
							</div>
						</fieldset>
					</div>
				</section>

				<section class="container">
					<div class="flex-side">
						<h3>Task Control</h3>

						<p>Configure how to process and queue multiple URLs.</p>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Processing Unit</legend>

							<form id="Tab-TaskControl-taskMode">
								<label data-description="Treats each URL as an individual task. This is the most responsive mode.">
									<input type="radio" name="taskMode" value="unitary" bind:group={ status.config.Tab.TaskControl.taskMode }>
									Unitary
								</label>
								<label data-description="Groups URLs into chunks of a specified size. Each chunk is treated as a single task.">
									<input type="radio" name="taskMode" value="batch" bind:group={ status.config.Tab.TaskControl.taskMode }>
									Batch
								</label>
								<label data-description="Treats the entire list of URLs as a single large task. This is the least responsive mode.">
									<input type="radio" name="taskMode" value="monolithic" bind:group={ status.config.Tab.TaskControl.taskMode }>
									Monolithic
								</label>
							</form>

							{#if status.config.Tab.TaskControl.taskMode === "batch"}
								<form id="Tab-TaskControl-chunkSize-form">
									<input id="Tab-TaskControl-chunkSize" name="TaskControl-chunkSize" type="number"
										min={ status.define.TaskControlChunkSizeValueMin }
										max={ status.define.TaskControlChunkSizeValueMax }
										step="1"
										bind:value={ status.config.Tab.TaskControl.chunkSize }
									>
									<label for="TaskControl-chunkSize">Number of URLs per Batch ({ status.define.TaskControlChunkSizeValueMin } ~ { status.define.TaskControlChunkSizeValueMax })</label>
								</form>
							{/if}
						</fieldset>

						<fieldset>
							<legend>Execution Order</legend>

							<form id="Tab-TaskControl-openMode">
								<label data-description="Bypasses the queue and attempts to open all tabs at once. Not recommended for a large number of URLs.">
									<input type="radio" name="openMode" value="parallel" bind:group={ status.config.Tab.TaskControl.openMode }>
									Parallel
								</label>
								<label data-description="Adds the new task to the end of the queue.">
									<input type="radio" name="openMode" value="append" bind:group={ status.config.Tab.TaskControl.openMode }>
									Append
								</label>
								<label data-description="Adds the new task to the front of the waiting queue to be processed next.">
									<input type="radio" name="openMode" value="prepend" bind:group={ status.config.Tab.TaskControl.openMode }>
									Prepend
								</label>
								<!--
								   The 'insertNext' option is reserved for future use.
								   It is currently commented out because its unique functionality is not yet implemented in this version.
								   For now, its behavior defaults to 'Prepend'.
								 -->
								<!--
								<label data-description="Same as 'Prepend'. Semantically distinct for future use.">
									<input type="radio" name="openMode" value="insertNext" bind:group={ status.config.Tab.TaskControl.openMode }>
									Insert Next
								</label>
								-->
							</form>
						</fieldset>
					</div>
				</section>
			</fieldset>


			<!-- Filtering -->
			<fieldset id="setting-paste">
				<legend>Filtering</legend>

				<!-- Filtering -->
				<section class="container">
					<div class="flex-side">
						<h3>Filtering</h3>
					</div>

					<div class="flex-main">
						<!-- Copy -->
						<fieldset>
							<legend>Copy</legend>

							<form id="Filtering-Copy-enable">
								<input id="Filtering-Copy-enable-input" data-action="copy" type="checkbox" checked={ status.config.Filtering.Copy.enable } onchange={ eventFilteringEnable }>
								<label for="Filtering-Copy-enable-input">Filter URLs when copying</label>
							</form>
						</fieldset>

						<!-- Paste -->
						<fieldset>
							<legend>Paste</legend>

							<form id="Filtering-Paste-enable">
								<input id="Filtering-Paste-enable-input" data-action="paste" type="checkbox" checked={ status.config.Filtering.Paste.enable } onchange={ eventFilteringEnable }>
								<label for="Filtering-Paste-enable-input">Filter URLs when pasting</label>

								{#if status.config.Search.regex}
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html createSafeHTML(showNoticeMessageForPaste()) }
								{/if}
							</form>
						</fieldset>

						<!-- Protocol -->
						<fieldset>
							<legend>Allowed Protocols (Select all that apply)</legend>

							<div id="Filtering-Protocol">
								<form id="Filtering-Protocol-http">
									<input id="Filtering-Protocol-http-input" type="checkbox" checked={ status.config.Filtering.Protocol.http } data-type="http" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-http-input">http</label>
								</form>
								<form id="Filtering-Protocol-https">
									<input id="Filtering-Protocol-https-input" type="checkbox" checked={ status.config.Filtering.Protocol.https } data-type="https" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-https-input">https</label>
								</form>
								<form id="Filtering-Protocol-file">
									<input id="Filtering-Protocol-https-file" type="checkbox" checked={ status.config.Filtering.Protocol.file } data-type="file" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-https-file">file</label>
								</form>
								<form id="Filtering-Protocol-ftp">
									<input id="Filtering-Protocol-https-ftp" type="checkbox" checked={ status.config.Filtering.Protocol.ftp } data-type="ftp" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-https-ftp">ftp</label>
								</form>

								<form id="Filtering-Protocol-data">
									<input id="Filtering-Protocol-data-input" type="checkbox" checked={ status.config.Filtering.Protocol.data } data-type="data" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-data-input">data</label>
								</form>
								<form id="Filtering-Protocol-blob">
									<input id="Filtering-Protocol-blob-input" type="checkbox" checked={ status.config.Filtering.Protocol.blob } data-type="blob" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-blob-input">blob</label>
								</form>

								<form id="Filtering-Protocol-mailto">
									<input id="Filtering-Protocol-mailto-input" type="checkbox" checked={ status.config.Filtering.Protocol.mailto } data-type="mailto" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-mailto-input">mailto</label>
								</form>
								<form id="Filtering-Protocol-javascript">
									<input id="Filtering-Protocol-javascript-input" type="checkbox" checked={ status.config.Filtering.Protocol.javascript } data-type="javascript" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-javascript-input">javascript</label>
								</form>

								<form id="Filtering-Protocol-about">
									<input id="Filtering-Protocol-about-input" type="checkbox" checked={ status.config.Filtering.Protocol.about } data-type="about" onchange={ eventFilteringProtocol }>
									<label for="Filtering-Protocol-about-input">about</label>
								</form>
								<form id="Filtering-Protocol-chrome">
									<input id="Filtering-Protocol-chrome-input" type="checkbox" checked={ status.config.Filtering.Protocol.chrome } data-type="chrome" onchange={ eventFilteringProtocol }>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									<label for="Filtering-Protocol-chrome-input">chrome ({@html createSafeHTML(getChromiumBasedBrowserList())})</label>
								</form>
							</div>
						</fieldset>
					</div>
				</section>
			</fieldset>

			<!-- System -->
			<fieldset id="setting-system">
				<legend>System</legend>

				<!-- Options Page -->
				<section class="container">
					<div class="flex-side">
						<h3>Options Page</h3>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Font Size of "Options Page"</legend>
							<form>
								<input id="OptionsPage-FontSize" name="OptionsPage-FontSize" type="number"
									min={ status.define.OptionsPageFontSizeValueMin }
									max={ status.define.OptionsPageFontSizeValueMax }
									step={ status.define.OptionsPageFontSizeValueStep }
									value={ status.config.OptionsPage.fontsize }
									oninput={ eventOptionsPageFontSize }
								>
								<label for="OptionsPage-FontSize">font size ({ status.define.OptionsPageFontSizeValueMin } ~ { status.define.OptionsPageFontSizeValueMax } px)</label>
							</form>
						</fieldset>
					</div>
				</section>

				<!-- Popup Menu -->
				<section class="container">
					<div class="flex-side">
						<h3>Popup Menu</h3>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Font Size of "Popup Menu"</legend>
							<form>
								<input id="PopupMenu-FontSize" name="PopupMenu-FontSize" type="number"
									min={ status.define.PopupMenuFontSizeValueMin }
									max={ status.define.PopupMenuFontSizeValueMax }
									step={ status.define.PopupMenuFontSizeValueStep }
									value={ status.config.PopupMenu.fontsize }
									oninput={ eventPopupMenuFontSize }
								>
								<label for="PopupMenu-FontSize">font size ({ status.define.PopupMenuFontSizeValueMin } ~ { status.define.PopupMenuFontSizeValueMax } px)</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>Clear Message</legend>
							<form id="PopupMenu-ClearMessage">
								<input id="PopupMenu-ClearMessage-enable-input" type="checkbox"
									checked={ status.config.PopupMenu.ClearMessage.enable }
									onchange={ eventPopupMenuClearMessageEnable }
								>
								<label for="PopupMenu-ClearMessage-enable-input">enable</label>
							</form>

							<form>
								<input id="PopupMenu-ClearMessage-timeout" name="PopupMenu-ClearMessage-timeout" type="number"
									min={ status.define.PopupMenuClearMessageTimeoutValueMin }
									max={ status.define.PopupMenuClearMessageTimeoutValueMax }
									step={ status.define.PopupMenuClearMessageTimeoutValueStep }
									value={ status.config.PopupMenu.ClearMessage.timeout }
									oninput={ eventPopupMenuClearMessageTimeout }
								>
								<label for="PopupMenu-ClearMessage-timeout">timeout ({ status.define.PopupMenuClearMessageTimeoutValueMin } ~ { status.define.PopupMenuClearMessageTimeoutValueMax } seconds)</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>OnClick Close</legend>
							<form id="PopupMenu-ClearMessage">
								<input id="PopupMenu-OnClickClose-enable-input" type="checkbox" checked={ status.config.PopupMenu.OnClickClose.enable } onchange={ eventPopupOnClickCloseEnable }>
								<label for="PopupMenu-OnClickClose-enable-input">enable</label>
							</form>

							<form>
								<input id="PopupMenu-ClearMessage-timeout" name="PopupMenu-ClearMessage-timeout" type="number"
									min={ status.define.PopupMenuOnClickCloseTimeoutValueMin }
									max={ status.define.PopupMenuOnClickCloseTimeoutValueMax }
									step={ status.define.PopupMenuOnClickCloseTimeoutValueStep }
									value={ status.config.PopupMenu.OnClickClose.timeout }
									oninput={ eventPopupOnClickCloseTimeout }
								>
								<label for="PopupMenu-ClearMessage-timeout">timeout ({ status.define.PopupMenuOnClickCloseTimeoutValueMin } ~ { status.define.PopupMenuOnClickCloseTimeoutValueMax } seconds)</label>
							</form>
						</fieldset>
					</div>
				</section>

				<!-- Debug -->
				<section class="container">
					<div class="flex-side">
						<h3>Debug</h3>
					</div>

					<div class="flex-main">
						<fieldset>
							<legend>Option</legend>
							<form id="Debug-logging">
								<input id="Debug-logging-input" type="checkbox" checked={ status.config.Debug.logging } onchange={ eventDebugLogging }>
								<label for="Debug-logging-input">Output debug log to the web console</label>
							</form>

							<form id="Debug-timestamp">
								<input id="Debug-timestamp-input" type="checkbox" disabled={ !status.config.Debug.logging } checked={ status.config.Debug.timestamp } onchange={ eventDebugTimestamp }>
								<label for="Debug-timestamp-input">Add Timestamp to debug log</label>
							</form>
						</fieldset>

						<fieldset disabled={ !status.config.Debug.timestamp || !status.config.Debug.logging }>
							<legend>Select Timestamp Type, UTC / GMT</legend>

							<form id="Debug-timecoordinate">
								<label for="Debug-timecoordinate-UTC">
									<input id="Debug-timecoordinate-UTC" type="radio" name="timecoordinate" value="UTC" checked={ status.config.Debug.timecoordinate === "UTC" ? true : false } onchange={ eventDebugTimecoordinate }>
									UTC
								</label>
								<label for="Debug-timecoordinate-GMT">
									<input id="Debug-timecoordinate-GMT" type="radio" name="timecoordinate" value="GMT" checked={ status.config.Debug.timecoordinate === "GMT" ? true : false } onchange={ eventDebugTimecoordinate }>
									GMT
								</label>
							</form>
						</fieldset>
					</div>
				</section>
			</fieldset>
		</article>
		<!-- close id="setting" -->

		<!-- Config : Import / Export -->
		<article id="config">
			<h1>Import &#47; Export</h1>

			<section>
				<button id="Config-import" title="Import Settings" onclick={ eventImportConfig }>Import</button>
				<button id="Config-export" title="Export Settings" onclick={ eventExportConfig }>Export</button>
			</section>
		</article>
		<!-- close id="config" -->
	</div>
</main>
<!-- close id="contents" -->



<style></style>