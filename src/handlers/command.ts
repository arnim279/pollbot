import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';
import { createPoll, addPollOption } from '../lib/database.ts';
import { updateMessage } from '../lib/manageMessage.ts';
import { getJSONFromSQLQuery, query } from '../lib/database.ts';
import { Poll } from '../types.ts';

export async function handleApplicationCommand(
	interaction: gateWayTypes.APIChatInputApplicationCommandGuildInteraction
): Promise<gateWayTypes.APIInteractionResponse> {
	const command = interaction.data
		.options?.[0] as gateWayTypes.ApplicationCommandInteractionDataOptionSubCommand;

	switch (command.name) {
		case 'create': {
			createPoll({
				channel_id: interaction.channel_id,
				creator_id: interaction.member.user.id,
				last_updated: Math.floor(new Date().valueOf() / 1000),
				message_id: '', //will be overwritten later
				option_count: command.options.filter(o => o.name.startsWith('option-'))
					.length,
				poll_type: Number(
					!(
						command.options.find(o => o.name === 'show-results-immediately')
							?.value ?? true
					)
				) as 0 | 1,
				poll_id: 0, //will be overwritten anyways
				title: command.options.find(o => o.name === 'title')?.value as string,
				creator_name: interaction.member.user.username,
			});

			const { poll_id } = getJSONFromSQLQuery<Poll>(
				'SELECT poll_id FROM polls WHERE channel_id = ?',
				[interaction.channel_id]
			).at(-1) as Poll;

			for (const option of command.options.filter(o =>
				o.name.startsWith('option-')
			)) {
				addPollOption({ poll_id, value: option.value as string });
			}

			const message_id = await updateMessage(poll_id);

			query('UPDATE polls SET message_id = ? WHERE poll_id = ?;', [
				message_id,
				poll_id,
			]);

			return {
				type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: 'poll created 📊',
					flags: gateWayTypes.MessageFlags.Ephemeral,
				},
			};
		}

		case 'invite': {
			return {
				type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
				data: {
					content:
						'[invite me](https://discord.com/api/oauth2/authorize?client_id=858402957966835762&permissions=2048&scope=bot%20applications.commands)',
					flags: gateWayTypes.MessageFlags.Ephemeral,
				},
			};
		}

		default: {
			return {
				type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: 'unknown command',
					flags: gateWayTypes.MessageFlags.Ephemeral,
				},
			};
		}
	}
}
