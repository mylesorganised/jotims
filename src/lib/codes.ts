// Morse code, phonetic alphabet and semaphore data, shared by tools and checks.

/** Chart order. (Object keys like "1" would otherwise sort before the letters.) */
export const CHARACTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ..."1234567890"];

export const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..",
  J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.", "0": "-----",
};

const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

/** "HI MUM" -> ".... .. / -- ..- --" */
export function toMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word]
        .map((ch) => MORSE[ch])
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join(" / ");
}

/** Accepts dots/dashes typed in lots of ways (•, —, _, ·) and tidies spacing. */
export function normalizeMorse(input: string): string {
  return input
    .replace(/[•·∙●]/g, ".")
    .replace(/[—–_−▬]/g, "-")
    .replace(/\s*[/|]\s*/g, " / ")
    .replace(/[^.\-/ ]/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function fromMorse(input: string): string {
  return normalizeMorse(input)
    .split(" / ")
    .map((word) =>
      word
        .split(" ")
        .filter(Boolean)
        .map((code) => MORSE_REVERSE[code] ?? "?")
        .join(""),
    )
    .join(" ");
}

export const PHONETIC: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel",
  I: "India", J: "Juliet", K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa",
  Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey",
  X: "X-ray", Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six",
  "7": "Seven", "8": "Eight", "9": "Niner",
};

export function toPhonetic(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word]
        .map((ch) => PHONETIC[ch])
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean)
    .join(" – ");
}

/**
 * Semaphore flag positions as clock directions seen by the person watching:
 * 6 = down, 7.5 = low left, 9 = left, 10.5 = high left, 12 = up,
 * 1.5 = high right, 3 = right, 4.5 = low right. Checked against the chart in
 * the Scouts Communicator sheet.
 */
export const SEMAPHORE: Record<string, [number, number]> = {
  A: [7.5, 6], B: [9, 6], C: [10.5, 6], D: [12, 6], E: [1.5, 6], F: [3, 6], G: [4.5, 6],
  H: [9, 7.5], I: [10.5, 7.5], J: [12, 3], K: [12, 7.5], L: [1.5, 7.5], M: [3, 7.5], N: [4.5, 7.5],
  O: [10.5, 9], P: [12, 9], Q: [1.5, 9], R: [3, 9], S: [4.5, 9],
  T: [10.5, 12], U: [10.5, 1.5], V: [12, 4.5], W: [1.5, 3], X: [1.5, 4.5], Y: [10.5, 3], Z: [3, 4.5],
};

/** Letters only, single spaces: for comparing typed answers. */
export function simplify(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
