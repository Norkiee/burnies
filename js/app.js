import { QUESTIONS, ANSWERS, ZONES, SUBSCALES, SIGNS, DRIVERS, CHANGES, PEOPLE } from "./data.js";
import { scoreAnswers, subscalePointers } from "./scoring.js";
import { historyAvailable, saveCheckIn, savePlan, updatePlan, getCheckIns, getPlans, clearHistory, exportHistory, importHistory } from "./storage.js";
import { localDate, parseLocal, calendarLinks, createIcs } from "./calendar.js";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const DECO = '<div class="deco" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
const ICON_COPY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
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
  const available = await historyAvailable();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone() && storageGet("ios-install-dismissed") !== "1";
  app.innerHTML = `<div class="page"><header class="app-header"><span class="brand-word">Burnies</span><button class="icon-button" id="theme" type="button" aria-label="Change colour theme">◐</button></header><h1 class="home-heading" data-focus-heading tabindex="-1">How are things feeling?</h1><p class="home-copy">Take a quiet check-in, make a small plan, or look back at your own pattern.</p><div class="stack"><button class="tile primary-tile" id="home-checkin" type="button"><strong>Check in</strong><span>12 short statements · about 2 minutes</span></button><button class="tile" id="home-plan" type="button"><strong>My plan</strong><span>Choose one change for this week</span></button><button class="tile" id="home-history" type="button"><strong>History</strong><span>${available ? "Saved on this device only" : "History is off on this device"}</span></button></div>${installPrompt && !isStandalone() ? '<button class="ghost section-gap" id="install-app" type="button">Install Burnies</button>' : ""}${ios ? '<section class="install-card"><button class="icon-button" id="dismiss-ios" type="button" aria-label="Dismiss install instructions">×</button><h3>Add Burnies to your Home Screen</h3><p>In Safari, tap Share, then Add to Home Screen. It will work offline after the first visit.</p></section>' : ""}<nav class="home-links" aria-label="More"><button id="home-support" type="button">Support</button><button id="home-about" type="button">Privacy</button></nav></div>`;
  app.querySelector("#home-checkin").addEventListener("click", renderCheckInIntro);
  app.querySelector("#home-plan").addEventListener("click", renderPlanIntro);
  app.querySelector("#home-history").addEventListener("click", renderHistory);
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
  app.innerHTML = `${header("Privacy")}<section class="page"><h1 data-focus-heading tabindex="-1">Private by design</h1><p class="lead">There is no account, server database, analytics, tracking, or advertising.</p><div class="card"><h3>On this device</h3><p class="muted section-gap">Completed check-ins and plans are stored in your browser so you can see your history. You can copy a backup or clear everything at any time.</p></div><div class="card"><h3>Calendar links</h3><p class="muted section-gap">Calendar links open only when you choose them. Review events use a neutral title. Your scores, signs, driver, and message are never included.</p></div><p class="note">Clearing browser data or removing the installed app may remove your history.</p></section>`;
  wireHeader(); focusHeading();
}

function renderSupport() {
  currentScreen = "support";
  app.innerHTML = `${header("Support")}<section class="page"><h1 data-focus-heading tabindex="-1">If it already feels heavy</h1><p class="lead">You do not have to work it out alone.</p><div class="card support-card"><h3>Talk to someone</h3><p>Speak to someone you trust, your manager, or a doctor or counselor. A professional can tell burnout apart from depression and other conditions.</p></div><div class="card support-card"><h3>Immediate danger</h3><p>If you are in immediate danger, contact local emergency services.</p></div><button class="cta section-gap" id="support-plan" type="button">Build my plan</button></section>`;
  wireHeader(); app.querySelector("#support-plan").addEventListener("click", renderPlanIntro); focusHeading();
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
  app.innerHTML = `<section class="intro" style="justify-content:center;text-align:center">${DECO}<div><h1 data-focus-heading tabindex="-1">Calculating your results carefully…</h1><button class="link-button" id="skip-calculation" type="button" style="color:#fff;margin-top:24px">Show now</button></div></section>`;
  let shown = false;
  const show = () => { if (shown) return; shown = true; renderCheckInResult(); };
  app.querySelector("#skip-calculation").addEventListener("click", show);
  setTimeout(show, reducedMotion.matches ? 50 : 1500);
  focusHeading();
}

