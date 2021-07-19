import { getJSONFromSQLQuery, SQLQuery } from "../lib/database.ts";
import { headers } from "../lib/defaultHeaders.ts";

import { Interaction } from "../types/interaction.ts";
import { Component, EmbedField } from "../types/message.ts";

/**
 * sends a message including the embed and components to vote
 * @param interaction the interaction
 * @returns discord error code or `false`
 */
export async function createPoll(
  interaction: Interaction,
): Promise<{ error: false | string }> {
  const lastUpdated = Math.floor(new Date().valueOf() / 1000);

  const commandOptions = interaction.data?.options?.[0].options;

  const title = commandOptions?.find(((option) => option.name === "title"))
    ?.value;

  const options = commandOptions?.filter(
    ((option) => option.name.startsWith("option-")),
  );

  const showResultsImmediately = commandOptions?.find((option) =>
    option.name === "show-results-immediately"
  )?.value;

  //sort options, just in case
  options?.sort((a, b) =>
    Number(a.name.split("-")[1]) - Number(b.name.split("-")[1])
  );

  const fields: EmbedField[] = options?.map(
    ((option, index) => ({
      name: `option ${index + 1}: ${option.value}`,
      value: showResultsImmediately
        ? "0 votes (0%)"
        : "results aren't visible until the poll is over",
    })),
  ) as EmbedField[];

  fields?.push({
    name: "\u2800\n0 votes in total",
    value: `last updated: <t:${lastUpdated}:R>`,
  });

  const components: Component[] = [
    {
      type: 1,
      components: options?.map((_option, index): Component => ({
        type: 2,
        label: String(index + 1),
        style: 1,
        custom_id: `vote_option_${index + 1}`,
      })),
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          label: "delete my vote",
          style: 1,
          custom_id: "vote_clear",
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
        },
      ],
    },
  ];

  const message = await fetch(
    `https://discord.com/api/v9/channels/${interaction.channel_id}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        embeds: [{
          author: {
            name: `poll by ${interaction.member?.user.username}`,
            url: `https://discordapp.com/users/${interaction.member?.user.id}`,
            icon_url: `https://cdn.discordapp.com/avatars/${
              interaction.member?.user.id
            }/${interaction.member?.user.avatar}`,
          },
          title: title,
          color: 5793266, //Blurple
          fields: fields,
        }],
        components: components,
      }),
      headers: headers(true),
    },
  ).then((r) => r.json());

  if (message.code && message.message) {
    return { error: `${message.message} (${message.code})` };
  }

  const newPollID = getJSONFromSQLQuery("SELECT poll_id FROM polls").length;

  SQLQuery(
    `INSERT INTO polls (
      poll_id,
      poll_type,
      creator_id,
      option_count,
      channel_id,
      message_id,
      last_updated
    )
    VALUES (
      '${newPollID}',
      ${showResultsImmediately ? 0 : 1},
      '${interaction.member?.user.id}' ,
      ${options?.length}, 
      '${message.channel_id}', 
      '${message.id}', 
      ${lastUpdated}
    )`,
  );

  return { error: false };
}
