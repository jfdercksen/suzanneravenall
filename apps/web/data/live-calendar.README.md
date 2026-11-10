# Live programme calendar: how to add dates

`live-calendar.json` feeds the calendar on `/events` and the live programmes
band on the home page. One file, no code. Only live programmes belong here:
recorded series and self-study stay in the shop and on `/programs`.

## Add a date

Find the programme and add an entry to its `sessions` list:

```json
{
  "programmeSlug": "meditation",
  "format": "Live via Zoom",
  "sessions": [
    {
      "start": "2027-01-12",
      "end": "2027-02-16",
      "time": "18:00-19:30 SAST",
      "note": "6 weekly sessions",
      "bookHref": "/shop/meditation-live-via-zoom"
    }
  ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `start` | yes | First day, `YYYY-MM-DD` |
| `end` | no | Last day of a multi-week run, `YYYY-MM-DD` |
| `time` | no | Time with its time zone, e.g. `18:00-19:30 SAST` |
| `note` | no | One short line, e.g. `6 weekly sessions` |
| `bookHref` | no | Shop page where the date can be bought. Without it the button is "Register interest" |

A date disappears from the calendar by itself the day after it ends. A
programme with no future date shows "Dates to be announced" and a "Register
interest" button.

## Add a programme

Add `{ "programmeSlug": "<slug>", "format": "Live via Zoom", "sessions": [] }`.
The slug is the programme's address on `/programs/<slug>`; its name and card
text come from `data/programs.ts`. The tests in `lib/events/liveCalendar.test.ts`
fail if a slug does not exist or a date is written wrongly. Run them before
the change is committed:

```
cd apps/web
npx vitest run lib/events
```

If a broken file still reaches the site, the page stays up, shows every
programme as "Dates to be announced" and reports the error to Sentry.
