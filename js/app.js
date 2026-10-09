import { QUESTIONS, ANSWERS, ZONES, SUBSCALES, SIGNS, DRIVERS, ACTIONS, PEOPLE } from "./data.js?v=26";
import { scoreAnswers, subscalePointers } from "./scoring.js?v=26";
import { historyAvailable, saveCheckIn, savePlan, updatePlan, getCheckIns, getPlans, clearHistory } from "./storage.js?v=26";
import { localDate, parseLocal, calendarLinks, createIcs } from "./calendar.js?v=26";
import { suggestActions, actionDetails, driversForPlan, focusForDriver } from "./plan.js?v=26";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const DECO = '<div class="deco" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const ICON_COPY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const TILE_ARROW = '<span class="tile-arrow" aria-hidden="true">→</span>';
let installPrompt = null;
let toastTimer;
let currentScreen = "home";
let checkInState;
let planState;

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const storageGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const appUrl = () => new URL("./", location.href).href;
const directStart = () => new URLSearchParams(location.search).get("start");

function clearDirectStart() {
  if (!directStart()) return;
  const url = new URL(location.href);
  url.searchParams.delete("start");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

async function copyText(text, success = "Copied") {
  try { await navigator.clipboard.writeText(text); showToast(success); return true; }
  catch { showToast("Copy was blocked. Select the text and copy it manually."); return false; }
}

function focusHeading() {
  requestAnimationFrame(() => app.querySelector("[data-focus-heading]")?.focus({ preventScroll: true }));
  scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

function header(title = "Burnies", back = renderHome) {
  return `<header class="app-header"><button class="icon-button" id="back" type="button" aria-label="Go back">‹</button><span class="top-title">${escapeHtml(title)}</span><span aria-hidden="true" style="width:44px"></span></header>`;
}

function wireHeader(back = renderHome) { document.querySelector("#back")?.addEventListener("click", back); }

function option(label, selected, value, role = "radio", detail = "") {
  return `<button type="button" class="option" role="${role}" aria-checked="${selected}" data-value="${escapeHtml(value)}"><span class="option-copy"><span>${escapeHtml(label)}</span>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</span><span class="dot" aria-hidden="true"></span></button>`;
}

function showDialog({ title, text, confirmLabel = "Continue", dangerous = false, onConfirm }) {
  const wrap = document.createElement("div");
  wrap.className = "dialog-backdrop";
  wrap.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><div class="button-row"><button type="button" class="ghost" id="dialog-cancel">Cancel</button><button type="button" class="${dangerous ? "danger" : "cta"}" id="dialog-confirm">${escapeHtml(confirmLabel)}</button></div></section>`;
  document.body.append(wrap);
  const close = () => { wrap.remove(); };
  wrap.querySelector("#dialog-cancel").addEventListener("click", close);
  wrap.querySelector("#dialog-confirm").addEventListener("click", async () => { await onConfirm(); close(); });
  wrap.addEventListener("click", event => { if (event.target === wrap) close(); });
  wrap.querySelector("#dialog-cancel").focus();
}

function renderFirstRun() {
  currentScreen = "first-run";
  app.innerHTML = `<section class="intro">${DECO}<div><h1 data-focus-heading tabindex="-1">A private moment to check in</h1><p>See how work is affecting you, then choose one small thing to do next.</p></div><div><p class="small">Your results and plans are saved on this device only. Nothing is sent to us. This tool estimates burnout complaints; it is not medical advice or a diagnosis.</p><button class="cta" id="start-app" type="button">Start</button></div></section>`;
  app.querySelector("#start-app").addEventListener("click", () => { storageSet("onboarding-complete", "1"); renderHome(); });
  focusHeading();
}

async function renderHome() {
  currentScreen = "home";
  clearDirectStart();
  const available = await historyAvailable();
  const plans = available ? await getPlans() : [];
  const duePlan = [...plans].reverse().find(plan => !plan.outcome && new Date(plan.reviewAt) <= new Date());
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone() && storageGet("ios-install-dismissed") !== "1";
  const dueMarkup = duePlan ? `<section class="due-card"><span class="label">Your plan is ready for review</span><strong>${escapeHtml(duePlan.change)}</strong><p>Look back without judging yourself, then take the check-in again.</p><button class="ghost" id="home-review" type="button">Review and check in</button></section>` : "";
  app.innerHTML = `<header class="app-header"><span class="brand-word">Burnies</span><button class="icon-button" id="theme" type="button" aria-label="Change colour theme">◐</button></header><div class="page"><h1 class="home-heading" data-focus-heading tabindex="-1">How are things feeling?</h1><p class="home-copy">Take a quiet check-in, make a small plan, or look back at your own pattern.</p>${dueMarkup}<div class="stack"><button class="tile primary-tile" id="home-checkin" type="button"><strong>Check in</strong><span>12 short statements · about 2 minutes</span>${TILE_ARROW}</button><button class="tile" id="home-plan" type="button"><strong>My plan</strong><span>Choose one change for this week</span>${TILE_ARROW}</button><button class="tile" id="home-history" type="button"><strong>History</strong><span>${available ? "Saved on this device only" : "History is off on this device"}</span>${TILE_ARROW}</button></div>${installPrompt && !isStandalone() ? '<button class="ghost section-gap" id="install-app" type="button">Install Burnies</button>' : ""}${ios ? '<section class="install-card"><button class="icon-button" id="dismiss-ios" type="button" aria-label="Dismiss install instructions">×</button><h3>Add Burnies to your Home Screen</h3><p>In Safari, tap Share, then Add to Home Screen. It will work offline after the first visit.</p></section>' : ""}<nav class="home-links" aria-label="More"><button id="home-support" type="button">Support</button><button id="home-about" type="button">Privacy</button></nav></div>`;
  app.querySelector("#home-checkin").addEventListener("click", renderCheckInIntro);
  app.querySelector("#home-plan").addEventListener("click", () => renderPlanIntro());
  app.querySelector("#home-history").addEventListener("click", renderHistory);
  app.querySelector("#home-review")?.addEventListener("click", renderCheckInIntro);
  app.querySelector("#home-support").addEventListener("click", renderSupport);
  app.querySelector("#home-about").addEventListener("click", renderPrivacy);
  app.querySelector("#install-app")?.addEventListener("click", async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderHome(); });
  app.querySelector("#dismiss-ios")?.addEventListener("click", () => { storageSet("ios-install-dismissed", "1"); renderHome(); });
  app.querySelector("#theme").addEventListener("click", toggleTheme);
  focusHeading();
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : current === "light" ? "" : "dark";
  if (next) document.documentElement.dataset.theme = next; else delete document.documentElement.dataset.theme;
  storageSet("theme", next);
  showToast(next ? `${next[0].toUpperCase()}${next.slice(1)} theme` : "Using device theme");
}

function renderPrivacy() {
  currentScreen = "privacy";
  app.innerHTML = `${header("Privacy")}<section class="page"><h1 data-focus-heading tabindex="-1">Private by design</h1><p class="lead">There is no account, server database, analytics, tracking, or advertising.</p><div class="card"><h3>On this device</h3><p class="muted section-gap">Completed check-ins and plans are stored in your browser so you can review or clear them at any time.</p></div><div class="card"><h3>Calendar links</h3><p class="muted section-gap">Calendar links open only when you choose them. Review events use a neutral title. Your scores, signs, drivers, and message are never included.</p></div><p class="note">Clearing browser data or removing the installed app may remove your history.</p></section>`;
  wireHeader(); focusHeading();
}

function renderSupport() {
  currentScreen = "support";
  app.innerHTML = `${header("Support")}<section class="page"><h1 data-focus-heading tabindex="-1">If it already feels heavy</h1><p class="lead">You do not have to work it out alone.</p><div class="card support-card"><h3>Talk to someone</h3><p>Speak to someone you trust, your manager, or a doctor or counselor. A professional can tell burnout apart from depression and other conditions.</p></div><div class="card support-card"><h3>Immediate danger</h3><p>If you are in immediate danger, contact local emergency services.</p></div><button class="cta section-gap" id="support-plan" type="button">Build my plan</button></section>`;
  wireHeader(); app.querySelector("#support-plan").addEventListener("click", () => renderPlanIntro()); focusHeading();
}

function renderCheckInIntro() {
  currentScreen = "checkin-intro";
  checkInState = { index: 0, answers: Array(QUESTIONS.length).fill(null) };
  app.innerHTML = `<section class="intro">${DECO}<div><h1 data-focus-heading tabindex="-1">Work experience survey</h1><p>12 short statements about how you feel at work. It takes about 2 minutes.</p><p>Go with your first instinct.</p></div><div><p class="small">Your answers stay on this device and completed results are saved here only. This survey estimates burnout complaints; it is not a diagnosis.</p><button class="cta" id="start-checkin" type="button">Start</button><button class="link-button" id="leave-checkin" type="button" style="color:#fff;width:100%;margin-top:8px">Back home</button></div></section>`;
  app.querySelector("#start-checkin").addEventListener("click", renderQuestion);
  app.querySelector("#leave-checkin").addEventListener("click", renderHome);
  focusHeading();
}

function renderQuestion() {
  currentScreen = "checkin-question";
  const { index, answers } = checkInState;
  app.innerHTML = `<section class="flow"><div class="top"><button class="icon-button" id="question-back" type="button" aria-label="Previous question">‹</button><span>${index + 1}/${QUESTIONS.length}</span><button class="icon-button" id="question-close" type="button" aria-label="Close survey">×</button></div><div class="bar" aria-hidden="true"><span style="width:${((index + 1) / QUESTIONS.length) * 100}%"></span></div><h1 data-focus-heading tabindex="-1"><span class="context" style="display:block;font-size:16px;letter-spacing:0">Thinking about your work, how often does this apply to you?</span>${escapeHtml(QUESTIONS[index].text)}</h1><div class="stack" role="radiogroup" aria-label="Answer">${ANSWERS.map((answer, optionIndex) => option(answer, answers[index] === optionIndex + 1, String(optionIndex + 1))).join("")}</div><div class="flow-foot"><button class="cta" id="question-next" type="button" ${answers[index] ? "" : "disabled"}>${index === QUESTIONS.length - 1 ? "See my results" : "Next"}</button></div></section>`;
  app.querySelectorAll(".option").forEach(button => button.addEventListener("click", () => { checkInState.answers[index] = Number(button.dataset.value); renderQuestion(); app.querySelector(`[data-value="${button.dataset.value}"]`)?.focus(); }));
  app.querySelector("#question-next").addEventListener("click", () => { if (!answers[index]) return; if (index === QUESTIONS.length - 1) renderCalculating(); else { checkInState.index += 1; renderQuestion(); } });
  app.querySelector("#question-back").addEventListener("click", () => { if (index === 0) renderCheckInIntro(); else { checkInState.index -= 1; renderQuestion(); } });
  app.querySelector("#question-close").addEventListener("click", () => showDialog({ title: "Leave this check-in?", text: "Your unfinished answers will be cleared.", confirmLabel: "Leave", dangerous: true, onConfirm: renderHome }));
  focusHeading();
}

function renderCalculating() {
  currentScreen = "calculating";
  app.innerHTML = `<section class="intro" style="justify-content:center;text-align:center">${DECO}<div><h1 data-focus-heading tabindex="-1">Calculating your results carefully<span class="loading-ellipsis" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span></h1></div></section>`;
  setTimeout(renderCheckInResult, reducedMotion.matches ? 50 : 1500);
  focusHeading();
}

function trendChart(records, compact = false) {
  if (records.length < 2) return "";
  const shown = records.slice(-6);
  const width = 420, height = 210, left = 34, right = 12, top = 14, bottom = 34;
  const plotBottom = height - bottom;
  const x = index => left + index * ((width - left - right) / Math.max(shown.length - 1, 1));
  const y = value => top + ((5 - value) / 4) * (plotBottom - top);
  const coordinates = shown.map((record, index) => [x(index), y(record.total)]);
  const line = coordinates.slice(1).reduce((path, point, index) => {
    const previous = coordinates[index];
    const middle = (previous[0] + point[0]) / 2;
    return `${path} C ${middle} ${previous[1]}, ${middle} ${point[1]}, ${point[0]} ${point[1]}`;
  }, `M ${coordinates[0][0]} ${coordinates[0][1]}`);
  const area = `${line} L ${coordinates.at(-1)[0]} ${plotBottom} L ${coordinates[0][0]} ${plotBottom} Z`;
  const dayKeys = shown.map(record => localDate(new Date(record.takenAt)));
  const oneDay = new Set(dayKeys).size === 1;
  const labels = shown.map(record => oneDay
    ? new Date(record.takenAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : new Date(record.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  const latest = shown.at(-1).total.toFixed(2);
  const grid = [5, 3, 1].map(value => `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}"/><text x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${value.toFixed(1)}</text>`).join("");
  return `<section class="trend-panel${compact ? " compact" : ""}"><div class="trend-head"><h3>${compact ? "Trend" : "Check-in trend"}</h3><span>Latest ${latest}</span></div><svg class="trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="Your recent check-in scores, from ${shown[0].total.toFixed(2)} to ${latest}"><defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--ink)" stop-opacity=".24"/><stop offset="100%" stop-color="var(--ink)" stop-opacity="0"/></linearGradient></defs><g class="trend-grid">${grid}</g><path d="${area}" fill="url(#trend-fill)"/><path class="trend-line" d="${line}"/>${coordinates.map(([cx, cy]) => `<circle class="trend-point" cx="${cx}" cy="${cy}" r="4"/>`).join("")}<g class="trend-labels">${labels.map((label, index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle">${escapeHtml(label)}</text>`).join("")}</g></svg></section>`;
}

async function renderCheckInResult() {
  currentScreen = "checkin-result";
  const result = scoreAnswers(checkInState.answers);
  const before = await getCheckIns();
  const record = { id: uid(), takenAt: new Date().toISOString(), instrument: "bat12-work-2.0", answers: [...checkInState.answers], ...result };
  let stored = true;
  try { await saveCheckIn(record); } catch { stored = false; }
  const all = [...before, record];
  const previous = before.at(-1);
  const pointers = subscalePointers(result.sub);
  const plans = await getPlans();
  const duePlan = [...plans].reverse().find(plan => !plan.outcome && new Date(plan.reviewAt) <= new Date(record.takenAt));
  const comparison = previous ? `<section class="card"><h3>Your pattern</h3><div class="comparison section-gap"><div><span class="label">Last time</span><strong>${previous.total.toFixed(2)}</strong></div><div class="difference">${Math.abs(record.total - previous.total).toFixed(2)} ${record.total > previous.total ? "higher" : record.total < previous.total ? "lower" : "the same"}</div><div><span class="label">Now</span><strong>${record.total.toFixed(2)}</strong></div></div>${trendChart(all, true)}<p class="note">Small changes between checks are normal. Look for the pattern over several checks.</p></section>` : "";
  const outcome = duePlan ? `<section class="card" id="outcome-card"><span class="label">Last time you planned</span><div class="value">${escapeHtml(duePlan.change)}</div><p class="note">Did it stick?</p><div class="outcome-options"><button type="button" data-outcome="stuck">Yes</button><button type="button" data-outcome="partly">Partly</button><button type="button" data-outcome="not">Not yet</button></div></section>` : "";
  app.innerHTML = `<section class="result"><div class="top"><span></span><span></span><button class="icon-button" id="result-close" type="button" aria-label="Close results">×</button></div><h1 data-focus-heading tabindex="-1">Your results</h1><p class="lead">Based on the short work-related Burnout Assessment Tool (BAT-12).</p>${stored ? "" : '<p class="status">History is off, but the rest of the app still works.</p>'}<div class="hero ${record.zone}"><span class="eyebrow">Overall score</span><div class="score">${record.total.toFixed(2)}<small> / 5</small></div><div class="zone-title">${ZONES[record.zone].label}</div><p>${ZONES[record.zone].description}</p></div>${comparison}${outcome}<section class="section-gap"><h2 style="font-size:22px;margin-bottom:12px">Where to look first</h2>${pointers.map(pointer => `<div class="card"><div class="card-title"><span>${escapeHtml(pointer.label)}</span><span class="badge ${pointer.zone}">${pointer.score.toFixed(2)}</span></div></div>`).join("")}</section><section class="card support-card"><h3>If it already feels heavy</h3><p>Talk to someone you trust, your manager, or a doctor or counselor. A professional can tell burnout apart from depression and other conditions.</p></section><p class="note result-disclaimer">This survey estimates burnout complaints; it does not provide a diagnosis. Its risk zones were developed for Flemish employees, so use them as a guide. If you feel unwell, speak to a health professional.</p><button class="ghost" id="result-retake" type="button">Take it again</button><p class="citation">Source: Schaufeli, W. B., Desart, S. &amp; De Witte, H. (2020), <em>Burnout Assessment Tool (BAT)—Development, Validity and Reliability</em>, and the BAT user manual version 2.0, KU Leuven.</p></section>`;
  app.querySelector("#result-close").addEventListener("click", renderHome);
  app.querySelector("#result-retake").addEventListener("click", renderCheckInIntro);
  app.querySelectorAll("[data-outcome]").forEach(button => button.addEventListener("click", async () => { duePlan.outcome = button.dataset.outcome; try { await updatePlan(duePlan); app.querySelector("#outcome-card").innerHTML = '<span class="label">Last time you planned</span><div class="value">Outcome saved on this device.</div>'; } catch { showToast("Could not save that outcome"); } }));
  focusHeading();
}

function freshPlan(context = {}) {
  const date = new Date(); date.setDate(date.getDate() + 7);
  return { step: 0, signs: [], drivers: [], change: "", actionId: null, reminderTime: "18:00", person: "", personName: "", reviewDate: localDate(date), reviewTime: "09:00", ...context };
}

function renderPlanIntro(context = {}) {
  currentScreen = "plan-intro"; planState = freshPlan(context);
  app.innerHTML = `<section class="intro">${DECO}<div><h1 data-focus-heading tabindex="-1">Your one-page plan</h1><p>Five quick steps, about three minutes. Choose one manageable change to try, then review how it went.</p></div><div><p class="small">Your completed plan is saved on this device only. It is never sent to us. This is not medical advice.</p><button class="cta" id="start-plan" type="button">Start</button><button class="link-button" id="leave-plan" type="button" style="color:#fff;width:100%;margin-top:8px">Back home</button></div></section>`;
  app.querySelector("#start-plan").addEventListener("click", renderPlanStep);
  app.querySelector("#leave-plan").addEventListener("click", renderHome);
  focusHeading();
}

const PLAN_STEPS = [
  ["Which early signs do you notice?", "Pick any that are true for you right now."],
  ["What are your top drivers?", "Where does work mismatch you most? Pick any that fit."],
  ["One change for this week", "These suggestions reflect the signs and drivers you selected. One is enough."],
  ["One person you will tell", "Saying it out loud to someone is the step people skip most."],
  ["When will you review how it went?", "Look back on the week, then retake the check-in."]
];
function planStepValid() {
  return [planState.signs.length > 0, planState.drivers.length > 0, !!planState.change.trim(), !!planState.person, !!planState.reviewDate][planState.step];
}

function renderPlanStep() {
  currentScreen = "plan-step";
  const step = planState.step;
  const quickReviewDates = [7, 14, 21].map(days => { const date = new Date(); date.setDate(date.getDate() + days); return { days, date: localDate(date) }; });
  let body = "";
  if (step === 0) body = `<div class="stack" role="group" aria-label="Early signs">${SIGNS.map(sign => option(sign, planState.signs.includes(sign), sign, "checkbox")).join("")}</div>`;
  if (step === 1) body = `<div class="stack" role="group" aria-label="Top drivers">${DRIVERS.map(([driver, detail]) => option(driver, planState.drivers.includes(driver), driver, "checkbox", detail)).join("")}</div>`;
  if (step === 2) {
    const ranked = suggestActions(planState.drivers, planState.assessmentFocus, planState.signs);
    const selected = ranked.find(action => action.title === planState.change);
    const choices = actions => actions.map(action => option(action.title, planState.change === action.title, action.title, "radio", `${action.summary} · ${action.duration} min`)).join("");
    body = `<div class="action-groups" role="radiogroup" aria-label="Change this week"><h3>Suggested for you</h3><div class="stack">${choices(ranked.slice(0, 3))}</div><h3>Other ideas</h3><div class="stack">${choices(ranked.slice(3))}</div></div>${selected ? `<section class="action-preview"><span>How to try it</span><p>${escapeHtml(selected.instruction)}</p><small>${escapeHtml(selected.frequency)}</small></section>` : ""}<label class="field-label" for="custom-change">Or write your own</label><input class="field" id="custom-change" maxlength="90" placeholder="For example: no work messages after 7pm" value="${ACTIONS.some(action => action.title === planState.change) ? "" : escapeHtml(planState.change)}"><div class="count"><span id="change-count">${ACTIONS.some(action => action.title === planState.change) ? 0 : planState.change.length}</span>/90</div><label class="field-label" for="reminder-time">Reminder time (clear it to skip)</label><input class="field" id="reminder-time" type="time" value="${escapeHtml(planState.reminderTime)}">`;
  }
  if (step === 3) body = `<div class="stack" role="radiogroup" aria-label="Person to tell">${PEOPLE.map(person => option(person, planState.person === person, person)).join("")}</div><label class="field-label" for="person-name">First name (optional)</label><input class="field" id="person-name" maxlength="40" placeholder="First name" value="${escapeHtml(planState.personName)}"><div class="count"><span id="name-count">${planState.personName.length}</span>/40</div>`;
  if (step === 4) body = `<div class="chips" role="group" aria-label="Quick review dates">${quickReviewDates.map(({ days, date }) => `<button class="chip" type="button" data-days="${days}" data-date="${date}" aria-pressed="${planState.reviewDate === date}">In ${days / 7} ${days === 7 ? "week" : "weeks"}</button>`).join("")}</div><div class="two-column"><div><label class="field-label" for="review-date">Date</label><input class="field" id="review-date" type="date" min="${localDate(new Date())}" value="${escapeHtml(planState.reviewDate)}"></div><div><label class="field-label" for="review-time">Time</label><input class="field" id="review-time" type="time" value="${escapeHtml(planState.reviewTime)}"></div></div>`;
  app.innerHTML = `<section class="flow"><div class="top"><button class="icon-button" id="plan-back" type="button" aria-label="Previous step">‹</button><span>${step + 1}/${PLAN_STEPS.length}</span><button class="icon-button" id="plan-close" type="button" aria-label="Close plan">×</button></div><div class="bar" aria-hidden="true"><span style="width:${((step + 1) / PLAN_STEPS.length) * 100}%"></span></div><h1 data-focus-heading tabindex="-1">${PLAN_STEPS[step][0]}</h1><p class="context">${PLAN_STEPS[step][1]}</p>${body}<div class="flow-foot"><button class="cta" id="plan-next" type="button" ${planStepValid() ? "" : "disabled"}>${step === PLAN_STEPS.length - 1 ? "Show my plan" : "Next"}</button></div></section>`;
  app.querySelector("#plan-back").addEventListener("click", () => { if (step === 0) renderPlanIntro(); else { planState.step -= 1; renderPlanStep(); } });
  app.querySelector("#plan-close").addEventListener("click", () => showDialog({ title: "Leave this plan?", text: "Your unfinished choices will be cleared.", confirmLabel: "Leave", dangerous: true, onConfirm: renderHome }));
  app.querySelector("#plan-next").addEventListener("click", () => { if (!planStepValid()) return; if (step === PLAN_STEPS.length - 1) finishPlan(); else { planState.step += 1; renderPlanStep(); } });
  app.querySelectorAll(".option").forEach(button => button.addEventListener("click", () => {
    const value = button.dataset.value;
    if (step === 0) {
      if (value === "None right now") planState.signs = planState.signs.includes(value) ? [] : [value];
      else { planState.signs = planState.signs.filter(sign => sign !== "None right now"); planState.signs = planState.signs.includes(value) ? planState.signs.filter(sign => sign !== value) : [...planState.signs, value]; }
    }
    if (step === 1) planState.drivers = planState.drivers.includes(value) ? planState.drivers.filter(driver => driver !== value) : [...planState.drivers, value];
    if (step === 2) { planState.change = value; planState.actionId = ACTIONS.find(action => action.title === value)?.id || null; }
    if (step === 3) planState.person = value;
    renderPlanStep(); app.querySelector(`[data-value="${CSS.escape(value)}"]`)?.focus();
  }));
  app.querySelector("#custom-change")?.addEventListener("input", event => { planState.change = event.target.value.trimStart(); planState.actionId = null; app.querySelector("#change-count").textContent = event.target.value.length; app.querySelectorAll(".option").forEach(item => item.setAttribute("aria-checked", "false")); app.querySelector("#plan-next").disabled = !planStepValid(); });
  app.querySelector("#reminder-time")?.addEventListener("input", event => { planState.reminderTime = event.target.value; });
  app.querySelector("#person-name")?.addEventListener("input", event => { planState.personName = event.target.value; app.querySelector("#name-count").textContent = event.target.value.length; });
  const syncReviewDateChips = value => app.querySelectorAll("[data-date]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.date === value)));
  app.querySelector("#review-date")?.addEventListener("input", event => { planState.reviewDate = event.target.value; syncReviewDateChips(planState.reviewDate); app.querySelector("#plan-next").disabled = !planStepValid(); });
  app.querySelector("#review-time")?.addEventListener("input", event => { planState.reviewTime = event.target.value || "09:00"; });
  app.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", () => { planState.reviewDate = button.dataset.date; app.querySelector("#review-date").value = planState.reviewDate; syncReviewDateChips(planState.reviewDate); app.querySelector("#plan-next").disabled = false; }));
  focusHeading();
}

function planMessage(plan) {
  const realSigns = plan.signs.filter(sign => sign !== "None right now").map(sign => sign.toLowerCase());
  const noticed = realSigns.length ? `I've noticed ${realSigns.join(", ")} lately` : "I've been thinking about how I'm coping with work lately";
  const hi = `Hi${plan.personName ? ` ${plan.personName}` : ""}, `;
  if (plan.person === "A doctor or counselor") return `${hi}${noticed} and I think work may be part of it. I'd like to book a time to talk about it.`;
  if (plan.person === "My manager") return `${hi}${noticed}, and I'd like to talk through my workload and priorities. Do you have 15 minutes this week?`;
  return `${hi}${noticed} and I'd like to talk it through. Do you have 15 minutes this week?`;
}

