import * as gateWayTypes from 'https://deno.land/x/discord_api_types@0.24.0/payloads/v9/mod.ts';

export function handleApplicationCommand(
	interaction: gateWayTypes.APIChatInputApplicationCommandInteraction
): gateWayTypes.APIInteractionResponse {
	return {
		type: gateWayTypes.InteractionResponseType.ChannelMessageWithSource,
		data: {
			content: 'command',
		},
	};
}
