const pad = value => String(value).padStart(2, "0");
export const localDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const compact = date => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
const utcStamp = date => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
const outlookTime = date => `${localDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

export function parseLocal(date, time = "09:00") {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}
export function nextWeekday(time, from = new Date()) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, hour, minute);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date;
}

export function calendarLinks(plan, appUrl) {
  const reviewStart = new Date(plan.reviewAt);
  const reviewEnd = new Date(reviewStart.getTime() + 15 * 60_000);
  const title = "Check in with myself";
  const details = `Look back on how the week went, then retake the check-in: ${appUrl}`;
  const google = new URL("https://calendar.google.com/calendar/render");
  google.search = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${compact(reviewStart)}/${compact(reviewEnd)}`, details });
  const outlook = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlook.search = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: title, body: details, startdt: outlookTime(reviewStart), enddt: outlookTime(reviewEnd) });
  let reminder = null;
  if (plan.reminderTime) {
    const start = nextWeekday(plan.reminderTime);
    const end = new Date(start.getTime() + 10 * 60_000);
    const url = new URL("https://calendar.google.com/calendar/render");
    url.search = new URLSearchParams({ action: "TEMPLATE", text: plan.change, dates: `${compact(start)}/${compact(end)}`, recur: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR" });
    reminder = { url: url.href, start, end };
  }
  return { google: google.href, outlook: outlook.href, reminder, reviewStart, reviewEnd, title, details };
}

const icsEscape = text => String(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
export function createIcs(plan, appUrl) {
  const links = calendarLinks(plan, appUrl);
  const stamp = utcStamp(new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Burnies//Plan//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${plan.id}-review@burnies`, `DTSTAMP:${stamp}`, `DTSTART:${compact(links.reviewStart)}`, `DTEND:${compact(links.reviewEnd)}`, `SUMMARY:${icsEscape(links.title)}`, `DESCRIPTION:${icsEscape(links.details)}`, "END:VEVENT"];
  if (links.reminder) lines.push("BEGIN:VEVENT", `UID:${plan.id}-reminder@burnies`, `DTSTAMP:${stamp}`, `DTSTART:${compact(links.reminder.start)}`, `DTEND:${compact(links.reminder.end)}`, "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", `SUMMARY:${icsEscape(plan.change)}`, "END:VEVENT");
  lines.push("END:VCALENDAR", "");
  return lines.join("\r\n");
}
