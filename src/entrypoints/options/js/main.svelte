<script>
	// Import Svelte
	import { onMount } from "svelte";

	// Import NPM Package
	import dayjs from "dayjs";

	// Import from Script
	import { initializeConfig }  from "@/assets/js/initializeConfig.mjs";
	import { logging }           from "@/assets/js/function.mjs";
	import { selectTab }         from "@/assets/js/select-tab.mjs";
	import { cloneObject }       from "@/assets/js/lib/user/cloneObject.mjs";
	import { StorageManager }    from "@/assets/js/lib/user/StorageManager.mjs";
	import { PopoverMessage }    from "@/assets/js/lib/user/PopoverMessage.mjs";

	let { status = $bindable() } = $props();

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

	function getCopyright(data) {
		const fromYear = (data.publish && typeof data.publish === "number") ? data.publish : null;
		const thisYear = (new Date()).getFullYear();
		const lastYear = (fromYear && fromYear !== thisYear && thisYear > fromYear) ? (`-${thisYear}`) : "";
		const result   = `&copy; ${fromYear}${lastYear} <strong>${data.author}</strong>.`;

		return result;
	}

	function getInformationOfConfig() {
		const manifest = chrome.runtime.getManifest();
		const now      = Date.now();

		const result = {
			name   : manifest.name,
			version: manifest.version,
			date   : {
				unixtime: now,
				iso8601 : new Date(now).toISOString()
			}
		};

		return result;
	}

	function getChromiumBasedBrowserList() {
		const list = status.define.ChromiumBasedBrowser;
		const text = (list).join(", ");

		return text;
	}
	// --------------------------------------------------------------------------------------------




	// ---------------------------------------------------------------------------------------------
	async function eventSettingSave() {
		const config = cloneObject(status.config);

		// Add, Information Of Config
		config.Information = getInformationOfConfig();

		// Save to Local Storage
		StorageManager.save("config", config);

		// Reinitialize, List of User Script
		await reInitialize();

		// Show, Flash Message
		PopoverMessage.create(status.define.Message.Setting_OnClick_SaveButton_Success);

		// debug
		console.log("Save to Storage.", config);
	}

	async function eventSettingReset() {
		status.config = cloneObject(status.define.Config);

		// Reinitialize, List of User Script
		await reInitialize();

		// Flash Message
		PopoverMessage.create(status.define.Message.Setting_OnClick_ResetButton);

		// debug
		console.log("Reset Config Data.", status.config);
	}

	async function importConfig(filetype) {
		const showOpenFileDialog = () => {
			return new Promise(resolve => {
				const input = document.createElement("input");

				input.type     = "file";
				input.accept   = filetype;
				input.onchange = (event) => { resolve(event.target.files[0]); };

				input.click();
			});
		};

		const readAsText = (file) => {
			return new Promise(resolve => {
				const reader = new FileReader();
				reader.readAsText(file);
				reader.onload = () => { resolve(reader.result); };
			});
		};

		const file = await showOpenFileDialog();
		const text = await readAsText(file);

		/*
			json     であるか
			正しい設定であるか
				true : setValue(config)
				false: 警告メッセージ >> 終了
		*/
		try {
			const _config    = JSON.parse(text);
			const { config } = await initializeConfig(_config);

			status.config = config;

			// Reinitialize, List of User Script
			await reInitialize();

			// Flash Message
			PopoverMessage.create(status.define.Message.Setting_ImportConfig_Success);

			// debug
			console.log("main.svelte > importConfig() > config", status.config);
		} catch (error) {
			// Flash Message
			PopoverMessage.create(status.define.Message.Setting_ImportConfig_Error);

			// debug
			console.log("Error, can't read Import File.", { cause: error });
		}
	}

	function exportConfig(setting, filename, filetype) {
		const config = JSON.stringify(setting, null, "\t");
		const file   = { mimetype : filetype, name : filename};
		const blob   = new Blob([ config ], { type: file.mimetype });
		const url    = URL.createObjectURL(blob);
		const ank    = document.createElement("a");

		ank.download            = file.name;
		ank.href                = url;
		ank.dataset.downloadurl = [ file.mimetype, ank.download, ank.href ].join(":");
		ank.click();

		// 削除
		URL.revokeObjectURL(url);
		ank.remove();
	}
	// ---------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Options Page

	function eventOptionsPageFontSize() {
		const max = status.define.OptionsPageFontSizeValueMax;
		const min = status.define.OptionsPageFontSizeValueMin;
		let   num = parseFloat(this.value);

		if ( !num || typeof num !== "number" || isNaN(num) ) {
			num        = status.define.Config.OptionsPage.fontsize;
			this.value = status.define.Config.OptionsPage.fontsize;
		}
		if ( (num > max) || (min > num) ) {
			// デフォルト値で上書き
			num        = status.define.Config.OptionsPage.fontsize;
			this.value = status.define.Config.OptionsPage.fontsize;

			const msg = {
				message    : [ `A value out of range has been entered. Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "16px",
				messagetype: "warning"
			};

			PopoverMessage.create(msg);
		}

		status.config.OptionsPage.fontsize = num;
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Popup Menu

	function eventPopupMenuClearMessageEnable() {
		status.config.PopupMenu.ClearMessage.enable = !(status.config.PopupMenu.ClearMessage.enable);
	}

	function eventPopupMenuClearMessageTimeout() {
		const max = status.define.PopupMenuClearMessageTimeoutValueMax;
		const min = status.define.PopupMenuClearMessageTimeoutValueMin;
		let   num = parseFloat(this.value);

		if ( (num > max) || (min > num) ) {
			// デフォルト値で上書き
			num        = status.define.Config.PopupMenu.ClearMessage.timeout;
			this.value = status.define.Config.PopupMenu.ClearMessage.timeout;

			const msg = {
				message    : [ `A value out of range has been entered. Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "16px",
				messagetype: "warning"
			};

			PopoverMessage.create(msg);
		}

		status.config.PopupMenu.ClearMessage.timeout = num;
	}

	function eventPopupOnClickCloseEnable() {
		status.config.PopupMenu.OnClickClose.enable = !(status.config.PopupMenu.OnClickClose.enable);
	}

	function eventPopupOnClickCloseTimeout() {
		const max = status.define.PopupMenuOnClickCloseTimeoutValueMax;
		const min = status.define.PopupMenuOnClickCloseTimeoutValueMin;
		let   num = parseFloat(this.value);

		if ( (num > max) || (min > num) ) {
			// デフォルト値で上書き
			num        = status.define.Config.PopupMenu.OnClickClose.timeout;
			this.value = status.define.Config.PopupMenu.OnClickClose.timeout;

			const msg = {
				message    : [ `A value out of range has been entered. Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "16px",
				messagetype: "warning"
			};

			PopoverMessage.create(msg);
		}

		status.config.PopupMenu.OnClickClose.timeout = num;
	}

	function eventPopupMenuFontSize() {
		const max = status.define.PopupMenuFontSizeValueMax;
		const min = status.define.PopupMenuFontSizeValueMin;
		let   num = parseFloat(this.value);

		if ( !num || typeof num !== "number" || isNaN(num) ) {
			num        = status.define.Config.PopupMenu.fontsize;
			this.value = status.define.Config.PopupMenu.fontsize;
		}
		if ( (num > max) || (min > num) ) {
			// デフォルト値で上書き
			num        = status.define.Config.PopupMenu.fontsize;
			this.value = status.define.Config.PopupMenu.fontsize;

			const msg = {
				message    : [ `A value out of range has been entered. Please set a value in the range ${min} ~ ${max}.` ],
				timeout    : 5000,
				fontsize   : "16px",
				messagetype: "warning"
			};

			PopoverMessage.create(msg);
		}

		status.config.PopupMenu.fontsize = num;
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Search

	function eventSearchRegex() {
		status.config.Search.regex = !(status.config.Search.regex);
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Filtering

	function eventFilteringEnable() {
		const action = (this).getAttribute("data-action");
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

	function eventFilteringProtocol() {
		const protocol = this.getAttribute("data-type");

		status.config.Filtering.Protocol[protocol] = !(status.config.Filtering.Protocol[protocol]);

		// debug
		console.log(`eventGetFilteringProtocol() >> protocol: ${protocol} >>`, { protocol, state: status.config.Filtering.Protocol[protocol]} );
	}

	function showNoticeMessageForPaste(isShow) {
		const message = "<p style='margin-bottom: 0;'><span style='color: red'>Notice</span>: If \"<b>Search URL of the text in the clipboard</b>\" option is enabled, filtering is only valid for \"http & https\" items.</p>";

		return isShow ? message : "";
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Format

	function eventFormatType() {
		status.config.Format.type = this.value;
	}

	function eventFormatCustomTemplate() {
		status.config.Format.template = this.value;
	}

	function eventFormatSelectMimetype(event) {
		const mimetype = event.target.value;

		status.config.Format.mimetype = mimetype;
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Tab

	function eventTabReverse() {
		status.config.Tab.reverse = !(status.config.Tab.reverse);
	}
	function eventTabActive() {
		status.config.Tab.active = !(status.config.Tab.active);
	}
	function eventTabPosition() {
		status.config.Tab.position = this.value;
	}
	function eventTabDelay() {
		status.config.Tab.delay = parseFloat(this.value);
	}
	// --------------------------------------------------------------------------------------------

	// --------------------------------------------------------------------------------------------
	// Debug

	function eventDebugLogging() {
		status.config.Debug.logging = !(status.config.Debug.logging);
	}

	function eventDebugTimestamp() {
		status.config.Debug.timestamp = !(status.config.Debug.timestamp);
	}

	function eventDebugTimecoordinate() {
		status.config.Debug.timecoordinate = this.value;
	}
	// --------------------------------------------------------------------------------------------


	// --------------------------------------------------------------------------------------------
	function eventImportConfig() {
		const filetype = "application/json";

		importConfig(filetype);
	}

	function eventExportConfig() {
		(async () => {
			const setting  = await StorageManager.load("config");
			const datestr  = dayjs().format("YYYY-MM-DD_HH-mm-ss"); // 要、Day.js Library(https://day.js.org/)
			const filetype = "application/json";
			const name     = status.define.Information.name;
			const version  = status.define.Information.version;
			const filename = `${name}_v${version}_${datestr}.json`;

			exportConfig(setting, filename, filetype);

			// Flash Message
			PopoverMessage.create(status.define.Message.Setting_OnClick_ExportButton);
		})();
	}
	// --------------------------------------------------------------------------------------------
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
				<dt>Chrome Web Store</dt>
				<dd id="chrome-webstore"><a href="{ status.define.Information.webstote.url }" title="{ status.define.Information.webstote.title }" target="_blank" rel="noopener noreferrer">{ status.define.Information.webstote.title }</a></dd>
			</dl>

			<dl>
				<dt>Source Code</dt>
				<dd id="sourcecode "><a href="{ status.define.Information.github.url }" title="{ status.define.Information.github.title }" target="_blank" rel="noopener noreferrer">{ status.define.Information.github.title }</a></dd>
			</dl>

			<h2>Support</h2>

			<p>Please note that as this is a free extension we are unable to provide personalized support.</p>

			<p>If you have issue or feature requests, please report them at issues (https://github.com/from-es/copy-url-of-all-tabs/issues).</p>

			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p id="copyright">{@html getCopyright(status.define.Information)}</p>
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

							<select id="Format-mimetype" onchange={eventFormatSelectMimetype}>
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
									<input type="radio" name="Tab-position-type" value="last"  checked={ status.config.Tab.position === "last" ? true : false } onchange={ eventTabPosition }>
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
									onchange={ eventTabDelay }
								>
								<label for="Tab-delay-number">wait time before opening the next tab ({ status.define.TabOpenDelayValueMin } ~ { status.define.TabOpenDelayValueMax } milliseconds)</label>
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

								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html showNoticeMessageForPaste(status.config.Search.regex) }
							</form>
						</fieldset>

						<!-- Protocol -->
						<fieldset>
							<legend>Allowed Protocols (Select all that apply)</legend>

							<div id="Filtering-Protocol">
								<form id="Filtering-Protocol-http">
									<input id="Filtering-Protocol-http-input" type="checkbox" checked={ status.config.Filtering.Protocol.http } data-type="http" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-http-input">http</label>
								</form>
								<form id="Filtering-Protocol-https">
									<input id="Filtering-Protocol-https-input" type="checkbox" checked={ status.config.Filtering.Protocol.https } data-type="https" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-https-input">https</label>
								</form>
								<form id="Filtering-Protocol-file">
									<input id="Filtering-Protocol-https-file" type="checkbox" checked={ status.config.Filtering.Protocol.file } data-type="file" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-https-file">file</label>
								</form>
								<form id="Filtering-Protocol-ftp">
									<input id="Filtering-Protocol-https-ftp" type="checkbox" checked={ status.config.Filtering.Protocol.ftp } data-type="ftp" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-https-ftp">ftp</label>
								</form>

								<form id="Filtering-Protocol-data">
									<input id="Filtering-Protocol-data-input" type="checkbox" checked={ status.config.Filtering.Protocol.data } data-type="data" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-data-input">data</label>
								</form>
								<form id="Filtering-Protocol-blob">
									<input id="Filtering-Protocol-blob-input" type="checkbox" checked={ status.config.Filtering.Protocol.blob } data-type="blob" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-blob-input">blob</label>
								</form>

								<form id="Filtering-Protocol-mailto">
									<input id="Filtering-Protocol-mailto-input" type="checkbox" checked={ status.config.Filtering.Protocol.mailto } data-type="mailto" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-mailto-input">mailto</label>
								</form>
								<form id="Filtering-Protocol-javascript">
									<input id="Filtering-Protocol-javascript-input" type="checkbox" checked={ status.config.Filtering.Protocol.javascript } data-type="javascript" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-javascript-input">javascript</label>
								</form>

								<form id="Filtering-Protocol-about">
									<input id="Filtering-Protocol-about-input" type="checkbox" checked={ status.config.Filtering.Protocol.about } data-type="about" onchange={eventFilteringProtocol}>
									<label for="Filtering-Protocol-about-input">about</label>
								</form>
								<form id="Filtering-Protocol-chrome">
									<input id="Filtering-Protocol-chrome-input" type="checkbox" checked={ status.config.Filtering.Protocol.chrome } data-type="chrome" onchange={eventFilteringProtocol}>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									<label for="Filtering-Protocol-chrome-input">chrome ({@html getChromiumBasedBrowserList()})</label>
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
									min={ status.define.OptionsPageSizeValueMin }
									max={ status.define.OptionsPageFontSizeValueMax }
									step={ status.define.OptionsPageFontSizeValueStep }
									value={ status.config.OptionsPage.fontsize }
									oninput={eventOptionsPageFontSize}
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
									oninput={eventPopupMenuFontSize}
								>
								<label for="PopupMenu-FontSize">font size ({ status.define.PopupMenuFontSizeValueMin } ~ { status.define.PopupMenuFontSizeValueMax } px)</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>Clear Message</legend>
							<form id="PopupMenu-ClearMessage">
								<input id="PopupMenu-ClearMessage-enable-input" type="checkbox"
									checked={ status.config.PopupMenu.ClearMessage.enable }
									onchange={eventPopupMenuClearMessageEnable}
								>
								<label for="PopupMenu-ClearMessage-enable-input">enable</label>
							</form>

							<form>
								<input id="PopupMenu-ClearMessage-timeout" name="PopupMenu-ClearMessage-timeout" type="number"
									min={ status.define.PopupMenuClearMessageTimeoutValueMin }
									max={ status.define.PopupMenuClearMessageTimeoutValueMax }
									step={ status.define.PopupMenuClearMessageTimeoutValueStep }
									value={ status.config.PopupMenu.ClearMessage.timeout }
									oninput={eventPopupMenuClearMessageTimeout}
								>
								<label for="PopupMenu-ClearMessage-timeout">timeout ({ status.define.PopupMenuClearMessageTimeoutValueMin } ~ { status.define.PopupMenuClearMessageTimeoutValueMax } seconds)</label>
							</form>
						</fieldset>

						<fieldset>
							<legend>OnClick Close</legend>
							<form id="PopupMenu-ClearMessage">
								<input id="PopupMenu-OnClickClose-enable-input" type="checkbox" checked={ status.config.PopupMenu.OnClickClose.enable } onchange={eventPopupOnClickCloseEnable}>
								<label for="PopupMenu-OnClickClose-enable-input">enable</label>
							</form>

							<form>
								<input id="PopupMenu-ClearMessage-timeout" name="PopupMenu-ClearMessage-timeout" type="number"
									min={ status.define.PopupMenuOnClickCloseTimeoutValueMin }
									max={ status.define.PopupMenuOnClickCloseTimeoutValueMax }
									step={ status.define.PopupMenuOnClickCloseTimeoutValueStep }
									value={ status.config.PopupMenu.OnClickClose.timeout }
									oninput={eventPopupOnClickCloseTimeout}
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
								<input id="Debug-logging-input" type="checkbox" checked={ status.config.Debug.logging } onchange={eventDebugLogging}>
								<label for="Debug-logging-input">Output debug log to the web console</label>
							</form>

							<form id="Debug-timestamp">
								<input id="Debug-timestamp-input" type="checkbox" disabled={ !status.config.Debug.logging } checked={ status.config.Debug.timestamp } onchange={eventDebugTimestamp}>
								<label for="Debug-timestamp-input">Add Timestamp to debug log</label>
							</form>
						</fieldset>

						<fieldset disabled={ !status.config.Debug.timestamp || !status.config.Debug.logging }>
							<legend>Select Timestamp Type, UTC / GMT</legend>

							<form id="Debug-timecoordinate">
								<label for="Debug-timecoordinate-UTC">
									<input id="Debug-timecoordinate-UTC" type="radio" name="timecoordinate" value="UTC" checked={ status.config.Debug.timecoordinate === "UTC" ? true : false } onchange={eventDebugTimecoordinate}>
									UTC
								</label>
								<label for="Debug-timecoordinate-GMT">
									<input id="Debug-timecoordinate-GMT" type="radio" name="timecoordinate" value="GMT" checked={ status.config.Debug.timecoordinate === "GMT" ? true : false } onchange={eventDebugTimecoordinate}>
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
				<button id="Config-import" title="Import Settings" onclick={eventImportConfig}>Import</button>
				<button id="Config-export" title="Export Settings" onclick={eventExportConfig}>Export</button>
			</section>
		</article>
		<!-- close id="config" -->
	</div>
</main>
<!-- close id="contents" -->



<style></style>