## Migration Rules Definition

This document outlines the operational rules for defining migration rules within the system.

```
{
	// Rule description, not used in processing
	rules: {
		author : "Author of the rule",
		reason : "Why this rule is applied",
		target : "Target object for evaluation",
		action : "What to change and how",
		created: "Creation date   e.x. 2025/07/12",
		expires: "Expiration requirement e.x. 2025/12/31 or Until upgrade to v2.x.y" // Manually delete the rule during an update after the specified date, one year from the release, or upon reaching an arbitrary version
	},

	// Used in processing
	condition: (argument) => { ... }, // argument = { config, define }, return value is boolean
	execute  : (argument) => { ... }  // argument = { config, define }, return object is config
}
```
