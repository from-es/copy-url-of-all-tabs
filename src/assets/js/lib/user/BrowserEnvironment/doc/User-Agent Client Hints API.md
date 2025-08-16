# User-Agent Client Hints API 解説

*   作成日: 2025年7月21日
*   最終更新日: 2025年7月21日


## 1. 概要

User-Agent Client Hints API は、従来の `User-Agent` 文字列に代わる、プライバシーに配慮した新しいブラウザ識別情報提供の仕組みです。`navigator.userAgentData` オブジェクトを通じて、ブラウザ、プラットフォーム、デバイスに関する情報を選択的に取得できます。

従来の User-Agent 文字列が凍結（固定化）される傾向にある中、この API は特に Windows の詳細なバージョンを識別する上で重要な手段となります。

## 2. `getHighEntropyValues()` による詳細情報の取得

このAPIの中心的な機能が `getHighEntropyValues()` メソッドです。このメソッドは、より詳細な情報（**High-Entropy Value / 高エントロピー値**）を取得するために使用されます。

高エントロピー値は、ユーザーを識別するために利用できる可能性が高い情報であるため、サーバーが `Accept-CH` レスポンスヘッダーで明示的に要求した場合にのみ取得可能です。

```http
Accept-CH: Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List
```

`BrowserEnvironment` ライブラリでは、以下のヒントを要求しています。

```javascript
[ "brands", "platform", "platformVersion", "mobile", "architecture", "bitness", "model", "uaFullVersion", "fullVersionList", "formFactor", "wow64" ]
```

## 3. 主要なHigh-Entropy-Valuesの解説

### 3.1. `brands` と `fullVersionList`

`brands` と `fullVersionList` は、ブラウザのブランドとバージョン情報を含む配列を返します。

- **`brands`**: ブラウザ名とメジャーバージョンが含まれます。
- **`fullVersionList`**: ブラウザ名と完全なバージョン番号が含まれます。

これらの配列には、`"Not;A Brand"` のようなダミーのブランド情報が含まれることがあります。これは、サーバー側が安易に特定のブラウザを弾かないようにするための仕様です。そのため、実際のブラウザ情報を取得する際には、このダミー情報を除外する処理が必要になります。

**`brands` の例:**
```json
[
	{ "brand": "Not)A;Brand", "version": "8" },
	{ "brand": "Chromium", "version": "138" },
	{ "brand": "Google Chrome", "version": "138" }
]
```

**`fullVersionList` の例:**
```json
[
	{ "brand": "Not)A;Brand", "version": "8.0.0.0" },
	{ "brand": "Chromium", "version": "138.0.7204.143" },
	{ "brand": "Google Chrome", "version": "138.0.7204.143" }
]
```

### 3.2. `platformVersion`

`platformVersion` は、OSのバージョンを特定するために使用されます。その形式はOSによって大きく異なります。

| プラットフォーム | `platformVersion` の形式例 | 備考 |
| :--- | :--- | :--- |
| **Windows** | `"15.0.0"` | `UniversalApiContract` のバージョンに基づく。 |
| **macOS** | `"14.5.0"` | `X.Y.Z` 形式。 |
| **Android** | `"14"` | メジャーリリース番号のみ。 |
| **iOS** | `"17.5.1"` | 詳細なOSバージョン。 |
| **Linux** | `""` | 常に空文字列。 |

#### Windows の `platformVersion` とバージョンの対応

Windows の `platformVersion` は、OSのビルド番号ではなく、**`Windows.Foundation.UniversalApiContract`** のバージョンに対応しています。

| `platformVersion` (メジャー) | Windows バージョン |
| :--- | :--- |
| `0` | Windows 7 / 8 / 8.1 |
| `1` | Windows 10 (1507) |
| `2` | Windows 10 (1511) |
| `3` | Windows 10 (1607) |
| `4` | Windows 10 (1703) |
| `5` | Windows 10 (1709) |
| `6` | Windows 10 (1803) |
| `7` | Windows 10 (1809) |
| `8` | Windows 10 (1903 / 1909) |
| `10` | Windows 10 (2004 / 20H2 / 21H1 / 21H2) |
| `13` | Windows 11 (初期リリースプレビュー) |
| `14` | Windows 11 (21H2) |
| `15` | Windows 11 (22H2 / 23H2) |
| `19` | Windows 11 (24H2) |

*注意: `9`, `11`, `12`, `16-18` 等のバージョンは、公式には特定のWindowsリリースに割り当てられていません。*

### 3.3. その他の情報

`getHighEntropyValues` からは、他にも以下の情報が取得できます。

