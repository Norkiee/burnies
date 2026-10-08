# Burnout self-check and one-page plan: build handoff

Prepared 7 October 2026 for Adinorkie, to hand to Claude Code. This document describes the tool to build: a private burnout self-check (the BAT-12) and a one-page plan builder, packaged as an installable PWA. Two prototypes exist and are the visual and behavioural reference. Build the finished app from this spec.

## 1. Goal and constraints

**Goal.** Give a team of designers and builders a private, free, instant way to check how work is affecting them, and turn the result into one small action they take straight away, with a reminder to review it a week later.

**Non-negotiables**

- **Private by design.** No accounts, no server, no analytics, no tracking, no network requests except the optional calendar links. Everything stays on the person's device.
- **Simple.** Five steps for the plan, twelve statements for the check. If a feature makes either feel longer, cut it.
- **Not a diagnosis.** Never use diagnostic language. The check estimates burnout complaints. The BAT authors say no self-report questionnaire can diagnose burnout.
- **Neutral calendar events.** Calendar items must not contain the person's plan, signs or scores, because work calendars are often shared.
- **Works offline** once installed.
- **No emojis** in the interface. Plain, calm wording.

## 2. What exists today (reference prototypes)

| Prototype | What it is | Where |
| --- | --- | --- |
| BAT-12 survey | Written by Adinorkie. Intro screen, one statement per screen with pill answers, a short "calculating" screen, then a results screen. Scores the 12 items on the BAT scale and shows the total against Flemish clinical cut-offs. | `index.html` (attach to this handoff) |
| One-Page Plan | Five-step plan builder in the same visual style, with a copyable message, a calendar menu and a close icon. | `one-page-plan.html` (attach to this handoff). Also published as a private artifact, version 3. |
| Original check-in | First-draft nine-statement reflection tool, not validated. Retain only as a legacy reference; it is not part of the production app (appendix A). | Published artifact, not attached |

Keep the visual language of the two prototypes. They were deliberately made to match.

## 3. App structure

One static app, no framework required (plain HTML, CSS and JavaScript, or a small build step if you prefer). Screens:

1. **First-run intro** (once): what this is, that it is private and stays on the device, not medical advice. A Start button.
2. **Home:** three tiles, plus a support link.
3. Check-in (take the survey)
4. My plan (build a plan)
5. History (past results and plans)
6. Support (general guidance)
7. **Check-in flow** (section 4)
8. **My plan flow** (section 5)
9. **History** (section 6)
10. **Install guide** (section 7)

Navigation: a back control on every screen, and a close control on result screens that returns to Home. A bottom tab bar is acceptable if it keeps things simple. Keep the 520 px max-width single column.

## 4. The check-in (BAT-12, work-related short version)

### 4.1 Source and conditions of use

The BAT is by Schaufeli, De Witte and Desart (KU Leuven, 2020). The official BAT website states that the instrument is non-proprietary and may be used free of charge without requesting permission from the authors. It also says that the instrument must not be modified and that the specified publication must be cited. The manual explicitly allows integrating the BAT into an online platform so participants can automatically receive their score.

- **Use the items exactly as published. Do not reword, drop or reorder them.**
- **No separate written permission is required**, provided the official conditions above are followed.
- **Cite** on the results screen: Schaufeli, W. B., Desart, S. and De Witte, H. (2020). Burnout Assessment Tool (BAT) - Development, validity and reliability. International Journal of Environmental Research and Public Health, 17, 9495. Also cite the BAT user manual version 2.0, KU Leuven, as the source of the scoring guidance and clinical cut-offs.
- **Neutral title while answering.** The manual advises against the word "burnout" and the subscale names on the questionnaire itself. Title the survey "Work experience survey" and show no subscale labels during the questions.

### 4.2 Instruction, scale and items

Instruction (verbatim): "The following statements are related to your work situation and how you experience this situation. Please state how often each statement applies to you."

