import { countColoredNonSolution } from './helpers';
import { ColorConnect } from './logic';

self.onmessage = (event) => {
	const { solution, config, preForm } = event.data;

	const colorConnect = new ColorConnect(solution, config, preForm);
	try {
		const res = colorConnect.calculate(countColoredNonSolution);
		if (!res) {
			console.error(
				'Failed to calculate valid positions for the given solution and configuration.'
			);
			self.postMessage({ errorMessage: 'Failed to calculate valid positions for the given solution and configuration.' });
		}

		self.postMessage({
			error: false,
			positions: colorConnect.positions,
			solution: colorConnect.solution
		});
	} catch (error) {
		self.postMessage({ errorMessage: "Failed to Validate: " + (error instanceof Error ? error.message : String(error)) });
	}
};
