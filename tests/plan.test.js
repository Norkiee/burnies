import test from "node:test";
import assert from "node:assert/strict";
import { rankActions, suggestActions, actionDetails, focusForDriver } from "../js/plan.js";

test("plan suggestions prioritize the selected driver", () => {
  const ranked = rankActions("Fairness");
  assert.ok(ranked[0].drivers.includes("Fairness"));
  assert.ok(ranked[1].drivers.includes("Fairness"));
});

test("assessment context can refine the first suggestion", () => {
  const ranked = rankActions(["Control"], "Cognitive impairment");
  assert.equal(ranked[0].id, "priority-reset");
});

test("weekly change list stays capped at six items", () => {
  const suggested = suggestActions(["Workload", "Fairness"]);
  assert.equal(suggested.length, 6);
  assert.ok(suggested[0].drivers.some(driver => ["Workload", "Fairness"].includes(driver)));
});

test("early signs refine suggestions after driver matching", () => {
  const withoutSigns = rankActions(["Community"]);
  const withSleepProblems = rankActions(["Community"], "", ["Sleep problems"]);
  assert.equal(withoutSigns[0].id, "visible");
  assert.equal(withSleepProblems[0].id, "after-hours");
});

test("different responses produce different sets of six", () => {
  const workload = suggestActions(["Workload"], "", ["Persistent exhaustion"]).map(action => action.id);
  const reward = suggestActions(["Reward"], "", ["Loss of motivation"]).map(action => action.id);
  assert.notDeepEqual(workload, reward);
  assert.ok(workload.includes("proper-break"));
  assert.ok(reward.includes("feedback"));
});

test("old and custom plans receive safe action details", () => {
  assert.equal(actionDetails({ change: "Shut down daily" }).duration, 10);
  assert.match(actionDetails({ change: "Take lunch outside" }).instruction, /small enough/);
});

test("each driver has a clear weekly focus", () => {
  assert.match(focusForDriver("Workload"), /manageable/);
  assert.match(focusForDriver(["Workload", "Control"]), /workload and control/);
});
