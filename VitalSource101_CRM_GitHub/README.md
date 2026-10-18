# VitalSource 101 CRM

A formal, responsive CRM school-project website with three role levels:

- **Admin** – full dashboard, customers, interactions, reports, notifications, user management, profile, and system settings.
- **Staff** – dashboard, customers, interactions, reports, notifications, and profile.
- **Customer** – dashboard, own profile, own interactions, and notifications.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@vitalsource.local | Admin@123 |
| Staff | staff@vitalsource.local | Staff@123 |
| Customer | customer@vitalsource.local | Customer@123 |

## GitHub Pages

1. Upload `index.html`, `style.css`, and `app.js` to the same GitHub repository folder.
2. Commit/push the files.
3. Open **Settings → Pages** in the repository.
4. Select **Deploy from a branch**, choose your main branch and `/root`, then save.
5. Open the generated GitHub Pages URL.

## Important security note

This version is a **front-end demonstration**. Login credentials and data are stored in the browser's `localStorage`, so this is not real server-side authentication. It is appropriate for a prototype/school presentation, but it should not be used to protect real customer data.

For a production CRM, move authentication, passwords, authorization, database access, and audit logs to a server/API with hashed passwords and server-side role checks.
