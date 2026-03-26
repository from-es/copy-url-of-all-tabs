/**
 * Utility for comparing version strings in Semantic Versioning format.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-24
 */

/**
 * Branded Type indicating a string in Semantic Versioning format.
 * This type is only effective at compile-time and is treated as a regular `string` at runtime.
 */
type SemVerString = string & { readonly __semVerBrand: unique symbol };

type SEMVER_PATTERN = typeof SEMVER_PATTERN;

type CompareVersionsResult = -1 | 0 | 1;

interface ParsedVersion {
	major: number;
	minor: number;
	patch: number;
	prerelease: (string | number)[];
}



/**
 * Regular expression for Semantic Versioning (SemVer 2.0.0 compliant)
 *
 * @see https://semver.org/#spec-item-2
 * @example
 *   "1.0.0"
 *   "1.0.0-alpha"
 *   "1.0.0-alpha.1"
 *   "1.0.0-0.3.7"
 *   "1.0.0-x.7.z.92"
 *   "1.0.0+build123"
 *   "1.0.0-alpha+001.build.1"
 *   "1.0.0-beta+exp.sha.5114f85"
 *   "1.0.0-rc.1+build.123"
 */
const SEMVER_PATTERN = {
	// Specify the maximum length of the version info string
	// Does SemVer have a size limit on the version string? (https://semver.org/#does-semver-have-a-size-limit-on-the-version-string)
	length: 128,

	// As a countermeasure against ReDoS, validate basic structure and character types with a simple regular expression
	// MAJOR.MINOR.PATCH followed by optional prerelease and build metadata parts
	simple: /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/,
	// Detailed regular expression compliant with SemVer 2.0.0 specification
	detail: /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+(?<buildmetadata>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
};

/**
 * Validates whether a string conforms to the Semantic Versioning format.
 *
 * @param   {unknown}        str     - The version string to validate
 * @param   {SEMVER_PATTERN} pattern - The SEMVER_PATTERN to use for validation
 * @returns {boolean}                  true if the string is compliant with Semantic Versioning format, otherwise false
 */
function validSemanticVersionsString(str: unknown, pattern: SEMVER_PATTERN): str is SemVerString {
	const isValidString = (str: string, reg: RegExp): boolean => {
		return reg.test(str);
	};

	// Check if it is a string
	if (!str || typeof str !== "string") {
		console.error("ERROR(string): invalid version string: input must be a string", { str, typeof: typeof str });

		return false;
	}
	// Validate string length
	if (str.length > pattern.length) {
		console.error("ERROR(string): invalid version string: length exceeds maximum allowed", { str, length: str.length, maxLength: pattern.length });

		return false;
	}

	// Validate with a simple regular expression as a countermeasure against ReDoS
	if (!isValidString(str, pattern.simple)) {
		console.error("ERROR(string): invalid version string: failed basic format check", { str, regex: pattern.simple });

		return false;
	}
	// Validate with a detailed regular expression compliant with SemVer 2.0.0 specification
	if (!isValidString(str, pattern.detail)) {
		console.error("ERROR(string): invalid version string: does not conform to semver 2.0.0 specification", { str, regex: pattern.detail });

		return false;
	}

	return true;
}

/**
 * Parses a string in Semantic Versioning format and generates an object that holds the values for each section.
 *
 * @param   {SemVerString} version - The version string to parse
 * @returns {ParsedVersion}          A parsed version object
 * @throws  {Error}                  Throws if the format is invalid
 */
function parseVersion(version: SemVerString): ParsedVersion {
	const buildMetadataIndex = version.indexOf("+");
	const mainVersion = buildMetadataIndex !== -1 ? version.substring(0, buildMetadataIndex) : version;

	const prereleaseIndex = mainVersion.indexOf("-");
	const versionParts = prereleaseIndex !== -1 ? mainVersion.substring(0, prereleaseIndex) : mainVersion;
	const prereleaseParts = prereleaseIndex !== -1 ? mainVersion.substring(prereleaseIndex + 1).split(".") : [];

	const parts = versionParts.split(".").map(Number);
	// The isNaN check here is strictly unnecessary because the regular expression guarantees
	// the numeric parts, but keeping it ensures stability for future changes in the regular Expression.
	if (parts.some(isNaN) || parts.length !== 3) {
		throw new Error(`Invalid: version string "${version}" does not conform to SemVer format in parseVersion`);
	}

	const prerelease = prereleaseParts.map(part => {
		// Numeric if it can be interpreted as a number, string otherwise
		return /^\d+$/.test(part) ? Number(part) : part;
	});

	return {
		major: parts[0],
		minor: parts[1],
		patch: parts[2],
		prerelease: prerelease,
	};
};

/**
 * Compares the MAJOR.MINOR.PATCH sections.
 *
 * @param   {ParsedVersion} parsedBase   - The parsed version to serve as the baseline for comparison
 * @param   {ParsedVersion} parsedTarget - The parsed version to be compared
 * @returns {number}                       Returns -1 if target is less than base, 0 if equal, and 1 if target is greater than base
 */
function compareMajorMinorPatch(parsedBase: ParsedVersion, parsedTarget: ParsedVersion): CompareVersionsResult {
	if (parsedBase.major > parsedTarget.major) { return -1; }
	if (parsedBase.major < parsedTarget.major) { return  1; }

	if (parsedBase.minor > parsedTarget.minor) { return -1; }
	if (parsedBase.minor < parsedTarget.minor) { return  1; }

	if (parsedBase.patch > parsedTarget.patch) { return -1; }
	if (parsedBase.patch < parsedTarget.patch) { return  1; }

	return 0;
}

/**
 * Compares the prerelease identifier sections.
 *
 * @param   {ParsedVersion} parsedBase   - The parsed version to serve as the baseline for comparison
 * @param   {ParsedVersion} parsedTarget - The parsed version to be compared
 * @returns {number}                       Returns -1 if target is less than base, 0 if equal, and 1 if target is greater than base
 */
function comparePrerelease(parsedBase: ParsedVersion, parsedTarget: ParsedVersion): CompareVersionsResult {
	// Versions without prerelease identifiers have higher precedence
	if (parsedBase.prerelease.length === 0 && parsedTarget.prerelease.length > 0) {
		return -1; // base has no prerelease, target has prerelease -> base has higher precedence
	}
	if (parsedBase.prerelease.length > 0 && parsedTarget.prerelease.length === 0) {
		return 1; // base has prerelease, target has no prerelease -> target has higher precedence
	}

	// If both have prerelease identifiers
	if (parsedBase.prerelease.length > 0 && parsedTarget.prerelease.length > 0) {
		const len = Math.min(parsedBase.prerelease.length, parsedTarget.prerelease.length);

		for (let i = 0; i < len; i++) {
			const idBase = parsedBase.prerelease[i];
			const idTarget = parsedTarget.prerelease[i];

			if (idBase === idTarget) { continue; }

			const typeBase = typeof idBase;
			const typeTarget = typeof idTarget;

			// If types differ, numeric identifiers have lower precedence than string identifiers
			if (typeBase !== typeTarget) {
				return typeBase === "number" ? 1 : -1;
			}

			// If types are the same, compare them using their respective methods
			if (typeBase === "number") {
				return (idBase as number) > (idTarget as number) ? -1 : 1;
			} else {
				const cmp = (idBase as string).localeCompare(idTarget as string);

				// istanbul ignore else: reaching this branch is impossible as cmp = 0 is handled at the loop start
				if (cmp !== 0) {
					return cmp > 0 ? -1 : 1;
				}
			}
		}

		// If identifiers differ in length, the one with more fields has higher precedence
		if (parsedBase.prerelease.length > parsedTarget.prerelease.length) { return -1; }
		if (parsedBase.prerelease.length < parsedTarget.prerelease.length) { return 1; }
	}

	return 0;
}

/**
 * Compares two version strings in Semantic Versioning format to determine their relative order.
 * Supports MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETADATA] format and follows the comparison rules for prerelease versions (SemVer 2.0.0).
 * Build metadata is ignored for comparison purposes.
 *
 * @param   {string} base   - The version string to serve as the baseline for comparison. Throws an error if not SemVer 2.0.0 compliant
 * @param   {string} target - The version string to be compared. Throws an error if not SemVer 2.0.0 compliant
 * @returns {number}          Returns -1 if target is less than base, 0 if equal, and 1 if target is greater than base
 * @throws  {Error}           Thrown if an invalid version string is provided
 */
function compareVersions(base: unknown, target: unknown): CompareVersionsResult {
	// Validate that both base and target are compliant with SEMVER_PATTERN
	const isValidStringBase = validSemanticVersionsString(base, SEMVER_PATTERN);
	const isValidStringTarget = validSemanticVersionsString(target, SEMVER_PATTERN);
	const isValidStringBoth = isValidStringBase && isValidStringTarget;
	if (!isValidStringBoth) {
		throw new Error("Invalid: one or both of the provided version strings are not valid semantic versions in compareVersions");
	}

	const parsedBase = parseVersion(base);
	const parsedTarget = parseVersion(target);

	const coreVersionComparison = compareMajorMinorPatch(parsedBase, parsedTarget);
	if (coreVersionComparison !== 0) {
		return coreVersionComparison;
	}

	const prereleaseComparison = comparePrerelease(parsedBase, parsedTarget);
	if (prereleaseComparison !== 0) {
		return prereleaseComparison;
	}

	return 0; // All are equal
}



export {
	compareVersions
};
export type {
	CompareVersionsResult
};