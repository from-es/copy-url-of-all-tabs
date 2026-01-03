// Import Svelte
import { mount } from "svelte";

// Import Svelte Component & Types
import App          from "../svelte/App.svelte";
import type AppType from "../svelte/App.svelte";

// Import Module
import { initializeConfig }      from "@/assets/js/initializeConfig";
import { initializeSharedState } from "@/assets/js/lib/user/StateManager/state";
import { logging }               from "@/assets/js/logging";

// Import CSS
import "../css/popup.css";

export let app: ReturnType<typeof mount> | AppType | null = null;

window.addEventListener("load", main);

async function main() {
	console.clear();

	// Initialize settings
	const { config, define } = await initializeConfig(null);

	// Set logging console
	logging(config, define);

	// Initialize Share State Object
	initializeSharedState(config, define);

	// Mounting the starting module
	const target = document.body;
	app = mount(App, { target });
}