# Smart Campus 360 — Login + Campus Portal

## Files
- `index.html` — login/sign-up screen and complete campus portal.
- `style.css` — portal styling.
- `script.js` — dashboard, assignments, notices, attendance, events, charts and browser data.
- `auth.css` — login and logout styling.
- `auth.js` — sign-up, login and logout logic.

## Run
1. Extract this ZIP.
2. Open the folder in VS Code.
3. Run `index.html` with Live Server (recommended).
4. Create an account using **Sign up**, then log in.
5. Use **Log out** in the sidebar to return to the login page.
6. Opening the page again always shows the login page; it does not automatically restore a previous login.

## Assignment and notice dates
- Default assignment deadlines and notice dates are on or after **5 November 2026**.
- Existing saved assignment and notice dates earlier than 5 November 2026 are automatically moved to 5 November 2026 when the portal loads.
- New assignment deadlines earlier than 5 November 2026 are rejected.
- The Overview and Assignments pages render from the same assignment records and show the same assignment ID.

## Data storage and security
Dashboard data remains in browser localStorage under `smartCampus360.v1`, so existing attendance, assignments, notices, events and theme settings are preserved on the same browser/device.
Account details are stored locally for this frontend demonstration. Authentication is not production-grade and does not sync across devices. Do not use a real/reused password or sensitive personal information. A production deployment needs a backend, secure password hashing and server-side sessions.


## Latest date and logout updates
- Notices are assigned distinct dates starting 6 November 2026.
- Campus events are assigned distinct dates starting 7 November 2026.
- Existing saved notice/event dates are migrated on load so both Overview and their full pages show matching dates.
- A Log out button is available at the top-right of the dashboard and in the sidebar.
