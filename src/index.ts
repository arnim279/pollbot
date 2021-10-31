import { Application } from 'https://deno.land/x/oak@v9.0.0/mod.ts';
import { isVerified } from 'https://deno.land/x/deno_verify_discord@1.2/index.ts';
import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';

import { checkRequiredFiles } from './lib/checkRequiredFiles.ts';
checkRequiredFiles();

import { initDatabase } from './lib/database.ts';
initDatabase();

import { handleApplicationCommand } from './handlers/command.ts';
import { handleComponentInteraction } from './handlers/component.ts';
import { logAnalytics } from './lib/logAnalytics.ts';

export const config = JSON.parse(Deno.readTextFileSync('./config.json'));

const app = new Application();

app.use(async function (ctx) {
	let interaction;
	try {
		interaction = (await ctx.request.body({ type: 'json' })
			.value) as gateWayTypes.APIInteraction;
	} catch {
		ctx.response.status = 415;
		return;
	}

	if (
		!isVerified(
			JSON.stringify(interaction),
			ctx.request.headers,
			config.applicationKey
		)
	) {
		ctx.response.status = 401;
		return;
	}

	logAnalytics(interaction);

	if (
		!interaction.member &&
		interaction.type !== gateWayTypes.InteractionType.Ping
	) {
		ctx.response.body = {
			type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: "you can't use this bot in a dm",
				flags: gateWayTypes.MessageFlags.Ephemeral,
			},
		};
		return;
	}

	switch (interaction.type) {
		case gateWayTypes.InteractionType.Ping: {
			ctx.response.body = { type: gateWayTypes.InteractionResponseType.Pong };
			break;
		}

		case gateWayTypes.InteractionType.ApplicationCommand: {
			ctx.response.body = await handleApplicationCommand(
				interaction as gateWayTypes.APIChatInputApplicationCommandInteraction //this bot doesn't have context menus
			);
			break;
		}

		case gateWayTypes.InteractionType.MessageComponent: {
			ctx.response.body = await handleComponentInteraction(interaction);
			break;
		}
	}
});

app.listen('0.0.0.0:4000');
console.log('bot listening for interactions on :4000');
