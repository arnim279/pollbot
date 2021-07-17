export type Message = {
  tts?: boolean;
  content?: string;
  embeds?: Embed[];
  components?: Component[];
};

export type Embed = {
  title?: string;
  description?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name?: string;
    url?: string;
    icon_url?: string;
  };
  fields?: EmbedField[];
};

export type EmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type Component = {
  type: 1 | 2 | 3;
  custom_id?: string;
  disabled?: boolean;
  style?: 1 | 2 | 3 | 4 | 5;
  label?: string;
  url?: string;
  components?: Component[];
};
