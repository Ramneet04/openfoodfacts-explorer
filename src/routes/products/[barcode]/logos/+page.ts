import type { PageLoad } from './$types';
import { createRobotoffApi } from '$lib/api';
import type { LogoAnnotation } from '@openfoodfacts/openfoodfacts-nodejs';

export const load: PageLoad = async ({ params, fetch, parent }) => {
	const { barcode } = params;

	try {
		const parentData = await parent();
		if (parentData.logos && parentData.logos.length > 0) {
			return {
				barcode,
				logos: parentData.logos,
				logoCount: parentData.logos.length
			};
		}

		const robotoff = createRobotoffApi(fetch);
		const response = await robotoff.searchLogos({
			barcode: barcode,
		});

		const logos = response.data?.logos?.map((logo: Record<string, any>) => ({
			logo_id: logo.logo_id || logo.id,
			image_url: logo.image_url || logo.crop_data?.image_url,
			type: logo.type,
			value: logo.value,
			confidence: logo.confidence
		})) || [];

		return {
			barcode,
			logos,
			logoCount: logos.length
		};
	} catch (error) {
		console.error('Error loading logos:', error);
		return {
			barcode,
			logos: [],
			logoCount: 0,
			error: 'Failed to load logos'
		};
	}
};
