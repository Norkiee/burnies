import test from "node:test";
import assert from "node:assert/strict";
import { calendarLinks, createIcs, nextWeekday, parseLocal } from "../js/calendar.js";

const plan = { id: "plan-1", change: "Shut down daily", reminderTime: "18:00", reviewAt: parseLocal("2026-10-14", "09:00").toISOString() };

test("review links contain only the neutral review details", () => {
  const links = calendarLinks(plan, "https://example.com/");
  assert.match(links.google, /Check\+in\+with\+myself/);
  assert.doesNotMatch(links.google, /Shut\+down\+daily/);
  assert.match(links.reminder.url, /Shut\+down\+daily/);
  assert.match(decodeURIComponent(links.reminder.url), /BYDAY=MO,TU,WE,TH,FR/);
});
test("next weekday skips weekends", () => {
  const friday = new Date(2026, 9, 9, 12, 0);
  const next = nextWeekday("18:00", friday);
  assert.equal(next.getDay(), 1);
  assert.equal(next.getHours(), 18);
});
test("ics contains a neutral review and recurring reminder", () => {
  const ics = createIcs(plan, "https://example.com/");
  assert.match(ics, /SUMMARY:Check in with myself/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  assert.match(ics, /SUMMARY:Shut down daily/);
});
