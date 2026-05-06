<script lang="ts">
	/**
	 * Main Svelte component for the options page.
	 *
	 * @file
	 */

	// Import Svelte
	import { onMount } from "svelte";

	// Import Svelte Component
	import CommonTemplate from "./CommonTemplate.svelte";
	import About          from "./About.svelte";
	import Settings       from "./Settings.svelte";
	import ImportExport   from "./ImportExport.svelte";

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import Module
	import { cloneObject }     from "@/assets/js/lib/CloneObject";
	import { setPageLanguage } from "@/assets/js/utils/setPageLanguage.ts";
	import { setRootFontSize } from "@/assets/js/utils/setRootFontSize";

	// Import Constants
	import { define } from "@/assets/js/define";



	// Reactive routing logic
	$effect(() => {
		const handleHashChange = () => {
			if (status.route) {
				status.route.page = window.location.hash.replace("#", "") || define.OptionsPageDefaultRoute;
			}
		};

		window.addEventListener("hashchange", handleHashChange);

		return () => window.removeEventListener("hashchange", handleHashChange);
	});

	const page = $derived(status.route?.page || define.OptionsPageDefaultRoute);

	onMount(async () => {
		console.info("INFO(options): Options page component mounted");
		console.debug("DEBUG(options): initial status object", { status: cloneObject(status) });

		await initialize();

		console.info("INFO(options): Options page component initialized");
	});

	/**
	 * Initializes the options page component.
	 *
	 * @returns {Promise<void>}
	 */
	async function initialize(): Promise<void> {
		setPageLanguage();

		setRootFontSize(status.config.OptionsPage.fontsize);
	}
</script>



<svelte:head>
	<title>Options - { status.define.Information.name }</title>
</svelte:head>



<CommonTemplate currentPage={ page }>
	{#if page === "about"}
		<About />
	{:else if page === "setting"}
		<Settings />
	{:else if page === "config"}
		<ImportExport />
	{:else}
		<Settings />
	{/if}
</CommonTemplate>



<style></style>