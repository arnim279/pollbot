# Pollbot

---

runs the http server that listens for discord interactions

### info

```yml
version: 1.0
lastupdate: 18.7.2021
dependencies:
  - discord api v9
  - deno 1.10.3
```

### setup

#### neccessary files:

- `data.sql`: just create it, the server will fill it
- `config.json`:

```json
{
  "botToken": "your discord bot token here",
  "applicationID": "discord application id",
  "publicApplicationKey": "discord public application id"
}
```

(can all be found [here](https://discord.com/developers/applications))

#### set the database up

```sql
create table votes (
  poll_id TEXT,
  user_id TEXT,
  chosen_option int
);

create table polls (
  poll_id TEXT PRIMARY KEY UNIQUE,
  creator_id TEXT,
  option_count int,
  channel_id TEXT,
  message_id TEXT,
  last_updated bigint
);
```

### start

`deno run --allow-net --allow-read --allow-write index.ts`\
(runs on port 80)
