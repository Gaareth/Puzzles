<script lang="ts">
	import AddIcon from '$lib/assets/icons/AddIcon.svelte';
	import DeleteIcon from '$lib/assets/icons/DeleteIcon.svelte';
	import ReloadIcon from '$lib/assets/icons/ReloadIcon.svelte';

	let { colors = $bindable(['#ff0000', '#00ff00', '#0000ff']) } = $props();

	function updateColor(index: number, color: string) {
		colors[index] = color;
	}

	function addColor() {
		colors.push('#ffffff');
	}

	function deleteColor(index: number) {
		colors.splice(index, 1);
	}

	function rotateColors() {
		if (colors.length < 2) return;

		colors = [...colors.slice(1), colors[0]];
	}
</script>

<div class="palette toggle-group">
	{#each colors as color, index (index)}
		<div class="color-entry">
			<input
				type="color"
				value={color}
				oninput={(e) => updateColor(index, e.currentTarget.value)}
			/>

			<button type="button" onclick={() => deleteColor(index)} class="icon-wrapper">
				<DeleteIcon size={24} />
			</button>
		</div>
	{/each}

	<button type="button" onclick={addColor} class="icon-wrapper">
		<AddIcon size={24} />
	</button>

	<button type="button" onclick={rotateColors} class="icon-wrapper last-entry">
		<ReloadIcon size={24} />
	</button>
</div>

<style>
	.palette {
		display: flex;
        flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
	}

	.color-entry {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	input[type='color'] {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		border: none;
		cursor: pointer;
	}

	button {
		cursor: pointer;
		/* height: 1.75rem;
        width: 1.75rem; */
		/* padding: 0.25 0.25rem; */
		padding: 0.5rem;
	}
</style>
