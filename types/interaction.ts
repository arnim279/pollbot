import { Component, Embed, Message } from "./message.ts";
import { User } from "./user.ts";

export type Interaction = {
  id: string;
  "application_id": string;
  type: 1 | 2 | 3;
  data?: {
    id: string;
    name: string;
    options?: InteractionDataOption[];
    "custom_id": string;
    "component_type"?: 1 | 2 | 3;
  };
  "guild_id"?: string;
  "channel_id"?: string;
  member?: {
    user: User;
    nick?: string;
    roles: string[];
    "joined_at": number;
    "premium_since"?: number;
    deaf: boolean;
    mute: boolean;
    pending?: boolean;
    permissions?: string;
  };
  user?: User;
  token: string;
  version: 1;
  message?: Message;
};

export type InteractionDataOption = {
  name: string;
  type: number;
  value?: string | number | boolean;
  options: InteractionDataOption[];
};

export type InteractionResponse = {
  type: 1 | 2 | 4 | 5 | 6 | 7;
  data: {
    tts?: boolean;
    content?: string;
    embeds?: Embed[];
    "allowed_mentions"?: {
      parse: ("roles" | "users" | "everyone")[];
      roles?: string[];
      users?: string[];
      "replied_user"?: boolean;
    };
    flags?: number;
    components?: Component[];
  };
};
