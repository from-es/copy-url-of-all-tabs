<script lang="ts">
	/**
	 * Settings section component for the options page.
	 *
	 * @file
	 */

	// Import Svelte Module
	import { sortable }          from "@/assets/js/lib/sortable.svelte.ts";
	import DebouncedNumericInput from "./DebouncedNumericInput.svelte";

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import Module
	import { createSafeHTML }                                         from "@/assets/js/utils/setSafeHTML";
	import { addRowForCustomDelay, deleteRowForCustomDelay }          from "../lib/customDelay";
	import { getChromiumBasedBrowserList, showNoticeMessageForPaste } from "../lib/utils/settingsHelper";

	// Import Object
	import { LOG_LEVELS } from "@/assets/js/lib/ConsoleManager/types";

	// Import Types
	import type { Config }          from "@/assets/js/types";
	import type { CustomDelayInfo } from "@/assets/js/define/types";
</script>



<article id="setting">
	<h1>Setting</h1>

	<!-- Copy -->
	<section id="setting-copy" class="fieldset-legend">
		<h2>Copy</h2>

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
							<input type="radio" name="Format-type" value="text" bind:group={ status.config.Format.type }>
							text
						</label>
						<label data-description="JSON format Text with title & url as object key names">
							<input type="radio" name="Format-type" value="json" bind:group={ status.config.Format.type }>
							json
						</label>
						<label data-description="You can specify a template with your own format">
							<input type="radio" name="Format-type" value="custom" bind:group={ status.config.Format.type }>
							custom
						</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Custom Template</legend>

					<!-- Reflect changes immediately via events -->
					<p>You can specify a template with your own format. Use <b>$title</b> &amp; <b>$url</b> variables.</p>

					<textarea id="Format-template" spellcheck="false" bind:value={ status.config.Format.template }></textarea>
				</fieldset>

				<fieldset>
					<legend>MIME Type</legend>

					<p>Specifies the MIME type when copying data to the clipboard. This only affects <b>custom</b> formats.</p>

					<select id="Format-mimetype" bind:value={ status.config.Format.mimetype }>
						<option value="text/plain">text/plain</option>
						<option value="text/html">text/html</option>
					</select>
				</fieldset>
			</div>
		</section>
	</section>

	<!-- Paste -->
	<section id="setting-paste" class="fieldset-legend">
		<h2>Paste</h2>

		<!-- Search -->
		<section class="container">
			<div class="flex-side">
				<h3>Search</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Search for URLs in the clipboard text</legend>

					<form id="Search-regex">
						<input id="Search-regex" type="checkbox" bind:checked={ status.config.Search.regex }>
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
						<input id="Tab-reverse-input" type="checkbox" bind:checked={ status.config.Tab.reverse }>
						<label for="Tab-reverse-input">Open tabs in reverse order</label>
					</form>

					<form id="Tab-active">
						<input id="Tab-active-input" type="checkbox" bind:checked={ status.config.Tab.active }>
						<label for="Tab-active-input">Open in active tab</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>New tab position</legend>

					<form id="Tab-position">
						<label data-description="Follow your browser settings">
							<input type="radio" name="Tab-position-type" value="default" bind:group={ status.config.Tab.position }>
							default
						</label>
						<label data-description="To the first of the tab bar">
							<input type="radio" name="Tab-position-type" value="first" bind:group={ status.config.Tab.position }>
							first
						</label>
						<label data-description="To the left of the active tab">
							<input type="radio" name="Tab-position-type" value="left" bind:group={ status.config.Tab.position }>
							left
						</label>
						<label data-description="To the right of the active tab">
							<input type="radio" name="Tab-position-type" value="right" bind:group={ status.config.Tab.position }>
							right
						</label>
						<label data-description="To the last of the tab bar">
							<input type="radio" name="Tab-position-type" value="last" bind:group={ status.config.Tab.position }>
							last
						</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Delay</legend>

					<form>
						<DebouncedNumericInput
							id           = "Tab-delay-number"
							bind:value   = { status.config.Tab.delay }
							min          = { status.define.TabOpenDelayValueMin }
							max          = { status.define.TabOpenDelayValueMax }
							step         = { status.define.TabOpenDelayValueStep }
							debounceTime = { status.define.OptionsPageInputDebounceTime }
						/>
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

					{#if status.config.Tab.customDelay.enable}
						<p id="custom-delay-note">
							<span class="notice-highlight">Notice</span>:
							Custom delays are applied starting from the Nth match of the pattern.
							"Apply from" sets the match count (1 = every match, 2 = from the 2nd match, etc.).
						</p>
					{/if}

					<div>
						<table id="Tab-custom-delay-table">
							<thead>
								<tr>
									<th data-cell-type="sort">Sort</th>
									<th data-cell-type="enable">Enable</th>
									<th data-cell-type="url">URL</th>
									<th data-cell-type="count">Apply from</th>
									<th data-cell-type="delay">Delay</th>
									<th data-cell-type="delete">Delete</th>
								</tr>
							</thead>

							<tbody
								id="Tab-custom-delay-list"
								{@attach sortable({
									list  : status.config.Tab.customDelay.list,
									handle: "#Tab-custom-delay-list .sortable",
									onSort: (newList) => {
										status.config.Tab.customDelay.list = newList as Config["Tab"]["customDelay"]["list"];
									},
									debounceTime: status.define.OptionsPageSortListDebounceTime
								})}
							>
								{#snippet customDelayList(item: CustomDelayInfo)}
									<tr>
										<td data-cell-type="sort" class="sortable" title="Drag to sort">✠</td>
										<td data-cell-type="enable"><input type="checkbox" bind:checked={ item.enable }></td>
										<td data-cell-type="url"><input class="blank-field-warning" type="url" bind:value={ item.pattern } placeholder="Only URL strings are supported. Regular expressions & wildcards are not. (e.g. https://example.com/)" required></td>
										<td data-cell-type="count">
											<DebouncedNumericInput
												bind:value   = { item.count }
												min          = { status.define.TabOpenCustomDelayApplyCountValueMin }
												max          = { status.define.TabOpenCustomDelayApplyCountValueMax }
												step         = { status.define.TabOpenCustomDelayApplyCountValueStep }
												debounceTime = { status.define.OptionsPageInputDebounceTime }
											/>
										</td>
										<td data-cell-type="delay">
											<DebouncedNumericInput
												bind:value   = { item.delay }
												min          = { status.define.TabOpenDelayValueMin }
												max          = { status.define.TabOpenDelayValueMax }
												step         = { status.define.TabOpenDelayValueStep }
												debounceTime = { status.define.OptionsPageInputDebounceTime }
												placeholder  = { status.define.TabOpenCustomDelayValue }
												required
											/>
										</td>
										<td data-cell-type="delete"><input class="delete-button" type="button" value="✖" title="Delete this item." onclick={ () => { deleteRowForCustomDelay(status.config.Tab.customDelay.list, item.id); } }></td>
									</tr>
								{/snippet}

								{#each status.config.Tab.customDelay.list as item (item.id)}
									{@render customDelayList(item)}
								{:else}
									<tr>
										<td data-cell-type="empty" colspan="6">
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
							<DebouncedNumericInput
								id           = "TaskControl-chunkSize"
								bind:value   = { status.config.Tab.TaskControl.chunkSize }
								min          = { status.define.TaskControlChunkSizeValueMin }
								max          = { status.define.TaskControlChunkSizeValueMax }
								step         = { status.define.TaskControlChunkSizeValueStep }
								debounceTime = { status.define.OptionsPageInputDebounceTime }
							/>
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
	</section>

	<!-- Filtering -->
	<section id="setting-filtering" class="fieldset-legend">
		<h2>Filtering</h2>

		<!-- Deduplicate URLs -->
		<section class="container">
			<div class="flex-side">
				<h3>URL Deduplication</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Enable Deduplication</legend>
					<form>
						<input id="Filtering-Deduplicate-Copy-enable-input" type="checkbox" bind:checked={ status.config.Filtering.Deduplicate.Copy.enable }>
						<label for="Filtering-Deduplicate-Copy-enable-input">Deduplicate URLs on Copy</label>
					</form>
					<form>
						<input id="Filtering-Deduplicate-Paste-enable-input" type="checkbox" bind:checked={ status.config.Filtering.Deduplicate.Paste.enable }>
						<label for="Filtering-Deduplicate-Paste-enable-input">Deduplicate URLs on Paste</label>
					</form>
				</fieldset>
			</div>
		</section>

		<!-- Protocol Filtering -->
		<section class="container">
			<div class="flex-side">
				<h3>Protocol Filtering</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Enable Filtering</legend>

					<form>
						<input id="Filtering-Protocol-Copy-enable-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.Copy.enable }>
						<label for="Filtering-Protocol-Copy-enable-input">Filter on Copy</label>
					</form>
					<form>
						<input id="Filtering-Protocol-Paste-enable-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.Paste.enable }>
						<label for="Filtering-Protocol-Paste-enable-input">Filter on Paste</label>
						{#if status.config.Search.regex && typeof showNoticeMessageForPaste() === "string"}
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html createSafeHTML(showNoticeMessageForPaste()) }
						{/if}
					</form>
				</fieldset>

				<fieldset>
					<legend>Allowed Protocols (Select all that apply)</legend>

					<div id="Filtering-Protocol-type">
						<form>
							<input id="Filtering-Protocol-type-http-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.http }>
							<label for="Filtering-Protocol-type-http-input">http</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-https-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.https }>
							<label for="Filtering-Protocol-type-https-input">https</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-file-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.file }>
							<label for="Filtering-Protocol-type-file-input">file</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-ftp-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.ftp }>
							<label for="Filtering-Protocol-type-ftp-input">ftp</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-data-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.data }>
							<label for="Filtering-Protocol-type-data-input">data</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-blob-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.blob }>
							<label for="Filtering-Protocol-type-blob-input">blob</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-mailto-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.mailto }>
							<label for="Filtering-Protocol-type-mailto-input">mailto</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-javascript-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.javascript }>
							<label for="Filtering-Protocol-type-javascript-input">javascript</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-about-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.about }>
							<label for="Filtering-Protocol-type-about-input">about</label>
						</form>
						<form>
							<input id="Filtering-Protocol-type-chrome-input" type="checkbox" bind:checked={ status.config.Filtering.Protocol.type.chrome }>
							<!-- eslint-disable svelte/no-at-html-tags -->
							<label for="Filtering-Protocol-type-chrome-input">chrome ({#if typeof getChromiumBasedBrowserList(status) === "string"}{@html createSafeHTML(getChromiumBasedBrowserList(status))}{/if})</label>
							<!-- eslint-enable svelte/no-at-html-tags -->
						</form>
					</div>
				</fieldset>
			</div>
		</section>

		<!-- URL Filtering -->
		<section class="container">
			<div class="flex-side">
				<h3>URL Filtering</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Enable Filtering</legend>

					<form>
						<input id="Filtering-PatternMatch-Copy-enable-input" type="checkbox" bind:checked={ status.config.Filtering.PatternMatch.Copy.enable }>
						<label for="Filtering-PatternMatch-Copy-enable-input">Filter on Copy</label>
					</form>
					<form>
						<input id="Filtering-PatternMatch-Paste-enable-input" type="checkbox" bind:checked={ status.config.Filtering.PatternMatch.Paste.enable }>
						<label for="Filtering-PatternMatch-Paste-enable-input">Filter on Paste</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Pattern Matching type</legend>

					<form id="PatternMatch-type">
						<label data-description="Excludes URLs that start with the specified string">
							<input type="radio" name="PatternMatch-type" value="prefix" bind:group={ status.config.Filtering.PatternMatch.type }>
							Prefix
						</label>
						<label data-description="Excludes URLs that contain the specified string">
							<input type="radio" name="PatternMatch-type" value="substring" bind:group={ status.config.Filtering.PatternMatch.type }>
							Substring
						</label>
						<label data-description="Excludes URLs that exactly match the specified string">
							<input type="radio" name="PatternMatch-type" value="exact" bind:group={ status.config.Filtering.PatternMatch.type }>
							Exact
						</label>
						<label data-description="Excludes URLs that match the specified regular expression">
							<input type="radio" name="PatternMatch-type" value="regex" bind:group={ status.config.Filtering.PatternMatch.type }>
							Regular expression
						</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Filtering Pattern</legend>

					<textarea id="Filtering-PatternMatch-Paste-pattern" spellcheck="false" bind:value={ status.config.Filtering.PatternMatch.pattern }></textarea>
				</fieldset>
			</div>
		</section>
	</section>

	<!-- System -->
	<section id="setting-system" class="fieldset-legend">
		<h2>System</h2>

		<!-- Options Page -->
		<section class="container">
			<div class="flex-side">
				<h3>Options Page</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Font Size of "Options Page"</legend>

					<form>
						<DebouncedNumericInput
							id           = "OptionsPage-FontSize"
							bind:value   = { status.config.OptionsPage.fontsize }
							min          = { status.define.OptionsPageFontSizeValueMin }
							max          = { status.define.OptionsPageFontSizeValueMax }
							step         = { status.define.OptionsPageFontSizeValueStep }
							debounceTime = { status.define.OptionsPageInputDebounceTime }
						/>
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
						<DebouncedNumericInput
							id           = "PopupMenu-FontSize"
							bind:value   = { status.config.PopupMenu.fontsize }
							min          = { status.define.PopupMenuFontSizeValueMin }
							max          = { status.define.PopupMenuFontSizeValueMax }
							step         = { status.define.PopupMenuFontSizeValueStep }
							debounceTime = { status.define.OptionsPageInputDebounceTime }
						/>
						<label for="PopupMenu-FontSize">font size ({ status.define.PopupMenuFontSizeValueMin } ~ { status.define.PopupMenuFontSizeValueMax } px)</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Clear Message</legend>

					<form id="PopupMenu-ClearMessage">
						<input id="PopupMenu-ClearMessage-enable-input" type="checkbox" bind:checked={ status.config.PopupMenu.ClearMessage.enable }>
						<label for="PopupMenu-ClearMessage-enable-input">enable</label>
					</form>

					<form>
						<DebouncedNumericInput
							id           = "PopupMenu-ClearMessage-timeout"
							bind:value   = { status.config.PopupMenu.ClearMessage.timeout }
							min          = { status.define.PopupMenuClearMessageTimeoutValueMin }
							max          = { status.define.PopupMenuClearMessageTimeoutValueMax }
							step         = { status.define.PopupMenuClearMessageTimeoutValueStep }
							debounceTime = { status.define.OptionsPageInputDebounceTime }
						/>
						<label for="PopupMenu-ClearMessage-timeout">timeout ({ status.define.PopupMenuClearMessageTimeoutValueMin } ~ { status.define.PopupMenuClearMessageTimeoutValueMax } seconds)</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>OnClick Close</legend>

					<form id="PopupMenu-ClearMessage">
						<input id="PopupMenu-OnClickClose-enable-input" type="checkbox" bind:checked={ status.config.PopupMenu.OnClickClose.enable }>
						<label for="PopupMenu-OnClickClose-enable-input">enable</label>
					</form>

					<form>
						<DebouncedNumericInput
							id           = "PopupMenu-OnClickClose-timeout"
							bind:value   = { status.config.PopupMenu.OnClickClose.timeout }
							min          = { status.define.PopupMenuOnClickCloseTimeoutValueMin }
							max          = { status.define.PopupMenuOnClickCloseTimeoutValueMax }
							step         = { status.define.PopupMenuOnClickCloseTimeoutValueStep }
							debounceTime = { status.define.OptionsPageInputDebounceTime }
						/>
						<label for="PopupMenu-OnClickClose-timeout">timeout ({ status.define.PopupMenuOnClickCloseTimeoutValueMin } ~ { status.define.PopupMenuOnClickCloseTimeoutValueMax } seconds)</label>
					</form>
				</fieldset>
			</div>
		</section>

		<!-- Badge -->
		<section class="container">
			<div class="flex-side">
				<h3>Badge</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Badge Display</legend>

					<form>
						<input id="Badge-enable-input" type="checkbox" bind:checked={ status.config.Badge.enable }>
						<label for="Badge-enable-input">Display the number of waiting URLs in a badge on the extension icon.</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Theme</legend>

					<form id="Badge-theme-type">
						<label>
							<input type="radio" name="Badge-theme-type" value="light" bind:group={ status.config.Badge.theme.type }>
							Light
						</label>
						<label>
							<input type="radio" name="Badge-theme-type" value="dark" bind:group={ status.config.Badge.theme.type }>
							Dark
						</label>
						<label>
							<input type="radio" name="Badge-theme-type" value="custom" bind:group={ status.config.Badge.theme.type }>
							Custom
						</label>
					</form>
				</fieldset>

				{#if status.config.Badge.theme.type === "custom"}
					<fieldset>
						<legend>Custom Colors</legend>

						<form class="custom-color-picker">
							<input id="Badge-theme-color-text" type="color" bind:value={ status.config.Badge.theme.color.text }>
							<label for="Badge-theme-color-text">: Text</label>
						</form>
						<form class="custom-color-picker">
							<input id="Badge-theme-color-background" type="color" bind:value={ status.config.Badge.theme.color.background }>
							<label for="Badge-theme-color-background">: Background</label>
						</form>
					</fieldset>
				{/if}
			</div>
		</section>

		<!-- Debug -->
		<section class="container">
			<div class="flex-side">
				<h3>Debug</h3>
			</div>

			<div class="flex-main">
				<fieldset>
					<legend>Enable Console Output</legend>

					<form id="Debug-logging">
						<input id="Debug-logging-input" type="checkbox" bind:checked={ status.config.Debug.logging }>
						<label for="Debug-logging-input">Output debug log to the web console</label>
					</form>
				</fieldset>

				<fieldset>
					<legend>Add Label for Console Output</legend>

					<form id="Debug-timestamp">
						<input id="Debug-timestamp-input" type="checkbox" disabled={ !status.config.Debug.logging } bind:checked={ status.config.Debug.timestamp }>
						<label for="Debug-timestamp-input">Add Timestamp to debug log</label>
					</form>

					<form id="Debug-methodLabel">
						<input id="Debug-methodLabel-input" type="checkbox" disabled={ !status.config.Debug.logging } bind:checked={ status.config.Debug.methodLabel }>
						<label for="Debug-methodLabel-input">Add Method Label to debug log</label>
					</form>
				</fieldset>

				<fieldset disabled={ !status.config.Debug.logging }>
					<legend>Log Level</legend>

					<form id="Debug-loglevel">
						<select id="Debug-loglevel-select" bind:value={ status.config.Debug.loglevel }>
							{#each Object.keys(LOG_LEVELS).toReversed() as level (level)}
								<option value={ level }>{ level }</option>
							{/each}
						</select>
						<label for="Debug-loglevel-select">Specifies the minimum level of logs to output.</label>
					</form>
				</fieldset>

				<fieldset disabled={ !status.config.Debug.timestamp || !status.config.Debug.logging }>
					<legend>Select Timestamp Type, UTC / GMT</legend>

					<form id="Debug-timecoordinate">
						<label for="Debug-timecoordinate-UTC">
							<input id="Debug-timecoordinate-UTC" type="radio" name="timecoordinate" value="UTC" bind:group={ status.config.Debug.timecoordinate }>
							UTC
						</label>
						<label for="Debug-timecoordinate-GMT">
							<input id="Debug-timecoordinate-GMT" type="radio" name="timecoordinate" value="GMT" bind:group={ status.config.Debug.timecoordinate }>
							GMT
						</label>
					</form>
				</fieldset>
			</div>
		</section>
	</section>
</article>