<script lang="ts">
	// WXT provided cross-browser compatible API and types.
	import { browser } from "wxt/browser";

	// Import from Svelte
	import { onMount } from "svelte";

	// Import from Svelte(Component)
	import Header from "./header.svelte";
	import Main   from "./main.svelte";
	import Footer from "./footer.svelte";

	// Import Shared State Object
	import { shareStatus as status } from "@/assets/js/lib/user/StateManager/state";

	onMount(() => {
		setUILanguage();
	});

	function setUILanguage() {
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