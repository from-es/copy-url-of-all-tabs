/**
 * Test suite for FormatManager.
 *
 * This file verifies the formatting and variable substitution logic in FormatManager,
 * specifically ensuring the robust variable substitution implemented to handle
 * special characters in titles and URLs.
 *
 * @file
 * @lastModified 2026-03-29
 */

import type { Browser } from "wxt/browser";
import { describe, it, expect, vi } from "vitest";
import { FormatManager } from "@/entrypoints/popup/js/FormatManager";

// Mock WXT's browser API module.
vi.mock("wxt/browser", () => ({
	browser: {
		runtime: {
			getManifest: vi.fn(() => ({
				author: "From E",
				name: "Copy URL of All Tabs",
				description: "A browser extension for copying all tab URLs.",
				version: "1.0.0"
			})),
			id: "dummy-extension-id"
		}
	}
}));

// --- Test Data Definition ---

/**
 * Standard mock tabs for general tests.
 */
const mockTabs: Browser.tabs.Tab[] = [
	{ title: "Example Page", url: "http://example.com" } as Browser.tabs.Tab,
	{ title: "Another Page", url: "http://another.com" } as Browser.tabs.Tab
];

/**
 * Tab with titles/URLs containing regex special characters.
 */
const trickyTabs: Browser.tabs.Tab[] = [
	{ title: "Price: $100", url: "http://shop.com/search?q=$&" } as Browser.tabs.Tab
];

/**
 * Tab with titles that look like placeholders themselves.
 */
const recursiveTabs: Browser.tabs.Tab[] = [
	{ title: "Contains $url", url: "http://realworld.com" } as Browser.tabs.Tab
];

/**
 * Tab with HTML special characters.
 */
const htmlTabs: Browser.tabs.Tab[] = [
	{ title: "Title <with> tags & symbols", url: "http://example.com?q=a&b=c" } as Browser.tabs.Tab
];

/**
 * Test case interface for data-driven testing.
 */
interface TestCase {
	name: string;
	tabs: Browser.tabs.Tab[];
	format: "text" | "json" | "custom";
	template: string | null;
	sanitize: boolean;
	expected: string;
}

/**
 * List of test cases for FormatManager.format.
 */
const testCases: TestCase[] = [
	{
		name: "format: text - should return newline-separated URLs",
		tabs: mockTabs,
		format: "text",
		template: null,
		sanitize: false,
		expected: "http://example.com\nhttp://another.com"
	},
	{
		name: "format: json - should return a pretty-printed JSON string",
		tabs: mockTabs,
		format: "json",
		template: null,
		sanitize: false,
		expected: JSON.stringify(
			mockTabs.map(t => ({ title: t.title, url: t.url })),
			null,
			"\t"
		)
	},
	{
		name: "format: custom - should substitute $title and $url correctly",
		tabs: mockTabs,
		format: "custom",
		template: "[$title]($url)",
		sanitize: false,
		expected: "[Example Page](http://example.com)\n[Another Page](http://another.com)"
	},
	{
		name: "format: custom - should be case-insensitive for placeholders",
		tabs: mockTabs,
		format: "custom",
		template: "$TITLE: $URL",
		sanitize: false,
		expected: "Example Page: http://example.com\nAnother Page: http://another.com"
	},
	{
		name: "format: custom - should handle regex special characters in replacement values literally",
		tabs: trickyTabs,
		format: "custom",
		template: "$title - $url",
		sanitize: false,
		expected: "Price: $100 - http://shop.com/search?q=$&"
	},
	{
		name: "format: custom - should implement single-pass replacement to avoid recursive substitution",
		tabs: recursiveTabs,
		format: "custom",
		template: "Title: $title, URL: $url",
		sanitize: false,
		expected: "Title: Contains $url, URL: http://realworld.com"
	},
	{
		name: "format: custom - should HTML-escape content if sanitize is true",
		tabs: htmlTabs,
		format: "custom",
		template: "<li>$title</li>",
		sanitize: true,
		expected: "<li>Title &lt;with&gt; tags &amp; symbols</li>"
	},
	{
		name: "format: custom - should handle multi-line templates correctly",
		tabs: [ mockTabs[0] ],
		format: "custom",
		template: "Template Start\nTitle: $title\nURL: $url\nTemplate End",
		sanitize: false,
		expected: "Template Start\nTitle: Example Page\nURL: http://example.com\nTemplate End"
	},
	{
		name: "format: custom - should return error message if template is null",
		tabs: mockTabs,
		format: "custom",
		template: null,
		sanitize: false,
		expected: "Error, Row template is empty! (see options page)"
	},
	{
		name: "format: custom - should return error message if template is empty string",
		tabs: mockTabs,
		format: "custom",
		template: "",
		sanitize: false,
		expected: "Error, Row template is empty! (see options page)"
	}
];

// --- Test Execution ---

describe("FormatManager", () => {
	testCases.forEach(({ name, tabs, format, template, sanitize, expected }) => {
		it(name, () => {
			const result = FormatManager.format(tabs, format, template, sanitize);
			expect(result).toBe(expected);
		});
	});
});