function trendChart(records) {
  if (records.length < 2) return "";
  const width = 420, height = 150, pad = 20;
  const x = index => pad + index * ((width - pad * 2) / Math.max(records.length - 1, 1));
  const y = value => height - pad - ((value - 1) / 4) * (height - pad * 2);
  const points = records.map((record, index) => `${x(index)},${y(record.total)}`).join(" ");
  return `<svg class="trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="Your check-in scores over time, from ${records[0].total.toFixed(2)} to ${records.at(-1).total.toFixed(2)}"><rect x="${pad}" y="${y(2.53)}" width="${width - pad * 2}" height="${y(1) - y(2.53)}" fill="var(--green)" opacity=".12"/><rect x="${pad}" y="${y(2.95)}" width="${width - pad * 2}" height="${y(2.53) - y(2.95)}" fill="var(--orange)" opacity=".14"/><rect x="${pad}" y="${y(5)}" width="${width - pad * 2}" height="${y(2.95) - y(5)}" fill="var(--zone-red)" opacity=".12"/><polyline points="${points}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${records.map((record, index) => `<circle cx="${x(index)}" cy="${y(record.total)}" r="5" fill="var(--bg)" stroke="var(--ink)" stroke-width="3"/>`).join("")}</svg>`;
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
  const comparison = previous ? `<section class="card"><h3>Your pattern</h3><div class="comparison section-gap"><div><span class="label">Last time</span><strong>${previous.total.toFixed(2)}</strong></div><div class="difference">${Math.abs(record.total - previous.total).toFixed(2)} ${record.total > previous.total ? "higher" : record.total < previous.total ? "lower" : "the same"}</div><div><span class="label">Now</span><strong>${record.total.toFixed(2)}</strong></div></div>${trendChart(all)}<p class="note">Small changes between checks are normal. Look for the pattern over several checks.</p></section>` : "";
  const outcome = duePlan ? `<section class="card" id="outcome-card"><span class="label">Last time you planned</span><div class="value">${escapeHtml(duePlan.change)}</div><p class="note">Did it stick?</p><div class="outcome-options"><button type="button" data-outcome="stuck">Yes</button><button type="button" data-outcome="partly">Partly</button><button type="button" data-outcome="not">Not yet</button></div></section>` : "";
  app.innerHTML = `<section class="result"><div class="top"><span></span><span></span><button class="icon-button" id="result-close" type="button" aria-label="Close results">×</button></div><h1 data-focus-heading tabindex="-1">Your results</h1><p class="lead">Based on the short work-related Burnout Assessment Tool (BAT-12).</p>${stored ? "" : '<p class="status">History is off, but the rest of the app still works.</p>'}<div class="hero ${record.zone}"><span class="eyebrow">Overall score</span><div class="score">${record.total.toFixed(2)}<small> / 5</small></div><div class="zone-title">${ZONES[record.zone].label}</div><p>${ZONES[record.zone].description}</p></div>${comparison}${outcome}<section class="section-gap"><h2 style="font-size:22px;margin-bottom:12px">Where to look first</h2>${pointers.map(pointer => `<div class="card"><div class="card-title"><span>${escapeHtml(pointer.label)}</span><span class="badge ${pointer.zone}">${pointer.score.toFixed(2)}</span></div></div>`).join("")}<p class="note">These subscales are pointers only, not individual verdicts.</p></section><section class="card support-card"><h3>If it already feels heavy</h3><p>Talk to someone you trust, your manager, or a doctor or counselor. A professional can tell burnout apart from depression and other conditions.</p></section><p class="note">This survey estimates burnout complaints. It cannot diagnose burnout or tell it apart from conditions such as depression; that needs an interview with a trained professional. Zones come from clinical cut-offs for Flemish employees, so treat them as a guide for other populations. If you feel unwell, please speak to a health professional.</p><p class="note">Source: Schaufeli, W. B., Desart, S. &amp; De Witte, H. (2020), <em>Burnout Assessment Tool (BAT)—Development, Validity and Reliability</em>, and the BAT user manual version 2.0, KU Leuven.</p><div class="stack"><button class="cta" id="result-plan" type="button">Build my plan</button><button class="ghost" id="result-retake" type="button">Take it again</button></div></section>`;
  app.querySelector("#result-close").addEventListener("click", renderHome);
  app.querySelector("#result-plan").addEventListener("click", renderPlanIntro);
  app.querySelector("#result-retake").addEventListener("click", renderCheckInIntro);
  app.querySelectorAll("[data-outcome]").forEach(button => button.addEventListener("click", async () => { duePlan.outcome = button.dataset.outcome; try { await updatePlan(duePlan); app.querySelector("#outcome-card").innerHTML = '<span class="label">Last time you planned</span><div class="value">Outcome saved on this device.</div>'; } catch { showToast("Could not save that outcome"); } }));
  focusHeading();
}

