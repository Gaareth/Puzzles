import type { ColorConnectInputs } from './logic';

const greekAlphabet = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω';

export type LevelStoreConfig = {
	WIDTH: number;
	HEIGHT: number;
	COLORS: string[];
	SYMBOLS: string;
	FONT_STRING: string;
};

export type LevelDrawConfig = LevelStoreConfig & {
	FONT_SIZE_PX: number;
};

export function makeDrawConfigFromStoreConfig(storeConfig: LevelStoreConfig): LevelDrawConfig {
	return {
		...storeConfig,
		FONT_SIZE_PX: storeConfig.FONT_STRING ? parseInt(storeConfig.FONT_STRING.split(' ')[0]) : 50
	};
}

const BASE_CONFIG = {
	WIDTH: 800,
	HEIGHT: 800,
	MAX_ATTEMPTS: {
		FIND_NON_OVERLAPPING_POSITION: 500,
		FIND_POSITION_WITH_COLOR: 500,
		FIND_POSITION_AND_COLOR: 500,
		FIND_FORM: 1000,
		OPTIMIZER: 10
	},
	SYMBOLS: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + greekAlphabet,
	COLORS: ['red', 'green', 'blue']
};

const INSANE_SMALL_AND_MANY: ColorConnectInputs = {
	...BASE_CONFIG,
	//
	FONT_SIZE_PX: 5,
	TYPEFACE: 'Arial',
	MIN_CHAR_DISTANCE: 5,
	//
	MAX_ATTEMPTS: {
		...BASE_CONFIG.MAX_ATTEMPTS,
		SPRAY: 8000
	},
	MIN_MIXUP_DIFF: 1
};

const LARGE: ColorConnectInputs = {
	...BASE_CONFIG,
	//
	FONT_SIZE_PX: 75,
	TYPEFACE: 'Arial',
	MIN_CHAR_DISTANCE: 120,
	//
	MAX_ATTEMPTS: {
		...BASE_CONFIG.MAX_ATTEMPTS,
		SPRAY: 75,
		FIND_POSITION_AND_COLOR: 1000
	},
	MIN_MIXUP_DIFF: 75 * 2
};

const MEDIUM: ColorConnectInputs = {
	...BASE_CONFIG,
	//
	FONT_SIZE_PX: 50,
	TYPEFACE: 'Arial',
	MIN_CHAR_DISTANCE: 100,
	//
	MAX_ATTEMPTS: {
		...BASE_CONFIG.MAX_ATTEMPTS,
		SPRAY: 100,
		FIND_POSITION_AND_COLOR: 1000
	},
	MIN_MIXUP_DIFF: 50 * 2
};

const SMALL: ColorConnectInputs = {
	...BASE_CONFIG,
	//
	FONT_SIZE_PX: 30,
	TYPEFACE: 'Arial',
	MIN_CHAR_DISTANCE: 50,
	//
	MAX_ATTEMPTS: {
		SPRAY: 200,
		...BASE_CONFIG.MAX_ATTEMPTS,
		FIND_POSITION_AND_COLOR: 100
	},
	MIN_MIXUP_DIFF: 30 * 3
};

const TINY: ColorConnectInputs = {
	...BASE_CONFIG,
	//
	FONT_SIZE_PX: 15,
	TYPEFACE: 'Arial',
	MIN_CHAR_DISTANCE: 15,
	//
	MAX_ATTEMPTS: {
		SPRAY: 500,
		...BASE_CONFIG.MAX_ATTEMPTS,
		FIND_POSITION_AND_COLOR: 300
	},
	MIN_MIXUP_DIFF: 15 * 4
};

export const CONFIG_PRESETS = {
	INSANE_SMALL_AND_MANY,
	LARGE,
	MEDIUM,
	SMALL,
	TINY
};
