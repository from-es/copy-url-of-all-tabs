import { add } from "./utils";
import { describe, it, expect } from "vitest";

describe("add function", () => {
  it("should return the sum of two numbers", () => {
    // 準備
    const a = 1;
    const b = 2;

    // 実行
    const result = add(a, b);

    // 検証
    expect(result).toBe(3);
  });

  it("should handle negative numbers", () => {
    expect(add(-1, -1)).toBe(-2);
  });
});