<script lang="ts">
	import { onMount } from 'svelte';
	import { createRobotoffApi } from '$lib/api';
	import Card from '$lib/ui/Card.svelte';
	import { _ } from '$lib/i18n';
	import Logo from '$lib/ui/Logo.svelte';
	import { ROBOTOFF_URL } from '$lib/const';
	import type { LogoAnnotation } from '@openfoodfacts/openfoodfacts-nodejs';

	interface LogoImage {
		logo_id: number;
		image_url?: string;
		type?: string;
		value?: string;
		confidence?: number;
	}

	type AnnotationType = LogoAnnotation['type'];

	let { barcode, logos: initialLogos = [] }: { barcode: string; logos?: LogoImage[] } = $props();

	let logos: LogoImage[] = $state(initialLogos);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	let selectedAnnotations: Map<number, AnnotationType> = $state(new Map());
	let selectedValues: Map<number, string> = $state(new Map());
	let annotatingLogoId: number | null = $state(null);

	const annotationOptions: AnnotationType[] = [
		'brand',
		'label',
		'category',
		'no_logo',
		'nutritional_label',
		'packager_code',
		'packaging',
		'qr_code',
		'store'
	];

	async function fetchLogos() {
		// Only fetch if we don't already have logos data
		if (logos.length > 0) {
			loading = false;
			return;
		}

		loading = true;
		error = null;
		successMessage = null;

		try {
			const robotoff = createRobotoffApi(fetch);
			console.log("ROBOTOFF_URL:", ROBOTOFF_URL);
			const response = await robotoff.searchLogos({
				barcode: barcode,
			});
			console.log("responseeee",response);
			if (response.data?.logos) {
				logos = response.data.logos.map((logo: Record<string, any>) => ({
					logo_id: logo.logo_id || logo.id,
					image_url: logo.image_url || logo.crop_data?.image_url,
					type: logo.type,
					value: logo.value,
					confidence: logo.confidence
				}));
			} else {
				logos = [];
			}
		} catch (err) {
			error = `Error fetching logos: ${err instanceof Error ? err.message : 'Unknown error'}`;
			logos = [];
			console.error('Error fetching logos:', err);
		} finally {
			loading = false;
		}
	}

	async function annotateLogo(logoId: number) {
		const annotationType = selectedAnnotations.get(logoId);
		if (!annotationType) {
			error = 'Please select an annotation type';
			return;
		}

		annotatingLogoId = logoId;
		error = null;
		successMessage = null;

		try {
			const robotoff = createRobotoffApi(fetch);

			const annotationValue = selectedValues.get(logoId) || '';

			const annotation = {
				logo_id: logoId,
				type: annotationType,
				value: annotationValue || null
			};

			const response = await robotoff.annotateLogos([annotation]);
			if (response.data) {
				successMessage = `Logo annotated as ${annotationType}`;
				// Remove the logo from the UI
				logos = logos.filter((logo) => logo.logo_id !== logoId);
				selectedAnnotations.delete(logoId);
				selectedValues.delete(logoId);

				// Clear success message after 3 seconds
				setTimeout(() => {
					successMessage = null;
				}, 3000);
			}
		} catch (err) {
			error = `Error annotating logo: ${err instanceof Error ? err.message : 'Unknown error'}`;
			console.error('Error annotating logo:', err);
		} finally {
			annotatingLogoId = null;
		}
	}

	onMount(() => {
		if (barcode) {
			fetchLogos();
		}
	});
</script>

