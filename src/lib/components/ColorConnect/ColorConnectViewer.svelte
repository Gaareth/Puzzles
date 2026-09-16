<script lang="ts">
	import { onMount } from 'svelte';
	import { drawChar, drawStart, drawSolution, getLineWidth, getRadius } from './draw';
	import type { PositionEntry } from './logic';
	import type { LevelDrawConfig } from './presets';
	import { distance, measureText } from '$lib/utils';
	import { type SelectionEntry, cmpPositionEntry, cmpSelection } from './helpers';
	import '../../styles/app.css';

	interface Props {
		solutionLength?: number;
		showSolution?: boolean;

		hasCalculated: boolean;
		config: LevelDrawConfig;
		positions: PositionEntry[];
		enableControls?: boolean;
		canvas?: HTMLCanvasElement | null;
		notGeneratedText?: string;
	}

	let {
		solutionLength,
		hasCalculated,
		config,
		positions,
		showSolution,
		enableControls,
		canvas = $bindable(),
		notGeneratedText = 'Level has not been calculated yet.'
	}: Props = $props();

	// let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $derived(canvas?.getContext('2d'));

	const radius = $derived(getRadius(config));
	const lineWidth = $derived(getLineWidth(config));
	const COLOR_HOVER = 'lightgray';
	const COLOR_SELECTION = '#aaaaaa';

	let mouseIsDragging: [number, number] | null = $state(null);

	let selection: SelectionEntry[] = $state([]);
	let selectedSolution: string = $derived(
		selection
			.filter((s) => s?.entry)
			.map((s) => s!.entry.char)
			.join('')
	);

	function isValidSelection(selectedEntry: SelectionEntry) {
		if (!selectedEntry) return false;

		if (selection.length == 0 && !cmpPositionEntry(selectedEntry?.entry, positions[0])) {
			return false;
		}

		for (const selectionEntry of selection) {
			if (cmpSelection(selectionEntry, selectedEntry)) {
				return false;
			}
		}
		return true;
	}

	function onMouseUp(event: MouseEvent) {
		mouseIsDragging = null;

		if (!enableControls) return;
		if (!ctx) return;

		const nearest = getNearestChar(ctx, event.offsetX, event.offsetY);
		if (!nearest) return;
		if (!isValidSelection(nearest)) return;

		selection.push(nearest);

		draw();
	}

	function onMouseDown(event: MouseEvent) {
		if (!enableControls) return;
		if (!ctx) return;

		const nearest = getNearestChar(ctx, event.offsetX, event.offsetY);
		if (!nearest) return;
		mouseIsDragging = nearest.charCenter;

		if (!isValidSelection(nearest)) return;

		selection.push(nearest);
	}

	function drawSelect(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.fill();
	}

	function getNearestChar(ctx: CanvasRenderingContext2D, x: number, y: number) {
		for (const entry of positions) {
			const charMeasure = measureText(ctx, entry.char, config.FONT_STRING);

			const charCenter: [number, number] = [
				entry.pos[0] + charMeasure.width / 2,
				entry.pos[1] - charMeasure.height / 2
			];

			if (distance([x, y], charCenter) < radius) {
				return { charCenter, entry };
			}
		}

		return null;
	}

	function drawHover(ctx: CanvasRenderingContext2D, x: number, y: number) {
		const nearest = getNearestChar(ctx, x, y);

		if (nearest) {
			if (!isValidSelection(nearest)) return;

			drawSelect(ctx, nearest.charCenter[0], nearest.charCenter[1], COLOR_HOVER);
		}
	}

	function drawLine(
		ctx: CanvasRenderingContext2D,
		startX: number,
		startY: number,
		endX: number,
		endY: number
	) {
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = lineWidth;
		ctx.stroke();
	}

	function onMouseMove(event: MouseEvent) {
		if (!enableControls) return;
		if (!ctx) return;

		clear();

		// draw selection first below base
		drawHover(ctx, event.offsetX, event.offsetY);
		draw();

		if (mouseIsDragging) {
			draw(mouseIsDragging);

			// Line goes above characters
			const [startX, startY] = mouseIsDragging;
			drawLine(ctx, startX, startY, event.offsetX, event.offsetY);
		}
	}

	function draw(dragStart?: [number, number]) {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx || !hasCalculated) return;

		if (dragStart) {
			drawSelect(ctx, dragStart[0], dragStart[1], COLOR_SELECTION);
		}

		drawSelection(ctx);
		drawPuzzle(ctx);
	}

	function drawPuzzle(ctx: CanvasRenderingContext2D) {
		// Characters go on top of selections
		for (const entry of positions) {
			drawChar(ctx, entry, config);
		}

		drawStart(ctx, positions[0], config);

		if (showSolution && solutionLength != null) {
			drawSolution(ctx, positions, solutionLength, config);
		}
	}

	function drawSelection(ctx: CanvasRenderingContext2D) {
		for (let i = 0; i < selection.length; i++) {
			const sel = selection[i];

			if (!sel) continue;
			const [x, y] = sel.charCenter;
			drawSelect(ctx, x, y, COLOR_SELECTION);

			if (i > 0) {
				const prev = selection[i - 1];
				if (!prev) continue;
				drawLine(ctx, prev.charCenter[0], prev.charCenter[1], x, y);
			}
		}
	}

	function clear() {
		if (!ctx) return;
		ctx.clearRect(0, 0, config.WIDTH, config.HEIGHT);
	}

	onMount(() => {
		draw();
	});

	$effect(() => {
		clear();
		draw();
	});
</script>

<div class="viewer">
	{#if enableControls}
		<div class="controls">
			<label class="flex-col">
				<!-- Solution -->
				<input
					type="text"
					readonly
					disabled
					placeholder="Solution"
					title="Fill by playing"
					value={selectedSolution}
				/>
			</label>
			<button
				type="button"
				disabled={selectedSolution.length === 0}
				onclick={() => {
					window.open(`solution/${selectedSolution}`, '_blank');
				}}
			>
				Submit
			</button>
			{#if selection.length > 0}
				<button
					type="button"
					disabled={selectedSolution.length === 0}
					onclick={() => (selection = [])}
				>
					Clear
				</button>
				<button
					type="button"
					disabled={selectedSolution.length === 0}
					onclick={() => {
						selection.pop();
					}}
				>
					Undo
				</button>
			{/if}
		</div>
	{/if}

	<div class="canvas-wrapper">
		<canvas
			onmousedown={onMouseDown}
			onmousemove={onMouseMove}
			onmouseup={onMouseUp}
			onmouseleave={onMouseUp}
			bind:this={canvas}
			width={config.WIDTH}
			height={config.HEIGHT}
			class="canvas"
		>
		</canvas>

		{#if !hasCalculated}
			<div class="loading-overlay">
				<p>{notGeneratedText}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.viewer {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: fit-content;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
		align-items: end;
		justify-content: center;
	}

	.canvas-wrapper {
		border: 1px solid black;
		border-radius: 0.5rem;
		padding: 1rem;
		background-color: #fafafa;

		position: relative;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		color: #333;
		z-index: 10;
		pointer-events: none;
	}

	@media print {
		.controls {
			display: none;
		}
	}
</style>
