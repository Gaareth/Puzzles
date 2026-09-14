import { describe, expect, it } from 'vitest';
import { encodeLevel, decodeLevel } from './encoding';
import { makeDrawConfigFromStoreConfig } from './presets';

describe('encodeLevel', () => {
	it('encodes and decodes a level', async () => {
		const colors = ['red', 'green', 'blue'];

		const level = [
			{ char: 'A', pos: [1, 2] as [number, number], color: 'red', index: null },
			{ char: 'B', pos: [10, 20] as [number, number], color: 'blue', index: null }
		];

		const config = {
			WIDTH: 64,
			HEIGHT: 64,
			COLORS: colors,
			SYMBOLS: 'AB',
			FONT_STRING: '24px Arial'
		};
		const drawConfig = makeDrawConfigFromStoreConfig(config);

		const encoded = await encodeLevel(level, config);
		const decoded = decodeLevel(encoded);

		expect(decoded.positions).toEqual(level);
		expect(decoded.config).toEqual(drawConfig);
	});
});
