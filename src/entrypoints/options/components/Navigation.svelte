<script lang="ts">
	/**
	 * Navigation sidebar component for the options page.
	 *
	 * @file
	 */

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import Module
	import { eventSettingSave, eventSettingReset } from "../lib/utils/settingsActions";

	// Props
	const { current } = $props();
</script>



<div id="sidebar">
	<article>
		<ul id="tabnav">
			<li><a href="#about"   title="About"           class:active={current === "about"  }>About</a></li>
			<li><a href="#setting" title="Setting"         class:active={current === "setting"}>Setting</a></li>
			<li><a href="#config"  title="Import / Export" class:active={current === "config" }>Import / Export</a></li>
		 </ul>
	</article>

	<article>
		<!-- Setting : Save & Reset -->
		<ul id="setting-action">
			<li><button id="SaveButton"  title="Save Extension Settings."              onclick={ () => eventSettingSave(status)                                   }>Save</button></li>
			<li><button id="ResetButton" title="Reset, Extension Settings to Default." onclick={ (e) => eventSettingReset(status, e.currentTarget as HTMLElement) }>Reset</button></li>
		</ul>
	</article>
</div>