{#if logos.length > 0 || loading || error}
	<Card>
		<div class="mb-4">
			<h2 class="mb-2 text-2xl font-bold sm:text-3xl">🤖 AI Insights - Logo Detection</h2>
			{#if logos.length > 0}
				<p class="text-sm text-gray-600">
					{logos.length} logo{logos.length !== 1 ? 's' : ''} needing review
				</p>
			{/if}
		</div>

		{#if error}
			<div class="alert alert-error mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m0-2l2 2"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Error</h3>
					<div class="text-xs">{error}</div>
				</div>
			</div>
		{/if}

		{#if successMessage}
			<div class="alert alert-success mb-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">Success</h3>
					<div class="text-xs">{successMessage}</div>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-8">
				<span class="loading loading-spinner loading-lg"></span>
				<span class="ml-2">Loading logos...</span>
			</div>
		{:else if logos.length === 0}
			<div class="alert">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span>No logos need review at this time.</span>
			</div>
		{:else}
			<div class="space-y-4">
				{#each logos as logo (logo.logo_id)}
					<div class="rounded border border-gray-300 p-4">
						<div class="mb-3 grid grid-cols-1 gap-4 md:grid-cols-3">
							{#if logo.image_url}
								<div class="md:col-span-1">
									<img
										src={logo.image_url}
										alt="Logo crop"
										class="h-auto w-full rounded object-cover"
									/>
								</div>
								<div class="md:col-span-2">
									<div class="mb-3 space-y-2">
										{#if logo.type}
											<div>
												<span class="font-semibold">Predicted Type:</span>
												<span class="ml-2">{logo.type}</span>
											</div>
										{/if}
										{#if logo.value}
											<div>
												<span class="font-semibold">Predicted Value:</span>
												<span class="ml-2">{logo.value}</span>
											</div>
										{/if}
										{#if logo.confidence}
											<div>
												<span class="font-semibold">Confidence:</span>
												<span class="ml-2">
													{(logo.confidence * 100).toFixed(1)}%
												</span>
											</div>
										{/if}
									</div>

									<div class="space-y-3">
										<div>
											<label for="annotation-{logo.logo_id}" class="mb-2 block text-sm font-medium">
												Annotation Type
											</label>
											<select
												id="annotation-{logo.logo_id}"
												class="select select-bordered w-full"
												value={selectedAnnotations.get(logo.logo_id) || ''}
												onchange={(e) => {
													const value = e.currentTarget.value as AnnotationType;
													if (value) {
														selectedAnnotations.set(logo.logo_id, value);
													} else {
														selectedAnnotations.delete(logo.logo_id);
													}
												}}
											>
												<option value="">Select annotation type</option>
												{#each annotationOptions as option}
													<option value={option}>
														{option}
													</option>
												{/each}
											</select>
										</div>

										<button
											class="btn btn-primary w-full"
											disabled={annotatingLogoId === logo.logo_id ||
												!selectedAnnotations.get(logo.logo_id)}
											onclick={() => annotateLogo(logo.logo_id)}
										>
											{#if annotatingLogoId === logo.logo_id}
												<span class="loading loading-spinner loading-sm"></span>
												Submitting...
											{:else}
												Submit Annotation
											{/if}
										</button>
									</div>
								</div>
							{:else}
								<div class="md:col-span-3">
									<div class="mb-3 space-y-2">
										{#if logo.type}
											<div>
												<span class="font-semibold">Predicted Type:</span>
												<span class="ml-2">{logo.type}</span>
											</div>
										{/if}
										{#if logo.value}
											<div>
												<span class="font-semibold">Predicted Value:</span>
												<span class="ml-2">{logo.value}</span>
											</div>
										{/if}
										{#if logo.confidence}
											<div>
												<span class="font-semibold">Confidence:</span>
												<span class="ml-2">
													{(logo.confidence * 100).toFixed(1)}%
												</span>
											</div>
										{/if}
									</div>

									<div class="space-y-3">
										<div>
											<label
												for="annotation-noimg-{logo.logo_id}"
												class="mb-2 block text-sm font-medium"
											>
												Annotation Type
											</label>
											<select
												id="annotation-noimg-{logo.logo_id}"
												class="select select-bordered w-full"
												value={selectedAnnotations.get(logo.logo_id) || ''}
												onchange={(e) => {
													const value = e.currentTarget.value as AnnotationType;
													if (value) {
														selectedAnnotations.set(logo.logo_id, value);
													} else {
														selectedAnnotations.delete(logo.logo_id);
													}
												}}
											>
												<option value="">Select annotation type</option>
												{#each annotationOptions as option}
													<option value={option}>
														{option}
													</option>
												{/each}
											</select>
										</div>

										<button
											class="btn btn-primary w-full"
											disabled={annotatingLogoId === logo.logo_id ||
												!selectedAnnotations.get(logo.logo_id)}
											onclick={() => annotateLogo(logo.logo_id)}
										>
											{#if annotatingLogoId === logo.logo_id}
												<span class="loading loading-spinner loading-sm"></span>
												Submitting...
											{:else}
												Submit Annotation
											{/if}
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
{/if}
