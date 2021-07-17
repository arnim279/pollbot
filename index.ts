import { readAll } from "https://deno.land/std@0.93.0/io/util.ts";
import {
  listenAndServe,
  ServerRequest,
} from "https://deno.land/std@0.92.0/http/mod.ts";
import { sign_detached_verify as verify } from "https://deno.land/x/tweetnacl_deno_fix@1.1.2/src/sign.ts";
import Buffer from "https://deno.land/std@0.76.0/node/buffer.ts";

import { headers } from "./lib/defaultHeaders.ts";
import { createPoll } from "./handlers/createPoll.ts";
import { handleComponentInteraction } from "./handlers/handleComponentInteraction.ts";

export const config = JSON.parse(
  new TextDecoder().decode(await Deno.readFile("./config.json")),
);

listenAndServe(":80", handleRequest);
console.log("server ready, listening on port 80");

async function handleRequest(req: ServerRequest) {
  const rawBody = new TextDecoder().decode(await readAll(req.body)) || "{}";
  const signature = req.headers.get("x-signature-ed25519") || "";
  const timestamp = req.headers.get("x-signature-timestamp") || "";

  try {
    if (
      !verify(
        Buffer.from(timestamp + rawBody),
        Buffer.from(signature, "hex"),
        Buffer.from(config.publicApplicationKey, "hex"),
      )
    ) {
      return req.respond({
        status: 401,
        headers: headers(),
      });
    }
  } catch (e) {
    return req.respond({
      status: 401,
      body: JSON.stringify({ error: e.message }),
      headers: headers(),
    });
  }

  const body = JSON.parse(rawBody);

  try {
    switch (body.type) {
      case 1: { //PING
        req.respond({ body: JSON.stringify({ type: 1 }), headers: headers() });
        break;
      }
      case 2: { //SLASH_COMMAND
        if (!body.guild_id) { // = sent in a dm
          return req.respond({
            body: JSON.stringify({
              type: 4,
              data: {
                content: "You can't use this command outside of a server",
              },
            }),
            headers: headers(),
          });
        }

        const subcommand = body.data.options[0].name;
        switch (subcommand) {
          case "create": {
            req.respond({ //initial "working on it" response
              body: JSON.stringify({
                type: 4,
                data: {
                  content: `working on it...`,
                  flags: 64,
                },
              }),
              headers: headers(),
            });
            const { error } = await createPoll(body);

            if (error) { //patch message to error
              fetch(
                `https://discord.com/api/v9/webhooks/${body.application_id}/${body.token}/messages/@original`,
                {
                  method: "PATCH",
                  body: JSON.stringify({
                    content: `Error: ${
                      error == 50001
                        ? "no permission to send messages in this channel, contact server staff"
                        : typeof error === "string"
                        ? error
                        : "unknown error"
                    }`,
                  }),
                  headers: headers(true),
                },
              );
            } else { //patch message to success
              fetch(
                `https://discord.com/api/v9/webhooks/${body.application_id}/${body.token}/messages/@original`,
                {
                  method: "PATCH",
                  body: JSON.stringify({
                    content: "successfully created poll :bar_chart:",
                  }),
                  headers: headers(true),
                },
              );
            }
            break;
          }
          default: //unknown message
            req.respond({
              body: JSON.stringify({
                type: 4,
                data: {
                  content:
                    "unknown command (message <@682183442460573703> for help)",
                  flags: 64,
                  allowed_mentions: { parse: [] },
                },
                headers: headers(),
              }),
            });
        }
        break;
      }
      case 3: { //MESSAGE_COMPONENT
        req.respond({
          body: JSON.stringify(handleComponentInteraction(body)),
          headers: headers(),
        });
        break;
      }
    }
  } catch (e) {
    console.log(e);
  }
}

/*
 *placeholder
 *placeholder
 *placeholder
 *placeholder
 *placeholder
 *placeholder
 */

const _sendPoll = () => {
  fetch(`https://discord.com/api/v9/channels/847069200480075796/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [{
        title: "is this a test?",
        color: 5793266,
        author: {
          name: "poll by arnim",
          icon_url:
            "https://cdn.discordapp.com/avatars/682183442460573703/262463d0d646d52910c31bbbe1aaa585",
          url: "https://discordapp.com/users/682183442460573703",
        },
        fields: [
          {
            name: "yes",
            value: ":orange_square:".repeat(1 / 3 * 25) +
              "\n 1 vote (33.3%)",
          },
          {
            name: "no",
            value: ":yellow_square:".repeat(2 / 3 * 25) +
              "\n 2 votes (66.7%)",
          },
          {
            name: "isn't everything a test\n",
            value: "0 votes (0%)",
          },
          {
            name: "\u2800\n3 votes in total",
            value: `last updated: ${new Date().toLocaleDateString()}, ${
              new Date().toLocaleTimeString()
            }`,
          },
        ],
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: 1,
              style: 1,
              custom_id: "option_1",
            },
            {
              type: 2,
              label: 2,
              style: 1,
              custom_id: "option_2",
            },
            {
              type: 2,
              label: 3,
              style: 1,
              custom_id: "option_3",
            },
          ],
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
              label: "close this poll",
              style: 4,
              custom_id: "poll_close",
            },
          ],
        },
      ],
    }),
    headers: headers(true),
  });
};

const _sendCLosedPoll = () => {
  fetch(`https://discord.com/api/v9/channels/847069200480075796/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [{
        title: "is this a test? (CLOSED)",
        color: 5793266,
        author: {
          name: "poll by arnim",
          icon_url:
            "https://cdn.discordapp.com/avatars/682183442460573703/262463d0d646d52910c31bbbe1aaa585",
          url: "https://discordapp.com/users/682183442460573703",
        },
        fields: [
          {
            name: "yes",
            value: ":orange_square:".repeat(1 / 3 * 25) +
              "\n 1 vote (33.3%)",
          },
          {
            name: "no",
            value: ":yellow_square:".repeat(2 / 3 * 25) +
              "\n 2 votes (66.7%)",
          },
          {
            name: "isn't everything a test\n",
            value: "0 votes (0%)",
          },
          {
            name: "\u2800\n3 votes in total",
            value: `last updated: ${new Date().toLocaleDateString()}, ${
              new Date().toLocaleTimeString()
            }`,
          },
        ],
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: 1,
              style: 1,
              custom_id: "option_1",
              disabled: true,
            },
            {
              type: 2,
              label: 2,
              style: 1,
              custom_id: "option_2",
              disabled: true,
            },
            {
              type: 2,
              label: 3,
              style: 1,
              custom_id: "option_3",
              disabled: true,
            },
          ],
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
              label: "close this poll",
              style: 4,
              custom_id: "poll_close",
              disabled: true,
            },
          ],
        },
      ],
    }),
    headers: headers(true),
  });
};
