/**
 * turns a "rawDate" like `17.3.2021 12:30` into a JavaScript date object
 * @param rawDate string that should be parsed
 * @returns parsed date or a string if there is a formatting error
 */

export function getDate(rawDate: string): Date | string {
  const date = {
    date: {
      day: Number(rawDate?.split(" ")[0].split(".")[0]) || new Date().getDay(),
      month: Number(rawDate?.split(" ")[0].split(".")[1]) ||
        new Date().getMonth(),
      year: Number(rawDate?.split(" ")[0].split(".")[2]) ||
        new Date().getFullYear(),
    },
    time: {
      hour: Number(rawDate?.split(" ")[1].split(":")[0]) || 0,
      minutes: Number(rawDate?.split(" ")[1].split(":")[1]) || 0,
    },
  };

  return new Date();
}
