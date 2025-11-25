StudentDesk - Exam Papers & Notes

Features
--------
- Home page with search + filters by branch, year, semester, exam type.
- Separate pages:
  * /papers - all question papers (paginated)
  * /notes - all notes PDFs (paginated)
  * /branch/:name - resources per branch
  * /subject/:name - resources per subject
- Real PDF upload (admin only) stored in public/uploads.
- Download counter using /download/:id route.
- Admin login (for upload/delete).
- Student registration + login via roll number.
- Delete resource (admin only).
- About and Contact static pages.
- Ready for local MongoDB or MongoDB Atlas + Render deployment.

Local Setup
-----------
1. Install dependencies:

   npm install

2. Start local MongoDB or set MONGODB_URI in .env.

3. (Optional) Seed sample data:

   npm run seed

4. Start the server:

   npm start

5. Open in browser:

   http://localhost:3000

Auth
----
Admin:
- Login at: /admin/login
- Default credentials (change in .env):
  ADMIN_USER=admin
  ADMIN_PASS=admin123

Student:
- Register at: /student/register
- Login at: /student/login
- Login uses roll number + password.
- Session is stored in express-session.

Environment Variables (.env)
----------------------------
Create a .env file in the project root with:

MONGODB_URI=mongodb://127.0.0.1:27017/studentdesk
SESSION_SECRET=super-secret-key-change-me
ADMIN_USER=admin
ADMIN_PASS=admin123
PORT=3000

Deployment (Render / Railway)
-----------------------------
1. Push this project to GitHub.
2. Create a MongoDB Atlas cluster, get the connection string.
3. On Render / Railway:
   - Create a new Web Service from the GitHub repo.
   - Set environment variables:
     * MONGODB_URI=<your Atlas connection string>
     * SESSION_SECRET=<long random string>
     * ADMIN_USER=<your admin username>
     * ADMIN_PASS=<your admin password>
   - Set start command:
     npm start
4. Deploy. The app uses process.env.PORT so it will bind correctly.

Routes Quick Reference
----------------------
- GET /          -> Home page
- GET /papers    -> All papers list (with filters & pagination)
- GET /notes     -> All notes list (with filters & pagination)
- GET /branch/:name  -> Resources filtered by branch
- GET /subject/:name -> Resources filtered by subject
- GET /download/:id  -> Increment downloads + redirect to PDF
- GET/POST /admin/login  -> Admin login
- POST /admin/logout     -> Admin logout
- GET/POST /student/register -> Student registration
- GET/POST /student/login    -> Student login
- POST /student/logout       -> Student logout
- GET/POST /upload           -> Admin-only upload
- POST /delete/:id           -> Admin-only delete
- GET /about                 -> About page
- GET /contact               -> Contact page
