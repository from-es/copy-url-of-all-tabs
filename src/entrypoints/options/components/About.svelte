<script lang="ts">
	/**
	 * About section component for the options page.
	 *
	 * @file
	 */

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import Module
	import { createSafeHTML } from "@/assets/js/utils/setSafeHTML";
	import { DynamicContent } from "../lib/dynamicContent";

	const dynamicContent = new DynamicContent(status);
</script>



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
		<dt>Changelog</dt>
		<dd id="update-history"><a href={ status.define.Information.updatehistory.url } title={ status.define.Information.updatehistory.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.updatehistory.title }</a></dd>
	</dl>

	<dl>
		<dt>Browser Extension Store</dt>
		<dd id="browser-extension-store">
			{#if typeof dynamicContent.getBrowserExtensionStoreContent() === "string"}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html createSafeHTML(dynamicContent.getBrowserExtensionStoreContent(), { ADD_ATTR: [ "target" ] }) }
			{/if}
		</dd>
	</dl>

	<dl>
		<dt>Source Code</dt>
		<dd id="sourcecode"><a href={ status.define.Information.github.url } title={ status.define.Information.github.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.github.title }</a></dd>
	</dl>

	<h2>Documents</h2>

	<p>For detailed documentation on this extension, please refer to
		the <a href={ status.define.Information.document.default.url } title={ status.define.Information.document.default.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.document.default.title }</a>
		 or
		the <a href={ status.define.Information.document.ja.url } title={ status.define.Information.document.ja.title } target="_blank" rel="noopener noreferrer">{ status.define.Information.document.ja.title }</a>.</p>

	<h2>Support</h2>

	{#if typeof dynamicContent.getWarningMessage() === "string"}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html createSafeHTML(dynamicContent.getWarningMessage()) }
	{/if}

	<p>Please note that as this is a free extension we are unable to provide personalized support.</p>

	<p>If you have issue or feature requests, please report them at issues (<a href={ status.define.Information.github.issues } title="Support" target="_blank" rel="noopener noreferrer">{ status.define.Information.github.issues }</a>).</p>

	{#if typeof dynamicContent.getCopyright() === "string"}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<p id="copyright">{@html createSafeHTML(dynamicContent.getCopyright()) }</p>
	{/if}
</article>