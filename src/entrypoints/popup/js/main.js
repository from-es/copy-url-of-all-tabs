// Import Svelte
import { mount } from "svelte";

// Import from Svelte(Script)
import App from "../svelte/App.svelte";

// Import from Script
import { initializeConfig } from "@/assets/js/initializeConfig.mjs";
import { logging          } from "@/assets/js/function.mjs";

// Import from CSS
import "../css/popup.css";

export let app = null;

window.addEventListener("load", boot);



async function boot() {
	console.clear();

	const { config, define } = await initializeConfig(null);

	main(config, define);
}

function main(config, define) {
	// Set logging console
	logging(config, define);

	const target = document.body;
	const values = {
		status : {
			config: config,
			define: define
		}
	};

	app = mount(App, {
		target: target,
		props : values
	});
}