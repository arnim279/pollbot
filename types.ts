export type Poll = {
  creator: string;
  channel: string;
  data: {
    title: string;
    options: string[];
  };
  votes: Record<string, string[]>;
};
