import { getJSONFromSQLQuery, SQLQuery } from "./database.ts";
import { EmbedField, Message } from "../types/message.ts";
import { InteractionResponse } from "../types/interaction.ts";
import { Poll, Vote } from "../types/custom.ts";
import { headers } from "./defaultHeaders.ts";
import { randomDiscordSquareEmojiList } from "./randomDiscordSquareEmojiList.ts";

//deno-fmt-ignore
export async function updateMessage( pollID: string, shouldClose = false ): Promise<InteractionResponse> {
  //deno-fmt-ignore
  const poll = getJSONFromSQLQuery(`SELECT * FROM polls WHERE poll_id = ${pollID}`)[0] as Poll


  //last updated: less than 5 seconds ago
  if (poll.last_updated > Math.floor(new Date().valueOf() / 1000) - 2 && shouldClose === false)  {
    return { type: 7, data: {} };
  }

  const messageURL =
    `https://discord.com/api/v9/channels/${poll.channel_id}/messages/${poll.message_id}`;

  //deno-fmt-ignore
  const votes = getJSONFromSQLQuery(`SELECT chosen_option FROM votes WHERE poll_id = ${pollID}`) as Vote[]

  const message = await fetch(messageURL, { headers: headers(true) }).then(
    (r) => r.json()
  ) as Message;
  const fields: EmbedField[] = message.embeds?.[0].fields as EmbedField[];

  const colors = randomDiscordSquareEmojiList(
    Number(pollID),
    fields.length - 1,
  );
  const newFields = fields.map((field, index) => {
    if (index === fields?.length - 1) {
      return {
        name: `${votes.length} vote${votes.length === 1 ? "" : "s"} in total`,
        value: `last updated <t:${poll.last_updated}:R>`,
      };
    }

    const votesForOption = votes.filter((vote) =>
      vote.chosen_option === index + 1
    ).length;
    let percentage = votesForOption / votes.length * 100
    if (isNaN(percentage)) percentage = 0
    return {
      name: field.name,
      value: poll.poll_type === 0 || shouldClose ?  colors[index].repeat(Math.floor(percentage / 100 * 20)) +
        `\n${votesForOption} votes (${percentage}%)` : "results aren't visible until the poll is over",
    };
  });

  if (!message.embeds || !message.components) return { type: 7, data: {} };
  message.embeds[0].fields = newFields;


  if (shouldClose) {
    message.embeds[0].title += " (CLOSED)"
    message.components = [
      {
        type: 1,
        components: message.components[0].components?.map((c) => {
          c.disabled = true;
          return c;
        }),
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "delete my vote",
            style: 1,
            custom_id: "vote_clear",
            disabled: true,
          },
          {
            type: 2,
            label: "what did I vote for again?",
            style: 2,
            custom_id: "vote_info",
          },
          {
            type: 2,
            label: "refresh data",
            style: 3,
            custom_id: "poll_refresh",
            disabled: true,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "close this poll",
            style: 4,
            custom_id: "poll_close",
            disabled: true,
          },
        ],
      },
    ];
  }

  await fetch(messageURL, {
    method: "PATCH",
    body: JSON.stringify(message),
    headers: headers(true),
  });

  SQLQuery(
    `UPDATE polls SET last_updated = ${
      Math.floor(new Date().valueOf() / 1000)
    } WHERE poll_id = ${pollID}`,
  );

  return { type: 7, data: {} };
}
