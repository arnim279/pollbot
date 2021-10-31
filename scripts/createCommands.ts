const Commands = [{
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
        {
          name: "show-results-immediately",
          type: 5,
          description:
            "whether the voting result should be available immediately or only after the poll is closed",
          required: false,
        },
      ],
    },
    {
      name: "invite",
      type: 1,
      description: "invite me to your own server"
    }
  ],
}];

console.log(JSON.stringify(Commands));