Scale (one answer per statement): Never = 1, Rarely = 2, Sometimes = 3, Often = 4, Always = 5.

Items, in the order the prototype presents them. The subscale column is for scoring only and is never shown during the survey.

| # | Statement | Subscale |
| --- | --- | --- |
| 1 | At work, I feel mentally exhausted | Exhaustion |
| 2 | After a day at work, I find it hard to recover my energy | Exhaustion |
| 3 | At work, I feel physically exhausted | Exhaustion |
| 4 | I struggle to find any enthusiasm for my work | Mental distance |
| 5 | I feel a strong aversion towards my job | Mental distance |
| 6 | I'm cynical about what my work means to others | Mental distance |
| 7 | At work, I have trouble staying focused | Cognitive impairment |
| 8 | When I'm working, I have trouble concentrating | Cognitive impairment |
| 9 | I make mistakes in my work because I have my mind on other things | Cognitive impairment |
| 10 | At work, I feel unable to control my emotions | Emotional impairment |
| 11 | I do not recognize myself in the way I react emotionally at work | Emotional impairment |
| 12 | At work I may overreact unintentionally | Emotional impairment |

### 4.3 Scoring

- Total score: sum of all 12 answers divided by 12, rounded to 2 decimals. Range 1.00 to 5.00.
- Subscale score: sum of its 3 answers divided by 3, rounded to 2 decimals.
- Compare the rounded values against the cut-offs below.

### 4.4 Cut-offs (BAT-12, clinical cut-offs for Flemish employees, manual Table 6)

| Score | Green (not at risk) | Orange (at risk) | Red (very high risk) |
| --- | --- | --- | --- |
| **Total** | 1.00 to 2.53 | 2.54 to 2.95 | 2.96 to 5.00 |
| Exhaustion | 1.00 to 3.16 | 3.17 to 3.50 | 3.51 to 5.00 |
| Mental distance | 1.00 to 2.16 | 2.17 to 3.16 | 3.17 to 5.00 |
| Emotional impairment | 1.00 to 2.16 | 2.17 to 2.82 | 2.83 to 5.00 |
| Cognitive impairment | 1.00 to 2.82 | 2.83 to 3.16 | 3.17 to 5.00 |

Rules from the manual, to honour in the UI:

- For individual use, **interpret the total score only.** The "red" cut-offs for the subscales are not sensitive enough.
- Subscale **orange** thresholds may optionally be shown as pointers ("where to look first"), never as a verdict.
- Cut-offs come from Flemish workers. There are no published thresholds for Ghana. The results screen must say so: "Zones come from clinical cut-offs for Flemish employees, so treat them as a guide."

### 4.5 Screens and behaviour

- **Intro:** full-bleed brand-red screen, title "Work experience survey", "12 short statements about how you feel at work. It takes about 2 minutes", "Go with your first instinct", the privacy line, and a white Start button.
- **Question screens:** back arrow, counter ("4/12"), close control, 6 px progress bar, the statement, five pill options (single-select, `role="radio"`), a Next button that is disabled until an answer is chosen. The last screen's button reads "See my results". The close control returns to Home. Do not use `confirm()` or `alert()`. If you want confirmation, build it into the page.
- **Short calculating screen** (about 2 seconds) is optional. Honour `prefers-reduced-motion` and let people skip it.
- **Results screen:** a hero card coloured by zone, showing the total score ("2.61 / 5"), the zone label and a short description. Then the citation and the not-a-diagnosis note, then the support card.

Zone copy from the prototype:

| Zone | Label | Description |
| --- | --- | --- |
| Green | Not at risk of burnout | Your answers sit below the level seen in people assessed with severe burnout complaints. Keep protecting the habits that help you recover. |
| Orange | At risk of burnout | Your answers are close to those of people with burnout complaints. This is a good moment to look at workload, rest and support before it grows. |
| Red | Very high risk of burnout | Your answers match those of people assessed with severe burnout complaints. Please talk to your doctor, a mental health professional or an occupational health service. |

