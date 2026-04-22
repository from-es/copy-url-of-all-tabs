/**
 * Tests for ConfigManager
 *
 * Verifies the import and export functionality for configuration files,
 * provided by `ConfigManager/index.ts`.
 *
 * This test uses individual 'it' blocks sequentially since it involves complex mocks
 * of DOM/browser APIs such as FileReader and input elements, along with asynchronous event verification.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { ConfigManager, MIME_TYPES } from "@/assets/js/lib/user/ConfigManager";

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("ConfigManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Cleanup for URL.createObjectURL etc. if needed
	});

	describe("exportFile", () => {
		it("should generate a Blob, mimic a download link, and click it", () => {
			// Arrange
			const content = "test content";
			const filename = "config.json";
			const mimetype = MIME_TYPES.json;

			const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
			const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
			const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

			// Act
			const result = ConfigManager.exportFile(content, filename, mimetype);

			// Assert
			expect(result.success).toBe(true);
			expect(createObjectURLSpy).toHaveBeenCalled();
			expect(clickSpy).toHaveBeenCalled();
			expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:url");
		});
	});

	describe("importFile", () => {
		let inputMock: any;
		let fileReaderMock: any;

		beforeEach(() => {
			inputMock = {
				type: "",
				accept: "",
				click: vi.fn(),
				onchange: null,
				oncancel: null,
				files: []
			};

			vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
				if (tagName === "input") {
					return inputMock as any;
				}
				if (tagName === "a") {
					return { click: vi.fn(), remove: vi.fn(), dataset: {} } as any;
				}

				return {} as any;
			});

			fileReaderMock = {
				readAsText: vi.fn(),
				onload: null,
				onerror: null,
				result: "file content"
			};

			vi.stubGlobal("FileReader", vi.fn(function() {
				return fileReaderMock;
			}));
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("should succeed in reading when the MIME type matches", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;
			const file = new File([ "content" ], "test.json", { type: mimetype });

			fileReaderMock.readAsText.mockImplementation(function(this: any) {
				if (this.onload) {
					this.onload();
				}
			});

			// Act
			const promise = ConfigManager.importFile(mimetype);

			// Trigger file selection
			await Promise.resolve();
			inputMock.onchange({ target: { files: [ file ] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(true);
			expect(result.content).toBe("file content");
		});

		it("should succeed in reading when the file extension matches (e.g., when MIME type is unknown)", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;
			const file = new File([ "content" ], "test.json", { type: "" }); // Empty MIME type

			fileReaderMock.readAsText.mockImplementation(function(this: any) {
				if (this.onload) {
					this.onload();
				}
			});

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.onchange({ target: { files: [ file ] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(true);
			expect(result.content).toBe("file content");
		});

		it("should return an error when neither the MIME type nor the extension matches", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;
			const file = new File([ "content" ], "test.txt", { type: "text/plain" });

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.onchange({ target: { files: [ file ] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.message).toContain("Invalid: a file with a different format");
		});

		it("should set isUserCancel to true when the user cancels", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.oncancel();

			const result = await promise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.isUserCancel).toBe(true);
		});

		it("should return an error when a file reading error occurs", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;
			const file = new File([ "content" ], "test.json", { type: mimetype });

			fileReaderMock.readAsText.mockImplementation(function(this: any) {
				if (this.onerror) {
					this.onerror();
				}
			});

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.onchange({ target: { files: [ file ] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.message).toContain("Error: error reading file");
		});

		it("should return an error when the file reading result is not a string", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;
			const file = new File([ "content" ], "test.json", { type: mimetype });

			fileReaderMock.result = null; // Not a string
			fileReaderMock.readAsText.mockImplementation(function(this: any) {
				if (this.onload) {
					this.onload();
				}
			});

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.onchange({ target: { files: [ file ] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.message).toContain("Failure: failed to read file as text");
		});

		it("should return an error if no file is selected (target.files is empty)", async () => {
			// Arrange
			const mimetype = MIME_TYPES.json;

			// Act
			const promise = ConfigManager.importFile(mimetype);

			await Promise.resolve();
			inputMock.onchange({ target: { files: [] } });

			const result = await promise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.message).toContain("Failure: no file selected");
		});
	});
});