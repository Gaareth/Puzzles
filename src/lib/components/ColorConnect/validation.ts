import { distance } from '$lib/utils';
import type { ColorConnect, Position, PositionEntry } from './logic';

/** Validate that all positions are valid and do not lead to mixups.
 * @param allow_previous_to_be_closer allows previous characters of the solution string to be closer than the next correct one.
 */
export function validate(
	solutionPositions: PositionEntry[],
	allPositions: PositionEntry[],
	min_mixup_diff: number,
	allow_previous_to_be_closer = false,
	throwOnError = false
) {
	// last one has no next one, so we can skip it
	for (let i = 0; i < solutionPositions.length - 2; i++) {
		const entryToCheck = solutionPositions[i];
		const nextEntry = solutionPositions[i + 1];

		// distance less than that are not allowed
		const distanceToNext = distance(entryToCheck.pos, nextEntry.pos);

		// is there any entry which is closer to me, than my next correct one
		for (const positionEntry of allPositions) {
			if (positionEntry == entryToCheck || positionEntry == nextEntry) {
				continue;
			}
			if (positionEntry.color != nextEntry.color) {
				continue;
			}

			// skip previous entries if allow_previous_to_be_closer is true
			if (allow_previous_to_be_closer && positionEntry.index != null && positionEntry.index <= i) {
				continue;
			}

			const distanceToSelf = distance(entryToCheck.pos, positionEntry.pos);
			if (distanceToSelf <= distanceToNext + min_mixup_diff) {
				if (throwOnError) {
					throw new Error(
						`Validation failed: ${positionEntry.char} at index ${positionEntry.index} is too close to ${entryToCheck.char} at index ${i}. 
						Its closer than the next correct character ${nextEntry.char} at index ${i + 1}. 
						Distance (${entryToCheck.char} to ${positionEntry.char}): ${distanceToSelf}, distance (${entryToCheck.char} to ${nextEntry.char}): ${distanceToNext}, 
						MIN_MIXUP_DIFF: ${min_mixup_diff}`
					);
				}
				return {
					valid: false,
					baseEntry: entryToCheck,
					correctNextEntry: nextEntry,
					confusableEntry: positionEntry
				};
			}
		}
	}
	return {
		valid: true
	};
}

/// Checks that the position and color leads to no mixups
export function isValidPosition(
	colorConnect: ColorConnect,
	position: Position,
	color: string
): boolean {
	// go through all solutions chars and check that $position is not nearer to it than the correct next solution char
	for (let i = 0; i < colorConnect.solution.length; i++) {
		const entry = colorConnect.getPositionByIndex(i);
		// not yet defined
		if (!entry) {
			continue;
		}

		const nextEntry = colorConnect.getPositionByIndex(i + 1);
		if (!nextEntry) {
			continue;
		}

		if (color != nextEntry?.color) {
			continue;
		}

		// check that the distance
		// from the solution char to the given position
		// is not less than the distance
		//  from the solution char to the correct next next entry
		const distanceSelf = distance(entry.pos, position);
		const distanceCorrect = distance(entry.pos, nextEntry.pos);

		// distanceSelf must be less than correct distance plus a padding
		if (distanceSelf <= distanceCorrect + colorConnect.config.MIN_MIXUP_DIFF) {
			return false;
		}
	}

	return true;
}

export function validateMinDistance(colorConnect: ColorConnect): void {
	for (let i = 0; i < colorConnect.positions.length; i++) {
		for (let j = i + 1; j < colorConnect.positions.length; j++) {
			const posI = colorConnect.positions[i];
			const posJ = colorConnect.positions[j];
			const [xi, yi] = posI.pos;
			const [xj, yj] = posJ.pos;

			// const charI = idxToPosition[i];
			// const charJ = solution[j];

			const dist = distance([xi, yi], [xj, yj]);
			if (dist < colorConnect.config.MIN_CHAR_DISTANCE) {
				throw new Error(
					`Validation failed: distance between index ${i} [${posI.char}] and index ${j} [${posJ.char}] is less 
						than MIN_CHAR_DISTANCE (${dist} < ${colorConnect.config.MIN_CHAR_DISTANCE})`
				);
			}
		}
	}
}