Note and citation text: "This survey estimates burnout complaints. It cannot diagnose burnout or tell it apart from conditions such as depression; that needs an interview with a trained professional. Zones come from clinical cut-offs for Flemish employees (Schaufeli, De Witte & Desart, 2020), so treat them as a guide for other populations. If you feel unwell, please speak to a health professional."

- After the result, offer the next step: **"Build my plan"** button that opens the plan flow.
- Add a "Take it again" action.
- Colour must never be the only signal. Always show the zone in words.

## 5. The one-page plan

Five steps, same visual flow as the check-in (back, counter n/5, close, progress bar, one question per screen, Next disabled until valid). Nothing is stored beyond the History feature in section 6.

| Step | Title | Input | Required |
| --- | --- | --- | --- |
| 1 | Which early signs do you notice? | Multi-select pills. Options: Loss of motivation, Negative thoughts, Trouble concentrating, Irritability, Sleep problems, Persistent exhaustion, None right now. "None right now" is exclusive and clears the others; picking another option clears it. | At least one |
| 2 | What are your top drivers? | Multi-select with round checkmarks. Options: Workload (Too much, too fast, or too many projects), Control (Little say over how or what I work on), Reward (Pay, credit or growth don't match the effort), Community (No one to think out loud with), Fairness (Unclear priorities, uneven credit), Values (Asked to ship what I don't believe in). | At least one |
| 3 | One change for this week | Single-select list plus an optional free-text "write your own" (max 90 characters). Typing text deselects the list choice, and choosing a list option clears the text. A weekday reminder time input, default 18:00, with the label "Weekday reminder time (clear it to skip)". | A change |
| 4 | One person you will tell | Single-select: A friend, A family member, A teammate, My manager, A doctor or counselor. Optional first-name text field (max 40). | A person |
| 5 | When will you review how it went? | Date input (min today, default 7 days ahead), time input (default 09:00), quick buttons: In 1 week, In 2 weeks, In 1 month. | A date |

The step 3 screen is capped at six choices drawn from a larger action library. Rank the library using the selected early signs, selected drivers and, when available, the most relevant assessment pointer. Different answers should produce a different set of six options. Present the strongest three under “Suggested for you” and the next three under “Other ideas.” “Define done first” and “Protect two focus blocks a week” are excluded from the library.

### 5.1 Result screen

Content, top to bottom:

1. Close icon at top right. It returns to Home. No "Start again" or "Change my answers" buttons.
2. Title "Your plan" and the line "Do the two small things below now. Then copy the plan before you close this page."
3. Hero card: "Review how it went" with the review date and time, and "Look back on the week, then retake the check-in."
4. Four summary cards: My early signs, My top driver, My change this week (with ", reminder at HH:MM on weekdays" when set), One person I'll tell (with the first name in brackets if given).
5. **Message card** with a message icon, "Do now: message to a \[person\]", the generated message, and an underlined **Copy message** link with a copy icon that copies the text and briefly reads "Copied".
6. **One "Add to calendar" button.** It expands a short list: Google Calendar review, Google Calendar weekday reminder (only if a reminder time is set), Outlook calendar review. In the installed PWA also offer **Download .ics** (see 5.3).
7. A **Copy my plan** button (plain-text copy of the whole plan).
8. A note: "The review event is titled "Check in with myself" and holds only a link to the check-in. The weekday reminder carries only the change you chose. The rest of your plan is not added to any calendar."

### 5.2 Message templates

Let `noticed` be "I've noticed " followed by the chosen signs, lower-cased and comma-separated, plus " lately". If the only choice is "None right now", use "I've been thinking about how I'm coping with work lately". Let `hi` be "Hi", plus the first name if given, plus a comma and a space.

