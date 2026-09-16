import type { Position, PositionEntry } from './logic';

export function countColoredNonSolution(positions: PositionEntry[]) {
	let c = 0;

	for (const entry of positions) {
		if (entry.color != 'gray' && entry.index == null) {
			c++;
		}
	}
	return c;
}
export type SelectionEntry = {
	charCenter: [number, number];
	entry: PositionEntry;
} | null;
export function cmpSelection(a: SelectionEntry, b: SelectionEntry) {
	if (!a || !b) return false;
	return a.charCenter[0] === b.charCenter[0] && a.charCenter[1] === b.charCenter[1];
}

export function cmpPositionEntry(a: PositionEntry, b: PositionEntry) {
	if (!a || !b) return false;
	return a.pos[0] === b.pos[0] && a.pos[1] === b.pos[1];
}

export function containsPosition(positions: Position[], pos: Position) {
	for (let i = 0; i < positions.length; i++) {
		const entry = positions[i];
		if (entry[0] === pos[0] && entry[1] === pos[1]) {
			return i;
		}
	}
	return null;
}

export function findIntersectingPosition(positions: Position[], pos: Position, radius: number) {
	for (let i = 0; i < positions.length; i++) {
		const entry = positions[i];
		const dx = entry[0] - pos[0];
		const dy = entry[1] - pos[1];
		if (Math.hypot(dx, dy) <= radius) {
			return i;
		}
	}
	return null;
}

// fills the line between the points
export function interpolateLine(linePoints: Position[], spacing = 4): Position[] {
	if (linePoints.length < 2) return linePoints;

	const result: Position[] = [linePoints[0]];

	for (let i = 1; i < linePoints.length; i++) {
		const [x1, y1] = linePoints[i - 1];
		const [x2, y2] = linePoints[i];

		const dx = x2 - x1;
		const dy = y2 - y1;
		const distance = Math.hypot(dx, dy);
		const steps = Math.ceil(distance / spacing);

		for (let step = 1; step <= steps; step++) {
			const t = step / steps;

			result.push([x1 + dx * t, y1 + dy * t]);
		}
	}

	return result;
}

/**
 * Distributes a specified number of points along a line, with optional jitter.
 * @param linePoints - The points that define the line.
 * @param numPoints - The number of points to distribute.
 * @param jitter - The maximum offset
 * @returns An array of points distributed along the line.
 */
export function pointsFromLine(
	linePoints: Position[],
	numPoints: number,
	{
		jitter = 5,
		offsetMap
	}: {
		jitter?: number;
		offsetMap?: Map<number, number>;
	} = {}
): Position[] {
	if (linePoints.length < 2) return linePoints;

	if (numPoints > linePoints.length) {
		throw new Error(
			`numPoints (${numPoints}) cannot be greater than the number of line points (${linePoints.length}).`
		);
	}

	const points: Position[] = [];

	for (let i = 0; i < numPoints; i++) {
		// Always use the exact start/end points
		if (i === 0) {
			points.push(linePoints[0]);
			continue;
		}

		if (i === numPoints - 1) {
			points.push(linePoints[linePoints.length - 1]);
			continue;
		}

		// Evenly spaced position along the line
		const t = i / (numPoints - 1);
		const position = t * (linePoints.length - 1);
		const index = Math.floor(position);
		const fraction = position - index;

		const current = linePoints[index];
		const next = linePoints[index + 1];

		// Linear interpolation between the two line points
		let x = current[0] + (next[0] - current[0]) * fraction;
		let y = current[1] + (next[1] - current[1]) * fraction;

		// Optional jitter along the line
		if (jitter > 0 || offsetMap) {
			const dx = next[0] - current[0];
			const dy = next[1] - current[1];
			const length = Math.hypot(dx, dy);

			if (length > 0) {
				let offset = 0;
				if (offsetMap) {
					offset = (offsetMap.get(i) ?? 0) * length;
				} else if (jitter > 0) {
					offset = (Math.random() * 2 - 1) * jitter;
				}

				x += (dx / length) * offset;
				y += (dy / length) * offset;
			}
		}

		points.push([x, y]);
	}

	return points;
}

export function permutations<T>(values: T[]): T[][] {
	if (values.length === 0) return [[]];

	return values.flatMap((value, i) =>
		permutations([...values.slice(0, i), ...values.slice(i + 1)]).map((rest) => [value, ...rest])
	);
}
