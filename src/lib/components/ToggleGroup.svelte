<script lang="ts" generics="T">
	type Option = { value: T; label: string };

	interface Props<T> {
		options: Option[];
		value?: T;
		onselect?: (value: T) => void;
		label?: string;
	}

	let { options, value = $bindable(), onselect, label }: Props<T> = $props();
	let activeIndex = $derived(
		Math.max(
			0,
			options.findIndex((option) => option.value === value)
		)
	);
	function select(index: number) {
		const option = options[index];
		if (!option) return;
		value = option.value;
		onselect?.(option.value);
		requestAnimationFrame(() => {
			document.getElementById(`toggle-${index}`)?.focus();
		});
	}
	function onKeydown(event: KeyboardEvent) {
		let index = activeIndex;
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				event.preventDefault();
				index = (index + 1) % options.length;
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				event.preventDefault();
				index = (index - 1 + options.length) % options.length;
				break;
			case 'Home':
				event.preventDefault();
				index = 0;
				break;
			case 'End':
				event.preventDefault();
				index = options.length - 1;
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				select(activeIndex);
				return;
			default:
				return;
		}
		select(index);
	}
</script>

<div class="wrapper">
	{#if label}
		<label for="toggle-group">{label}</label>
	{/if}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="toggle-group equal-width-cols"
		role="group"
		onkeydown={onKeydown}
		style={`--count: ${options.length}`}
		id="toggle-group"
	>
		{#each options as option, index (index)}
			<button
				id="toggle-{index}"
				type="button"
				role="radio"
				aria-checked={value === option.value}
				tabindex={index === activeIndex ? 0 : -1}
				class:active={value === option.value}
				onclick={() => select(index)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.equal-width-cols {
		display: grid;
		grid-template-columns: repeat(var(--count), 1fr);
	}

	.equal-width-rows {
		display: grid;
		grid-template-columns: 1fr;
	}

	:global(.toggle-group) {
		padding: 5px;
		gap: 4px;
		border: 1px solid #d4d4d4;
		border-radius: 0.5rem;
		background: #f5f5f5;
	}

	button {
		padding: 0.4rem 0.75rem;
		border: 0;
		border-radius: 0.35rem;
		background: transparent;
		color: #666;
		cursor: pointer;
		transition:
			background 0.1s,
			color 0.1s;
	}

	button:hover {
		/* color: black; */
		background: #ccc;
	}

	button.active {
		background: black;
		color: white;
		box-shadow: 0 1px 2px rgb(0 0 0 / 10%);
		font-weight: 600;
	}

	button:focus-visible {
		position: relative;
		z-index: 1;
		outline: 2px solid currentColor;
		outline-offset: -2px;
	}
</style>
