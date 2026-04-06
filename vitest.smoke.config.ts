import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest configuration for smoke tests only.
 * Runs tests in `tests/_vitest-check/` to verify the test environment.
 * Use: `npm run vitest:smoke`
 */
export default defineConfig({
	plugins: [
		svelte({ hot: !process.env.VITEST }),
		tsconfigPaths(),
	],
	resolve: {
		conditions: [ "browser" ],
	},
	test: {
		globals: true,
		environment: "jsdom",

		// Smoke tests: only include _vitest-check directory
		include: [
			"tests/_vitest-check/**/*.test.{js,ts}"
		],
	},
});