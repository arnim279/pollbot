import { config } from "../index.ts";

export function headers(withToken = false): Headers {
  const headers = new Headers();

  if (withToken) headers.set("Authorization", `Bot ${config.botToken}`);
  headers.set("Content-Type", "application/json");
  headers.set("Date", new Date().toUTCString());

  return headers;
}
