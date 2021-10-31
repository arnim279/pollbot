import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';
import { addVote, deleteVote } from '../lib/database.ts';
import { updateMessage } from '../lib/manageMessage.ts';

export async function handleComponentInteraction(
	interaction: gateWayTypes.APIMessageComponentGuildInteraction
): Promise<gateWayTypes.APIInteractionResponse> {
	let [poll_id, type, action] = interaction.data.custom_id.split('_');

	console.log(parseInt(poll_id));

	switch (type) {
		case 'vote': {
			switch (action) {
				case 'delete': {
					deleteVote({
						poll_id,
						user_id: interaction.member.user.id,
						chosen_option: 0,
					});

					await updateMessage(parseInt(poll_id));

					return {
						type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
						data: {
							content: 'deleted your vote',
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}

				default: {
					const chosen_option = parseInt(action);

					addVote({
						poll_id,
						user_id: interaction.member.user.id,
						chosen_option,
					});

					await updateMessage(parseInt(poll_id));

					return {
						type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
						data: {
							content: `added vote for option ${chosen_option}`,
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}
			}
		}

		case 'poll': {
			break;
		}
	}

	return {
		type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'component',
			flags: gateWayTypes.MessageFlags.Ephemeral,
		},
	};
}
