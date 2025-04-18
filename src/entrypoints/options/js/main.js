// Import Svelte
import { mount } from "svelte";

// Import Svelte(Script)
import App from "./App.svelte";

// Import from Script
import { define }           from "@/assets/js/define.mjs";
import { initializeConfig } from "@/assets/js/initializeConfig.mjs";
import { logging }          from "@/assets/js/function.mjs";

export let app = null;

window.addEventListener("load", boot);



async function boot() {
	const config = await initializeConfig(define);

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