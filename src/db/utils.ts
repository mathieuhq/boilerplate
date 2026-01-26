import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 24);

export function generateId(): string {
  return nanoid();
}

export const cuid = () => generateId();
