<script lang="ts">
	import { onMount } from 'svelte';
	import ColorConnectViewer from './ColorConnectViewer.svelte';
	import {
		type ColorConnectConfig,
		type ColorConnectInputs,
		type PositionEntry,
		applyDefaultsToConfig
	} from './logic';
	import { CONFIG_PRESETS } from './presets';
	import { encodeLevel } from './encoding';
	import { countColoredNonSolution } from './helpers';
	import { dev } from '$app/env';

	let solution: string = $state('');
	let config: ColorConnectInputs = $state(CONFIG_PRESETS.LARGE);

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
			if (data.error) {
				error = 'No valid solution found. Please try a different solution.';
				loading = false;
				return;
			}

			positions = data.positions;
			hasCalculated = true;

			loading = false;

			calcStats(positions);
		};

		// generate();
	});

	function generate() {
		if (!worker) return;

		loading = true;
		hasCalculated = false;

		worker.postMessage({
			solution: $state.snapshot(solution),
			config: $state.snapshot(configWithDefaults)
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
			`${dev ? '/create' : '/cc.html'}?level=${encodeURIComponent(levelString)}`,
			'_blank'
		);
	}
</script>

<div class="wrapper">
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
		solutionLength={solution.length}
		{hasCalculated}
		config={configWithDefaults}
		{positions}
		{showSolution}
		enableControls={false}
	/>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.error {
		border: 1px solid red;
	}

	.error p {
		color: red;
	}

	.controls {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 1rem;
	}
</style>
