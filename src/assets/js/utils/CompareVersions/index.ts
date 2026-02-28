/**
	@name         CompareVersions
	@description  セマンティックバージョニング形式のバージョン文字列を比較するユーティリティ
	@author       From E
	@lastModified 2026-02-27
	@dependency   none
*/

/**
 * セマンティックバージョニング形式の文字列であることを示す Branded Type
 * この型はコンパイル時にのみ有効で、実行時には通常の `string` として扱う
 */
type SemVerString = string & { readonly __semVerBrand: unique symbol };

type SEMVER_PATTERN = typeof SEMVER_PATTERN;

export type CompareVersionsResult = -1 | 0 | 1;

interface ParsedVersion {
	major     : number;
	minor     : number;
	patch     : number;
	prerelease: (string | number)[];
}

/**
 * セマンティックバージョニングの正規表現 (SemVer 2.0.0 準拠)
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
	// バージョン情報の文字列長の上限を指定
	// Does SemVer have a size limit on the version string? (https://semver.org/#does-semver-have-a-size-limit-on-the-version-string)
	length: 128,

	// ReDoS対策として、簡易的な正規表現で基本的な構造と文字種を検証
	// MAJOR.MINOR.PATCH の後に、オプションでプレリリース部とビルドメタデータ部を許可
	simple: /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/,
	// SemVer 2.0.0 の仕様に準拠した詳細な正規表現
	detail: /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+(?<buildmetadata>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
};

/**
 * セマンティックバージョニング形式に準じた文字列であるか検証
 * @param   {unknown} str
 * @param   {object}  pattern - SEMVER_PATTERN
 * @returns {boolean}
 */
function validSemanticVersionsString(str: unknown, pattern: SEMVER_PATTERN): str is SemVerString {
	const isValidString = (str: string, reg: RegExp): boolean => {
		return reg.test(str);
	};

	// 文字列であるか
	if (!str || typeof str !== "string") {
		console.error("ERROR(string): invalid version string: input must be a string", { str, typeof: typeof str });

		return false;
	}
	// 文字列長の検証
	if (str.length > pattern.length) {
		console.error("ERROR(string): invalid version string: length exceeds maximum allowed", { str, length: str.length, maxLength: pattern.length });

		return false;
	}

	// ReDoS 対策として、簡易的な正規表現で検証
	if (!isValidString(str, pattern.simple)) {
		console.error("ERROR(string): invalid version string: failed basic format check", { str, regex: pattern.simple });

		return false;
	}
	// SemVer 2.0.0 の仕様に準拠した詳細な正規表現で検証
	if (!isValidString(str, pattern.detail)) {
		console.error("ERROR(string): invalid version string: does not conform to semver 2.0.0 specification", { str, regex: pattern.detail });

		return false;
	}

	return true;
}

function parseVersion(version: SemVerString): ParsedVersion {
	const buildMetadataIndex = version.indexOf("+");
	const mainVersion        = buildMetadataIndex !== -1 ? version.substring(0, buildMetadataIndex) : version;

	const prereleaseIndex = mainVersion.indexOf("-");
	const versionParts    = prereleaseIndex !== -1 ? mainVersion.substring(0, prereleaseIndex) : mainVersion;
	const prereleaseParts = prereleaseIndex !== -1 ? mainVersion.substring(prereleaseIndex + 1).split(".") : [];

	const parts = versionParts.split(".").map(Number);
	// ここでのisNaNチェックは、正規表現が数値部分を保証しているため、厳密には不要だが、
	// 念のため残しておくことで、将来的な正規表現の変更などにも対応しやすくなる。
	if (parts.some(isNaN) || parts.length !== 3) {
		throw new Error(`Invalid: version string "${version}" does not conform to SemVer format in parseVersion`);
	}

	const prerelease = prereleaseParts.map(part => {
		// 数値として解釈できる場合は数値、そうでない場合は文字列
		return /^\d+$/.test(part) ? Number(part) : part;
	});

	return {
		major     : parts[0],
		minor     : parts[1],
		patch     : parts[2],
		prerelease: prerelease,
	};
};

