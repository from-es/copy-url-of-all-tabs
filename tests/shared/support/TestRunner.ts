import { it, expect } from "vitest";

/**
 * Basic structure of a test case (read-only)
 *
 * @template I Type of the input value
 * @template E Type of the expected value
 */
export interface TestCase<I = any, E = any> {
	/** Test case name (title for the 'it' block) */
	readonly name: string;
	/** Input value passed to the target function (object recommended for multiple inputs) */
	readonly input: I;
	/** Expected return value or error message (for error cases) */
	readonly expected?: E;
	/** Optional individual setup (if specific preparation is needed) */
	readonly setup?: (context?: any) => void;
}

/**
 * Test execution class
 * Encapsulates common cycles (loops, setup, 'it' blocks) and provides assertion branches.
 */
export class TestRunner {
	/**
	 * Execution for successful/normal test cases
	 * Bulk verification is possible if targetFn returns results or multiple items as an object.
	 */
	static success<T extends TestCase>(
		cases: readonly T[],
		context: any,
		targetFn: (input: any, ctx: any, caseData: T) => any | Promise<any>
	) {
		this.run(cases, context, async (caseData, ctx) => {
			expect(await targetFn(caseData.input, ctx, caseData)).toEqual(caseData.expected);
		});
	}

	/**
	 * Execution for error test cases (exception throwing verification)
	 * If 'expected' is defined, it also verifies that the error message matches.
	 */
	static error<T extends TestCase>(
		cases: readonly T[],
		context: any,
		targetFn: (input: any, ctx: any, caseData: T) => any | Promise<any>
	) {
		this.run(cases, context, async (caseData, ctx) => {
			const call = async () => await targetFn(caseData.input, ctx, caseData);
			if (caseData.expected) {
				await expect(call()).rejects.toThrow(caseData.expected);
			} else {
				await expect(call()).rejects.toThrow();
			}
		});
	}

	/** Internal common execution logic */
	private static run<T extends TestCase>(
		cases: readonly T[],
		context: any,
		assertion: (caseData: T, context: any) => void | Promise<void>
	) {
		cases.forEach((caseData) => {
			it(caseData.name, async () => {
				if (caseData.setup) {
					caseData.setup(context);
				}
				await assertion(caseData, context);
			});
		});
	}
}