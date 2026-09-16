<script lang="ts">
	import ColorConnectViewer from '$lib/components/ColorConnect/ColorConnectViewer.svelte';
	import { decodeLevel } from '$lib/components/ColorConnect/encoding';
	import { browser } from '$app/environment';
	import type { PositionEntry } from '$lib/components/ColorConnect/logic';
	import type { LevelDrawConfig } from '$lib/components/ColorConnect/presets';
	import QRCode from 'qrcode';
	import { onMount } from 'svelte';

	let positions: PositionEntry[] = $state([]);
	let config: LevelDrawConfig | null = $state(null);
	let canvas: HTMLCanvasElement;

	if (browser) {
		const level = new URLSearchParams(window.location.search).get('level');

		if (level) {
			const levelData = decodeLevel(level);
			positions = levelData.positions;
			config = levelData.config;
		}
	}
	onMount(async () => {
		if (canvas) {
			generateQRCode();
		}
	});
	async function generateQRCode() {
		await QRCode.toCanvas(canvas, document.URL, {
			errorCorrectionLevel: 'L'
		});
	}
</script>

<svelte:head>
	<title>Play Color Connect</title>
</svelte:head>

<div class="wrapper">
	{#if config}
		<ColorConnectViewer {positions} {config} hasCalculated={true} enableControls={true} />
	{/if}
</div>
<div class="qr-code"><p>Scan this QR code to view the puzzle and play online:</p><canvas bind:this={canvas}></canvas></div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}

	.qr-code {
		display: none;
	} 

	 @media print {
		.qr-code {
			display: block;
		}
	}
</style>
