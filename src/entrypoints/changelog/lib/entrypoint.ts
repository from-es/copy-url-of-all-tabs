/**
 * Main entry point for the changelog page.
 *
 * @file
 */

// Import Svelte
import { mount } from "svelte";

// Import Svelte Component & Types
import App          from "../components/App.svelte";
import type AppType from "../components/App.svelte";

// Import Svelte Module
import { initializeSharedState } from "@/assets/js/lib/user/StateManager/state.svelte.ts";

// Import Module
import { initializeConfig } from "@/assets/js/initializeConfig";
import { logging }          from "@/assets/js/logging";



/**
 * The Svelte application instance.
 */
let app: ReturnType<typeof mount> | AppType | null = null;

window.addEventListener("load", main);

/**
 * Initializes and mounts the Svelte application.
 *
 * Initializes the configuration, logging, and shared state, then mounts the Svelte application to the document body.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
	console.clear();

	// Initialize settings
	const { config, define } = await initializeConfig(null);

	// Initialize Share State Object
	initializeSharedState(config, define);

	// Set logging console
	logging(config, define);

	// Mounting the starting module
	const target = document.body;
	app = mount(App, { target });
}



export { app };