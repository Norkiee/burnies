import test from "node:test";
import assert from "node:assert/strict";
import { classify, scoreAnswers } from "../js/scoring.js";

test("all minimum answers score 1.00 green", () => {
  assert.deepEqual(scoreAnswers(Array(12).fill(1)), { total: 1, sub: { ex: 1, md: 1, ci: 1, ei: 1 }, zone: "green" });
});
test("all maximum answers score 5.00 red", () => {
  assert.deepEqual(scoreAnswers(Array(12).fill(5)), { total: 5, sub: { ex: 5, md: 5, ci: 5, ei: 5 }, zone: "red" });
});
test("total cut-off boundaries are inclusive", () => {
  assert.equal(classify(2.53), "green");
  assert.equal(classify(2.54), "orange");
  assert.equal(classify(2.95), "orange");
  assert.equal(classify(2.96), "red");
});
test("invalid response arrays are rejected", () => {
  assert.throws(() => scoreAnswers(Array(11).fill(1)), /twelve integers/);
  assert.throws(() => scoreAnswers(Array(12).fill(6)), /twelve integers/);
});
