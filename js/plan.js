import { ACTIONS } from "./data.js?v=26";

const FOCUS = {
  Workload: "Make the amount of work more manageable",
  Control: "Create a little more say over your working day",
  Reward: "Make progress and contribution easier to notice",
  Community: "Bring one other person into what you are carrying",
  Fairness: "Make priorities and expectations more explicit",
  Values: "Protect more space for work you can stand behind"
};

const ASSESSMENT_MATCH = {
  Exhaustion: ["proper-break", "shutdown", "cutoff", "side-projects"],
  "Mental distance": ["meaningful", "wins", "feedback", "side-projects"],
  "Cognitive impairment": ["priority-reset", "tripwire", "shutdown", "visible"],
  "Emotional impairment": ["check-in", "tripwire", "after-hours", "visible"]
};

const SIGN_MATCH = {
  "Loss of motivation": ["meaningful", "wins", "feedback", "side-projects"],
  "Negative thoughts": ["feedback", "wins", "check-in", "tripwire"],
  "Trouble concentrating": ["priority-reset", "shutdown", "tripwire", "side-projects"],
  Irritability: ["check-in", "after-hours", "tripwire", "proper-break"],
  "Sleep problems": ["cutoff", "after-hours", "shutdown", "proper-break"],
  "Persistent exhaustion": ["proper-break", "shutdown", "side-projects", "visible"]
};

const normalizeDrivers = drivers => Array.isArray(drivers) ? drivers : drivers ? [drivers] : [];

export function rankActions(drivers, assessmentFocus = "", signs = []) {
  const selectedDrivers = normalizeDrivers(drivers);
  const focusIds = ASSESSMENT_MATCH[assessmentFocus] || [];
  return ACTIONS.map((action, index) => {
    const focusIndex = focusIds.indexOf(action.id);
    const signMatches = signs.filter(sign => (SIGN_MATCH[sign] || []).includes(action.id)).length;
    return {
      action,
      index,
      score: (action.drivers.filter(driver => selectedDrivers.includes(driver)).length * 2) + (signMatches * 1.5) + (focusIndex >= 0 ? 2 + ((focusIds.length - focusIndex) / 10) : 0)
    };
  }).sort((a, b) => b.score - a.score || a.index - b.index).map(item => item.action);
}

export const suggestActions = (drivers, assessmentFocus = "", signs = [], limit = 6) => rankActions(drivers, assessmentFocus, signs).slice(0, limit);

export function actionDetails(plan) {
  const action = ACTIONS.find(item => item.id === plan.actionId || item.title === plan.change);
  return {
    id: action?.id || null,
    title: plan.change,
    instruction: plan.actionInstruction || action?.instruction || "Make this change small enough to try during the next week.",
    duration: Number(plan.actionDuration || action?.duration || 10),
    frequency: plan.actionFrequency || action?.frequency || "During the next week"
  };
}

export function driversForPlan(plan) {
  if (Array.isArray(plan.drivers) && plan.drivers.length) return plan.drivers;
  return plan.driver ? [plan.driver] : [];
}

export function focusForDriver(drivers) {
  const selected = normalizeDrivers(drivers);
  if (selected.length === 1) return FOCUS[selected[0]] || "Try one small change that protects your energy";
  if (selected.length > 1) return `Ease the pressure around ${new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(selected.map(driver => driver.toLowerCase()))}`;
  return "Try one small change that protects your energy";
}
