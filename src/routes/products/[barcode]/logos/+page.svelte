<script lang="ts">
	import { createRobotoffApi } from '$lib/api';
	import Card from '$lib/ui/Card.svelte';
	import type { LogoAnnotation } from '@openfoodfacts/openfoodfacts-nodejs';

	import IconMdiLoading from '@iconify-svelte/mdi/loading';
	import IconMdiArrowLeft from '@iconify-svelte/mdi/arrow-left';
	import IconMdiAlert from '@iconify-svelte/mdi/alert';
	import IconMdiCheckCircle from '@iconify-svelte/mdi/check-circle';
	import IconMdiInformation from '@iconify-svelte/mdi/information';

	interface LogoImage {
		logo_id: number;
		image_url?: string;
		type?: string;
		value?: string;
		confidence?: number;
	}

	type AnnotationType = LogoAnnotation['type'];

	interface PageProps {
		data: {
			barcode: string;
			logos: LogoImage[];
			logoCount: number;
			error?: string;
		};
	}

	let { data }: PageProps = $props();

	let logos = $state<LogoImage[]>(data.logos || []);
	let selectedAnnotations: Map<number, AnnotationType> = $state(new Map());
	let selectedValues: Map<number, string> = $state(new Map());
	let annotatingLogoId: number | null = $state(null);
	let successMessage = $state<string | null>(null);
	let error = $state<string | null>(data.error || null);

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
				successMessage = `Logo annotated successfully!`;
				logos = logos.filter((logo) => logo.logo_id !== logoId);
				selectedAnnotations.delete(logoId);
				selectedValues.delete(logoId);

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
</script>

<svelte:head>
	<title>Logo Annotations - Product {data.barcode}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-base-100">

	<div class="border-b border-base-300 bg-base-200 px-4 py-4 sm:px-6">
		<div class="mx-auto max-w-4xl">
			<div class="flex items-center gap-3">
				<a
					href={`/products/${data.barcode}`}
					class="btn btn-ghost btn-sm gap-2"
					title="Back to product"
				>
					<IconMdiArrowLeft class="h-5 w-5" />
					<span class="hidden sm:inline">Back</span>
				</a>
				<h1 class="flex-1 text-2xl font-bold">Logo Annotations</h1>
				<span class="badge badge-lg">{logos.length}</span>
			</div>
		</div>
	</div>

	<div class="flex-1 px-4 py-6 sm:px-6">
		<div class="mx-auto max-w-4xl">
			{#if error}
				<div class="alert alert-error mb-6">
				<IconMdiAlert class="h-6 w-6 shrink-0" />
						<div class="text-xs">{error}</div>
					</div>
				</div>
			{/if}

			{#if successMessage}
				<div class="alert alert-success mb-6">
				<IconMdiCheckCircle class="h-6 w-6 shrink-0" />
						<div class="text-xs">{successMessage}</div>
					</div>
				</div>
			{/if}

			{#if logos.length === 0}
				<Card>
					<div class="flex flex-col items-center justify-center py-12">
						<IconMdiInformation class="mb-4 h-16 w-16 opacity-50" />
						<h3 class="mb-2 text-lg font-semibold">No Logos to Annotate</h3>
						<p class="mb-6 text-center text-sm opacity-70">
							All logos for this product have been annotated or there are no logos detected.
						</p>
						<a
							href={`/products/${data.barcode}`}
							class="btn btn-primary btn-sm"
						>
							<IconMdiArrowLeft class="h-4 w-4" />
							Back to Product
						</a>
					</div>
				</Card>
			{:else}
				<div class="space-y-4">
					{#each logos as logo (logo.logo_id)}
						<Card>
							<div class="grid gap-6 sm:grid-cols-3">
								<!-- Image Section -->
								{#if logo.image_url}
									<div class="sm:col-span-1">
										<div class="overflow-hidden rounded-lg bg-base-200">
											<img
												src={logo.image_url}
												alt="Logo crop"
												class="h-auto w-full object-cover"
											/>
										</div>
									</div>

									<!-- Info Section -->
									<div class="sm:col-span-2">
										<div class="mb-6 space-y-3">
											{#if logo.type}
												<div class="flex items-start justify-between">
													<span class="font-semibold text-base-content">Predicted Type:</span>
													<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
														>{logo.type}</span
													>
												</div>
											{/if}
											{#if logo.value}
												<div>
													<span class="font-semibold text-base-content">Predicted Value:</span>
													<p class="mt-1 text-sm text-base-content/70">{logo.value}</p>
												</div>
											{/if}
											{#if logo.confidence}
												<div class="flex items-center gap-3">
													<span class="font-semibold text-base-content">Confidence:</span>
													<div class="flex-1">
														<div class="flex items-center gap-2">
															<progress
																class="progress progress-info h-2 flex-1"
																value={logo.confidence}
																max="1"
															></progress>
															<span class="w-12 text-right text-sm font-medium">
																{(logo.confidence * 100).toFixed(0)}%
															</span>
														</div>
													</div>
												</div>
											{/if}
										</div>

										
										<div class="space-y-4 border-t border-base-300 pt-4">
											<div>
												<label for="annotation-{logo.logo_id}" class="mb-2 block text-sm font-semibold">
													Select Annotation Type
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
													<option value="">Choose annotation type...</option>
													{#each annotationOptions as option}
														<option value={option}>
															{option.replace(/_/g, ' ')}
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
													<IconMdiLoading class="h-5 w-5 animate-spin" />
													Submitting...
												{:else}
													Submit Annotation
												{/if}
											</button>
										</div>
									</div>
								{:else}
									<div class="sm:col-span-3">
										<div class="mb-6 space-y-3">
											{#if logo.type}
												<div>
													<span class="font-semibold text-base-content">Predicted Type:</span>
													<span class="ml-3 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900 dark:bg-blue-900/30 dark:text-blue-300"
														>{logo.type}</span
													>
												</div>
											{/if}
											{#if logo.value}
												<div>
													<span class="font-semibold text-base-content">Predicted Value:</span>
													<p class="mt-1 text-sm text-base-content/70">{logo.value}</p>
												</div>
											{/if}
										</div>

										<div class="space-y-4 border-t border-base-300 pt-4">
											<div>
												<label for="annotation-{logo.logo_id}" class="mb-2 block text-sm font-semibold">
													Select Annotation Type
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
													<option value="">Choose annotation type...</option>
													{#each annotationOptions as option}
														<option value={option}>
															{option.replace(/_/g, ' ')}
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
													<IconMdiLoading class="h-5 w-5 animate-spin" />
													Submitting...
												{:else}
													Submit Annotation
												{/if}
											</button>
										</div>
									</div>
								{/if}
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