function freshPlan() {
  const date = new Date(); date.setDate(date.getDate() + 7);
  return { step: 0, signs: [], driver: "", change: "", reminderTime: "18:00", person: "", personName: "", reviewDate: localDate(date), reviewTime: "09:00" };
}

function renderPlanIntro() {
  currentScreen = "plan-intro"; planState = freshPlan();
  app.innerHTML = `<section class="intro">${DECO}<div><h1 data-focus-heading tabindex="-1">Your one-page plan</h1><p>Five quick steps, about three minutes. You finish with one small change, a message ready to send, and a reminder to review how it went.</p></div><div><p class="small">Your completed plan is saved on this device only. It is never sent to us. This is not medical advice.</p><button class="cta" id="start-plan" type="button">Start</button><button class="link-button" id="leave-plan" type="button" style="color:#fff;width:100%;margin-top:8px">Back home</button></div></section>`;
  app.querySelector("#start-plan").addEventListener("click", renderPlanStep);
  app.querySelector("#leave-plan").addEventListener("click", renderHome);
  focusHeading();
}

const PLAN_STEPS = [
  ["Which early signs do you notice?", "Pick any that are true for you right now."],
  ["What is your top driver?", "Where does work mismatch you most? Pick one."],
  ["One change for this week", "Pick one. Small is fine."],
  ["One person you will tell", "Saying it out loud to someone is the step people skip most."],
  ["When will you review how it went?", "Look back on the week, then retake the check-in."]
];
function planStepValid() {
  return [planState.signs.length > 0, !!planState.driver, !!planState.change.trim(), !!planState.person, !!planState.reviewDate][planState.step];
}