/**
 * MAJOR.MINOR.PATCH 部分を比較します。
 * @param   {ParsedVersion} parsedBase   - 比較の基準となるパース済みバージョン
 * @param   {ParsedVersion} parsedTarget - 比較対象のパース済みバージョン
 * @returns {number}                     - target が base より小さい場合は -1、等しい場合は 0、大きい場合は 1 を返す
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
 * プレリリース識別子部分を比較
 * @param   {ParsedVersion} parsedBase   - 比較の基準となるパース済みバージョン
 * @param   {ParsedVersion} parsedTarget - 比較対象のパース済みバージョン
 * @returns {number}                     - target が base より小さい場合は -1、等しい場合は 0、大きい場合は 1 を返す
 */
function comparePrerelease(parsedBase: ParsedVersion, parsedTarget: ParsedVersion): CompareVersionsResult {
	// プレリリース識別子がない方が優先度が高い
	if (parsedBase.prerelease.length === 0 && parsedTarget.prerelease.length > 0) {
		return -1; // base はプレリリースなし、target はプレリリースあり -> base の方が優先度が高い
	}
	if (parsedBase.prerelease.length > 0 && parsedTarget.prerelease.length === 0) {
		return 1; // base はプレリリースあり、target はプレリリースなし -> target の方が優先度が高い
	}

	// 両方にプレリリース識別子がある場合
	if (parsedBase.prerelease.length > 0 && parsedTarget.prerelease.length > 0) {
		const len = Math.min(parsedBase.prerelease.length, parsedTarget.prerelease.length);

		for (let i = 0; i < len; i++) {
			const idBase = parsedBase.prerelease[i];
			const idTarget = parsedTarget.prerelease[i];

			if (idBase === idTarget) { continue; }

			const typeBase = typeof idBase;
			const typeTarget = typeof idTarget;

			// 型が異なる場合、数値は文字列より優先度が低い
			if (typeBase !== typeTarget) {
				return typeBase === "number" ? 1 : -1;
			}

			// 型が同じ場合は、それぞれの方法で比較
			if (typeBase === "number") {
				return (idBase as number) > (idTarget as number) ? -1 : 1;
			} else {
				const cmp = (idBase as string).localeCompare(idTarget as string);

				// istanbul ignore else: cmp が 0 の場合はループの先頭で continue されるため、この分岐は到達不能
				if (cmp !== 0) {
					return cmp > 0 ? -1 : 1;
				}
			}
		}

		// 識別子のフィールド数が異なる場合、多い方が優先度が高い
		if (parsedBase.prerelease.length > parsedTarget.prerelease.length) { return -1; }
		if (parsedBase.prerelease.length < parsedTarget.prerelease.length) { return  1; }
	}

	return 0;
}

/**
 * セマンティックバージョニング形式のバージョン文字列からバージョンの大小を比較
 * MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETADATA] 形式をサポートし、
 * プレリリース版の比較ルール（SemVer 2.0.0）に従います。ビルドメタデータは比較に影響しない
 *
 * @param   {string} base   - 比較の基準となるバージョン文字列。SemVer 2.0.0 準拠でない場合、エラーがスローされます。
 * @param   {string} target - 比較対象のバージョン文字列。SemVer 2.0.0 準拠でない場合、エラーがスローされます。
 * @returns {number}        - target が base より小さい場合は -1、等しい場合は 0、大きい場合は 1 を返す
 * @throws  {Error}         - 不正なバージョン文字列が渡された場合にスローする
 */
export function compareVersions(base: unknown, target: unknown): CompareVersionsResult {
	// base と target が、共に SEMVER_PATTERN 準拠であるか検証
	const isValidStringBase   = validSemanticVersionsString(base, SEMVER_PATTERN);
	const isValidStringTarget = validSemanticVersionsString(target, SEMVER_PATTERN);
	const isValidStringBoth   = isValidStringBase && isValidStringTarget;
	if (!isValidStringBoth) {
		throw new Error("Invalid: one or both of the provided version strings are not valid semantic versions in compareVersions");
	}

	const parsedBase   = parseVersion(base);
	const parsedTarget = parseVersion(target);

	const coreVersionComparison = compareMajorMinorPatch(parsedBase, parsedTarget);
	if (coreVersionComparison !== 0) {
		return coreVersionComparison;
	}

	const prereleaseComparison = comparePrerelease(parsedBase, parsedTarget);
	if (prereleaseComparison !== 0) {
		return prereleaseComparison;
	}

	return 0; // 全てが等しい
}