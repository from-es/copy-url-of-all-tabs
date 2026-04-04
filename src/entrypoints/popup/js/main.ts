/**
 * Main entry point for the popup page.
 *
 * @file
 * @lastModified 2026-04-04
 */

// Import Svelte
import { mount } from "svelte";

// Import Svelte Component & Types
import App          from "../svelte/App.svelte";
import type AppType from "../svelte/App.svelte";

// Import Svelte Module
import { initializeSharedState } from "@/assets/js/lib/user/StateManager/state.svelte.ts";

// Import Module
import { initializeConfig } from "@/assets/js/initializeConfig";
import { logging }          from "@/assets/js/logging";

// Import CSS
import "../css/popup.css";



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

	// Set logging console
	logging(config, define);

	// Initialize Share State Object
	initializeSharedState(config, define);

	// Mounting the starting module
	const target = document.body;
	app = mount(App, { target });
}



export { app };