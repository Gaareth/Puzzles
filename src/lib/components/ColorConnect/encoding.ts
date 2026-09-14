import type { PositionEntry } from './logic';
import { makeDrawConfigFromStoreConfig, type LevelDrawConfig, type LevelStoreConfig } from './presets';

class BitWriter {
	private bytes: number[] = [];
	private bitOffset = 0;

	write(value: number, bits: number) {
		if (value < 0 || value >= 2 ** bits) {
			throw new Error(`Value ${value} cannot be represented in ${bits} bits`);
		}

		for (let i = 0; i < bits; i++) {
			const bit = (value >> i) & 1; // select bit i

			// only write if 1. (no overwriting possible)
			if (bit) {
				const byteIndex = this.bitOffset >> 3; // divide by 8
				const bitIndex = this.bitOffset & 7; // modulo 8. keep only the last 3 bits

				this.bytes[byteIndex] ??= 0;
				this.bytes[byteIndex] |= 1 << bitIndex; // set the bit bitIndex in the byte at byteIndex to 1
			}

			this.bitOffset++;
		}
	}

	writeString(str: string, maxLengthBits: number = 8, bitsPerChar: number = 8) {
		const length = str.length;
		const maxLength = 2 ** maxLengthBits - 1;

		if (length > maxLength) {
			throw new Error(`String length ${length} exceeds maximum length of ${maxLength}`);
		}

		this.write(length, maxLengthBits);

		const maxCharCode = 2 ** bitsPerChar - 1;

		for (let i = 0; i < length; i++) {
			const charCode = str.charCodeAt(i);

			if (charCode > maxCharCode) {
				throw new Error(`Character code ${charCode} exceeds ${bitsPerChar} bits`);
			}

			this.write(charCode, bitsPerChar);
		}
	}

	finish(): Uint8Array {
		return Uint8Array.from(this.bytes);
	}
}

class BitReader {
	bitOffset = 0;

	constructor(private bytes: Uint8Array) {}

	read(bits: number): number {
		let value = 0;

		for (let i = 0; i < bits; i++) {
			const byteIndex = this.bitOffset >> 3;
			const bitIndex = this.bitOffset & 7;

			const bit = (this.bytes[byteIndex] >> bitIndex) & 1;
			value |= bit << i;

			this.bitOffset++;
		}

		return value;
	}

	readString(maxLengthBits: number = 8, bitsPerChar: number = 8): string {
		const length = this.read(maxLengthBits);
		let str = '';

		for (let i = 0; i < length; i++) {
			const charCode = this.read(bitsPerChar);
			str += String.fromCharCode(charCode);
		}

		return str;
	}
}

function bitsRequired(count: number): number {
	if (count <= 1) return 0;
	return Math.ceil(Math.log2(count));
}

export function encodeLevel(level: PositionEntry[], config: LevelStoreConfig): string {
	const { WIDTH: width, HEIGHT: height, COLORS: colors, SYMBOLS: chars } = config;

	const writer = new BitWriter();

	// level configuration. 2 + 2 + num_colors * 2 + num_chars * (1 + 2) + font_string_length * 2
	writer.write(width, 16);
	writer.write(height, 16);

	writer.write(colors.length, 8);
	for (const color of colors) {
		writer.writeString(color, 8, 8);
	}
	writer.writeString(chars, 8, 16);
	writer.writeString(config.FONT_STRING, 8, 8);

	// position entries
	const xBits = bitsRequired(width); // 10
	const yBits = bitsRequired(height); // 10
	const charBits = bitsRequired(chars.length); // 5
	const colorBits = bitsRequired(colors.length); // 2

	console.log(`Encoding level with ${xBits} | ${yBits} | ${charBits} | ${colorBits} bits`);

	for (const entry of level) {
		const x = entry.pos[0];
		const y = entry.pos[1];
		const charIndex = chars.indexOf(entry.char);
		const colorIndex = colors.indexOf(entry.color);

		if (x < 0 || x >= width) {
			throw new Error(`Invalid x position: ${x}`);
		}

		if (y < 0 || y >= height) {
			throw new Error(`Invalid y position: ${y}`);
		}

		if (charIndex === -1) {
			throw new Error(`Character ${entry.char} not found`);
		}

		if (colorIndex === -1) {
			throw new Error(`Color ${entry.color} not found`);
		}

		writer.write(x, xBits);
		writer.write(y, yBits);
		writer.write(charIndex, charBits);
		writer.write(colorIndex, colorBits);
	}

	const bytes = writer.finish();
	console.log(`Encoded level to ${bytes.length} bytes`);

	return btoa(String.fromCharCode(...bytes));
}

export function decodeLevel(encoded: string): {
	positions: PositionEntry[];
	config: LevelDrawConfig;
} {
	const binary = atob(encoded);

	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	const reader = new BitReader(bytes);

	const width = reader.read(16);
	const height = reader.read(16);

	const numColors = reader.read(8);
	const colors: string[] = [];
	for (let i = 0; i < numColors; i++) {
		colors.push(reader.readString(8, 8));
	}

	const chars = reader.readString(8, 16);
	const fontString = reader.readString(8, 8);
	const config: LevelDrawConfig = makeDrawConfigFromStoreConfig({
		WIDTH: width,
		HEIGHT: height,
		COLORS: colors,
		SYMBOLS: chars,
		FONT_STRING: fontString
	});
	const headerSizeBits = reader.bitOffset;

	const xBits = bitsRequired(width);
	const yBits = bitsRequired(height);
	const charBits = bitsRequired(chars.length);
	const colorBits = bitsRequired(colors.length);

	const bitsPerEntry = xBits + yBits + charBits + colorBits;
	const entryCount = Math.floor((bytes.length * 8 - headerSizeBits) / bitsPerEntry);
	console.log(`Decoding level with ${xBits} | ${yBits} | ${charBits} | ${colorBits} bits, ${entryCount} entries`);

	const positions: PositionEntry[] = [];

	for (let i = 0; i < entryCount; i++) {
		const x = reader.read(xBits);
		const y = reader.read(yBits);
		const charIndex = reader.read(charBits);
		const colorIndex = reader.read(colorBits);

		if (x >= width || y >= height) {
			throw new Error('Invalid position in level data.');
		}

		if (charIndex >= chars.length) {
			throw new Error(`Invalid character index: ${charIndex}`);
		}

		if (colorIndex >= colors.length) {
			throw new Error(`Invalid color index: ${colorIndex}`);
		}

		positions.push({
			char: chars[charIndex],
			pos: [x, y],
			color: colors[colorIndex],
			index: null
		});
	}

	return { positions, config };
}