function planLines(plan) {
  const action = actionDetails(plan);
  const drivers = driversForPlan(plan);
  const review = new Date(plan.reviewAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return [["My focus", focusForDriver(drivers)], ["My 7-day experiment", action.title], ["How I'll try it", action.instruction], ["Schedule", `${action.duration} minutes · ${action.frequency}${plan.reminderTime ? ` · reminder at ${plan.reminderTime}` : ""}`], ["I'll review on", review], ["My top drivers", drivers.join(", ")], ["One person I'll tell", `${plan.person}${plan.personName ? ` (${plan.personName})` : ""}`]];
}

async function finishPlan() {
  const details = actionDetails(planState);
  const plan = { id: uid(), createdAt: new Date().toISOString(), signs: [...planState.signs], drivers: [...planState.drivers], driver: planState.drivers[0], change: planState.change.trim(), actionId: details.id, actionInstruction: details.instruction, actionDuration: details.duration, actionFrequency: details.frequency, reminderTime: planState.reminderTime || null, person: planState.person, personName: planState.personName.trim() || null, reviewAt: parseLocal(planState.reviewDate, planState.reviewTime || "09:00").toISOString(), assessmentZone: planState.assessmentZone || null, assessmentFocus: planState.assessmentFocus || null, outcome: null };
  let stored = true;
  try { await savePlan(plan); } catch { stored = false; }
  renderPlanResult(plan, stored);
}

function calendarFile(plan, options = {}) {
  return new File([createIcs(plan, appUrl(), options)], "burnies-plan.ics", { type: "text/calendar" });
}

function downloadCalendarFile(plan, options) {
  const blob = calendarFile(plan, options);
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "burnies-plan.ics";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  showToast("Downloaded — open the file and tap Add");
}

function openCalendarSheet(plan, links) {
  const returnFocus = document.activeElement;
  const sheet = document.createElement("div");
  sheet.className = "sheet-backdrop";
  sheet.innerHTML = `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="calendar-sheet-title"><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><div><h2 id="calendar-sheet-title">Save calendar reminders</h2><p>Google opens in your browser. Apple and other calendars use a download.</p></div><button class="icon-button" id="calendar-sheet-close" type="button" aria-label="Close calendar options">×</button></div><fieldset class="calendar-choices"><legend>Include in the downloaded file</legend>${links.reminder ? '<label><input id="include-reminder" type="checkbox" checked><span><strong>Plan reminder</strong><small>Weekdays until your review date</small></span></label>' : ""}<label><input id="include-review" type="checkbox" checked><span><strong>Review check-in</strong><small>One event on your review date</small></span></label></fieldset><label class="field-label" for="alert-minutes">Alert in the downloaded file</label><select class="field" id="alert-minutes"><option value="">No alert</option><option value="0">At the scheduled time</option><option value="10" selected>10 minutes before</option><option value="30">30 minutes before</option></select><div class="sheet-options section-gap"><a id="google-review" href="${escapeHtml(links.google)}" rel="noopener"><strong>Add review to Google Calendar</strong><span>Opens Google Calendar to confirm the event</span></a>${links.reminder ? `<a id="google-reminder" href="${escapeHtml(links.reminder.url)}" rel="noopener"><strong>Add reminder to Google Calendar</strong><span>Opens Google Calendar to confirm the weekdays</span></a>` : ""}<button id="download-calendar" type="button"><strong>Download for Apple or Outlook</strong><span>Open the downloaded file, then tap Add</span></button></div><p class="note">Your browser cannot reliably open a calendar app directly. The download is the standard calendar file used by Apple Calendar, Outlook and other calendar apps.</p></section>`;
  document.body.append(sheet);
  document.body.style.overflow = "hidden";
  const close = () => {
    sheet.remove();
    document.body.style.overflow = "";
    returnFocus?.focus();
  };
  sheet.querySelector("#calendar-sheet-close").addEventListener("click", close);
  sheet.addEventListener("click", event => { if (event.target === sheet) close(); });
  sheet.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setTimeout(close, 0)));
  const updateChoices = () => {
    const includeReview = sheet.querySelector("#include-review").checked;
    const includeReminder = sheet.querySelector("#include-reminder")?.checked ?? false;
    sheet.querySelector("#google-review").hidden = !includeReview;
    if (sheet.querySelector("#google-reminder")) sheet.querySelector("#google-reminder").hidden = !includeReminder;
    sheet.querySelector("#download-calendar").disabled = !includeReview && !includeReminder;
  };
  sheet.querySelectorAll('input[type="checkbox"]').forEach(input => input.addEventListener("change", updateChoices));
  sheet.querySelector("#download-calendar").addEventListener("click", () => {
    const rawAlert = sheet.querySelector("#alert-minutes").value;
    const options = { includeReview: sheet.querySelector("#include-review").checked, includeReminder: sheet.querySelector("#include-reminder")?.checked ?? false, alertMinutes: rawAlert === "" ? null : Number(rawAlert) };
    downloadCalendarFile(plan, options);
    close();
  });
  sheet.addEventListener("keydown", event => {
    if (event.key === "Escape") { close(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...sheet.querySelectorAll("a:not([hidden]), button:not([disabled]), input, select")];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  sheet.querySelector("#calendar-sheet-close").focus();
}

function renderPlanResult(plan, stored = true) {
  currentScreen = "plan-result";
  const lines = planLines(plan);
  const message = planMessage(plan);
  const action = actionDetails(plan);
  const drivers = driversForPlan(plan);
  const review = lines[4][1];
  const links = calendarLinks(plan, appUrl());
  app.innerHTML = `<section class="result"><div class="top"><span></span><span></span><button class="icon-button" id="plan-result-close" type="button" aria-label="Close plan">×</button></div><h1 data-focus-heading tabindex="-1">Your plan</h1><p class="lead">One manageable experiment. You do not need to do it perfectly.</p>${stored ? "" : '<p class="status">History is off, but you can still copy your plan.</p>'}<div class="hero red"><span class="eyebrow">Your focus this week</span><div class="zone-title">${escapeHtml(focusForDriver(drivers))}</div><p>Try one small change, then notice what helped.</p></div><section class="card experiment-card"><div class="label">Your 7-day experiment</div><h2>${escapeHtml(action.title)}</h2><p>${escapeHtml(action.instruction)}</p><div class="experiment-meta"><span>${escapeHtml(`${action.duration} min`)}</span><span>${escapeHtml(action.frequency)}</span>${plan.reminderTime ? `<span>Reminder ${escapeHtml(plan.reminderTime)}</span>` : ""}</div></section><div class="card"><div class="label">Do now: message to ${escapeHtml(plan.person.toLowerCase())}</div><div class="value message">${escapeHtml(message)}</div><button class="copy-link" id="copy-message" type="button">${ICON_COPY} Copy message</button></div><div class="card review-card"><div class="label">Review how it went</div><div class="value">${escapeHtml(review)}</div><p class="note">Look back without judging yourself, then retake the check-in.</p></div><div class="section-gap stack"><button class="cta" id="calendar-toggle" type="button">Save calendar reminders</button><button class="ghost" id="copy-plan" type="button">Copy my plan</button></div><p class="note">Calendar events include only the change you chose and a neutral review event. Your scores, signs, drivers and message stay in Burnies.</p></section>`;
  app.querySelector("#plan-result-close").addEventListener("click", renderHome);
  app.querySelector("#copy-message").addEventListener("click", () => copyText(message, "Message copied"));
  app.querySelector("#copy-plan").addEventListener("click", () => copyText(`My Burnies plan\n${lines.map(([label, value]) => `${label}: ${value}`).join("\n")}`, "Plan copied"));
  app.querySelector("#calendar-toggle").addEventListener("click", () => openCalendarSheet(plan, links));
  focusHeading();
}

async function renderHistory() {
  currentScreen = "history";
  const available = await historyAvailable();
  const [checkins, plans] = await Promise.all([getCheckIns(), getPlans()]);
  const checkInMarkup = [...checkins].reverse().map(record => `<div class="card history-item"><div><strong>${record.total.toFixed(2)} · ${escapeHtml(ZONES[record.zone].label)}</strong><br><time datetime="${record.takenAt}">${new Date(record.takenAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></div><span class="badge ${record.zone}">${record.zone}</span></div>`).join("");
  const planMarkup = [...plans].reverse().map(plan => `<button class="card history-item history-plan" type="button" data-plan-id="${escapeHtml(plan.id)}"><div><strong>${escapeHtml(plan.change)}</strong><br><time datetime="${plan.createdAt}">${new Date(plan.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}</time></div><span class="badge">${plan.outcome ? escapeHtml(plan.outcome === "stuck" ? "Yes" : plan.outcome === "not" ? "Not yet" : "Partly") : "View plan"}</span></button>`).join("");
  app.innerHTML = `${header("History")}<section class="page"><h1 data-focus-heading tabindex="-1">Your history</h1><p class="lead">Saved on this device only. Your scores are compared only with your own previous check-ins.</p>${available ? "" : '<p class="status">History is off on this device. Check-ins and plans still work, but completed entries cannot be saved.</p>'}<section class="history-group"><h2>Check-ins</h2>${checkins.length > 1 ? trendChart(checkins) : ""}${checkInMarkup || '<div class="history-empty">No completed check-ins yet.</div>'}</section><section class="history-group"><h2>Plans</h2>${planMarkup || '<div class="history-empty">No completed plans yet.</div>'}</section><button class="danger" id="clear-history" type="button" ${(checkins.length || plans.length) && available ? "" : "disabled"}>Clear my history</button></section>`;
  wireHeader();
  app.querySelectorAll("[data-plan-id]").forEach(button => button.addEventListener("click", () => {
    const plan = plans.find(item => item.id === button.dataset.planId);
    if (plan) renderPlanResult(plan, true);
  }));
  app.querySelector("#clear-history").addEventListener("click", () => showDialog({ title: "Clear all history?", text: "This removes every saved check-in and plan from this device. This cannot be undone.", confirmLabel: "Clear history", dangerous: true, onConfirm: async () => { try { await clearHistory(); showToast("History cleared"); renderHistory(); } catch { showToast("History could not be cleared"); } } }));
  focusHeading();
}

function registerInstallEvents() {
  addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; if (currentScreen === "home") renderHome(); });
  addEventListener("appinstalled", () => { installPrompt = null; showToast("App installed"); });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    const showUpdate = worker => {
      const banner = document.querySelector("#update-banner"); banner.hidden = false;
      document.querySelector("#apply-update").onclick = () => worker.postMessage({ type: "SKIP_WAITING" });
    };
    if (registration.waiting) showUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => { const worker = registration.installing; worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker); }); });
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!refreshing) { refreshing = true; location.reload(); } });
  } catch { /* The app remains usable without offline installation. */ }
}

const savedTheme = storageGet("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
registerInstallEvents();
registerServiceWorker();
if (directStart() === "checkin") {
  storageSet("onboarding-complete", "1");
  renderCheckInIntro();
} else if (directStart() === "plan") {
  storageSet("onboarding-complete", "1");
  renderPlanIntro();
} else if (storageGet("onboarding-complete") === "1") renderHome();
else renderFirstRun();
