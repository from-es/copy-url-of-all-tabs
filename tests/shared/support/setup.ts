import { vi } from "vitest";

// Base mocks common to all tests (wxt/browser, etc.)
vi.mock("wxt/browser", () => ({
	browser: {
		runtime: {
			getManifest: vi.fn(() => ({
				author: "From E",
				name: "Copy URL of All Tabs",
				version: "1.20.8"
			})),
			id: "dummy-extension-id"
		}
	}
}));