- Doctor or counselor: `hi` + `noticed` + " and I think work may be part of it. I'd like to book a time to talk about it."
- Manager: `hi` + `noticed` + ", and I'd like to talk through my workload and priorities. Do you have 15 minutes this week?"
- Anyone else: `hi` + `noticed` + " and I'd like to talk it through. Do you have 15 minutes this week?"

Always render user text with `textContent` or escape it. Never inject user input as HTML.

### 5.3 Calendar behaviour

Floating local times, no time zone suffix. Review event: 15 minutes at the chosen date and time. Habit reminder: 10 minutes at the reminder time on weekdays, starting on the next weekday after today.

- **Review title:** "Check in with myself". **Details:** "Look back on how the week went, then retake the check-in: " followed by the app's URL.
- **Weekday reminder title:** the chosen change text. **No details field.**
- **Google Calendar review:** `https://calendar.google.com/calendar/render?action=TEMPLATE&text=<title>&dates=YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS&details=<details>`
- **Google weekday reminder:** same, plus `&recur=` followed by the URL-encoded value `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`.
- **Outlook (outlook.live.com):** `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=<title>&body=<details>&startdt=YYYY-MM-DDTHH:MM:SS&enddt=YYYY-MM-DDTHH:MM:SS`
- Open links with `target="_blank"` and `rel="noopener"`.
- **.ics download (new, PWA only).** Generate a calendar file in the browser (`text/calendar` blob download) with the same neutral titles. Include an `RRULE` for the weekday reminder. This is what makes Apple Calendar and other apps work. It is not possible in the artifact prototype because downloads are blocked there, but it is allowed in a normal self-hosted page. Test on iOS Safari and Android Chrome.
- The Google and Outlook URLs were built from documented formats but never opened in the prototype. Test them, including that the recurrence and times arrive correctly. Outlook has other hosts (for example outlook.office.com for Microsoft 365). Consider adding that variant.

## 6. History and comparison (new feature)

**Principle.** Saved on the device only. Nothing leaves it. The words "nothing is saved" in the prototypes must be replaced by "Your results are saved on this device only." Add **Clear my history** and **Copy my history** (a plain-text export as a backup), and an optional import of that backup.

### 6.1 Data model

```
CheckIn  { id, takenAt (ISO), instrument: "bat12-work-2.0",
           answers: number[12], total, sub: { ex, md, ci, ei }, zone: "green|orange|red" }
Plan     { id, createdAt (ISO), signs: string[], drivers: string[], change, reminderTime|null,
           person, personName|null, reviewAt (ISO), outcome: null|"stuck"|"partly"|"not" }
```

Store with a schema version number. Use IndexedDB, or localStorage with a size cap. Wrap every storage call in try/catch. If storage is unavailable or full, the app must still work and say history is off.

### 6.2 Comparison behaviour

- On the results screen, if a previous check-in exists, show **"Last time" and "Now"** side by side, the difference in total score, and a small trend line of all totals with the three zone bands drawn behind it.
- Wording is neutral: "higher than last time", "lower than last time". Never say "improved" or "worse", and never present a small change as meaningful. The manual publishes no threshold for a meaningful individual change, so do not invent one. Add the line: "Small changes between checks are normal. Look for the pattern over several checks."
- Subscale changes are shown only as pointers, not verdicts.
- **Link the plan to the next check-in.** When a check-in is taken on or after a plan's review date, show "Last time you planned: \[change\]" with a three-way question: Did it stick? Yes, Partly, Not yet. Store the answer in `outcome`.
- Comparison is between the person's own results only. No benchmarks against others.

## 7. PWA requirements

The prototypes run inside a locked-down artifact frame that blocks service workers and a custom manifest, so they cannot install. Hosting the app on your own origin is what makes it a real PWA.

