import { countColoredNonSolution } from './helpers';
import { ColorConnect } from './logic';

self.onmessage = (event) => {
	const { solution, config } = event.data;

	const colorConnect = new ColorConnect(solution, config);
	const res = colorConnect.calculate(countColoredNonSolution);
	if (!res) {
		console.error('Failed to calculate valid positions for the given solution and configuration.');
		self.postMessage({ error: true });
	}

	self.postMessage({
		error: false,
		positions: colorConnect.positions,
		solution: colorConnect.solution
	});
};
