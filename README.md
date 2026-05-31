# FlashLearn

A study tool that uses AI to generate flashcards and quizzes. Built for a Year 11 Software Engineering assessment.

**Live demo:** [flashlearnai.netlify.app](https://flashlearnai.netlify.app)

---

## What it does

You enter a subject, academic level, and topic. FlashLearn generates flashcards instantly, lets you study them, then quizzes you with written answers that AI marks and gives feedback on.

- Generate flashcards from any subject and topic
- Create your own custom cards
- Take a written quiz with AI marking and scores
- LaTeX rendering for maths via KaTeX
- Built-in Pomodoro timer (25/5/15 min)
- Works on desktop and mobile

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, KaTeX |
| Backend | Python 3, Flask |
| AI | Claude |
| Hosting | Netlify (frontend), Render (backend) |

---

## Project structure

```
flashlearn/
├── src/
│   ├── frontend/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── assets/
│   └── backend/
│       ├── app.py
│       └── requirements.txt
├── .env.local
└── README.md
```

---

## Getting started

**Prerequisites:** Python 3.11+, Node.js 18+, an API key from [apifree.ai](https://apifree.ai)

### 1. Clone

```bash
git clone https://github.com/your-username/flashlearn.git
cd flashlearn
```

### 2. Backend

```bash
cd src/backend
pip install -r requirements.txt
```

Add a `.env.local` file:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Start the server:

```bash
python3 app.py
```

Runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`.

---

## API

### `POST /generate`

Generates flashcards based on study inputs.

```json
{
  "year": "Year 11",
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "count": 5
}
```

Returns an array of question/answer pairs.

### `POST /mark`

Marks written quiz answers and returns a score with feedback.

```json
{
  "questions": [
    {
      "question": "What is the quadratic formula?",
      "correctAnswer": "x = (-b ± √(b²-4ac)) / 2a",
      "studentAnswer": "x equals negative b plus or minus..."
    }
  ]
}
```

Returns a score out of 10 and written feedback for each answer.

---

## Deployment

### Backend (Render)

1. Push to GitHub and create a new Web Service on [render.com](https://render.com)
2. Set root directory to `src/backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add `ANTHROPIC_API_KEY` as an environment variable

### Frontend (Netlify)

1. Connect the repo on [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Update the API URL in `App.jsx` to your Render URL

> Render's free tier sleeps after inactivity. The first request may take around 30 seconds. FlashLearn shows a loading message while the server wakes up.

---

*Made by Angad*