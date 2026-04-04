<script lang="ts">
	/**
	 * Main Svelte component for the options page.
	 *
	 * @file
	 * @lastModified 2026-04-04
	 */

	// WXT provided cross-browser compatible API.
	import { browser } from "wxt/browser";

	// Import Svelte
	import { onMount } from "svelte";

	// Import Svelte Component
	import Header from "./header.svelte";
	import Main   from "./main.svelte";
	import Footer from "./footer.svelte";

	// Import Object
	import { shareStatus as status } from "@/assets/js/lib/user/StateManager/state.svelte.ts";  // Shared State Object



	onMount(() => {
		setUILanguage();
	});

	/**
	 * Set the language attribute of the HTML element based on the browser's UI language.
	 *
	 * Supports "ja" and defaults to "en".
	 *
	 * @returns {void}
	 */
	function setUILanguage(): void {
		const lang = browser.i18n.getUILanguage();
		const elm  = document.querySelector("html");

		if ( !elm ) {
			return;
		}

		switch (lang) {
			case "ja":
				elm.setAttribute("lang", "ja");
				break;
			default:
				elm.setAttribute("lang", "en");
				break;
		}
	}
</script>



<!-- Svelte Component Tag, Start -->
<Header title={ status.define.Information.name } />

<Main />

<Footer />
<!-- Svelte Component Tag, End -->



<style></style>