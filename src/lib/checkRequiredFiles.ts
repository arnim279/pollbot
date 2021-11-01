export function checkRequiredFiles() {
	let config: Record<string, string | boolean> = {};
	try {
		config = JSON.parse(Deno.readTextFileSync('./config.json'));
	} catch {
		console.error('./config.json invalid');
		Deno.exit(1);
	}

	if (config.analytics === true) {
		try {
			if (Deno.readTextFileSync('./data/analytics.csv') === '')
				throw new Error();
		} catch {
			Deno.writeTextFile(
				'./data/analytics.csv',
				'unix_time_secs, interaction_type, interaction_name'
			);
		}
	}
}
