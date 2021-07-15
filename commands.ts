const Commands: ApplicationCommand = {
  name: "poll",
  description: " ",
  options: [
    {
      name: "create",
      type: 1,
      description: "create new poll",
      options: [
        {
          name: "title",
          type: 3,
          description: "title of the poll",
          required: true,
        },
        {
          name: "option-1",
          type: 3,
          description: "first option",
          required: true,
        },
        {
          name: "option-2",
          type: 3,
          description: "second option",
          required: false,
        },
        {
          name: "option-3",
          type: 3,
          description: "third option",
          required: false,
        },
        {
          name: "option-4",
          type: 3,
          description: "fourth option",
          required: false,
        },
        {
          name: "option-5",
          type: 3,
          description: "fifth option",
          required: false,
        },
      ],
    },
    {
      name: "close",
      type: 1,
      description: "close poll (disable new votes)",
      options: [
        {
          name: "id",
          type: 3,
          description: "id of the poll",
          required: true,
        },
      ],
    },
  ],
};

console.log(JSON.stringify(Commands));

type ApplicationCommandOption = {
  name: string;
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  description: string;
  required?: boolean;
  choices?: (string | number)[];
  options?: ApplicationCommandOption[];
};

type ApplicationCommand = {
  name: string;
  description: string;
  options: ApplicationCommandOption[];
};
