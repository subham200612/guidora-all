Guidora Local Development Setup Instructions
============================================

Follow these steps to run your frontend and backend together for full functionality (images, API, etc.):

---
1. Start the Backend Server
--------------------------
- Open a terminal in your project folder.
- Run:
  node backend2.js
- The backend will run at http://localhost:5000/

---
2. Serve the Frontend with Live Server (Recommended)
---------------------------------------------------
- Open your project folder in VS Code.
- Install the "Live Server" extension from the Extensions Marketplace.
- Right-click your frontend2.html.html file and select "Open with Live Server".
- Your site will open at something like http://127.0.0.1:5500/frontend2.html.html

---
3. Alternative: Serve Frontend with Node.js Static Server
--------------------------------------------------------
- Open a terminal in your project folder.
- Run:
  npx http-server .
- Open the provided address (e.g., http://localhost:8080/frontend2.html.html) in your browser.

---
4. Alternative: Serve Frontend with Python SimpleHTTPServer
----------------------------------------------------------
- Open a terminal in your project folder.
- Run:
  python -m http.server
- Open http://localhost:8000/frontend2.html.html in your browser.

---
5. Accessing Images and API
--------------------------
- All images and API requests will work via http://localhost:5000/ (your backend).
- Do NOT open the HTML file by double-clicking; always use a local server.

---
6. Troubleshooting
------------------
- If images do not show, check the uploads folder and backend logs.
- If you get 404 errors, verify the image URLs and file locations.
- Make sure both backend and frontend servers are running.

---
Need more help? Just ask!
