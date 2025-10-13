// Import Types
import { type Config, type Define } from "@/assets/js/types";

// Import Svelte
import { mount } from "svelte";

// Import Svelte Component & Types
import App          from "./App.svelte";
import type AppType from "./App.svelte";

// Import from Script
import { initializeConfig } from "@/assets/js/initializeConfig";
import { logging }          from "@/assets/js/logging";

export let app: AppType | null = null;

window.addEventListener("load", boot);



async function boot() {
	const { config, define } = await initializeConfig(null);

	main(config, define);
}

function main(config: Config, define: Define) {
	console.clear();

	// Set logging console
	logging(config, define);

	const target = document.body;
	const values = {
		variables : {
			config : config,
			define : define
		}
	};

	app = mount(App, {
		target: target,
		props : values
	});
}