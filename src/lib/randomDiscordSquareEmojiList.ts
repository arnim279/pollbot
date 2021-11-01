export function randomDiscordSquareEmojiList(seed: number, amount: number) {
  const emojis = randomizeArray(
    [
      "orange",
      "blue",
      "brown",
      "green",
      "purple",
      "red",
      "yellow",
    ].map((name) => `:${name}_square:`),
    seed,
  );

  return [...emojis].splice(0, amount);
}

/**
 * "randomizes" the array, but the same seed and array always return the same array
 * @param arr the array to randomize
 * @param seed determines how the array is randomized
 * @returns seemingly randomized array
 */
function randomizeArray<T>(arr: T[], seed: number): T[] {
  seed += 15;
  while (seed > 0) {
    arr.push(arr.splice(Math.floor(arr.length / (2 * seed)), 1)[0]); //no idea what this does, but it looks random
    seed--;
  }
  return arr;
}
