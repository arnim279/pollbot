create table votes (
  poll_id TEXT,
  user_id TEXT,
  chosen_option int
);

create table polls (
  poll_id TEXT PRIMARY KEY UNIQUE,
  option_count int,
  channel_id TEXT,
  message_id TEXT,
  last_updated bigint,
  vote_end bigint
);