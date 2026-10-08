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
export const ACTIONS = [
  { id: "shutdown", title: "Shut down daily", summary: "End work with a clear stopping point", instruction: "Use the last 10 minutes to note what is done, what comes next, and then close work.", duration: 10, frequency: "Weekdays", drivers: ["Workload", "Control"] },
  { id: "wins", title: "Keep a wins log", summary: "Notice progress that is easy to miss", instruction: "Write down one thing you completed, helped with, or learned before you finish work.", duration: 5, frequency: "Weekdays", drivers: ["Reward", "Values"] },
  { id: "side-projects", title: "Cap side projects at one", summary: "Reduce the number of open commitments", instruction: "Choose one active side project and pause the rest until your review date.", duration: 10, frequency: "Once, then protect it", drivers: ["Workload", "Values"] },
  { id: "tripwire", title: "Set a tripwire", summary: "Decide when you will stop or ask for help", instruction: "Choose one warning sign and the action you will take when it appears.", duration: 5, frequency: "Once, then use it", drivers: ["Workload", "Control", "Values"] },
  { id: "visible", title: "Ask for workload to be visible", summary: "Make priorities and trade-offs explicit", instruction: "List your active work and ask which item should move if something new is added.", duration: 15, frequency: "Once this week", drivers: ["Workload", "Fairness", "Community"] },
  { id: "after-hours", title: "Agree after-hours norms", summary: "Make availability expectations clearer", instruction: "Agree when messages can wait and what genuinely needs an urgent response.", duration: 10, frequency: "Once, then keep it", drivers: ["Control", "Fairness", "Community"] },
  { id: "proper-break", title: "Take a proper midday break", summary: "Create one real pause in the workday", instruction: "Step away from work for 20 minutes and leave messages closed until you return.", duration: 20, frequency: "Weekdays", drivers: ["Workload", "Reward"] },
  { id: "priority-reset", title: "Choose three priorities", summary: "Give the day a shorter, clearer list", instruction: "Pick the three outcomes that matter most today and let everything else be secondary.", duration: 10, frequency: "At the start of each workday", drivers: ["Workload", "Control", "Fairness"] },
  { id: "feedback", title: "Ask for useful feedback", summary: "Get a clearer view of your contribution", instruction: "Ask one person what was useful in your recent work and what would make the next version stronger.", duration: 15, frequency: "Once this week", drivers: ["Reward", "Community"] },
  { id: "check-in", title: "Book a 15-minute check-in", summary: "Bring someone into what you are carrying", instruction: "Choose one trusted person and book a short conversation to share what has been difficult.", duration: 15, frequency: "Once this week", drivers: ["Community", "Fairness"] },
  { id: "cutoff", title: "Set a work-message cutoff", summary: "Protect a clearer end to the day", instruction: "Choose a time after which non-urgent work messages can wait until the next workday.", duration: 5, frequency: "Set once, then follow it", drivers: ["Workload", "Control", "Fairness"] },
  { id: "meaningful", title: "Protect one meaningful task", summary: "Make space for work you can stand behind", instruction: "Choose one useful or meaningful task and give it the first 30 minutes of one work session.", duration: 30, frequency: "Once this week", drivers: ["Values", "Reward", "Control"] }
];
export const PEOPLE = ["A friend", "A family member", "A teammate", "My manager", "A doctor or counselor"];