function renderPlanStep() {
  currentScreen = "plan-step";
  const step = planState.step;
  let body = "";
  if (step === 0) body = `<div class="stack" role="group" aria-label="Early signs">${SIGNS.map(sign => option(sign, planState.signs.includes(sign), sign, "checkbox")).join("")}</div>`;
  if (step === 1) body = `<div class="stack" role="radiogroup" aria-label="Top driver">${DRIVERS.map(([driver, detail]) => option(driver, planState.driver === driver, driver, "radio", detail)).join("")}</div>`;
  if (step === 2) body = `<div class="stack" role="radiogroup" aria-label="Change this week">${CHANGES.map(change => option(change, planState.change === change, change)).join("")}</div><label class="field-label" for="custom-change">Or write your own</label><input class="field" id="custom-change" maxlength="90" placeholder="For example: no work messages after 7pm" value="${CHANGES.includes(planState.change) ? "" : escapeHtml(planState.change)}"><div class="count"><span id="change-count">${CHANGES.includes(planState.change) ? 0 : planState.change.length}</span>/90</div><label class="field-label" for="reminder-time">Weekday reminder time (clear it to skip)</label><input class="field" id="reminder-time" type="time" value="${escapeHtml(planState.reminderTime)}">`;
  if (step === 3) body = `<div class="stack" role="radiogroup" aria-label="Person to tell">${PEOPLE.map(person => option(person, planState.person === person, person)).join("")}</div><label class="field-label" for="person-name">First name (optional)</label><input class="field" id="person-name" maxlength="40" placeholder="First name" value="${escapeHtml(planState.personName)}"><div class="count"><span id="name-count">${planState.personName.length}</span>/40</div>`;
  if (step === 4) body = `<div class="chips" role="group" aria-label="Quick review dates"><button class="chip" type="button" data-days="7">In 1 week</button><button class="chip" type="button" data-days="14">In 2 weeks</button><button class="chip" type="button" data-days="month">In 1 month</button></div><div class="two-column"><div><label class="field-label" for="review-date">Date</label><input class="field" id="review-date" type="date" min="${localDate(new Date())}" value="${escapeHtml(planState.reviewDate)}"></div><div><label class="field-label" for="review-time">Time</label><input class="field" id="review-time" type="time" value="${escapeHtml(planState.reviewTime)}"></div></div>`;
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
    if (step === 1) planState.driver = value;
    if (step === 2) planState.change = value;
    if (step === 3) planState.person = value;
    renderPlanStep(); app.querySelector(`[data-value="${CSS.escape(value)}"]`)?.focus();
  }));
  app.querySelector("#custom-change")?.addEventListener("input", event => { planState.change = event.target.value.trimStart(); app.querySelector("#change-count").textContent = event.target.value.length; app.querySelectorAll(".option").forEach(item => item.setAttribute("aria-checked", "false")); app.querySelector("#plan-next").disabled = !planStepValid(); });
  app.querySelector("#reminder-time")?.addEventListener("input", event => { planState.reminderTime = event.target.value; });
  app.querySelector("#person-name")?.addEventListener("input", event => { planState.personName = event.target.value; app.querySelector("#name-count").textContent = event.target.value.length; });
  app.querySelector("#review-date")?.addEventListener("input", event => { planState.reviewDate = event.target.value; app.querySelector("#plan-next").disabled = !planStepValid(); });
  app.querySelector("#review-time")?.addEventListener("input", event => { planState.reviewTime = event.target.value || "09:00"; });
  app.querySelectorAll("[data-days]").forEach(button => button.addEventListener("click", () => { const date = new Date(); if (button.dataset.days === "month") date.setMonth(date.getMonth() + 1); else date.setDate(date.getDate() + Number(button.dataset.days)); planState.reviewDate = localDate(date); app.querySelector("#review-date").value = planState.reviewDate; app.querySelector("#plan-next").disabled = false; }));
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
  const review = new Date(plan.reviewAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return [["My early signs", plan.signs.join(", ")], ["My top driver", plan.driver], ["My change this week", `${plan.change}${plan.reminderTime ? `, reminder at ${plan.reminderTime} on weekdays` : ""}`], ["One person I'll tell", `${plan.person}${plan.personName ? ` (${plan.personName})` : ""}`], ["I'll review on", review]];
}

async function finishPlan() {
  const plan = { id: uid(), createdAt: new Date().toISOString(), signs: [...planState.signs], driver: planState.driver, change: planState.change.trim(), reminderTime: planState.reminderTime || null, person: planState.person, personName: planState.personName.trim() || null, reviewAt: parseLocal(planState.reviewDate, planState.reviewTime || "09:00").toISOString(), outcome: null };
  let stored = true;
  try { await savePlan(plan); } catch { stored = false; }
  renderPlanResult(plan, stored);
}

