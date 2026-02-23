<script lang="ts">
	interface Props {
		logoCount: number;
		barcode: string;
	}

	let { logoCount, barcode }: Props = $props();
</script>

{#if logoCount > 0}
	<a
		href={`/products/${barcode}/logos`}
		class="flex items-center gap-2 rounded-md border-l-4 border-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:text-amber-950 dark:border-amber-500 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-200 dark:hover:text-amber-50"
	>
		<svg class="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
			<path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
		</svg>
		<span>Annotate {logoCount} logo{logoCount !== 1 ? 's' : ''}</span>
		<svg class="h-3 w-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
		</svg>
	</a>
{/if}
