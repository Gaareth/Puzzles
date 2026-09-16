import { assert, distance, getRandomInclusive, shuffleArray } from '$lib/utils';
import { isValidPosition, validate, validateMinDistance } from './validation';

export type Position = [number, number];
export type PositionEntry = {
	char: string;
	pos: Position;
	color: string;
	index: number | null; // optional index of the character in the solution string, null if not part of the solution
};

type ColorConnectBaseConfig = {
	WIDTH: number;
	HEIGHT: number;
	COLORS: string[];
	SYMBOLS: string;

	MAX_ATTEMPTS: {
		SPRAY: number;
		FIND_NON_OVERLAPPING_POSITION: number;
		FIND_POSITION_WITH_COLOR: number;
		FIND_POSITION_AND_COLOR: number;
		FIND_FORM: number;
		OPTIMIZER: number;
	};
	GRAY_SPAWN_CHANCE: number; // out of 1
	MIN_MIXUP_DIFF: number;
};

export type ColorConnectConfig = ColorConnectBaseConfig & {
	FONT_SIZE_PX: number;
	FONT_STRING: string;
	MIN_CHAR_DISTANCE: number;
	PADDING: number;
};

export type ColorConnectInputs = ColorConnectBaseConfig & {
	FONT_SIZE_PX: number;
	TYPEFACE: string;
	FONT_STRING?: string | undefined;

	MIN_CHAR_DISTANCE?: number | undefined;
	PADDING?: number | undefined;
};

export function applyDefaultsToConfig(config: ColorConnectInputs): ColorConnectConfig {
	// use the font size as default for padding and min char distance

	return {
		...config,
		FONT_STRING: `${config.FONT_SIZE_PX}px ${config.TYPEFACE}`,
		MIN_CHAR_DISTANCE: config.MIN_CHAR_DISTANCE ?? config.FONT_SIZE_PX,
		PADDING: config.PADDING ?? config.FONT_SIZE_PX
	};
}

export type scoreLevel = (level: PositionEntry[]) => number;

export class ColorConnect {
	solution: string;
	positions: PositionEntry[];
	idxToPositionPointer: Map<number, number>;
	config: ColorConnectConfig;
	hasCalculated: boolean = false;
	preForm: Position[] | null;

	constructor(solution: string, config: ColorConnectConfig, preForm: Position[] | null = null) {
		this.solution = solution;
		this.positions = [];
		this.idxToPositionPointer = new Map();
		this.config = config;
		this.preForm = preForm;

		if (preForm) {
			this._fillPreForm();
		}
	}

	_fillPreForm() {
		const form = [];
		if (!this.preForm) return;
		for (let i = 0; i < this.preForm.length; i++) {
			const pos = this.preForm[i];
			const char = this.solution[i];
			const color = this.config.COLORS[i % this.config.COLORS.length];
			const positionEntry: PositionEntry = { pos, char, color, index: i };
			this.positions.push(positionEntry);
			this.idxToPositionPointer.set(i, i);
			form.push(positionEntry);
		}

		// TODO: tryFind if preForm has less points than solution, and fill the rest with random positions and colors

		return form;
	}

	getPositionByIndex(idx: number): PositionEntry | null {
		const pointer = this.idxToPositionPointer.get(idx);
		if (pointer == null) {
			return null;
		}

		const entry = this.positions[pointer];
		assert(entry != null, `No entry found for index ${idx} should not happen`);
		return entry;
	}

	getPositionByIndexAsserted(idx: number): PositionEntry {
		const entry = this.getPositionByIndex(idx);

		if (entry == null) {
			for (const [i, pointer] of this.idxToPositionPointer.entries()) {
				const posEntry = this.positions[pointer];
				console.log(`Index ${i} -> Pointer ${pointer} -> Entry:`, posEntry);
			}
		}

		assert(entry != null, `No entry found for index ${idx} should not happen.`);
		return entry;
	}

	findNonOverlappingPosition(min_dist: number): Position | null {
		let x: number, y: number;
		const maxAttempts = this.config.MAX_ATTEMPTS.FIND_NON_OVERLAPPING_POSITION;

		for (let attempts = 0; attempts < maxAttempts; attempts++) {
			x = getRandomInclusive(this.config.PADDING, this.config.WIDTH - this.config.PADDING - 1);
			y = getRandomInclusive(this.config.PADDING, this.config.HEIGHT - this.config.PADDING - 1);

			const isOverlapping = this.positions.some(({ pos: [px, py] }) => {
				return distance([x, y], [px, py]) < min_dist;
			});

			if (!isOverlapping) {
				return [x, y];
			}
		}

		return null;
	}

	hasSpace(min_dist: number): boolean {
		const totalCharacters = this.positions.length;
		const maxCharacters = Math.floor(
			((this.config.WIDTH - 2 * this.config.PADDING) *
				(this.config.HEIGHT - 2 * this.config.PADDING)) /
				(min_dist * min_dist)
		);
		console.log(`Total characters: ${totalCharacters}, Max characters: ${maxCharacters}`);
		return totalCharacters < maxCharacters;
	}

