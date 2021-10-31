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

listenAndServe(`:${!isNaN(config.port) ? config.port : 80}`, handleRequest);
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
            req.respond({ //DEFERRED_CHANNEL_MESSAGE
              body: JSON.stringify({
                type: 5,
                data: { flags: 64 },
              }),
              headers: headers(),
            });

            const { error } = await createPoll(body);

            //patch message
            fetch(
              `https://discord.com/api/v9/webhooks/${body.application_id}/${body.token}/messages/@original`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  content: error || "successfully created poll :bar_chart:",
                }),
                headers: headers(true),
              },
            );

            break;
          }
          case "invite": {
            req.respond({
              body: JSON.stringify({
                type: 4,
                data: {
                  content:
                    "[invite me](https://discord.com/api/oauth2/authorize?client_id=858402957966835762&permissions=2048&scope=bot%20applications.commands)",
                  flags: 64,
                  allowed_mentions: { parse: [] },
                },
                headers: headers(),
              })
            })

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
          body: JSON.stringify(await handleComponentInteraction(body)),
          headers: headers(),
        });
        break;
      }
    }
  } catch (e) {
    console.log(e);
  }
}
