import { Interaction, InteractionResponse } from "../types/interaction.ts";
import { Poll, Vote } from "../types/custom.ts";
import { getJSONFromSQLQuery, SQLQuery } from "../lib/database.ts";
import { updateMessage } from "../lib/updateMessage.ts";

//deno-fmt-ignore
export async function handleComponentInteraction(interaction: Interaction): Promise<InteractionResponse> {
  //deno-fmt-ignore
  if ( !getPoll(interaction) && !interaction.data?.custom_id.startsWith("poll_close_") ) {
    return { //error:  already deleted
      type: 4,
      data: {
        embeds: [{
          author: {
            name: "pollbot",
            icon_url:
              "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
          },
          color: 5793266,
          title: "Error",
          description: "the poll was already closed",
        }],
        flags: 64,
      },
    };
  }

  if (interaction.data?.custom_id.startsWith("vote_")) {
    return handleVote(interaction);
  } else if (interaction.data?.custom_id.startsWith("poll_")) {
    return await handlePollChange(interaction);
  } else {
    return unknownOption();
  }
}

function handleVote(interaction: Interaction): InteractionResponse {
  const pollID = getPoll(interaction)?.poll_id as string;

  /*
  vote
  */
  if (interaction.data?.custom_id.startsWith("vote_option_")) {
    const option = interaction.data.custom_id.replace("vote_option_", "");

    //check if already voted
    const alreadyVoted = getJSONFromSQLQuery(
      `SELECT chosen_option FROM votes WHERE poll_id = ${pollID} and user_id = ${
        interaction.member?.user.id
      }`,
    ) as Vote[];
    if (alreadyVoted.length > 0) {
      //deno-fmt-ignore
      SQLQuery(`UPDATE votes SET chosen_option = ${option} WHERE poll_id = ${pollID} and user_id = ${interaction.member?.user.id}`);
      updateMessage(pollID);
      return {
        type: 4,
        data: {},
      };
    } else {
      SQLQuery(`INSERT INTO votes (
      poll_id, 
      user_id,
      chosen_option
      ) VALUES (
        '${pollID}',
        '${interaction.member?.user.id}',
        ${option} 
      )`);
      updateMessage(pollID);
      return {
        type: 7,
        data: {},
      };
    }
  } /*

  get vote info
  */
  else if (interaction.data?.custom_id === "vote_info") {
    //deno-fmt-ignore
    const myVote = getJSONFromSQLQuery(`SELECT chosen_option FROM votes WHERE poll_id=${pollID} and user_id = ${interaction.member?.user.id}`)[0] as Vote;
    return {
      type: 4,
      data: {
        flags: 64,
        embeds: [{
          author: {
            name: "pollbot",
            icon_url:
              "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
          },
          color: 5793266,
          title: "vote info",
          description: myVote
            ? `you voted for option ${myVote.chosen_option}`
            : "you didn't vote yet",
        }],
      },
    };
  } /*

  delete my vote
  */
  else if (interaction.data?.custom_id === "vote_clear") {
    //deno-fmt-ignore
    const myVote = getJSONFromSQLQuery(`SELECT chosen_option FROM votes WHERE poll_id=${pollID} and user_id = ${interaction.member?.user.id}`) as Vote[];

    if (myVote.length > 0) {
      //deno-fmt-ignore
      SQLQuery(`DELETE FROM votes WHERE poll_id=${pollID} and user_id = ${interaction.member?.user.id}`);
      updateMessage(pollID);
    }

    return { //didn't vote yet
      type: myVote.length === 0 ? 4 : 7,
      data: myVote.length === 0
        ? {
          flags: 64,
          embeds: [{
            author: {
              name: "pollbot",
              icon_url:
                "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
            },
            color: 5793266,
            title: "vote info",
            description: myVote.length === 0
              ? "you didn't vote yet"
              : `your vote for option ${myVote[0].chosen_option} was deleted.`,
          }],
        }
        : {},
    };
  } /*

  unknown option
  */
  else return unknownOption();
}