- **Hosting:** deploy as a Render Static Site over HTTPS. Use relative URLs everywhere so previews and non-root paths remain safe, and set `start_url` and `scope` to match the deployed path.
- **Manifest** (`manifest.webmanifest`): `name`, `short_name`, `description`, `start_url`, `scope`, `display: "standalone"`, `orientation: "portrait"`, `background_color: "#fffdfb"`, `theme_color: "#a33630"`, and icons at 192 and 512 pixels, plus a maskable icon. Serve it with the right MIME type.
- **Icons:** a simple mark in the brand red. Provide an Apple touch icon (180 pixels) and a favicon.
- **Meta tags:** viewport with `viewport-fit=cover`, `theme-color` (with light and dark variants through `media`), `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` and the touch icon link.
- **Service worker:** precache the app shell (HTML, CSS, JS, fonts, icons) with a versioned cache name. Cache-first for the shell. On a new version, show a small "Update available, reload" prompt and update only when the user taps it. No background sync, no push.
- **Fonts:** self-host Instrument Sans (weights 500, 600, 700) as subsetted woff2 files. Do not load from Google at runtime, so the app works offline.
- **Offline:** every screen, the scoring, the plan and the history must work with no network. Only the calendar links need the internet.
- **Install guidance:** on Android Chrome, capture `beforeinstallprompt` and show an "Install" button on Home. iOS has no prompt, so show a dismissible card: tap Share, then Add to Home Screen. Remember the dismissal. Do not nag.
- **Storage on iOS:** installed home-screen apps usually keep their data, but behaviour varies, so test on a real iPhone. The backup export exists for this reason.
- **No push notifications.** They need a server and break the privacy design. Reminders go through the calendar.
- **After deploying:** generate a QR code for the final URL (PNG and SVG), verify it decodes, and hand it over for use in a presentation.

## 8. Design system

Taken from the BAT-12 prototype and the plan prototype. Keep it.

- **Font:** Instrument Sans, weights 500 to 700, falling back to Avenir Next, Segoe UI and the system sans.
- **Light tokens:** `--bg #fffdfb`, `--ink #3b3a3d`, `--mute #6b696f`, `--pill #fbf1f0`, `--pill2 #efdedc`, `--brand #a33630`, `--brand2 #7d2621`, `--red #d3463f`, `--pink #dc8885`, field `#ffffff`.
- **Dark tokens:** `--bg #17161a`, `--ink #f4f1ee`, `--mute #a8a5ab`, `--pill` and card `#242227`, `--pill2 #3a373d`, field `#1d1b20`.
- **Zone colours:** green `#2e8b57`, orange `#c26f0c`, red `#a33630`. Check white-on-orange contrast on the hero, and darken the orange if it fails.
- **Theming:** define every colour as a token on `:root` and redefine in `@media (prefers-color-scheme: dark)` plus a `data-theme` override, so a manual toggle works either way.
- **Shape:** pill buttons (999 px radius), a primary button with a 4 px darker bottom edge, 28 px radius result cards, 22 px radius summary cards, a 6 px progress bar. Intro and loading screens are full-bleed brand red with a pixel-block decoration in the top right.
- **Layout:** single column, max width 520 px, at least 16 px side gutters, no horizontal scrolling at 360 px width. Respect safe-area insets.
- **Accessibility:** visible focus rings, 44 px minimum touch targets, `role="radiogroup"` and `role="radio"` (or checkbox) with `aria-checked`, focus moves to the new screen heading on each step, screen-reader labels on icon-only buttons, support `prefers-reduced-motion`, and never rely on colour alone.

## 9. Support content

Show on the results screen and under Support on Home:

- "If it already feels heavy: talk to someone you trust, your manager, or a doctor or counselor. A professional can tell burnout apart from depression and other conditions."
- "If you are in immediate danger, contact local emergency services."

## 10. Decisions already made

- The BAT-12 is the assessment, because it is validated and the official BAT site permits free use under its stated conditions. The original nine-item check is retained only as a legacy reference and is not part of the production app.
- Total score is the headline. Subscales are secondary pointers.
- The plan is a one-week experiment (one change, a reminder, a message to send, a review in a week), not a list of intentions, to make it actionable while staying five steps.
- Calendar events are neutral.
- History is on-device only. A server-side store was rejected because it is burnout-related data and would need an identity to tie results to a person.
- The close icon on the result screens returns to Home. There are no separate "Start again" buttons.

