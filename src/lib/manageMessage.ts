import * as restAPITypes from 'https://deno.land/x/discord_api_types@0.24.0/rest/v9/mod.ts';
import { config } from '../index.ts';
import { Poll, PollOption } from '../types.ts';
import { getJSONFromSQLQuery, query } from './database.ts';
import { randomDiscordSquareEmojiList } from './randomDiscordSquareEmojiList.ts';

/**
 * @returns the message id
 */
export async function updateMessage(poll_id: number, closing = false) {
	const poll = getJSONFromSQLQuery<Poll>(
		'SELECT * FROM polls WHERE poll_id = ?;',
		[poll_id]
	)[0];
	const options = getJSONFromSQLQuery<PollOption>(
		'SELECT * FROM polloptions WHERE poll_id = ?;',
		[poll_id]
	);

	const maxEmojis = 20;
	const voteAmount = getJSONFromSQLQuery(
		'SELECT * FROM votes WHERE poll_id = ?;',
		[poll_id]
	).length;

	const last_update = Math.floor(new Date().valueOf() / 1000);

	const emojis = randomDiscordSquareEmojiList(poll_id, options.length);

	const message: restAPITypes.RESTPostAPIChannelMessageJSONBody = {
		embeds: [
			{
				title: poll.title + (closing ? ' - CLOSED' : ''),
				description: `by ${poll.creator_name}`,
				color: 5727471, //blurple
				fields: options.map((option, index) => {
					const percentage =
						getJSONFromSQLQuery(
							'SELECT * FROM votes WHERE poll_id = ? AND chosen_option = ?;',
							[poll_id, index]
						).length / voteAmount || 0;

					return {
						name: option.value,
						value:
							poll.poll_type === 0 || closing
								? `${emojis[index].repeat(percentage * maxEmojis)} *(${
										percentage * 100
								  }%)*`
								: "results aren't visible while the poll is still open",
					};
				}),
				footer: {
					text: `${voteAmount} total votes`,
				},
				timestamp: new Date().toISOString(),
			},
		],
		components: [
			...(closing
				? []
				: [
						{
							type: 1,
							components: options.map((option, index) => ({
								type: 2,
								label: option.value || 'option',
								custom_id: `${poll_id}_vote_${index}`,
								style: 1,
							})),
						},
				  ]),
			{
				type: 1,
				components: [
					{
						type: 2,
						label: 'delete my vote',
						custom_id: `${poll_id}_vote_delete`,
						style: 1,
						disabled: closing,
					},
					{
						type: 2,
						label: 'what did I vote for again?',
						custom_id: `${poll_id}_vote_info`,
						style: 1,
					},
					{
						type: 2,
						label: 'reload data',
						custom_id: `${poll_id}_poll_reload`,
						style: 1,
						disabled: closing,
					},
				],
			},
			{
				type: 1,
				components: [
					{
						type: 2,
						label: 'close vote',
						custom_id: `${poll_id}_poll_close`,
						style: 4,
						disabled: closing,
					},
				],
			},
		],
	};

	if (!poll.message_id) {
		//empty string when initialized
		const { id } = (await fetch(
			`https://discord.com/api/v9/channels/${poll.channel_id}/messages`,
			{
				method: 'POST',
				headers: {
					'authorization': `Bot ${config.botToken}`,
					'content-type': 'application/json',
				},
				body: JSON.stringify(message),
			}
		).then(r => r.json())) as restAPITypes.RESTPatchAPIChannelMessageResult;

		return id;
	}

	const { id } = (await fetch(
		`https://discord.com/api/v9/channels/${poll.channel_id}/messages/${poll.message_id}`,
		{
			method: 'PATCH',
			headers: {
				'authorization': `Bot ${config.botToken}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(message),
		}
	).then(r => r.json())) as restAPITypes.RESTPatchAPIChannelMessageResult;

	query('UPDATE polls SET last_updated = ? WHERE poll_id = ?;', [
		last_update,
		poll_id,
	]);

	return id;
}
