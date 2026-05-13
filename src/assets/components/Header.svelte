<script lang="ts">
	/**
	 * Common Header component for all entrypoints.
	 *
	 * @file
	 */

	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	interface HeaderProps {
		logo?: {
			title: string;  // Brand title
			href?: string;  // Optional link for the brand logo
		};
	}

	const { logo }: HeaderProps = $props();
</script>



{#snippet brandLogo(logo: HeaderProps["logo"])}
	{#if typeof logo === "object" && typeof logo?.title === "string" && typeof logo?.href === "string"}
		<!-- Anchor link (Accessibility: Consider aria-current if linking to current page) -->
		<a href={ logo.href } title={ logo.title } class="brand-logo">{ logo.title }</a>
	{:else if typeof logo === "object" && typeof logo?.title === "string"}
		<!-- Plain text -->
		<p class="brand-logo">{ logo.title }</p>
	{:else}
		<!-- Fallback to default name from define.json -->
		<p class="brand-logo">{ status.define.Information.name }</p>
	{/if}
{/snippet}



<header id="header">
	<div id="brand">
		{@render brandLogo(logo)}
	</div>
</header>