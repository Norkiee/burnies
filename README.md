# Burnies

A private, installable work-experience check-in and one-page plan. Completed results and plans are stored in IndexedDB on the person's device. Burnies has no accounts, analytics, tracking, or runtime dependencies.

## Local development

```sh
npm test
npm run build
npm run serve
```

Then open `http://localhost:4173`.

## Presentation links

- Check-in QR: `https://burnies.onrender.com/?start=checkin`
- Plan QR: `https://burnies.onrender.com/?start=plan`

## Render

The included `render.yaml` configures a Render Static Site. It runs `npm run build` and publishes `dist/`. Security headers restrict the app to its own scripts, styles, images, fonts, and same-origin requests; calendar services are opened only through user-selected links.

## Privacy

- Check-ins and plans stay in browser storage.
- History can be reviewed or cleared in the app.
- Review calendar events contain only a neutral title and a link back to the app.
- Plan reminders contain only the selected change and end at the chosen review date.
