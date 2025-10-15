/**
 * @file tests/utils/ClipboardManager.test.ts
 * @lastupdate 2025/09/06
 * @description
 * This file tests the ClipboardManager class.
 *
 * Since ClipboardManager relies on the browser's `navigator.clipboard` API,
 * which is not available in the Node.js environment where Vitest runs,
 * this test file uses `vi.stubGlobal` to mock the clipboard functionality.
 *
 * Each method (`readText`, `writeText`, `write`, `clear`) is tested for
 * both successful execution and failure handling to ensure the wrapper
 * class behaves as expected.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClipboardManager } from "@/assets/js/lib/user/ClipboardManager";

describe("ClipboardManager", () => {
	const mockClipboard = {
		readText: vi.fn(),
		writeText: vi.fn(),
		write: vi.fn(),
	};

	beforeEach(() => {
		// Mock browser APIs used by ClipboardManager
		vi.stubGlobal("navigator", {
			clipboard: mockClipboard,
		});
		// Mock ClipboardItem and Blob as they are not fully available in JSDOM
		vi.stubGlobal("ClipboardItem", vi.fn(item => item));
		vi.stubGlobal("Blob", vi.fn((content, options) => ({
			content,
			...options,
		})));
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	describe("readText", () => {
		it("should return text on successful read", async () => {
			const sampleText = "Hello, world!";
			mockClipboard.readText.mockResolvedValue(sampleText);

			const result = await ClipboardManager.readText();
			expect(result).toBe(sampleText);
			expect(mockClipboard.readText).toHaveBeenCalledOnce();
		});

		it("should return false on failure", async () => {
			mockClipboard.readText.mockRejectedValue(new Error("Read failed"));

			const result = await ClipboardManager.readText();
			expect(result).toBe(false);
			expect(mockClipboard.readText).toHaveBeenCalledOnce();
		});
	});

	describe("writeText", () => {
		it("should return true on successful write", async () => {
			const sampleText = "Hello, world!";
			mockClipboard.writeText.mockResolvedValue(undefined);

			const result = await ClipboardManager.writeText(sampleText);
			expect(result).toBe(true);
			expect(mockClipboard.writeText).toHaveBeenCalledWith(sampleText);
		});

		it("should return false on failure", async () => {
			const sampleText = "Hello, world!";
			mockClipboard.writeText.mockRejectedValue(new Error("Write failed"));

			const result = await ClipboardManager.writeText(sampleText);
			expect(result).toBe(false);
			expect(mockClipboard.writeText).toHaveBeenCalledWith(sampleText);
		});
	});

	describe("write", () => {
		it("should return true on successful write", async () => {
			const data = "some data";
			const mimetype = "text/plain";
			mockClipboard.write.mockResolvedValue(undefined);

			const result = await ClipboardManager.write(data, mimetype);
			expect(result).toBe(true);
			expect(mockClipboard.write).toHaveBeenCalledOnce();
		});

		it("should return false on failure", async () => {
			const data = "some data";
			const mimetype = "text/plain";
			mockClipboard.write.mockRejectedValue(new Error("Write failed"));

			const result = await ClipboardManager.write(data, mimetype);
			expect(result).toBe(false);
			expect(mockClipboard.write).toHaveBeenCalledOnce();
		});
	});

	describe("clear", () => {
		it("should return true on successful clear", async () => {
			mockClipboard.writeText.mockResolvedValue(undefined);

			const result = await ClipboardManager.clear();
			expect(result).toBe(true);
			// clear() calls writeText with an empty string
			expect(mockClipboard.writeText).toHaveBeenCalledWith("");
		});

		it("should return false on failure", async () => {
			mockClipboard.writeText.mockRejectedValue(new Error("Clear failed"));

			const result = await ClipboardManager.clear();
			expect(result).toBe(false);
			expect(mockClipboard.writeText).toHaveBeenCalledWith("");
		});
	});
});