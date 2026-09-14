<script lang="ts">
	import ColorConnectViewer from '$lib/components/ColorConnect/ColorConnectViewer.svelte';
	import { decodeLevel } from '$lib/components/ColorConnect/encoding';
	import { browser } from '$app/environment';
	import type { PositionEntry } from '$lib/components/ColorConnect/logic';
	import type { LevelDrawConfig } from '$lib/components/ColorConnect/presets';


	let positions: PositionEntry[] = $state([]);
	let config: LevelDrawConfig | null = $state(null);

	if (browser) {
		const level = new URLSearchParams(window.location.search).get('level');

		if (level) {
			const levelData = decodeLevel(level);
			positions = levelData.positions;
			config = levelData.config;
		}
	}
</script>

<div class="wrapper">
	{#if config}
		<ColorConnectViewer {positions} {config} hasCalculated={true} enableControls={true} />
	{/if}
</div>

<style>
	.wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
</style>