## 11. Open items and risks

| Item | Detail | Owner |
| --- | --- | --- |
| BAT conditions | The official BAT site permits free use without requesting permission, but the items must not be modified and the required publication must be cited. | Build and wording |
| Flemish cut-offs | Not validated for Ghana. State this in the UI. | Wording |
| Calendar links | Google and Outlook URLs untested. The .ics download is untested. | Build and test |
| iOS storage and install | Test on a real iPhone, including offline and reopening after a few days. | Build and test |
| `confirm()` in the prototype | The quit button in `index.html` uses `confirm()`, which does not work in the artifact viewer. In the self-hosted app it works, but prefer an in-page confirmation for consistency. | Build |
| Contrast | White text on the orange hero may be under 4.5:1 for small text. | Build |

## 12. Suggested build order

1. Project skeleton, tokens, fonts, Home, routing and the shared step component.
2. Check-in flow, scoring and results, tested with fixed answer sets (for example all 1s gives 1.00, all 5s gives 5.00, and the boundary values 2.53, 2.54, 2.95 and 2.96).
3. Plan flow, message generation and calendar links, including the .ics file.
4. History: storage layer with fallback, comparison view, trend line, clear, copy and import.
5. PWA: manifest, icons, service worker, install guidance, offline testing.
6. Deploy, generate the QR code, and test on real phones.

## 13. Acceptance checklist

- \[ \] The app installs on Android Chrome and on iPhone (Add to Home Screen), opens full screen, and every feature works in airplane mode after the first load.
- \[ \] No network requests are made except when a calendar link is opened (check the network panel).
- \[ \] BAT scoring matches hand-calculated examples, including each zone boundary.
- \[ \] The survey shows no "burnout" or subscale labels during the 12 statements.
- \[ \] The results screen shows the citation, the Flemish cut-off caveat, the not-a-diagnosis note and the support card.
- \[ \] The plan cannot proceed past a step without a valid answer. "None right now" is exclusive in step 1.
- \[ \] Calendar events never contain signs, driver, scores or message text. The review title is "Check in with myself".
- \[ \] History comparison uses neutral wording and shows no benchmarks against others. Clear and copy work. The app works with storage disabled.
- \[ \] Usable at 360 px width in light and dark, with visible focus, 44 px targets and reduced motion honoured.
- \[ \] User input is never rendered as HTML.
- \[ \] A QR code for the final URL decodes on a phone.

## Appendix A: legacy original check (not used in production)

Nine statements, past month, scale Rarely, Sometimes, Often, Almost always scored 0 to 3. Three per area. Exhaustion: I feel drained before the day starts. A weekend off doesn't recharge me. I run on deadlines and caffeine. Distance: I feel "whatever" about work I used to love. I avoid opening certain projects. Details I used to care about no longer matter. Efficacy: I doubt my work is good enough. Finishing takes far longer than it used to. I don't feel I'm growing or making a difference. Per-area sums of 0 to 2 read "rarely", 3 to 5 "sometimes", 6 to 9 "often". This tool is original, not validated, and must be labelled that way.

## Appendix B: sources

- Schaufeli, W. B., De Witte, H. and Desart, S. (2020). Burnout Assessment Tool (BAT), and the BAT user manual, version 2.0. KU Leuven. burnoutassessmenttool.be
- World Health Organization (2019). Burn-out an "occupational phenomenon": International Classification of Diseases.
- Mind Garden. Maslach Burnout Inventory licensing (why the MBI could not be used).
- Gollwitzer, P. M. and Sheeran, P. (2006). Implementation intentions and goal achievement: a meta-analysis (basis for the if-then style of the change and message steps; existence confirmed, full text not read).
