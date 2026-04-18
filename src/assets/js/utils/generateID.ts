/**
 * Generates a cryptographically secure random ID based on the specified number of digits and character types.
 *
 * @file
 * @lastModified 2026-04-18
 */

interface CharacterOptions {
	number  ?: boolean;
	alphabet?: {
		uppercase?: boolean;
		lowercase?: boolean;
	};
	symbol?: boolean;
}



/**
 * Validates the arguments passed to the generateID function.
 *
 * @remarks
 * Both parameters are typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param   {unknown}    digit     - The number of digits for the generated ID
 * @param   {unknown}    character - Options specifying the types of characters to use
 * @returns {void}
 * @throws  {TypeError}              Thrown if any argument is of an invalid type
 * @throws  {RangeError}             Thrown if the digit is out of legal range
 */
function validateArguments(digit: unknown, character: unknown): void {
	if (typeof digit !== "number" || !Number.isInteger(digit)) {
		throw new TypeError(`Invalid argument 'digit': an integer is required, but ${typeof digit} was provided.`);
	}

	if (digit > Number.MAX_SAFE_INTEGER || digit <= 0) {
		throw new RangeError(`Invalid argument 'digit': must be within the range 1 to ${Number.MAX_SAFE_INTEGER}, but ${digit} was provided.`);
	}

	if (!character || typeof character !== "object") {
		throw new TypeError(`Invalid argument 'character': an object is required, but ${typeof character} was provided.`);
	}

	// Use a type-safe cast after verifying it's an object to check properties.
	const options = character as CharacterOptions;

	const hasAtLeastOneType = !!(
		options.number ||
		options.alphabet?.uppercase ||
		options.alphabet?.lowercase ||
		options.symbol
	);
	if (!hasAtLeastOneType) {
		throw new TypeError("Invalid argument 'character': at least one character type must be enabled.");
	}

	if (options.number !== undefined && typeof options.number !== "boolean") {
		throw new TypeError(`Invalid argument 'character.number': a boolean is required, but ${typeof options.number} was provided.`);
	}

	if (options.alphabet !== undefined) {
		if (typeof options.alphabet !== "object" || options.alphabet === null) {
			throw new TypeError(`Invalid argument 'character.alphabet': an object is required, but ${typeof options.alphabet} was provided.`);
		}
		if (options.alphabet.uppercase !== undefined && typeof options.alphabet.uppercase !== "boolean") {
			throw new TypeError(`Invalid argument 'character.alphabet.uppercase': a boolean is required, but ${typeof options.alphabet.uppercase} was provided.`);
		}
		if (options.alphabet.lowercase !== undefined && typeof options.alphabet.lowercase !== "boolean") {
			throw new TypeError(`Invalid argument 'character.alphabet.lowercase': a boolean is required, but ${typeof options.alphabet.lowercase} was provided.`);
		}
	}

	if (options.symbol !== undefined && typeof options.symbol !== "boolean") {
		throw new TypeError(`Invalid argument 'character.symbol': a boolean is required, but ${typeof options.symbol} was provided.`);
	}
}

/**
 * Generates the character pool for the random ID based on specified character options.
 *
 * @param   {CharacterOptions} character - Options specifying the types of characters to use
 * @returns {string}                       The combined string of all allowed characters
 */
function getCharacterPool(character: CharacterOptions): string {
	const stringType = {
		number  : "0123456789",
		alphabet: {
			uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			lowercase: "abcdefghijklmnopqrstuvwxyz"
		},
		symbol: "`~!@#$%^&*()_+-={}[]|:;\"'<>,.?/"
	};

	let str = "";

	if (character?.number) {
		str += stringType.number;
	}
	if (character?.alphabet?.uppercase) {
		str += stringType.alphabet.uppercase;
	}
	if (character?.alphabet?.lowercase) {
		str += stringType.alphabet.lowercase;
	}
	if (character?.symbol) {
		str += stringType.symbol;
	}

	return str;
}

/**
 * Generates a cryptographically secure random ID based on the specified number of digits and character types.
 *
 * @param   {number}           [digit]     - The number of digits for the generated ID
 * @param   {CharacterOptions} [character] - Options specifying the types of characters to use
 * @returns {string}                         The generated random ID string
 * @throws  {TypeError}                      Thrown if the digit is not an integer or character options are invalid
 * @throws  {RangeError}                     Thrown if the digit is out of legal range
 */
export function generateID(digit: number = 8, character: CharacterOptions = { number: true, alphabet: { uppercase: true, lowercase: true }, symbol: false }): string {
	validateArguments(digit, character);

	const finalCharacter = Object.assign({ number: false, alphabet: { uppercase: false, lowercase: false }, symbol: false }, character);
	const typedArray     = new Uint32Array(digit);
	const cryptoArray    = crypto.getRandomValues(typedArray);
	const char           = getCharacterPool(finalCharacter);
	const rand           = Array.from(cryptoArray)
		.map((num) => char[num % char.length])
		.join("");

	return rand;
}