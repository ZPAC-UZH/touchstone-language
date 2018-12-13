import {inspect} from "util";

export function pretty_str (obj: any) : string {
    return (inspect(obj, true, 10));
}
export function computeLcmOfArray(inputArray) {
  let current = inputArray[0];
  for (let i = 1; i < inputArray.length; i++) {
    current = lcm(current, inputArray[i]);
  }
  return current;
}

function gcd(a, b) {
  return !b ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}
