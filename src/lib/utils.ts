export function getRandomInclusive(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function distance(pos1: [number, number], pos2: [number, number]): number {
	const [x1, y1] = pos1;
	const [x2, y2] = pos2;
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

export function measureText(ctx: CanvasRenderingContext2D, text: string, font: string) {
	ctx.font = font;
	const metrics = ctx.measureText(text);
	return {
		width: metrics.width,
		height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
	}
}

export function normalizeVector(vector: [number, number]): [number, number] {
	const [x, y] = vector;
	const length = Math.sqrt(x * x + y * y);
	return [x / length, y / length];
}


export function generateHueColorPalette(length: number): string[] {
	if (length <= 0) return [];

	return Array.from({ length }, (_, i) => {
		const hue = (i * 360) / length;
		return `hsl(${hue}, 70%, 50%)`;
	});
}