function downloadCalendarFile(plan) {
  const blob = new Blob([createIcs(plan, appUrl())], { type: "text/calendar;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "burnies-plan.ics";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function openCalendarSheet(plan, links) {
  const returnFocus = document.activeElement;
  const sheet = document.createElement("div");
  sheet.className = "sheet-backdrop";
  sheet.innerHTML = `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="calendar-sheet-title"><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-header"><div><h2 id="calendar-sheet-title">Add to calendar</h2><p>Choose where to add your review or reminder.</p></div><button class="icon-button" id="calendar-sheet-close" type="button" aria-label="Close calendar options">×</button></div><div class="sheet-options"><a href="${escapeHtml(links.google)}" target="_blank" rel="noopener"><strong>Google Calendar</strong><span>Review how it went</span></a>${links.reminder ? `<a href="${escapeHtml(links.reminder.url)}" target="_blank" rel="noopener"><strong>Google Calendar</strong><span>Weekday reminder</span></a>` : ""}<a href="${escapeHtml(links.outlook)}" target="_blank" rel="noopener"><strong>Outlook Calendar</strong><span>Review how it went</span></a>${isStandalone() ? '<button id="download-ics" type="button"><strong>Calendar file</strong><span>Apple Calendar and other apps</span></button>' : ""}</div><p class="note">Calendar events contain only the neutral review details described below.</p></section>`;
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
  sheet.querySelector("#download-ics")?.addEventListener("click", () => { downloadCalendarFile(plan); close(); });
  sheet.addEventListener("keydown", event => {
    if (event.key === "Escape") { close(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...sheet.querySelectorAll("a, button")];
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
  const links = calendarLinks(plan, appUrl());
  app.innerHTML = `<section class="result"><div class="top"><span></span><span></span><button class="icon-button" id="plan-result-close" type="button" aria-label="Close plan">×</button></div><h1 data-focus-heading tabindex="-1">Your plan</h1><p class="lead">Do the two small things below now. Then copy the plan before you close this page.</p>${stored ? "" : '<p class="status">History is off, but you can still copy your plan.</p>'}<div class="hero red"><span class="eyebrow">Review how it went</span><div class="zone-title">${escapeHtml(lines[4][1])}</div><p>Look back on the week, then retake the check-in.</p></div>${lines.slice(0, 4).map(([label, value]) => `<div class="card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`).join("")}<div class="card"><div class="label">Do now: message to ${escapeHtml(plan.person.toLowerCase())}</div><div class="value message">${escapeHtml(message)}</div><button class="copy-link" id="copy-message" type="button">${ICON_COPY} Copy message</button></div><div class="section-gap stack"><button class="cta" id="calendar-toggle" type="button">Add to calendar</button><button class="ghost" id="copy-plan" type="button">Copy my plan</button></div><p class="note">The review event is titled “Check in with myself” and holds only a link to the check-in. The weekday reminder carries only the change you chose. The rest of your plan is not added to any calendar.</p></section>`;
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
  const planMarkup = [...plans].reverse().map(plan => `<div class="card history-item"><div><strong>${escapeHtml(plan.change)}</strong><br><time datetime="${plan.createdAt}">${new Date(plan.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}</time></div><span class="badge">${plan.outcome ? escapeHtml(plan.outcome === "stuck" ? "Yes" : plan.outcome === "not" ? "Not yet" : "Partly") : "Awaiting review"}</span></div>`).join("");
  app.innerHTML = `${header("History")}<section class="page"><h1 data-focus-heading tabindex="-1">Your history</h1><p class="lead">Saved on this device only. Your scores are compared only with your own previous check-ins.</p>${available ? "" : '<p class="status">History is off on this device. Check-ins and plans still work, but completed entries cannot be saved.</p>'}<section class="history-group"><h2>Check-ins</h2>${checkInMarkup || '<div class="history-empty">No completed check-ins yet.</div>'}${checkins.length > 1 ? trendChart(checkins) : ""}</section><section class="history-group"><h2>Plans</h2>${planMarkup || '<div class="history-empty">No completed plans yet.</div>'}</section><div class="stack"><button class="ghost" id="copy-history" type="button" ${available ? "" : "disabled"}>Copy my history</button><button class="ghost" id="show-import" type="button" ${available ? "" : "disabled"}>Import a backup</button><div id="import-panel" hidden><label class="field-label" for="import-text">Paste a history backup</label><textarea class="field" id="import-text" spellcheck="false"></textarea><button class="cta section-gap" id="import-history" type="button">Import and merge</button></div><button class="danger" id="clear-history" type="button" ${(checkins.length || plans.length) && available ? "" : "disabled"}>Clear my history</button></div></section>`;
  wireHeader();
  app.querySelector("#copy-history").addEventListener("click", async () => copyText(await exportHistory(), "History copied"));
  app.querySelector("#show-import").addEventListener("click", () => { const panel = app.querySelector("#import-panel"); panel.hidden = !panel.hidden; if (!panel.hidden) app.querySelector("#import-text").focus(); });
  app.querySelector("#import-history").addEventListener("click", async () => { try { const count = await importHistory(app.querySelector("#import-text").value); showToast(`Imported ${count.checkins} check-ins and ${count.plans} plans`); renderHistory(); } catch (error) { showToast(error.message || "That backup could not be imported"); } });
  app.querySelector("#clear-history").addEventListener("click", () => showDialog({ title: "Clear all history?", text: "This removes every saved check-in and plan from this device. This cannot be undone unless you copied a backup.", confirmLabel: "Clear history", dangerous: true, onConfirm: async () => { try { await clearHistory(); showToast("History cleared"); renderHistory(); } catch { showToast("History could not be cleared"); } } }));
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
if (storageGet("onboarding-complete") === "1") renderHome(); else renderFirstRun();
