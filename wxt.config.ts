import { defineConfig }                       from "wxt";
import { type ConfigEnv, type WxtViteConfig } from "wxt";
import { manifest }                           from "./src/manifest";


// eslint-disable-next-line no-unused-vars
const getViteConfig: (env: ConfigEnv) => WxtViteConfig | Promise<WxtViteConfig> = (env) => {
	// debug
	// console.log("Debug, arguments >>", env);

	return {
		build: {
			sourcemap: ((env.mode === "sourcemap") ? true : false)
		}
	};
};

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir        : "src",
	publicDir     : "src/public",
	outDirTemplate: "{{browser}}-mv{{manifestVersion}}",

	modules: [ "@wxt-dev/module-svelte" ],

	vite: getViteConfig,

	manifest: manifest
});