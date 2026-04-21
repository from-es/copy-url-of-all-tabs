/**
 * Tests for BrowserEnvironment
 *
 * Verifies the browser environment information retrieval process via
 * the User-Agent Client Hints API (`navigator.userAgentData`) or fallback
 * logic to `navigator.userAgent`.
 *
 * This test uses individual 'it' blocks sequentially because the mocks
 * for the asynchronous `userAgentData` API (getHighEntropyValues) and
 * DOM global objects are complex, requiring specific environment simulations.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, afterEach, beforeEach, expect, vi } from "vitest";
import { BrowserEnvironment } from "@/assets/js/lib/user/BrowserEnvironment";

vi.mock("@/assets/js/lib/user/BrowserEnvironment/plugins/bowser", () => ({
	UserAgentParserPlugin: {
		information: { useLibrary: "bowser-mock" },
		execute: vi.fn(() => ({
			browser: { name: "MockBrowser", version: "1.0" },
			engine: { name: "MockEngine", version: "1.0" },
			os: { name: "MockOS", version: "10", versionName: "MockOSX" }
		}))
	}
}));

describe("BrowserEnvironment", () => {
	let originalNavigator: any;

	beforeEach(() => {
		originalNavigator = globalThis.navigator;
	});

	afterEach(() => {
		Object.defineProperty(globalThis, "navigator", {
			value: originalNavigator,
			configurable: true
		});
		vi.clearAllMocks();
	});

	it("should retrieve and supplement information from Client Hints if navigator.userAgentData exists", async () => {
		// Arrange: Create a mock for userAgentData
		Object.defineProperty(globalThis, "navigator", {
			value: {
				userAgent: "Mozilla/5.0",
				userAgentData: {
					brands: [ { brand: "Chrome", version: "114" } ],
					mobile: false,
					platform: "Windows",
					getHighEntropyValues: vi.fn().mockResolvedValue({
						brands: [ { brand: "Chrome", version: "114" } ],
						fullVersionList: [ { brand: "Chrome", version: "114.0.0.0" } ],
						mobile: false,
						model: "",
						architecture: "x86",
						bitness: "64",
						platform: "Windows"
					})
				}
			},
			configurable: true
		});

		const env = new BrowserEnvironment();

		// Act
		const result = await env.get();

		// Assert
		expect(result.checker.isSuccess).toBe(true);
		expect(result.checker.dataSources.primary).toBe("navigator.userAgentData");
		expect(result.checker.dataSources.secondary).toBe("bowser-mock"); // Fallback to secondary

		// Confirm that the values in pluginInfo (parsed from userAgent) shallow-overwrite those from clientHintsInfo.
		expect(result.information.browser.name).toBe("MockBrowser");
		// expect(result.information.browser.version).toBe("114.0.0.0"); // This will also be overwritten by MockBrowser's element.
		expect(result.information.os.name).toBe("MockOS");

		// Info supplemented by plugin
		expect(result.information.os.versionName).toBe("MockOSX"); // Info from mock plugin
	});

	it("should retrieve via fallback (plugin) if navigator.userAgentData is missing but userAgent exists", async () => {
		// Arrange
		Object.defineProperty(globalThis, "navigator", {
			value: {
				userAgent: "Mock-UserAgent-String"
			},
			configurable: true
		});

		const env = new BrowserEnvironment();

		// Act
		const result = await env.get();

		// Assert
		expect(result.checker.isSuccess).toBe(true);
		expect(result.checker.dataSources.primary).toBe("bowser-mock");

		// Confirm that values from plugin (bowser-mock) are directly in result.information
		expect(result.information.browser.name).toBe("MockBrowser");
		expect(result.information.os.name).toBe("MockOS");
	});

	it("should return an error result if neither are supported", async () => {
		// Arrange
		Object.defineProperty(globalThis, "navigator", {
			value: {}, // Neither userAgent nor userAgentData exists
			configurable: true
		});

		const env = new BrowserEnvironment();

		// Act
		const result = await env.get();

		// Assert
		expect(result.checker.isSuccess).toBe(false);
		expect(result.checker.dataSources.primary).toBe(undefined);
		expect(result.checker.message).toContain("not supported");
	});
});