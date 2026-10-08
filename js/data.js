export const QUESTIONS = [
  { sub: "ex", text: "At work, I feel mentally exhausted" },
  { sub: "ex", text: "After a day at work, I find it hard to recover my energy" },
  { sub: "ex", text: "At work, I feel physically exhausted" },
  { sub: "md", text: "I struggle to find any enthusiasm for my work" },
  { sub: "md", text: "I feel a strong aversion towards my job" },
  { sub: "md", text: "I'm cynical about what my work means to others" },
  { sub: "ci", text: "At work, I have trouble staying focused" },
  { sub: "ci", text: "When I'm working, I have trouble concentrating" },
  { sub: "ci", text: "I make mistakes in my work because I have my mind on other things" },
  { sub: "ei", text: "At work, I feel unable to control my emotions" },
  { sub: "ei", text: "I do not recognize myself in the way I react emotionally at work" },
  { sub: "ei", text: "At work I may overreact unintentionally" }
];

export const ANSWERS = ["Never", "Rarely", "Sometimes", "Often", "Always"];

export const ZONES = {
  green: { label: "Not at risk of burnout", description: "Your answers sit below the level seen in people assessed with severe burnout complaints. Keep protecting the habits that help you recover." },
  orange: { label: "At risk of burnout", description: "Your answers are close to those of people with burnout complaints. This is a good moment to look at workload, rest and support before it grows." },
  red: { label: "Very high risk of burnout", description: "Your answers match those of people assessed with severe burnout complaints. Please talk to your doctor, a mental health professional or an occupational health service." }
};

export const SUBSCALES = {
  ex: { label: "Exhaustion", cuts: [3.16, 3.5] },
  md: { label: "Mental distance", cuts: [2.16, 3.16] },
  ci: { label: "Cognitive impairment", cuts: [2.82, 3.16] },
  ei: { label: "Emotional impairment", cuts: [2.16, 2.82] }
};

export const SIGNS = ["Loss of motivation", "Negative thoughts", "Trouble concentrating", "Irritability", "Sleep problems", "Persistent exhaustion", "None right now"];
export const DRIVERS = [
  ["Workload", "Too much, too fast, or too many projects"],
  ["Control", "Little say over how or what I work on"],
  ["Reward", "Pay, credit or growth don't match the effort"],
  ["Community", "No one to think out loud with"],
  ["Fairness", "Unclear priorities, uneven credit"],
  ["Values", "Asked to ship what I don't believe in"]
];
export const CHANGES = ["Shut down daily", "Keep a wins log", "Define done first", "Protect two focus blocks a week", "Cap side projects at one", "Set a tripwire", "Ask for workload to be visible", "Agree after-hours norms"];
export const PEOPLE = ["A friend", "A family member", "A teammate", "My manager", "A doctor or counselor"];
