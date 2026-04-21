/**
 * Tests for ClipboardManager
 *
 * ClipboardManager depends on the browser's `navigator.clipboard` API.
 * Since it is not available in the Node.js environment where Vitest runs,
 * the clipboard functionality is mocked using `vi.stubGlobal`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, beforeEach, afterEach, vi } from "vitest";
import { ClipboardManager } from "@/assets/js/lib/user/ClipboardManager";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const mockClipboard = {
	readText: vi.fn(),
	writeText: vi.fn(),
	write: vi.fn(),
};

const testData = {
	readText: {
		success: [
			{ name: "should return the read string when reading text succeeds", input: "Hello, world!", expected: "Hello, world!" }
		],
		error: [
			{ name: "should return false when reading text fails", input: new Error("Read failed"), expected: false }
		]
	},
	writeText: {
		success: [
			{ name: "should return true when writing text succeeds", input: "Hello, world!", expected: true }
		],
		error: [
			{ name: "should return false when writing text fails", input: new Error("Write failed"), expected: false }
		]
	},
	write: {
		success: [
			{ name: "should return true when writing data succeeds", input: { data: "some data", mimetype: "text/plain" }, expected: true }
		],
		error: [
			{ name: "should return false when writing data fails", input: { data: "some data", mimetype: "text/plain" }, expected: false }
		]
	},
	clear: {
		success: [
			{ name: "should return true when clearing clipboard succeeds", input: null, expected: true }
		],
		error: [
			{ name: "should return false when clearing clipboard fails", input: new Error("Clear failed"), expected: false }
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("ClipboardManager", () => {
	beforeEach(() => {
		// Mock browser APIs used by ClipboardManager
		vi.stubGlobal("navigator", {
			clipboard: mockClipboard,
		});
		// Mock ClipboardItem and Blob as they are not fully available in JSDOM
		vi.stubGlobal(
			"ClipboardItem",
			vi.fn(function (item) {
				return item;
			}),
		);
		vi.stubGlobal(
			"Blob",
			vi.fn(function (content, options) {
				return {
					content,
					...options,
				};
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	describe("readText", () => {
		TestRunner.success(testData.readText.success, null, async (input) => {
			mockClipboard.readText.mockResolvedValue(input);
			return await ClipboardManager.readText();
		});

		TestRunner.success(testData.readText.error, null, async (input) => {
			mockClipboard.readText.mockRejectedValue(input);
			return await ClipboardManager.readText();
		});
	});

	describe("writeText", () => {
		TestRunner.success(testData.writeText.success, null, async (input) => {
			mockClipboard.writeText.mockResolvedValue(undefined);
			return await ClipboardManager.writeText(input);
		});

		TestRunner.success(testData.writeText.error, null, async (input) => {
			mockClipboard.writeText.mockRejectedValue(input);
			return await ClipboardManager.writeText(input);
		});
	});

	describe("write", () => {
		TestRunner.success(testData.write.success, null, async (input) => {
			mockClipboard.write.mockResolvedValue(undefined);
			return await ClipboardManager.write(input.data, input.mimetype);
		});

		TestRunner.success(testData.write.error, null, async (input) => {
			mockClipboard.write.mockRejectedValue(new Error("Write failed"));
			return await ClipboardManager.write(input.data, input.mimetype);
		});
	});

	describe("clear", () => {
		TestRunner.success(testData.clear.success, null, async () => {
			mockClipboard.writeText.mockResolvedValue(undefined);
			return await ClipboardManager.clear();
		});

		TestRunner.success(testData.clear.error, null, async (input) => {
			mockClipboard.writeText.mockRejectedValue(input);
			return await ClipboardManager.clear();
		});
	});
});