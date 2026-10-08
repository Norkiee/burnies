import { QUESTIONS, SUBSCALES } from "./data.js";

export const round2 = value => Math.round((value + Number.EPSILON) * 100) / 100;

export function classify(value, cuts = [2.53, 2.95]) {
  if (value <= cuts[0]) return "green";
  if (value <= cuts[1]) return "orange";
  return "red";
}

export function scoreAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length || answers.some(value => !Number.isInteger(value) || value < 1 || value > 5)) {
    throw new TypeError("BAT-12 answers must contain twelve integers from 1 to 5.");
  }
  const total = round2(answers.reduce((sum, value) => sum + value, 0) / answers.length);
  const sub = {};
  for (const key of Object.keys(SUBSCALES)) {
    const values = answers.filter((_, index) => QUESTIONS[index].sub === key);
    sub[key] = round2(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
  return { total, sub, zone: classify(total) };
}

export function subscalePointers(sub) {
  return Object.entries(SUBSCALES).map(([key, value]) => ({ key, label: value.label, score: sub[key], zone: classify(sub[key], value.cuts) }));
}