async function handlePollChange(
  interaction: Interaction,
): Promise<InteractionResponse> {
  const pollID = getPoll(interaction)?.poll_id as string;

  //refresh message, if it isn't stored in the db anymore, disable buttons
  if (interaction.data?.custom_id === "poll_refresh") {
    return await updateMessage(pollID);
  }

  //check if interaction member is poll creator
  if (
    getPoll(interaction)?.creator_id !== interaction.member?.user.id &&
    !interaction.data?.custom_id.startsWith("poll_close_confirm_")
  ) {
    return { //error: no permission
      type: 4,
      data: {
        embeds: [{
          author: {
            name: "pollbot",
            icon_url:
              "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
          },
          color: 5793266,
          title: "Error",
          description: "you don't have permission to close this poll",
        }],
        flags: 64,
      },
    };
  }

  if (interaction.data?.custom_id === "poll_close") {
    return returnCloseConfirmationMessage(pollID);
  } else if (interaction.data?.custom_id === "poll_close_cancel") {
    return { //Confirm **CANCELLED**
      type: 7,
      data: {
        flags: 64,
        embeds: [{
          author: {
            name: "pollbot",
            icon_url:
              "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
          },
          title: "Confirm your action (*CANCELLED*)",
          color: 5793266,
          description:
            `Are you sure you want to close this poll? This cannot be undone.`,
        }],
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 1,
            label: "cancel",
            custom_id: `poll_close_cancel`,
            disabled: true,
          }, {
            type: 2,
            style: 4,
            label: "proceed",
            custom_id: `poll_close_confirm_${pollID}`,
            disabled: true,
          }],
        }],
      },
    };
  } else if (interaction.data?.custom_id.startsWith("poll_close_confirm_")) {
    const originalPollID = interaction.data.custom_id.replace(
      "poll_close_confirm_",
      "",
    );
    updateMessage(originalPollID, true);
    return { //Confirmed
      type: 7,
      data: {
        flags: 64,
        embeds: [{
          author: {
            name: "pollbot",
            icon_url:
              "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
          },
          title: "poll info",
          color: 5793266,
          description: `poll closed.`,
        }],
        components: [{
          type: 1,
          components: [{
            type: 2,
            style: 1,
            label: "cancel",
            custom_id: `poll_close_cancel`,
            disabled: true,
          }, {
            type: 2,
            style: 4,
            label: "proceed",
            custom_id: `poll_close_confirm_${originalPollID}`,
            disabled: true,
          }],
        }],
      },
    };
  } else return unknownOption();
}

function unknownOption(): InteractionResponse {
  return { //invalid option, contact @arnim
    type: 4,
    data: {
      embeds: [{
        author: {
          name: "pollbot",
          icon_url:
            "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
        },
        color: 5793266,
        title: "Error",
        description: "invalid option, contact <@682183442460573703> for help",
      }],
      allowed_mentions: { parse: [] },
      flags: 64,
    },
  };
}

function getPoll(interaction: Interaction): Poll | null {
  try {
    //deno-fmt-ignore
    const poll = getJSONFromSQLQuery(`SELECT * FROM polls WHERE message_id = ${interaction.message?.id} and channel_id = ${interaction.channel_id}`) as Poll[];
    return poll[0];
  } catch {
    return null;
  }
}

function returnCloseConfirmationMessage(pollID: string): InteractionResponse {
  return { //confirm your action or cancel
    type: 4,
    data: {
      flags: 64,
      embeds: [{
        author: {
          name: "pollbot",
          icon_url:
            "https://cdn.discordapp.com/avatars/858402957966835762/26920e0f4fbaabbf62b01a1ddf63da57",
        },
        title: "Confirm your action",
        color: 5793266,
        description:
          `Are you sure you want to close this poll? This cannot be undone.`,
      }],
      components: [{
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: "cancel",
            custom_id: `poll_close_cancel`,
          },
          {
            type: 2,
            style: 4,
            label: "proceed",
            custom_id: `poll_close_confirm_${pollID}`,
          },
        ],
      }],
    },
  };
}
