import { measureText, generateHueColorPalette, normalizeVector } from '$lib/utils';
import type { PositionEntry } from './logic';
import type { LevelDrawConfig } from './presets';

export function drawStart(
	ctx: CanvasRenderingContext2D,
	position: PositionEntry,
	config: LevelDrawConfig
) {
	const charMeasure = measureText(ctx, position.char, config.FONT_STRING);
	const radius = config.FONT_SIZE_PX / 1.5;
	const charCenter = [position.pos[0] + charMeasure.width / 2, position.pos[1] - charMeasure.height / 2];

	const hueColors = generateHueColorPalette(1);

	ctx.lineWidth = config.FONT_SIZE_PX / 10;

	ctx.strokeStyle = hueColors[0];
	ctx.beginPath();
	ctx.arc(charCenter[0], charCenter[1], radius, 0, 2 * Math.PI);
	ctx.stroke();
}

export function drawSolution(
	ctx: CanvasRenderingContext2D,
	positions: PositionEntry[],
	solutionLength: number,
	config: LevelDrawConfig
) {
	const firstEntry = positions[0];
	const charMeasure = measureText(ctx, firstEntry.char, config.FONT_STRING);
	const radius = config.FONT_SIZE_PX / 1.5;
	const smallerRadius = radius / 1.25;
	const charCenter = [
		firstEntry.pos[0] + charMeasure.width / 2,
		firstEntry.pos[1] - charMeasure.height / 2
	];

	const hueColors = generateHueColorPalette(solutionLength);

	ctx.lineWidth = config.FONT_SIZE_PX / 10;

	ctx.beginPath();
	ctx.strokeStyle = hueColors[0];
	const nextPos = positions[1].pos;
	const direction: [number, number] = normalizeVector([
		nextPos[0] - charCenter[0],
		nextPos[1] - charCenter[1]
	]);
	const drawPoint = [charCenter[0] + direction[0] * radius, charCenter[1] + direction[1] * radius];
	ctx.moveTo(drawPoint[0], drawPoint[1]);
	ctx.stroke();

	let prevPos = drawPoint;

	for (let i = 1; i < solutionLength; i++) {
		const entry = positions[i];
		const charMeasure = measureText(ctx, entry.char, config.FONT_STRING);
		const charCenter = [
			entry.pos[0] + charMeasure.width / 2,
			entry.pos[1] - charMeasure.height / 2
		];
		const direction = normalizeVector([charCenter[0] - prevPos[0], charCenter[1] - prevPos[1]]);
		const drawPoint = [
			charCenter[0] - direction[0] * smallerRadius,
			charCenter[1] - direction[1] * smallerRadius
		];

		ctx.beginPath();
		ctx.lineWidth = config.FONT_SIZE_PX / 15;
		ctx.arc(charCenter[0], charCenter[1], smallerRadius, 0, 2 * Math.PI);
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = hueColors[i - (1 % hueColors.length)];
		ctx.moveTo(prevPos[0], prevPos[1]);
		ctx.lineTo(drawPoint[0], drawPoint[1]);
		ctx.stroke();

		prevPos = drawPoint;
	}
}

export function drawChar(
	ctx: CanvasRenderingContext2D,
	entry: PositionEntry,
	config: LevelDrawConfig
) {
	ctx.font = config.FONT_STRING;
	ctx.fillStyle = entry.color;
	ctx.fillText(entry.char, entry.pos[0], entry.pos[1]);
}
