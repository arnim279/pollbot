import { readAll } from "https://deno.land/std@0.93.0/io/util.ts";
import {
  listenAndServe,
  ServerRequest,
} from "https://deno.land/std@0.92.0/http/mod.ts";
import { sign_detached_verify as verify } from "https://deno.land/x/tweetnacl_deno_fix@1.1.2/src/sign.ts";
import Buffer from "https://deno.land/std@0.76.0/node/buffer.ts";
import { DB as SQLiteDataBase } from "https://deno.land/x/sqlite@v2.4.2/mod.ts";
import { QueryParam } from "https://deno.land/x/sqlite@v2.4.2/src/db.ts";
import { ColumnName } from "https://deno.land/x/sqlite@v2.4.2/src/rows.ts";

const config = JSON.parse(
  new TextDecoder().decode(await Deno.readFile("./config.json")),
);

const db = new SQLiteDataBase("./data.sql");

listenAndServe(":80", handleRequest);
console.log("server ready, listening on port 80");

async function handleRequest(req: ServerRequest) {
  const headers = new Headers();
  headers.set("Authorization", `Bot ${config.botToken}`);
  headers.set("Content-Type", "application/json");

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
        body: "invalid request signature",
        headers: headers,
      });
    }
  } catch {
    return req.respond({
      status: 401,
      body: "invalid request signature",
      headers: headers,
    });
  }

  const body = JSON.parse(rawBody);

  try {
    req.respond({});
  } catch {
    req.respond({ status: 500 });
  }
}

function getJSONFromSQLQuery(
  query: string,
  queryParams?: QueryParam[],
): Record<string, string | number>[] {
  const queryResponse = db.query(query, queryParams);

  let columns: ColumnName[];
  try {
    columns = queryResponse.columns().filter((column) =>
      column.tableName === "votes"
    );
  } catch {
    columns = [];
  }

  const res: Record<string, string | number>[] = [];

  for (const column of queryResponse) {
    res.push({});
    for (const index in column) {
      res[res.length - 1][columns[index].name] = column[index];
    }
  }
  return res;
}
