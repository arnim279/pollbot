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
          name: "end-of-vote",
          type: 3,
          description:
            "datetime at which the poll should end. format: `dd.mm.yy hh:mm` (`yy`, `hh` and `mm` are optional)",
          required: false,
        },
      ],
    },
  ],
}];

console.log(JSON.stringify(Commands));
