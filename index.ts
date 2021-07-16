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
        const subcommand = body.data.options[0].name;
        switch (subcommand) {
          case "create": {
            req.respond({
              body: JSON.stringify({
                type: 4,
                data: {
                  content: `working on it...`,
                  flags: 64,
                },
              }),
              headers: headers(),
            });
            await createPoll(body);
            //delete original response
            break;
          }
          default:
            req.respond({
              body: JSON.stringify({
                type: 4,
                data: { content: "how did you do that?", flags: 64 },
                headers: headers(),
              }),
            });
        }
        break;
      }
      case 3: { //MESSAGE_COMPONENT
        req.respond({
          body: JSON.stringify({
            type: 4,
            data: { content: "not working yet" },
          }),
          headers: headers(),
        });
        break;
      }
      default: {
        req.respond({ status: 400, body: "type unknown" });
      }
    }
  } catch (e) {
    req.respond({ status: 500 });
    console.log(e);
  }
}

const _send = () => {
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
            value:
              ":orange_square::orange_square::orange_square::orange_square::orange_square:\n 1 vote (33.3%)",
          },
          {
            name: "no",
            value:
              ":brown_square::brown_square::brown_square::brown_square::brown_square:\n 2 votes (66.7%)",
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
