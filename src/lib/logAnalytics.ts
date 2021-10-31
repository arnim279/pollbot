export async function logAnalytics(interaction: any) {
	Deno.writeTextFile(
		'./data/analytics.csv',
		'\n' +
			[
				Math.floor(new Date().valueOf() / 1000),
				interaction.type,
				interaction.type === 2
					? `${interaction.data?.name || ''} ${
							interaction.data?.options?.[0]?.name || ''
					  }`
					: interaction.type === 1
					? interaction.data.custom_id
					: '',
			].join(','),
		{ append: true }
	);
}
