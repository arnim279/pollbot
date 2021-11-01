import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';
import {
	addVote,
	deleteVote,
	getJSONFromSQLQuery,
	deletePoll,
} from '../lib/database.ts';
import { updateMessage } from '../lib/manageMessage.ts';
import { Vote, Poll } from '../types.ts';

export async function handleComponentInteraction(
	interaction: gateWayTypes.APIMessageComponentGuildInteraction
): Promise<gateWayTypes.APIInteractionResponse> {
	let [poll_id, type, action] = interaction.data.custom_id.split('_');

	switch (type) {
		case 'vote': {
			switch (action) {
				case 'info': {
					const vote = getJSONFromSQLQuery<Vote>(
						'SELECT chosen_option FROM votes WHERE poll_id = ? AND user_id = ?;',
						[poll_id, interaction.member.user.id]
					)[0];

					return {
						type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
						data: {
							content: vote
								? `you voted for option ${vote.chosen_option + 1}`
								: "you didn't vote yet",
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}

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
							content: `added vote for option ${chosen_option + 1}`,
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}
			}
		}

		case 'poll': {
			switch (action) {
				case 'reload': {
					await updateMessage(parseInt(poll_id));

					return {
						type: gateWayTypes.InteractionResponseType.UpdateMessage,
						data: {},
					};
				}

				case 'close': {
					const poll = getJSONFromSQLQuery<Poll>(
						'SELECT * FROM polls WHERE poll_id = ?;',
						[parseInt(poll_id)]
					)[0];
					if (poll.creator_id !== interaction.member.user.id) {
						return {
							type: gateWayTypes.InteractionResponseType
								.ChannelMessageWithSource,
							data: {
								content: "you can't do this",
								flags: gateWayTypes.MessageFlags.Ephemeral,
							},
						};
					}

					return {
						type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
						data: {
							content:
								'are you sure you want to close this poll? this cannot be undone',
							components: [
								{
									type: 1,
									components: [
										{
											type: 2,
											label: "i'm sure",
											custom_id: `${poll_id}_poll_close-confirm`,
											style: 4,
										},
									],
								},
							],
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}

				case 'close-confirm': {
					await updateMessage(parseInt(poll_id), true);
					deletePoll(parseInt(poll_id));

					return {
						type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
						data: {
							content: 'closed',
							flags: gateWayTypes.MessageFlags.Ephemeral,
						},
					};
				}
			}
		}
	}

	return {
		type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'unknown interaction',
			flags: gateWayTypes.MessageFlags.Ephemeral,
		},
	};
}
