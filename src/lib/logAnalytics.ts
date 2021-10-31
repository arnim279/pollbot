import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';

export async function logAnalytics(interaction: any) {
	Deno.writeTextFile(
		'./data/analytics.csv',
		'\n' +
			[
				Math.floor(new Date().valueOf() / 1000),
				interaction.type,
				`${interaction.data?.name || ''} ${
					interaction.data?.options?.[0]?.name || ''
				}`,
			].join(','),
		{ append: true }
	);

	('lol');
}
