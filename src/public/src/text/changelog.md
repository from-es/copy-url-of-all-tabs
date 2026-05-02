# Changelog

All notable changes to this project will be documented in this file.

- The format is based on [Keep a Changelog](https://keepachangelog.com/).
- This project adheres to [Semantic Versioning](https://semver.org/).

## [1.20.9] - 2026-04-22

### Changed

- Internal code improvements to enhance extension stability and maintainability.

## [1.20.8] - 2026-04-09

### Changed

- Internal code improvements to enhance extension stability and maintainability.

## [1.20.7] - 2026-04-06

### Changed

- Internal code improvements to enhance extension stability and maintainability.

## [1.20.6] - 2026-04-04

### Changed

- Internal code improvements to enhance extension stability and maintainability.
- Added explanatory notes for the "Custom Delay" setting on the options page.

## [1.20.5] - 2026-03-28

### Changed

- Improved extension descriptions on the options page for better clarity.

## [1.20.4] - 2026-03-26

### Changed

- Internal code improvements to enhance extension stability and maintainability.
- Improved extension description for better clarity in the browser extension store.

## [1.20.3] - 2026-03-13

### Changed

- Internal code improvements to enhance extension stability and maintainability.

## [1.20.2] - 2026-03-05

### Changed

- Internal code improvements to enhance extension stability and maintainability.

## [1.20.1] - 2026-02-28

### Changed

- Standardized internal logging processes to enhance extension stability and facilitate troubleshooting.

## [1.20.0] - 2026-02-06

### Added

- Enhanced debug settings on the options page, including more granular control over log levels and timestamp configurations.

### Fixed

- Addressed layout issues on the options page that occurred when resizing the window.

## [1.19.1] - 2026-01-24

### Fixed

- Fixed a minor issue in the numeric input fields to improve stability.

### Changed

- Improved internal logic to prevent potential memory leaks, enhancing overall performance and stability.

## [1.19.0] - 2026-01-23

### Changed

- Improved the stability of the initial setup process after installation.

## [1.18.0] - 2026-01-16

### Added

- Added a feature to enable or disable individual items in the custom delay list on the options page.

## [1.17.0] - 2026-01-03

### Changed

- The internal architecture has been significantly updated to improve performance and stability.

## [1.16.1] - 2025-12-26

### Changed

- Refactored and optimized internal components.

## [1.16.0] - 2025-12-21

### Added

- Updated core dependencies, build tools, and development tools to the latest versions.

### Fixed

- Removed redundant internal dependencies.

## [1.15.3] - 2025-12-21

### Fixed

- Standardized all warning messages on the options page to English.

## [1.15.2] - 2025-12-19

### Fixed

- Fixed a bug that could cause a validation warning to be displayed on the options page after resetting and then saving the settings.

## [1.15.1] - 2025-12-15

### Fixed

- Fixed a bug on the options page that could prevent URL pattern matching settings from being applied correctly.
- Corrected an error in the user guide's description of the URL pattern matching rules.

## [1.15.0] - 2025-12-11

### Added

- Enhanced URL filtering with pattern matching capabilities. This includes prefix, substring, and exact matches, as well as a regex mode for advanced filtering.

### Fixed

- Improved URL parsing to correctly handle URLs from the clipboard that contain underscores in the hostname.

### Changed

- Refactored and optimized internal components for better performance and maintainability.

## [1.14.0] - 2025-12-06

### Added

- When saving, if invalid values are found in the settings, a notification will now specify which fields need correction.

### Changed

- Enhanced the validation process on the Options screen when saving settings.

## [1.13.0] - 2025-11-25

### Added

- Added validation for badge color format to ensure valid CSS color values.
- Improved the clarity of explanatory texts on the options screen.

### Changed

- Internal code has been refactored for better performance and maintainability.

## [1.12.0] - 2025-11-10

### Added

- Added a badge feature to display the number of URLs waiting to be opened on the extension icon.

### Fixed

- Fixed an issue where importing a settings file would save the settings immediately, instead of waiting for the user to press the "Save" button.

## [1.11.0] - 2025-11-07

### Added

- Added an option to exclude duplicate URLs from being copied.

### Fixed

- Fixed an issue where tabs were not opened in the correct order when using the 'prepend' mode to open URLs.

## [1.10.0] - 2025-10-28

### Added

- Improved the responsiveness and stability of numeric input fields on the options page.

### Fixed

- Fixed an issue where the placeholder text for the custom delay setting on the options page was incorrect.

### Changed

- Refactored UI components on the options page for better performance and maintainability.

## [1.9.0] - 2025-10-24

### Changed

- Optimized the internal settings update process to improve extension efficiency and reliability.

## [1.8.0] - 2025-10-20

### Added

- Added "Task Control" options to the options page. You can now fine-tune how multiple tabs are processed, such as the processing unit and the execution order.

### Changed

- Significantly improved the stability and performance when opening a large number of tabs by introducing a new queueing system.

## [1.7.0] - 2025-10-16

### Changed

- Improved the stability and robustness of the extension.

## [1.6.0] - 2025-10-13

### Added

- Internal system improvements for enhanced stability.
- Improved input validation on the options page.

### Fixed

- Fixed a minor spelling error.

## [1.5.0] - 2025-10-08

### Fixed

- Fixed an issue where custom delay settings were not saved or applied correctly.

## [1.4.0] - 2025-10-04

### Added

- The settings import/export functionality has been refactored and improved for better stability and maintainability.

## [1.3.1] - 2025-09-26

### Fixed

- Fixed an issue where notification messages did not scale correctly with the browser's font size settings.

## [1.3.0] - 2025-09-22

### Added

- Improved the logic and reliability of pop-up messages.

### Changed

- Changed the minimum required Firefox version to 127.

## [1.2.0] - 2025-09-20

### Added

- Added support for Firefox Add-ons.
- Enhanced security by sanitizing HTML content to prevent potential XSS vulnerabilities.

## [1.1.2] - 2025-09-13

### Changed

- Improved the layout of the update history page for better readability.

## [1.1.1] - 2025-09-06

### Fixed

- Fixed various internal code style issues.

### Changed

- Improved and refactored internal code for better stability and maintenance.

## [1.1.0] - 2025-09-04

### Added

- The font size setting from the options page is now applied to the update history page.

### Changed

- Refactored the update history page logic for better performance and error handling.
- Improved internal data management to enhance code stability.

## [1.0.5] - 2025-08-30

### Changed

- Improved and refactored internal code for better stability and maintenance.

## [1.0.4] - 2025-08-26

### Fixed

- Fixed various internal code style issues.
- Corrected the tooltip text for the support link on the options page.

## [1.0.3] - 2025-08-26

### Fixed

- Fixed various internal code style issues.

## [1.0.2] - 2025-08-23

### Changed

- Improved the validation message display when entering numbers on the options page.
- Improved internal processing for better performance and stability.

## [1.0.1] - 2025-08-19

### Fixed

- Fixed an issue where the extension incorrectly overrode the default browser history page.

## [1.0.0] - 2025-08-16

### Added

- All initially planned core features have been implemented.
- Future releases will follow Semantic Versioning.

## [0.9.0] - 2025-08-05

### Added

- The interval between opening tabs can now be specified for each URL individually.

## [0.8.3] - 2025-07-12

### Fixed

- Improved URL extraction accuracy from the clipboard.

## [0.8.2] - 2025-07-12

### Fixed

- Corrected an internal configuration error related to file formats.
- Fixed an issue during the settings migration process when importing settings.

## [0.8.1.10] - 2025-07-09

### Changed

- Improved internal data cloning processes for better reliability.
- Switched to a more modern CSS reset for improved cross-browser consistency.
- Updated project documentation.

## [0.8.1.9] - 2025-07-07

### Changed

- Improved accessibility in pop-up menus.

## [0.8.1.8] - 2025-07-04

### Changed

- Improved internal UI component structure for better maintainability.
- Refactored state management to separate business logic from the UI.
- Updated documentation on the options page for better clarity.

## [0.8.1.7] - 2025-06-30

### Changed

- Standardized internal logging and output logic.
- Migrated state management logic to a more robust system.
- Improved error handling during user interactions.

### Fixed

- Fixed typos in notification messages.

## [0.8.1.6] - 2025-06-22

### Fixed

- Fixed various internal code formatting and style issues.

## [0.8.1.5] - 2025-06-07

### Changed

- Optimized internal data operations for better performance ([commit c44c3bc](https://github.com/from-es/copy-url-of-all-tabs/commit/c44c3bcb7145e1668c4650b1134ad19220bb25a2)).
- Optimized internal data operations ([commit db3c365](https://github.com/from-es/copy-url-of-all-tabs/commit/db3c365f9e033fa6980fe389e0cea97359b5d56b)).
- Optimized internal data operations ([commit fccf398](https://github.com/from-es/copy-url-of-all-tabs/commit/fccf39819b48924df631765eac0d4e6636738858)).

## [0.8.1.4] - 2025-06-05

### Changed

- Optimized internal filtering and data calculation processes.

## [0.8.1.3] - 2025-05-31

### Changed

- Updated core parsing libraries to the latest version.

## [0.8.1.2] - 2025-04-18

### Fixed

- Fixed minor typos and code style issues.

## [0.8.1.1] - 2025-04-17

### Added

- Enhanced internal code quality checks.

## [0.8.1] - 2025-04-17

### Fixed

- External links in the update history page now correctly open in a new tab.

### Changed

- Updated core parsing libraries.

## [0.8.0] - 2025-04-14

### Changed

- Internal directory structure reorganization for better project management.
- Modernized the internal build system.

## [0.7.0] - 2025-01-29

### Added

- URL filtering options can now be applied separately for Copy and Paste actions.

### Fixed

- Fixed validation logic for version information.

## [0.6.1.1] - 2025-01-20

### Changed

- Updated the internal UI framework for the options page.

## [0.6.1] - 2024-12-12

### Changed

- Improved the internal layout of the pop-up menu.

## [0.6.0] - 2024-11-01

### Added

- Initial release on the browser extension store.