- **`mobile`**: モバイルデバイスかどうか (boolean)
- **`platform`**: オペレーティングシステム名 (例: `"Windows"`)
- **`architecture`**: CPUアーキテクチャ (例: `"x86"`, `"x64"`)
- **`bitness`**: CPUのビット数 (例: `"32"`, `"64"`)
- **`model`**: デバイスのモデル名 (例: `"Nexus 7"`, `"iPhone"`)
- **`uaFullVersion`**: 完全なバージョン番号（**非推奨**）

## 4. 実装例 (JavaScript)

以下に、`platformVersion` を用いて Windows のバージョンを判定する JavaScript の実装例を示します。

```javascript
/*
 * User-Agent Client Hints の platformVersion 文字列から
 * OSのバージョン名を取得します。
 *
 * @returns {Promise<string|null>} 判定されたOSのバージョン名、またはnullを返す
 */
async function getOsVersionName() {
	const userAgentData = globalThis?.navigator?.userAgentData;

	if (!userAgentData) {
		console.log("User-Agent Client Hints is not supported.");
		return null;
	}

	// OSごとのバージョン名解決ロジックを格納するマッピング
	const osVersionMap = {
		"windows": (version) => {
			const majorVersion = parseInt(version.split('.')[0], 10);
			const mapping = {
				0: "Windows 7/8/8.1",
				1: "Windows 10 (1507)",
				2: "Windows 10 (1511)",
				3: "Windows 10 (1607)",
				4: "Windows 10 (1703)",
				5: "Windows 10 (1709)",
				6: "Windows 10 (1803)",
				7: "Windows 10 (1809)",
				8: "Windows 10 (1903/1909)",
				10: "Windows 10 (2004/20H2/21H1/21H2)",
				13: "Windows 11 (Initial Preview)",
				14: "Windows 11 (21H2)",
				15: "Windows 11 (22H2/23H2)",
				19: "Windows 11 (24H2)",
			};
			return Object.hasOwn(mapping, majorVersion) ? mapping[majorVersion] : `Windows (Unknown Version ${version})`;
		},
		"macos"  : (version) => `macOS ${version}`,
		"android": (version) => `Android ${version}`,
		"ios"    : (version) => `iOS ${version}`,
		"linux"  : () => "Linux",
	};

	try {
		const platform = userAgentData.platform.toLowerCase();

		// platformVersionは高エントロピー値のため、サーバーからの許可が必要
		const highEntropyValues = await userAgentData.getHighEntropyValues(["platformVersion"]);
		const platformVersion   = highEntropyValues.platformVersion;

		if (!platformVersion && platform !== 'linux') {
			console.log(`Could not retrieve platformVersion for ${platform}.`);
			return platform;  // Just return the platform name if version is unavailable
		}

		if (Object.hasOwn(osVersionMap, platform)) {
			const resolver    = osVersionMap[platform];
			const versionName = resolver(platformVersion);
			console.log(`Detected: ${versionName} (Platform: ${platform}, Version: ${platformVersion})`);
			return versionName;
		} else {
			console.log(`Unknown platform: ${platform}`);
			return `${userAgentData.platform} (Unknown)`;
		}
	} catch (error) {
		console.error("Error getting high entropy values:", error);
		return null;
	}
}

// 実行例
getOsVersionName();
```

## 5. 注意点と課題

- **サーバーサイドの対応:** 高エントロピー値を取得するには、サーバーが `Accept-CH` ヘッダーを送信し、クライアントに値の送信を許可する必要がある。
- **ブラウザの互換性:** User-Agent Client Hints は、主に Chromium ベースのブラウザ（Google Chrome, Microsoft Edgeなど）でサポートされている。Firefoxなど、他のブラウザでは利用できない場合がある。
- **情報の粒度:** `platformVersion` のメジャーバージョンは、必ずしもOSのマイナーアップデートやセキュリティパッチの適用状況を反映するものではない。より詳細な識別には、ビルド番号を含む完全なバージョン文字列 (`fullVersionList` など) の利用を検討する必要がある。

## 6. 参考文献

- [Microsoft Learn: Detect Windows 11 using User-Agent Client Hints](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/how-to-detect-win11)
- [MDN Web Docs: Navigator.userAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
- [MDN Web Docs: NavigatorUAData.getHighEntropyValues()](https://developer.mozilla.org/ja/docs/Web/API/NavigatorUAData/getHighEntropyValues)
- [User-Agent Client Hints - WICG](https://wicg.github.io/ua-client-hints/#browser-os-experiments-use-case)
- [Yauaa - User-Agent Client Hints](https://yauaa.basjes.nl/using/clienthints/)
- [Releases, Windows NT - Wikipedia](https://en.wikipedia.org/wiki/Windows_NT#Releases "Releases, Windows NT - Wikipedia")
