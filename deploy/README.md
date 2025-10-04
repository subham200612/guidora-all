# Guidora Travel Experiences Web App

A fullstack Node.js + MongoDB web app for sharing and discovering travel experiences, hidden gems, and activities.

## Project Structure
- `frontend/` — HTML, CSS, JS (client-side)
- `backend/` — Node.js/Express API, MongoDB models
- `uploads/` — User-uploaded images/files

## Setup & Local Development
1. **Clone the repository:**
   ```
   git clone <your-repo-url>
   cd deploy
   ```
2. **Install backend dependencies:**
   ```
   cd backend
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the `backend` folder.
   - Fill in your MongoDB URI, JWT secret, and Google Maps API key.
4. **Start backend server:**
   ```
   npm start
   ```
5. **Test frontend locally:**
   - Open `frontend/index.html` directly in your browser.
   - For advanced usage, serve with Vercel or any static server.

## Deployment Instructions

### 1. Add to GitHub Repository
1. Create a new repository on GitHub.
2. Push your local code:
   ```
   git remote add origin <your-repo-url>
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

### 2. Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com/) and create a new project.
2. Select your GitHub repo and set the root directory to `frontend`.
3. Deploy as a static site.

### 3. Deploy Backend to Render/Heroku
1. Go to [Render](https://render.com/) or [Heroku](https://heroku.com/) and create a new web service.
2. Set the root directory to `backend`.
3. Add environment variables from `.env` (do not commit secrets).
4. Set the start command to `npm start`.
5. Ensure MongoDB is accessible from your deployment (use MongoDB Atlas for cloud DB).

### 4. Environment Variables
- See `backend/.env.example` for required variables.
- Never commit your real `.env` file to GitHub.

### 5. API Endpoints
- Backend runs at `/api/*` (e.g., `/api/experiences`).
- Frontend fetches from backend using the deployed backend URL.

## Example .env
See `backend/.env.example` for required environment variables.

## License
MIT
