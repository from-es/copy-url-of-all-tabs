<script>
	// Import from Svelte
	import { onMount } from "svelte";

	// Import from Svelte(Component)
	import Header from "./header.svelte";
	import Main   from "./main.svelte";
	import Footer from "./footer.svelte";

	let { variables = $bindable() } = $props();
	let status = $state(variables);

	onMount(() => {
		setUILanguage();
	});

	function setUILanguage() {
		const lang = chrome.i18n.getUILanguage();
		const elm  = document.querySelector("html");

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
<Header bind:status={ status } />

<Main bind:status={ status } />

<Footer />
<!-- Svelte Component Tag, End -->



<style></style>