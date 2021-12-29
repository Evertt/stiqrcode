<script lang="ts">
	import { tweened } from "svelte/motion"
	import { cubicOut, cubicInOut } from "svelte/easing"

	export let value: number
	export let max: number

	const duration = 400

	const progress = tweened(0, {
		duration, easing: cubicInOut
	})

	$: if (value != null && max > 0) {
		$progress = Math.min(value / max, 1)
		
		if (value < max)
			progress.set((value+1) / max * .95, {
				easing: cubicOut,
				duration: 10000,
				delay: duration + 100
			})
	}
</script>

<progress class="h-4" value={$progress} />

<style>
	progress[value]::-webkit-progress-bar {
		background-color: #eee;
		border-radius: 8px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
	}

	progress[value]::-webkit-progress-value {
		background-image:
			-webkit-linear-gradient(top, 
															rgba(255, 255, 255, .125), 
															rgba(0, 0, 0, .125)),
			-webkit-linear-gradient(left, #363, #363);

		border-radius: 8px; 
		background-size: 100% 100%, 100% 100%;
	}
</style>