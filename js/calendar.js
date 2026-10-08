const pad = value => String(value).padStart(2, "0");
export const localDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const compact = date => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
const utcStamp = date => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
const outlookTime = date => `${localDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
  const checkInUrl = new URL(appUrl);
  checkInUrl.searchParams.set("start", "checkin");
  const details = `Look back on how the week went, then retake the check-in: ${checkInUrl.href}`;
  const google = new URL("https://calendar.google.com/calendar/render");
  google.search = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${compact(reviewStart)}/${compact(reviewEnd)}`, details });
  const outlook = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlook.search = new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: title, body: details, startdt: outlookTime(reviewStart), enddt: outlookTime(reviewEnd) });
  let reminder = null;
  if (plan.reminderTime) {
    const from = plan.createdAt ? new Date(plan.createdAt) : new Date();
    const start = plan.reminderStart ? new Date(plan.reminderStart) : nextWeekday(plan.reminderTime, from);
    if (start < reviewStart) {
      const end = new Date(start.getTime() + Number(plan.actionDuration || 10) * 60_000);
      const until = utcStamp(reviewStart);
      const url = new URL("https://calendar.google.com/calendar/render");
      url.search = new URLSearchParams({ action: "TEMPLATE", text: plan.change, dates: `${compact(start)}/${compact(end)}`, recur: `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${until}` });
      reminder = { url: url.href, start, end };
    }
  }
  return { google: google.href, outlook: outlook.href, reminder, reviewStart, reviewEnd, title, details };
}

const icsEscape = text => String(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const foldLine = line => {
  const chunks = [];
  let rest = line;
  while (rest.length > 73) { chunks.push(rest.slice(0, 73)); rest = rest.slice(73); }
  chunks.push(rest);
  return chunks.join("\r\n ");
};
const alarmLines = minutes => minutes == null ? [] : ["BEGIN:VALARM", `TRIGGER:${minutes === 0 ? "PT0M" : `-PT${minutes}M`}`, "ACTION:DISPLAY", "DESCRIPTION:Burnies reminder", "END:VALARM"];

export function createIcs(plan, appUrl, options = {}) {
  const { includeReview = true, includeReminder = true, alertMinutes = 10 } = options;
  const links = calendarLinks(plan, appUrl);
  const stamp = utcStamp(new Date());
  const zone = timeZone();
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Burnies//Plan//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  if (includeReview) lines.push("BEGIN:VEVENT", `UID:${plan.id}-review@burnies`, `DTSTAMP:${stamp}`, `DTSTART;TZID=${zone}:${compact(links.reviewStart)}`, `DTEND;TZID=${zone}:${compact(links.reviewEnd)}`, `SUMMARY:${icsEscape(links.title)}`, `DESCRIPTION:${icsEscape(links.details)}`, ...alarmLines(alertMinutes), "END:VEVENT");
  if (includeReminder && links.reminder) lines.push("BEGIN:VEVENT", `UID:${plan.id}-reminder@burnies`, `DTSTAMP:${stamp}`, `DTSTART;TZID=${zone}:${compact(links.reminder.start)}`, `DTEND;TZID=${zone}:${compact(links.reminder.end)}`, `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${utcStamp(links.reviewStart)}`, `SUMMARY:${icsEscape(plan.change)}`, ...alarmLines(alertMinutes), "END:VEVENT");
  lines.push("END:VCALENDAR", "");
  return lines.map(foldLine).join("\r\n");
}
