import { db, getJSONFromSQLQuery } from "../lib/database.ts";
import { headers } from "../lib/defaultHeaders.ts";
import { getDate } from "../lib/getDate.ts";

import { Interaction } from "../types/interaction.ts";
import { Component, EmbedField } from "../types/message.ts";

/**
 * sends a message including the embed and components to vote
 * @param interaction the interaction
 * @returns discord error code or `false`
 */
export async function createPoll(
  //deno-lint-ignore no-explicit-any
  interaction: Interaction,
): Promise<{ error: false | number | string }> {
  const newPollID = await getJSONFromSQLQuery("SELECT poll_id FROM polls")
    .length;

  const commandOptions = interaction.data?.options?.[0].options;

  let title = commandOptions?.find(((option) => option.name === "title"))
    ?.value;
  const rawDate = commandOptions?.find(
    ((option) => option.name === "end-of-vote"),
  )
    ?.value?.toString();

  const date = rawDate ? getDate(rawDate) : null;

  if (typeof date === "string") {
    return { error: "wrong-date-format: " + date };
  }

  const options = commandOptions?.filter(
    ((option) => option.name.startsWith("option-")),
  );

  options?.sort((a, b) =>
    Number(a.name.split("-")[1]) - Number(b.name.split("-")[1])
  );

  const fields: EmbedField[] = options?.map(
    ((option, index) => ({
      name: `option ${index + 1}: ${option.value}`,
      value: "0 votes (0%)",
    })),
  ) as EmbedField[];

  fields?.push({
    name: "\u2800\n0 votes in total",
    value: `last updated: ${new Date().toLocaleDateString()}, ${
      new Date().toLocaleTimeString()
    } CET`,
  });

  const components: Component[] = [
    {
      type: 1,
      components: options?.map((option, index): Component => ({
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
          label: "delete this poll",
          style: 4,
          custom_id: "poll_delete",
        },
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
          title: title +
            (rawDate ? ` (closes ${date?.toLocaleString()} CET)` : ""),
          color: 5793266, //Blurple
          fields: fields,
          timestamp: new Date().toISOString(),
        }],
        components: components,
      }),
      headers: headers(true),
    },
  ).then((r) => r.json());

  if (message.code && message.message) {
    console.log(message.message);
    return { error: message.code };
  }

  return { error: false };
}
