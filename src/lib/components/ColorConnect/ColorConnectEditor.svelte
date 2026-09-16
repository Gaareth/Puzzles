<script lang="ts">
	import { onMount } from 'svelte';
	import ColorConnectViewer from './ColorConnectViewer.svelte';
	import {
		type ColorConnectConfig,
		type ColorConnectInputs,
		type Position,
		type PositionEntry,
		applyDefaultsToConfig
	} from './logic';
	import { CONFIG_PRESETS } from './presets';
	import { encodeLevel } from './encoding';
	import {
		containsPosition,
		countColoredNonSolution,
		findIntersectingPosition,
		interpolateLine,
		pointsFromLine
	} from './helpers';
	import { dev } from '$app/env';
	import { drawChar, getRadius } from './draw';
	import { generateHueColorPalette } from '$lib/utils';
	import ToggleGroup from '../ToggleGroup.svelte';
	import { validate } from './validation';
	import ColorPalette from '../ColorPalette.svelte';

	let solution: string = $state('');
	$effect(() => {
		if (preFormPoints && solution.length > preFormPoints.length) {
			errorControl = 'Add more points';
		}
	});

	let configPreset = $state<keyof typeof CONFIG_PRESETS>('LARGE');
	// svelte-ignore state_referenced_locally
	let config: ColorConnectInputs = $state(CONFIG_PRESETS[configPreset]);

	let positions: PositionEntry[] = $state([]);
	let hasCalculated: boolean = $state(false);
	let configWithDefaults: ColorConnectConfig = $derived(applyDefaultsToConfig(config));

	let loading: boolean = $state(false);
	let error: string | null = $state(null);
	let showSolution: boolean = $state(false);

	let worker: Worker | null = $state(null);

	onMount(() => {
		worker = new Worker(new URL('./colorConnect.worker.ts', import.meta.url), {
			type: 'module'
		});
		worker.onmessage = ({ data }) => {
			loading = false;
			if (data.errorMessage) {
				error = data.errorMessage;
				return;
			}

			positions = data.positions;
			hasCalculated = true;

			loading = false;
			error = null;

			calcStats(positions);
		};

		// generate();
	});

	function generate() {
		if (!worker) return;

		loading = true;
		hasCalculated = false;

		if (drawFormBy == 'line' && interpolatedLinePoints) {
			preFormPoints = pointsFromLine(interpolatedLinePoints, solution.length);
		}

		worker.postMessage({
			solution: $state.snapshot(solution),
			config: $state.snapshot(configWithDefaults),
			preForm: $state.snapshot(preFormPoints)
		});
	}

	let coloredNonSolution = $state(0);
	// let numOptionsAvg = $state(0);

	function calcStats(positions: PositionEntry[]) {
		coloredNonSolution = countColoredNonSolution(positions);
	}

	async function saveLevel() {
		const levelString = encodeLevel(positions, {
			...configWithDefaults,
			COLORS: [...configWithDefaults.COLORS, 'gray']
		});
		console.log('Encoded Level:', levelString);
		window.open(
			`${dev ? '/cc/' : '/cc.html'}?level=${encodeURIComponent(levelString)}`,
			'_blank'
		);
	}

	let errorControl: string | null = $state(null);
	let drawFormMode = $state(false);
	let drawFormBy = $state<'points' | 'line' | 'shape'>('points');
	let shapes = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star', 'heart'];
	let selectedShape = $state();

	let viewerCanvas: HTMLCanvasElement | null = $state(null);
	let preFormPoints = $state<Position[] | null>(null);
	let selectedPointIndex = $state<number | null>(null);
	let preFormLinePoints = $state<Position[] | null>(null);
	let interpolatedLinePoints = $derived(
		preFormLinePoints ? interpolateLine(preFormLinePoints) : null
	);
	let invalidPoints: Position[] = $state([]);
	$effect(() => {
		let ctx = viewerCanvas?.getContext('2d');
		if (!ctx || !viewerCanvas) return;
		ctx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
		drawFormByLine();
		drawFormMarkers();
	});

	$effect(() => {
		const preForEntryPoints: PositionEntry[] = (preFormPoints ?? []).map((entry, index) => ({
			char: solution[index],
			pos: entry,
			color: configWithDefaults.COLORS[index % configWithDefaults.COLORS.length],
			index
		}));

		const validationResult = validate(
			preForEntryPoints,
			preForEntryPoints,
			configWithDefaults.MIN_MIXUP_DIFF,
			true
		);
		if (!validationResult.valid) {
			errorControl = 'Form constraints are invalid';
			invalidPoints = [
				validationResult.baseEntry!.pos,
				validationResult.correctNextEntry!.pos,
				validationResult.confusableEntry!.pos
			];
		} else {
			errorControl = null;
			invalidPoints = [];
		}
	});

	onMount(() => {
		if (!viewerCanvas) return;
		viewerCanvas.addEventListener('mouseup', (e) => {
			if (!drawFormMode || e.buttons !== 0) return;
			// reset drag
			selectedPointIndex = null;
		});

		viewerCanvas.addEventListener('mousemove', (e) => {
			if (!drawFormMode || e.buttons !== 1 || (drawFormBy !== 'line' && drawFormBy !== 'points'))
				return;
			if (!preFormLinePoints) preFormLinePoints = [];
			if (!preFormPoints) preFormPoints = [];

			if (drawFormBy == 'line') {
				preFormLinePoints.push([e.offsetX, e.offsetY]);
			}

			// drag
			if (drawFormBy == 'points' && selectedPointIndex != null) {
				preFormPoints[selectedPointIndex] = [e.offsetX, e.offsetY];
			}
		});

		viewerCanvas.addEventListener('mousedown', (e) => {
			if (!drawFormMode) return;
			if (!preFormPoints) preFormPoints = [];

			if (drawFormBy == 'points') {
				const x = e.offsetX;
				const y = e.offsetY;

				const idx = findIntersectingPosition(preFormPoints, [x, y], getRadius(configWithDefaults));
				if (idx != null) {
					// define drag
					selectedPointIndex = idx;
					return;
				}

				if (preFormPoints.length >= solution.length) {
					errorControl = `First define the solution, then draw the form.`;
					return;
				}

				preFormPoints.push([x, y]);
			}
			errorControl = null;
		});
	});

	function drawFormByLine() {
		const ctx = viewerCanvas?.getContext('2d');
		if (!ctx || !viewerCanvas) return;
		if (!interpolatedLinePoints?.length) return;

		const points = interpolatedLinePoints;
		const palette = generateHueColorPalette(points.length);
		// const radius = getRadius(configWithDefaults);

		for (let i = 0; i < points.length; i++) {
			const [x, y] = points[i];

			ctx.beginPath();
			ctx.arc(x, y, 4, 0, Math.PI * 2);
			ctx.fillStyle = palette[i];
			ctx.fill();
		}
	}

	function drawFormMarkers() {
		let ctx = viewerCanvas?.getContext('2d');
		if (!ctx || !viewerCanvas) return;
		if (!preFormPoints || preFormPoints.length === 0) return;

		ctx.font = configWithDefaults.FONT_STRING;

		for (let i = 0; i < preFormPoints.length; i++) {
			const entry = preFormPoints[i];
			ctx.beginPath();
			ctx.arc(entry[0], entry[1], getRadius(configWithDefaults), 0, 2 * Math.PI);
			ctx.fillStyle = configWithDefaults.COLORS[i % configWithDefaults.COLORS.length];
			ctx.fill();

			if (containsPosition(invalidPoints, entry) != null) {
				ctx.beginPath();
				ctx.arc(entry[0], entry[1], getRadius(configWithDefaults) * 1.125, 0, 2 * Math.PI);
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 2;
				ctx.stroke();
			}

			const char = String(i);
			const charMeasure = ctx.measureText(char);
			const charPos: [number, number] = [
				entry[0] - charMeasure.width / 2,
				entry[1] + charMeasure.actualBoundingBoxAscent / 2
			];
			const pos: PositionEntry = {
				char,
				pos: charPos,
				color: 'black',
				index: null
			};
			drawChar(ctx, pos, configWithDefaults);
		}
	}

	function clear() {
		preFormPoints = [];
		preFormLinePoints = [];
	}
