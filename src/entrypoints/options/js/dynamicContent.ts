// WXT provided cross-browser compatible API and types
import { browser } from "wxt/browser";

// Import Types
import { type Config, type Define } from "@/assets/js/types/index";

// statusの型をmain.svelteから受け取るため、必要な部分だけを定義
// NOTE: main.svelte の `$props()` の型が変更された場合は、それに合わせた変更が必要
type Status = {
	define: Define;
	config: Config;
};

export class DynamicContent {
	private status   : Status;
	private storeData: Define["Information"]["BrowserExtensionStore"][string] | null;

	constructor(status: Status) {
		this.status    = status;
		this.storeData = this.getBrowserStoreData();
	}

	/*
		ブラウザの種類を判定
		NOTE: manifest.json に依存する形でハードコーディングをしている為、リファクタリング時は要注意

		@dependency manifest.json (has property, "browser_specific_settings" or "minimum_chrome_version")
	*/
	private getBrowserType(): "chrome" | "firefox" | null {
		const manifest = browser.runtime.getManifest();

		// debug
		// console.log("Debug, getBrowserType() >>", { manifest });

		// Firefox: "browser_specific_settings" のプロパティを持っているか
		const isFirefox = Object.hasOwn(manifest, "browser_specific_settings");
		if (isFirefox) {
			return "firefox";
		}

		// Chrome: 有効な "minimum_chrome_version" のプロパティを持っているか
		const isChrome = Object.hasOwn(manifest, "minimum_chrome_version") && typeof manifest.minimum_chrome_version === "string" && manifest.minimum_chrome_version.length > 0;
		if (isChrome) {
			return "chrome";
		}

		return null;
	}

	private getBrowserStoreData(): Define["Information"]["BrowserExtensionStore"][string] | null {
		const storeInfos  = this.status.define.Information.BrowserExtensionStore;
		const browserType = this.getBrowserType();

		if (browserType && Object.hasOwn(storeInfos, browserType)) {
			return storeInfos[browserType];
		}

		return null;
	}

	public getBrowserExtensionStoreContent(): string {
		if (this.storeData) {
			return `<a href="${this.storeData.url}" title="${this.storeData.title}" target="_blank" rel="noopener noreferrer">${this.storeData.title}</a>`;
		} else {
			return "There is no official distribution for this browser.";
		}
	}

	public getWarningMessage(): string | null {
		if (!this.storeData) {
			const issues  = `${this.status.define.Information.github.url}/issues`;
			const message = `Your browser is <b>not officially supported</b>, as this extension is intended for Chrome or Firefox. You may encounter <b>unexpected issues</b>. To help us improve compatibility, please let us know what browser you are using via Issues (${issues}).`;
			return `<p id="warning-message-for-supported-browser">${message}</p>`;
		}

		return null;
	}

	public getCopyright(): string {
		const store = this.storeData;

		const fromYear = store && Object.hasOwn(store, "publish") && typeof store.publish === "number" ? store.publish : null;
		const thisYear = new Date().getFullYear();
		const lastYear = fromYear && fromYear !== thisYear && thisYear > fromYear ? `-${thisYear}` : "";
		const author   = this.status.define.Information.author;
		const result   = `&copy; ${fromYear}${lastYear} <strong>${author}</strong>.`;

		return result;
	}
}