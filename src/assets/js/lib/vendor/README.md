# Vendor Directory

This directory is intended for external third-party libraries or scripts that are **not** managed by a package manager like npm.

## Usage Rules

- **Do not place files directly in the root of the `vendor` directory.**
- Create a dedicated subdirectory for each library/script.
- For libraries available on npm, use `npm install` and manage them via `package.json` instead of placing them here.
- Document the source, license, and version of any code added.

## Recommended Directory Structure

To maintain clarity and support future updates, organize each library as follows:

```text
vendor/
 └── library-name/
      ├── source/
      │    ├── library-source.zip  # Original archive (If distributed as a compressed file)
      │    ├── library-a.js        # Original source files (If distributed as uncompressed files)
      │    └── LICENSE             # License file (extracted from zip if needed)
      ├── dist/
      │    ├── library-a.js        # Built/ready-to-use files
      │    └── library-a.min.js    # Minified versions (if available)
      └── README.md                # Maintenance notes (Source URL, Version, etc.)
```

### Purpose of library-specific README.md

The `README.md` inside each library folder serves as a maintenance log. It should include:
- **Source URL**: Where the library was downloaded from.
- **Version**: The specific version currently in use.
- **Reason**: Why it is managed manually instead of via npm.
- **Modifications**: Details of any changes made to the original code.
- **Update Procedure**: How to update the library to a newer version.

## License Management

To ensure legal compliance and transparency, follow these two rules for all third-party code:

1. **Dual Documentation (Recommended)**
   - **Local Proof**: Keep the license file in `vendor/library-name/source/LICENSE`. If the license is inside a zip file, **extract it** as a plain text file for better visibility.
   - **Centralized Registry**: Add the library's name, URL, and full license text to the project-wide `THIRD_PARTY_NOTICES.md`.

2. **Why Both?**
   - **Traceability**: Local license files provide immediate context for developers working with the code.
   - **Compliance**: `THIRD_PARTY_NOTICES.md` acts as a single point of truth for external transparency and satisfies the distribution requirements of most open-source licenses.

## Import Example

When using a library in your code, import from its `dist/` directory:

```typescript
import LibraryA from "@/assets/js/lib/vendor/library-name/dist/library-a.min.js";
```