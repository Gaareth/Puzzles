<script lang="ts">
	import ColorConnectEditor from '$lib/components/ColorConnect/ColorConnectEditor.svelte';
</script>

<svelte:head>
	<title>Create a Color Connect Puzzle</title>	
</svelte:head>	

<div class="wrapper">
	<ColorConnectEditor />
</div>

<style>
	.wrapper {
		/* display: flex;
		justify-content: center;
		align-items: flex-start;
		min-height: 100vh;
		padding-top: 2rem;
		box-sizing: border-box; */
	}
</style>
