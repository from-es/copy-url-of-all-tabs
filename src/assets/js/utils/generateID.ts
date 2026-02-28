interface CharacterOptions {
	number?: boolean;
	alphabet?: {
		uppercase?: boolean;
		lowercase?: boolean;
	};
	symbol?: boolean;
}

/**
 * 指定された桁数と文字タイプに基づき、暗号学的に安全なランダムIDを生成
 *
 * @param   {number} [digit=8]                                                                                             - 生成するIDの桁数。デフォルトは8
 * @param   {CharacterOptions} [character={ number: true, alphabet: { uppercase: true, lowercase: true }, symbol: false }] - 使用する文字の種類を指定するオプション
 * @returns {string}                                                                                                       - 生成されたランダムなID文字列
 * @throws {TypeError} - digitまたはcharacter引数が無効な場合にスローする
 */
export function generateID(digit: number = 8, character: CharacterOptions = { number: true, alphabet: { uppercase: true, lowercase: true }, symbol: false }): string {
	const validate = (digit && typeof digit === "number" && Number.isInteger(digit));
	if (!validate) {
		throw new TypeError(`Invalid: digit must be an integer in generateID, received ${digit}`);
	}

	const number = Number(digit);
	if ( !(Number.MAX_SAFE_INTEGER >= number) && (number > 0) ) {
		throw new TypeError(`Invalid: digit must be within the legal range in generateID, received ${digit}`);
	}

	if ( !character || typeof character !== "object" ) {
		throw new TypeError(`Invalid: character options must be an object in generateID, received ${typeof character}`);
	} else if ( !character?.number && !character?.alphabet?.uppercase && !character?.alphabet?.lowercase && !character?.symbol ) {
		throw new TypeError("Invalid: character options must have at least one character type enabled in generateID");
	} else if ( character?.number && typeof character.number !== "boolean" ) {
		throw new TypeError(`Invalid: character.number must be a boolean in generateID, received ${typeof character.number}`);
	} else if ( character?.alphabet?.uppercase && typeof character.alphabet.uppercase !== "boolean" ) {
		throw new TypeError(`Invalid: character.alphabet.uppercase must be a boolean in generateID, received ${typeof character.alphabet.uppercase}`);
	} else if ( character?.alphabet?.lowercase && typeof character.alphabet.lowercase !== "boolean" ) {
		throw new TypeError(`Invalid: character.alphabet.lowercase must be a boolean in generateID, received ${typeof character.alphabet.lowercase}`);
	} else if ( character?.symbol && typeof character.symbol !== "boolean" ) {
		throw new TypeError(`Invalid: character.symbol must be a boolean in generateID, received ${typeof character.symbol}`);
	}

	const finalCharacter = Object.assign({ number: false, alphabet: { uppercase: false, lowercase: false }, symbol: false }, character);

	const stringType = {
		number  : "0123456789",
		alphabet: {
			uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			lowercase: "abcdefghijklmnopqrstuvwxyz"
		},
		symbol: "`~!@#$%^&*()_+-={}[]|:;\"'<>,.?/"
	};
	const getCharacter = (chr: CharacterOptions): string => {
		let str = "";

		if ( chr?.number ) {
			str += stringType.number;
		}
		if ( chr?.alphabet?.uppercase ) {
			str += stringType.alphabet.uppercase;
		}
		if ( chr?.alphabet?.lowercase ) {
			str += stringType.alphabet.lowercase;
		}
		if ( chr?.symbol ) {
			str += stringType.symbol;
		}

		return str;
	};

	const typedArray  = new Uint32Array(digit);
	const cryptoArray = crypto.getRandomValues(typedArray);
	const char        = getCharacter(finalCharacter);
	const rand        = Array.from(cryptoArray)
		.map((num) => char[num % char.length])
		.join("");

	return rand;
}