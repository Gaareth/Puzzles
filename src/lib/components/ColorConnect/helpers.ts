import type { PositionEntry } from './logic';

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
