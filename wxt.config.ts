import { defineConfig, UserManifest }         from "wxt";
import { type ConfigEnv, type WxtViteConfig } from "wxt";
import { manifest }                           from "./src/manifest";


// eslint-disable-next-line no-unused-vars
const getViteConfig: (env: ConfigEnv) => WxtViteConfig | Promise<WxtViteConfig> = (env) => {
	// debug
	// console.log("Debug, arguments >>", env);

	return {
		build: {
			sourcemap: env.mode === "sourcemap"
		}
	};
};
const getManifest = (env: ConfigEnv): UserManifest => {
	const obj: UserManifest = { ...manifest }; // 元の manifest を変更しないようにコピーを作成
	const browser           = env.browser;

	switch (browser) {
		case "chrome":
			delete obj.browser_specific_settings;
			break;
		case "firefox":
			delete obj.minimum_chrome_version;
			break;
		default:
			break;
	}

	// debug
	// console.log("[wxt.config.ts] Generated manifest:", { browser, manifest: obj });

	return obj;
};


// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir        : "src",
	publicDir     : "src/public",
	outDirTemplate: "{{browser}}-mv{{manifestVersion}}",

	modules: [ "@wxt-dev/module-svelte" ],

	vite    : getViteConfig,
	manifest: getManifest
});