	spray() {
		let i = 0;
		const maxSprayAttempts = this.config.MAX_ATTEMPTS.SPRAY;
		while (true) {
			// if (!hasSpace(50)) break;

			const result = this.findValidPositionAndColor(this.config.MIN_CHAR_DISTANCE);
			if (!result) break;
			const { pos, color } = result;

			const char = this.config.SYMBOLS[getRandomInclusive(0, this.config.SYMBOLS.length - 1)];
			const positionEntry = { pos, color, char, index: null };
			this.positions.push(positionEntry);

			i++;
			if (i > maxSprayAttempts) break;
		}
	}

	findValidPositionAndColor(min_dist: number): { pos: Position; color: string } | null {
		const maxAttempts = this.config.MAX_ATTEMPTS.FIND_POSITION_AND_COLOR;
		let attempts = 0;

		while (attempts < maxAttempts) {
			attempts++;
			const result = this.findNonOverlappingPosition(min_dist);
			if (!result) {
				continue;
			}
			const [x, y] = result;

			// add gray in 50percent to colors
			const colors = [...this.config.COLORS];
			if (Math.random() < this.config.GRAY_SPAWN_CHANCE) {
				colors.push('gray');
			}

			for (const color of shuffleArray(colors)) {
				if (isValidPosition(this, [x, y], color)) {
					return { pos: [x, y], color };
				}
			}
		}

		console.warn('Max attempts reached while finding a position and color.');
		return null;
	}

	findValidPosition(color: string): Position | null {
		const maxAttempts = this.config.MAX_ATTEMPTS.FIND_POSITION_WITH_COLOR;
		let attempts = 0;

		while (attempts < maxAttempts) {
			attempts++;
			const result = this.findNonOverlappingPosition(this.config.MIN_CHAR_DISTANCE);
			if (!result) {
				continue;
			}
			const [x, y] = result;

			if (isValidPosition(this, [x, y], color)) {
				return [x, y];
			}
		}

		return null;
	}

	findValidForm() {
		const form = [];

		for (let i = 0; i < this.solution.length; i++) {
			const char = this.solution[i];
			const pickedColor = this.config.COLORS[i % this.config.COLORS.length];
			const positionResult = this.findValidPosition(pickedColor);
			if (positionResult == null) {
				return;
			}

			const positionEntry: PositionEntry = {
				pos: positionResult,
				color: pickedColor,
				char,
				index: i
			};

			this.idxToPositionPointer.set(i, this.positions.length);
			this.positions.push(positionEntry);
			form.push(positionEntry);
		}

		return form;
	}

	_clear() {
		this.positions = [];
		this.idxToPositionPointer.clear();
	}

	tryFindValidForm() {
		if (this.preForm) {
			this._clear();
			return this._fillPreForm();
		}

		const maxAttempts = this.config.MAX_ATTEMPTS.FIND_FORM;

		let attempts = 0;

		while (attempts < maxAttempts) {
			attempts++;
			// clear positions and idxToPosition for a fresh attempt
			this._clear();

			const formResult = this.findValidForm();
			if (formResult == null) {
				continue;
			}

			return formResult;
		}

		console.error('Max attempts reached while trying to find a valid form.');
		return null;
	}

	scramblePositions() {
		// dont scramble first
		const scrambled = this.positions.slice(1);

		shuffleArray(scrambled);
		this.positions = [this.positions[0], ...scrambled];
		this.idxToPositionPointer.clear();
		for (let i = 0; i < this.positions.length; i++) {
			const entry = this.positions[i];
			if (entry.index != null) {
				this.idxToPositionPointer.set(entry.index, i);
			}
		}
	}

	_validatePositions() {
		const solutionPositions = [];
		for (const entry of this.idxToPositionPointer.values()) {
			const positionEntry = this.positions[entry];
			if (positionEntry.index != null) {
				solutionPositions.push(positionEntry);
			}
		}
		validate(solutionPositions, this.positions, this.config.MIN_MIXUP_DIFF, true, true);
	}

	calculate(
		byBestFn: scoreLevel | null = null,
		validateResult: boolean = true
	): PositionEntry[] | null {
		const maxAttempts = this.config.MAX_ATTEMPTS.OPTIMIZER;

		let bestScore = -Infinity;
		let bestAttempt: {
			positions: PositionEntry[];
			idxToPositionPointer: Map<number, number>;
		} | null = null;

		for (let i = 0; i < maxAttempts; i++) {
			const formResult = this.tryFindValidForm();
			if (formResult == null) {
				continue;
			}

			if (validateResult) {
				this._validatePositions();
			}

			this.spray();

			if (validateResult) {
				this._validatePositions();
				validateMinDistance(this);
			}

			if (byBestFn == null) {
				this.scramblePositions();
				return formResult;
			}

			const score = byBestFn(this.positions);
			if (score > bestScore) {
				bestScore = score;
				bestAttempt = {
					positions: [...this.positions],
					idxToPositionPointer: new Map(this.idxToPositionPointer)
				};
			}
		}

		this.scramblePositions();
		this.hasCalculated = true;
		if (bestAttempt) {
			this.positions = bestAttempt.positions;
			this.idxToPositionPointer = bestAttempt.idxToPositionPointer;
			console.log(`Best score after ${maxAttempts} attempts: ${bestScore}`);
			return bestAttempt.positions;
		}
		return null;
	}
}

