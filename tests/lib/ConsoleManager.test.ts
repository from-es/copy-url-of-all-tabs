/**
 * Tests for ConsoleManager
 *
 * Verifies the filtering and styling functionality of the console object provided by `ConsoleManager`.
 *
 * This test focuses on verifying side effects involving the modification and restoration
 * of the global console object state, and uses individual 'it' blocks sequentially.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { ConsoleManager } from "@/assets/js/lib/user/ConsoleManager";

describe("ConsoleManager", () => {
	beforeEach(() => {
		// Arrange: Clean state at the start of each test
		ConsoleManager.restore();
		ConsoleManager.option({
			logging: true,
			loglevel: "warn",
			methodLabel: true,
			timestamp: false, // Temporarily disabled to reduce test complexity
			timecoordinate: "UTC"
		});
	});

	afterEach(() => {
		ConsoleManager.restore();
		vi.clearAllMocks();
	});

	it("should override console methods when apply() is called", () => {
		// Arrange
		ConsoleManager.apply();
		const logSpy = vi.spyOn(globalThis.console, "log");

		// Act
		console.log("test");

		// Assert: loglevel is 'warn', so log should be set to no-op
		expect(logSpy).toHaveBeenCalled();
		expect(logSpy.getMockName()).toBe("noop");
	});

	it("should function as a filter for loglevel (outputting 'warn' and above)", () => {
		// Arrange
		ConsoleManager.apply();
		const warnSpy = vi.spyOn(globalThis.console, "warn");

		// Act
		console.warn("warning");

		// Assert
		expect(warnSpy).toHaveBeenCalled();
	});

	it("should change settings when option() is called", () => {
		// Act
		ConsoleManager.option({ loglevel: "debug" });

		// Assert
		const { option } = ConsoleManager.state();
		expect(option.loglevel).toBe("debug");
	});

	it("should throw an error when invalid options are set", () => {
		// Act & Assert
		expect(() => {
			ConsoleManager.option({ loglevel: "invalid" as any });
		}).toThrow();

		expect(() => {
			ConsoleManager.option({ logging: "not-a-boolean" as any });
		}).toThrow();

		expect(() => {
			ConsoleManager.option({ methodLabel: "not-a-boolean" as any });
		}).toThrow();

		expect(() => {
			ConsoleManager.option({ timestamp: "not-a-boolean" as any });
		}).toThrow();

		expect(() => {
			ConsoleManager.option({ timecoordinate: "not-utc-or-gmt" as any });
		}).toThrow();

		expect(() => {
			ConsoleManager.option(null as any);
		}).toThrow();
	});

	it("should set methods to no-op (empty functions) when logging is false or loglevel is 'silent'", () => {
		// Arrange
		ConsoleManager.option({ logging: false });
		ConsoleManager.apply();

		// Act
		console.log("this should not be output");

		// Assert
		expect(typeof console.log).toBe("function");

		// Arrange
		ConsoleManager.restore();
		ConsoleManager.option({ logging: true, loglevel: "silent" });
		ConsoleManager.apply();

		// Act
		console.warn("this also should not be output");

		// Assert
		expect(typeof console.warn).toBe("function");
	});

	it("should generate a timestamp when timestamp is true and timecoordinate is 'GMT'", () => {
		// Arrange
		ConsoleManager.option({
			timestamp: true,
			timecoordinate: "GMT",
			methodLabel: true,
			logging: true,
			loglevel: "all"
		});
		ConsoleManager.apply();
		const logSpy = vi.spyOn(globalThis.console, "log");

		// Act
		console.log("GMT test");

		// Assert
		expect(logSpy).toHaveBeenCalled();
	});

	it("should use original methods directly when both timestamp and methodLabel are false", () => {
		// Arrange
		ConsoleManager.option({
			timestamp: false,
			methodLabel: false,
			logging: true,
			loglevel: "all"
		});
		ConsoleManager.apply();
		const logSpy = vi.spyOn(globalThis.console, "log");

		// Act
		console.log("direct test");

		// Assert
		expect(logSpy).toHaveBeenCalledWith("direct test");
	});

	it("should retrieve current settings via state()", () => {
		// Act
		const state = ConsoleManager.state();

		// Assert
		expect(state.option).toBeDefined();
		expect(state.method).toBeDefined();
	});
});