</script>

<div class="wrapper">
	<aside class="side-panel">
		{#if errorControl}
			<div class="error">
				<p>{errorControl}</p>
			</div>
		{/if}

		<button
			type="button"
			onclick={() => {
				if (drawFormMode && preFormPoints != null && preFormPoints.length > 0) {
					// If in draw form mode, clear the preForm
					preFormPoints = [];
				}
				drawFormMode = !drawFormMode;
			}}
		>
			{#if drawFormMode}
				Randomize
			{:else}
				Draw Form
			{/if}
		</button>

		{#if drawFormMode && preFormPoints != null && preFormPoints.length > 0}
			<button type="button" onclick={() => preFormPoints?.pop()}> Undo </button>
		{/if}

		{#if drawFormMode}
			<button type="button" onclick={clear}> Clear </button>
		{/if}

		{#if drawFormMode}
			<ToggleGroup
				options={[
					{ value: 'points', label: 'Draw By Points' },
					{ value: 'line', label: 'Draw By Line' },
					{ value: 'shape', label: 'Draw By Shape' }
				]}
				bind:value={drawFormBy}
			/>

			{#if drawFormBy == 'shape'}
				<select bind:value={selectedShape}>
					<option value="" disabled selected>Select a shape</option>
					{#each shapes as shape (shape)}
						<option value={shape}>{shape}</option>
					{/each}
				</select>
				<button type="button" disabled={!selectedShape}>Draw the Shape</button>
			{/if}
		{/if}
	</aside>

	<main>
		{#if error}
			<div class="error">
				<p>{error}</p>
			</div>
		{/if}

		<div class="controls">
			<div>
				<label for="">Solution:</label>
				<input type="text" bind:value={solution} />
			</div>

			<div>
				<button type="button" onclick={generate} disabled={solution.length === 0 || loading}>
					{#if loading}
						Loading...
					{:else}
						Generate
					{/if}
				</button>

				<button
					type="button"
					onclick={() => {
						showSolution = !showSolution;
					}}
					disabled={!hasCalculated}
				>
					Toggle Solution
				</button>
				<button type="button" onclick={saveLevel} disabled={!hasCalculated}> Save </button>
			</div>
		</div>

		<div>
			ColoredNonSolution: {coloredNonSolution} / {solution.length}
		</div>

		<ColorConnectViewer
			bind:canvas={viewerCanvas}
			solutionLength={solution.length}
			{hasCalculated}
			config={configWithDefaults}
			{positions}
			{showSolution}
			enableControls={false}
			notGeneratedText={!loading && drawFormMode ? 'Draw a form' : undefined}
		/>
	</main>

	<aside class="level-control">
		<ToggleGroup
			label="Config Preset"
			options={[
				{ value: 'LARGE', label: 'Large' },
				{ value: 'MEDIUM', label: 'Medium' },
				{ value: 'SMALL', label: 'Small' },
				{ value: 'TINY', label: 'Tiny' },
				{ value: 'INSANE_SMALL_AND_MANY', label: 'Very tiny' }
			]}
			value={configPreset}
			onselect={(selection) => {
				if (selection in CONFIG_PRESETS) {
					const preset = selection as keyof typeof CONFIG_PRESETS;
					config = CONFIG_PRESETS[preset];
					configPreset = preset;
				}
			}}
		/>

		<label class="input-wrapper">
			Char Size {config.FONT_SIZE_PX}
			<input
				type="range"
				min="0"
				max="150"
				value={config.FONT_SIZE_PX}
				oninput={(e) => {
					const size = Number(e.currentTarget.value);

					config.FONT_SIZE_PX = size;
				}}
			/>
		</label>

		<label class="input-wrapper">
			Min Char Size {config.MIN_CHAR_DISTANCE}
			<input
				type="range"
				min="0"
				max="150"
				value={config.MIN_CHAR_DISTANCE}
				oninput={(e) => {
					const size = Number(e.currentTarget.value);

					config.MIN_CHAR_DISTANCE = size;
				}}
			/>
		</label>

		<label class="input-wrapper">
			Min Anti-Confusion Distance {config.MIN_MIXUP_DIFF}
			<input
				type="range"
				min="0"
				max="250"
				value={config.MIN_MIXUP_DIFF}
				oninput={(e) => {
					const size = Number(e.currentTarget.value);

					config.MIN_MIXUP_DIFF = size;
				}}
			/>
		</label>

		<label class="input-wrapper">
			Spray {config.MAX_ATTEMPTS.SPRAY}
			<input
				type="range"
				min="0"
				max="1000"
				value={config.MAX_ATTEMPTS.SPRAY}
				oninput={(e) => {
					const size = Number(e.currentTarget.value);

					config.MAX_ATTEMPTS.SPRAY = size;
				}}
			/>
		</label>

		<label class="input-wrapper">
			Gray Spawn Change {config.GRAY_SPAWN_CHANCE}
			<input
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={config.GRAY_SPAWN_CHANCE}
				oninput={(e) => {
					const size = Number(e.currentTarget.value);
					config.GRAY_SPAWN_CHANCE = size;
				}}
			/>
		</label>

		<ColorPalette bind:colors={config.COLORS} />
	</aside>
</div>

<style>
	.wrapper {
		display: grid;
		grid-template-columns: 400px 1fr 400px;
		min-height: 100vh;
		margin: 0 3rem;
	}

	main {
		min-width: 0;
		width: fit-content;
		margin: 0 auto;
	}

	aside {
		/* margin: 1rem; */
		margin-top: 3rem;
	}

	.error {
		border: 1px solid red;
		padding: 0.5rem;
		max-width: 700px;
		margin: 0 auto;
		margin-top: 1rem;
	}

	.error p {
		color: red;
		white-space: wrap;
		text-wrap: wrap;
	}

	.controls {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.level-control {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
