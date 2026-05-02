# UrlDelayCalculator.ts

A versatile, stateless utility for calculating URL opening delays. Designed for high performance and robustness, making it ideal for browser extensions and web applications that need to manage sequential resource loading.

---

## Overview

When opening a large number of URLs programmatically, it's common to encounter rate limiting or performance degradation from servers. `UrlDelayCalculator.ts` provides a powerful solution by calculating both individual and cumulative delays for a list of URLs based on a default delay and a set of customizable rules.

This utility is designed as a stateless, static class, ensuring it runs safely and predictably even in environments with ephemeral lifecycles, such as browser extension Service Workers (Manifest V3).

## Features

- **Stateless Design:** No instance required. All functionality is provided through a static method.
- **Customizable Rules:** Define specific delays for URLs matching certain patterns.
- **Flexible Pattern Matching:** Supports `prefix`, `substring`, and `exact` matching for string patterns, as well as `RegExp` objects.
- **Conditional Application:** Apply custom delays only from the Nth match of a rule (e.g., apply only from the 2nd occurrence).
- **Robust & Safe:** Gracefully handles invalid or malformed rule patterns without throwing errors.
- **High Performance:** Pre-compiles regular expression rules to optimize performance when processing large URL lists.
- **Detailed Results:** Calculates both `cumulative` (for `setTimeout`) and `individual` (for `async/await` loops) delays.

## Installation

```bash
npm install url-delay-calculator
```
*(Note: This is a hypothetical package name for demonstration.)*

## Basic Usage

Here's a simple example of how to use the calculator.

```typescript
import { UrlDelayCalculator, type UrlDelayRule } from './UrlDelayCalculator';

const urls = [
  'https://example.com/page1',
  'https://special-site.com/resourceA',
  'https://example.com/page2',
  'https://special-site.com/resourceB'
];

const rules: UrlDelayRule[] = [
  {
    pattern: 'https://special-site.com/',
    matchType: 'prefix',
    delay: 1000 // Apply a 1-second delay for this site
  }
];

const defaultDelay = 250; // 250ms default delay between URLs

// Apply custom delays from the first match (default behavior)
const results = UrlDelayCalculator.calculateDelays(urls, defaultDelay, rules);

console.log(results);

/*
Output:
[
  { url: '...', delay: { cumulative: 0, individual: 0 } },
  { url: '...', delay: { cumulative: 1000, individual: 1000 } },
  { url: '...', delay: { cumulative: 1250, individual: 250 } },
  { url: '...', delay: { cumulative: 2250, individual: 1000 } }
]
*/
```

## API Reference

### `UrlDelayCalculator.calculateDelays(urls, defaultDelay, customRules, applyFrom)`

Calculates the delay for each URL in a list.

- **`urls: string[]`**: An array of URL strings to process.
- **`defaultDelay: number`**: The default delay in milliseconds to apply between URLs that do not match any custom rule.
- **`customRules?: UrlDelayRule[]`**: (Optional) An array of `UrlDelayRule` objects to apply custom delays.
- **`applyFrom?: number`**: (Optional) The occurrence number from which to start applying custom delays. If `2`, the delay applies from the second match onwards. Defaults to `1` (applies from the first match).<br>_Note: The caller is responsible for determining this value, which could be a fixed application setting or a user-configurable option._
- **Returns**: `UrlDelayCalculationResult[]` - An array of result objects.

### `UrlDelayRule` Interface

Defines a custom rule for applying delays.

```typescript
interface UrlDelayRule {
  /**
   * The pattern to match against URLs. Can be a string or a RegExp object.
   */
  pattern: string | RegExp;

  /**
   * The matching strategy if `pattern` is a string. Ignored for RegExp patterns.
   * - 'prefix': (Default) Matches if the URL starts with the pattern.
   * - 'substring': Matches if the URL contains the pattern.
   * - 'exact': Matches if the URL is identical to the pattern.
   */
  matchType?: 'prefix' | 'substring' | 'exact';

  /**
   * The delay in milliseconds to apply if the pattern matches.
   */
  delay: number;
}
```

### `UrlDelayCalculationResult` Interface

Describes the calculated delay for a single URL.

```typescript
interface UrlDelayCalculationResult {
  /**
   * The original URL.
   */
  url: string;

  /**
   * An object containing delay information.
   */
  delay: {
    /**
     * The cumulative delay from the start of the sequence (in ms).
     * Ideal for use with `setTimeout`.
     */
    cumulative: number;

    /**
     * The individual wait time before processing this specific URL (in ms).
     * Ideal for use in `async/await` loops with a `sleep` function.
     */
    individual: number;
  };
}
```

## Advanced Usage

### Applying Delays from the Second Match Onwards

By setting the `applyFrom` argument, you can configure rules to apply their delay only from the Nth match. This is useful for scenarios like applying a delay only to the second, third, or subsequent occurrences of URLs from the same domain.

```typescript
const urls = [
  'https://x.com/user/1', // 1st match: no custom delay
  'https://example.com/a',
  'https://x.com/user/2', // 2nd match: custom delay applies
  'https://example.com/b',
  'https://x.com/user/3'  // 3rd match: custom delay applies
];

const rules: UrlDelayRule[] = [
  {
    pattern: 'https://x.com',
    matchType: 'prefix',
    delay: 5000, // A 5-second delay
  }
];

// Pass `2` to applyFrom, so delays are applied from the 2nd match.
const results = UrlDelayCalculator.calculateDelays(urls, 250, rules, 2);

/*
Expected individual delays:
- https://x.com/user/1: 0 (first URL in list)
- https://example.com/a: 250
- https://x.com/user/2: 5000 (2nd match, applyFrom: 2 is met)
- https://example.com/b: 250
- https://x.com/user/3: 5000 (3rd match, applyFrom: 2 is met)
*/
```

### Handling Invalid Rules

The calculator is designed to be robust. If an invalid rule pattern is provided (e.g., an empty string or a non-string/non-RegExp type), it will not throw an error. Instead, it will log a warning to the console and treat the rule as if it matches nothing, ensuring your application remains stable.

```typescript
const invalidRules: UrlDelayRule[] = [
  { pattern: '', delay: 1000 }, // Invalid: empty string
  { pattern: null, delay: 1000 } // Invalid: wrong type
];

// This will log warnings to the console but will not crash.
const results = UrlDelayCalculator.calculateDelays(urls, 250, invalidRules);
```

## License

This project is licensed under the [MIT License](../../../../../../../LICENSE.md).
