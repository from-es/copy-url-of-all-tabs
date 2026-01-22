// Import NPM Package
import ColorString from "color-string";



// Defines the signature (name, arguments, return type) of fields and methods that a class should implement.
interface ColorManager {
	// eslint-disable-next-line no-unused-vars
	isValidColor(color: string): boolean;
}

// This class is responsible for handling the implementation differences arising from external libraries.
class Implementation implements ColorManager {
	/**
	 * Determines whether a given string represents a valid color.
	 *
	 * Uses the project's internal getColorString parser to check if the input
	 * can be interpreted as a color. Accepts any format recognized by
	 * getColorString (e.g., named colors, hex, rgb/rgba, hsl/hsla, etc.).
	 *
	 * @param   {string}  color - The input string to validate as a color.
	 * @returns {boolean}       - True if the string can be parsed as a color by getColorString; otherwise false.
	 */
	isValidColor(color: string): boolean {
		return !!ColorString.get(color);
	}
}



// Export as a singleton instance.
export const ColorManager = new Implementation();