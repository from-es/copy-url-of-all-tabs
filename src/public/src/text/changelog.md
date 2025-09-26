#### [1.3.1] - 2025/09/26

- fix
	- Fixed an issue where notification messages did not scale correctly with the browser's font size settings.

#### [1.3.0] - 2025/09/22

- feat
	- Improved the logic and reliability of pop-up messages.
- change
	- Changed the minimum required Firefox version to 127.

#### [1.2.0] - 2025/09/20

- feat
	- Added support for Firefox Add-ons.
	- Enhanced security by sanitizing HTML content to prevent potential XSS vulnerabilities.

#### [1.1.2] - 2025/09/13

- clean
	- Improved the layout of the `changelog page` for better readability.

#### [1.1.1] - 2025/09/06

- fix
	- Fixed various code style issues identified by ESLint.
- clean
	- Improved and refactored internal code for better stability and maintenance.

#### [1.1.0] - 2025/09/04

- feat
	- The font size setting from the options page is now applied to the `changelog page`.
- clean
	- Refactored the `changelog script` for better performance, including improved error handling and more efficient DOM manipulation.
	- Refactored `StorageManager` to unify error handling, improving code stability and maintenance.

#### [1.0.5] - 2025/08/30

- clean
	- Improved and refactored internal code for better stability and maintenance.

#### [1.0.4] - 2025/08/26

- fix
	- Fixed various code style issues identified by ESLint.
	- Corrected the tooltip text for the support link on the options page.

#### [1.0.3] - 2025/08/26

- fix
	- Fixed various code style issues identified by ESLint.

#### [1.0.2] - 2025/08/23

- improve
	- Improved the validation message display when entering numbers on the options page.
- clean
	- Improved internal processing for better performance and stability.

#### [1.0.1] - 2025/08/19

- fix
	- Fixed an issue where the extension incorrectly overrode the default Chrome history page (`chrome://history`)

#### [1.0.0] - 2025/08/16

- release
	- All initially planned core features have been implemented
	- Future releases will follow [Semantic Versioning](https://semver.org/)

#### [0.9.0] - 2025/08/05

- add
	- The interval between opening tabs can now be specified for each URL (when opening the URL for the second time or later), instead of being fixed to the delay value specified in the options

#### [0.8.3] - 2025/07/12

- fix
	- Improve URL extraction accuracy from clipboard

#### [0.8.2] - 2025/07/12

- fix
	- Corrected a typo in the `mimetype` property of the `config.Format` object
	- Fixed "Migrate settings" process not passing when importing settings

#### [0.8.1.10] - 2025/07/09

- clean
	- Refactoring, Centralize "deep copy" processing, structuredClone & cloneDeep (lodash)
- replace
	- Replace "normalize.css" with "modern-normalize.css"
- update
	- Fixed a word warning in Visual Studio Code
		- ``project/README.md``
		- ``project/material/Chrome Web Store/doc/Overview.md``

#### [0.8.1.9] - 2025/07/07

- clean
	- Improved accessibility in pop-up menus
		- ``project/src/entrypoints/popup/svelte/App.svelte``
		- ``project/src/entrypoints/popup/css/popup.css``

#### [0.8.1.8] - 2025/07/04

- clean
	- Change button elements to display using snippet (``project/src/entrypoints/popup/svelte/App.svelte``)
	- Refactoring, Split App.svelte  (``project/src/entrypoints/popup/svelte/App.svelte``)
		- Create a store for state management
		- Separate business logic from the component
- update
	- update documentation in options page (typo & improve wording)

#### [0.8.1.7] - 2025/06/30

- clean
	- Refactor to centralize console output logic (``project/src/entrypoints/popup/js/FormatManager.mjs``)
	- Refactoring App.svelte (``project/src/entrypoints/popup/svelte/App.svelte``)
		- Migrate state management logic to store
		- UI display logic managed in derived store
			- Display loading status
			- Disable buttons during processing
		- Improved error handling
- fix
	- Fixed typos in messages (``project/src/entrypoints/popup/js/FormatManager.mjs``)
- ESLint
	- Disabled the "svelte/no-at-html-tags" error found in ESLint

#### [0.8.1.6] - 2025/06/22

- fix
	- Fixed "quotes" of items found in ESLint
	- Fixed "space-infix-ops" of items found in ESLint
	- Fixed "comma-spacing" of items found in ESLint

#### [0.8.1.5] - 2025/06/07

- clean
	- Optimizing array operations (https://github.com/from-es/copy-url-of-all-tabs/commit/c44c3bcb7145e1668c4650b1134ad19220bb25a2)
	- Optimizing array operations (https://github.com/from-es/copy-url-of-all-tabs/commit/db3c365f9e033fa6980fe389e0cea97359b5d56b)
	- Optimizing array operations (https://github.com/from-es/copy-url-of-all-tabs/commit/fccf39819b48924df631765eac0d4e6636738858)
- fix
	- Fixed "quotes" of items found in ESLint ``FormatManager.mjs``

#### [0.8.1.4] - 2025/06/05

- clean
	- Optimizing the filtering process (https://github.com/from-es/copy-url-of-all-tabs/commit/08f3a6259a4f84fc45a2c56649a6ee1956398910)
	- Optimizing array difference calculations (https://github.com/from-es/copy-url-of-all-tabs/commit/cc37ff3e34ea9b3252426819f92cf3bc0ebd7412)

#### [0.8.1.3] - 2025/05/31

- fix
	- Fixed items found in ESLint
- update
	- Update **Marked** v15.0.8 to v15.0.12

#### [0.8.1.2] - 2025/04/18

- fix
	- Fixed typo in source code
	- Fixed items found in ESLint

#### [0.8.1.1] - 2025/04/17

- add
	- Install ESLint for Svelte. eslint-plugin-svelte (https://sveltejs.github.io/eslint-plugin-svelte/)

#### [0.8.1] - 2025/04/17

- fix
	- Open external links in the page of "Update History" in a new tab
- update
	- Update **Marked** v14.1.2 to v15.0.8

#### [0.8.0] - 2025/04/14

- change
	- Changes to the directory structure
		- Change the path from ``project/src/src`` to ``project/src/assets``
	- Change import path specification to using aliases (https://wxt.dev/api/reference/wxt/interfaces/InlineConfig.html#alias).
- upgrade
	- Upgrade WXT v0.19.0 to v0.20.0

#### [0.7.0] - 2025/01/29

- add
	- URL filtering options can now be applied separately for Copy and Paste.
- fix
	- Fixed "Version Information" validation.

#### [0.6.1.1] - 2025/01/20

- upgrade
	- Migrated the UI framework used in the options from Svelte 4 to 5.

#### [0.6.1] - 2024/12/12

- clean
	- The HTML structure of the pop-up menu has been changed.

#### [0.6.0] - 2024/11/01

- release
	- Publish in the Chrome Web Store