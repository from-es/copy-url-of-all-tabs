// Import Svelte
import { mount } from "svelte";

// Import Svelte(Script)
import App from "./App.svelte";

// Import from Script
import { initializeConfig } from "@/assets/js/initializeConfig";
import { logging }          from "@/assets/js/function.mjs";

export let app = null;

window.addEventListener("load", boot);



async function boot() {
	const { config, define } = await initializeConfig(null);

	main(config, define);
}

function main(config, define) {
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