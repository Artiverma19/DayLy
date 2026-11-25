# DayLy — Your AI Sidekick

An AI-powered content studio and student productivity hub in a single page. Generate platform-ready posts with live, word-by-word streaming, and plan your day with an AI-assisted task board, focus timer and reminders.

Built with **Node.js + Express**, **Google Gemini** and **Docker**. Developed entirely through vibe coding as the project work of the IBM x Bharat Cares *Vibe Coding: Building & Deploying an AI Web Application on AWS* internship.

| | |
|---|---|
| **Live app** | https://REPLACE-WITH-YOUR-SERVICE-NAME.onrender.com |
| **Source code** | https://github.com/REPLACE-WITH-YOUR-USERNAME/REPLACE-WITH-YOUR-REPO |

> The app runs on a free hosting tier that goes to sleep after about 15 minutes without traffic. The first visit after a pause can take around a minute to load.

---

## Deployment History

- **AWS Elastic Beanstalk (us-east-1)** — original deployment, built and submitted for the IBM internship project (Docker platform, Amazon Linux 2023). That environment was shut down when the AWS free trial ended, so its URL no longer works.
- **Render** — current deployment, running the same Docker image with automatic HTTPS.

---

## Render Deployment Details

| Item | Value |
|------|-------|
| Platform | Render (Web Service, Docker runtime, Free instance) |
| Live URL | https://REPLACE-WITH-YOUR-SERVICE-NAME.onrender.com |
| Branch deployed | `master` |
| Auto-deploy | On commit: every push to GitHub redeploys the app |
| Region | Singapore |
| Environment variables | `GEMINI_API_KEY` (set in the Render dashboard, never in the repo) |
| Deployed on | DD/MM/2026 |

---

## Screenshots

Add your screenshots to a `screenshots/` folder and link them here:

```
![Content Studio](screenshots/content-studio.png)
![Tracker](screenshots/tracker.png)
```

---

## Features

### Content Studio
- Pick a platform: **LinkedIn**, **Twitter/X**, **Instagram** or **Email/Message**
- Platform-aware prompts that adjust tone, length and format
- Optional **hashtags** and **3 variations** mode
- **Streaming output**: text appears progressively instead of after a long wait
- Editable result with **copy** and share shortcuts (post to X, share to LinkedIn)

### Tracker
- Add tasks with due date, time and energy level (High / Medium / Low focus)
- Status tracking for every task
- **AI Breakdown**: turns a vague task into 3 concrete subtasks using Gemini
- Daily briefing card with focus tips
- **Pomodoro focus timer** with lofi background audio
- **Browser notification** reminders for tasks due today or overdue
- Daily streak badge

### Responsive UI
Colorful, playful single-page interface designed for both desktop and mobile.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, vanilla JavaScript (Fetch API + `TextDecoder` for streaming) |
| Backend | Node.js, Express (ES modules), CORS, dotenv |
| AI | Google Gemini via the official `@google/genai` SDK (`gemini-flash-latest`) |
| Packaging | Docker (`node:20-alpine`) |
| Hosting | Render (current); AWS Elastic Beanstalk (original) |

---

## Architecture

```
Browser (HTML/CSS/JS)
        |
        |  HTTPS requests + streamed response
        v
Render web service  ->  Docker container  ->  Node.js / Express
                                                    |
                                                    |  server-side API call (key never leaves the server)
                                                    v
                                             Google Gemini API
```

The browser never talks to Gemini directly. All requests go through the Express backend, which holds the API key as an environment variable and streams the model's response back chunk by chunk (HTTP chunked streaming read with `fetch` and `TextDecoder`).

---

## Project Structure

```
DayLy/
├── server.js            # Express app, static file serving, route mounting
├── routes/
│   ├── content.js       # POST /api/content/generate  (streaming Gemini output)
│   └── tracker.js       # Task endpoints + AI breakdown
├── public/
│   ├── index.html       # Single-page UI
│   ├── style.css
│   └── app.js           # Frontend logic, streaming reader, reminders
├── data/                # Lightweight task storage
├── Dockerfile
├── .dockerignore
├── .gitignore
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate content for a platform; response is streamed as plain text |
| GET | `/api/tracker/list` | List all tasks |
| POST | `/api/tracker/add` | Add a task |
| PATCH | `/api/tracker/status/:id` | Update a task's status |
| DELETE | `/api/tracker/delete/:id` | Delete a task |
| POST | `/api/tracker/breakdown/:id` | AI-generated subtasks for a task |

---

## Run Locally

### Prerequisites
- Node.js 20+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Setup

```bash
git clone https://github.com/REPLACE-WITH-YOUR-USERNAME/REPLACE-WITH-YOUR-REPO.git
cd REPLACE-WITH-YOUR-REPO
npm install
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the server:

```bash
node server.js
```

Open http://localhost:3000.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key. The server will not start without it. |
| `GEMINI_MODEL` | No | Overrides the model used by the AI Breakdown feature |
| `PORT` | No | Defaults to `3000`. Hosting platforms such as Render set this automatically, so leave it unset there. |

---

## Run with Docker

```bash
docker build -t dayly .
docker run -p 3000:3000 --env-file .env dayly
```

The `.dockerignore` excludes `.env` and `node_modules`, so secrets are never baked into the image; they are supplied at runtime.

---

## Deploy to Render

1. Push this repository to GitHub (the project files must be at the repository root, with the `Dockerfile` next to `package.json`).
2. In Render, choose **New > Web Service** and connect the repository.
3. Select the **Docker** runtime (Render detects the Dockerfile) and the **Free** instance type.
4. Add the environment variable `GEMINI_API_KEY`. Do not set `PORT`.
5. Create the service. When the build finishes, the `onrender.com` URL is live over HTTPS.

### Alternative: AWS Elastic Beanstalk

Zip the project contents (without `node_modules` and `.env`), create an Elastic Beanstalk application on the **Docker** platform, upload the zip, and add `GEMINI_API_KEY` under Configuration > Software > Environment properties. Elastic Beanstalk serves plain HTTP by default; HTTPS needs CloudFront or a load balancer with a certificate.

---

## Security

- The Gemini API key lives only in server-side environment variables
- `.env` is listed in `.gitignore` and `.dockerignore`, so it is never committed or copied into the image
- The frontend only calls the app's own `/api/*` endpoints, never Gemini directly
- Served over HTTPS on Render

---

## Limitations and Roadmap

- Tasks are stored on the server without an external database, so on free hosting they reset when the service restarts or redeploys
- Planned: persistent database storage (for example MongoDB), user accounts with per-user task boards, and scheduled reminders beyond the browser session

---

## Author

**Arti** — B.Tech (Industrial Internet of Things), University School of Automation and Robotics, GGSIPU

Built during the IBM x Bharat Cares Vibe Coding Masterclass internship project work.
