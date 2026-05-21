# FlashLearn

An AI-powered flashcard generator and quiz platform, built as a Software Engineering assessment project.

**Live Demo:** [flashlearnai.netlify.app](https://flashlearnai.netlify.app)

---

## Overview

FlashLearn is a full-stack study tool that uses AI to generate personalised flashcards and quizzes based on your subject, academic level, and topic. You enter what you are studying and FlashLearn handles the rest.

It was built using Python (Flask) on the backend and React on the frontend, as part of a Year 11 Software Engineering assessment.

---

## Features

- **AI Flashcard Generation** - Enter your subject, level, and topic to get instant flashcards powered by Claude AI.
- **Custom Flashcards** - Create and manage your own question and answer cards.
- **AI Quiz Mode** - After studying, take a quiz where AI marks your written answers and gives detailed feedback with a score out of 100.
- **LaTeX Rendering** - Mathematical expressions render cleanly using KaTeX.
- **Pomodoro Timer** - A built-in focus timer with 25, 5, and 15 minute modes.
- **Responsive Design** - Works on both desktop and mobile.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, KaTeX |
| Backend | Python 3, Flask, Flask-CORS |
| AI | Claude (via apifree.ai) |
| Deployment | Netlify (frontend), Render (backend) |

---

## Project Structure

```
flashlearn/
├── src/
│   ├── frontend/
│   │   ├── App.jsx          # Main React component
│   │   ├── App.css          # Styles
│   │   └── assets/          # Logo and images
│   └── backend/
│       ├── app.py           # Flask API server
│       └── requirements.txt
├── .env.local               # API keys (not committed)
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- An API key from [apifree.ai](https://apifree.ai)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/flashlearn.git
cd flashlearn
```

### 2. Set up the backend

```bash
cd src/backend
pip install -r requirements.txt
```

Create a `.env.local` file in the backend folder:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Start the Flask server:

```bash
python3 app.py
```

The backend runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd src/frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

---

## API Endpoints

### `POST /generate`

Generates AI flashcards based on study parameters.

**Request body:**
```json
{
  "year": "Year 11",
  "subject": "Mathematics",
  "topic": "Quadratic Equations",
  "count": 5
}
```

**Response:**
```json
[
  {
    "question": "What is the quadratic formula?",
    "answer": "x = (-b ± √(b²-4ac)) / 2a"
  }
]
```

### `POST /mark`

AI-marks student quiz answers and returns scores with feedback.

**Request body:**
```json
{
  "questions": [
    {
      "question": "What is the quadratic formula?",
      "correctAnswer": "x = (-b ± √(b²-4ac)) / 2a",
      "studentAnswer": "x equals negative b plus or minus the square root of b squared minus 4ac all over 2a"
    }
  ]
}
```

**Response:**
```json
[
  {
    "score": 9,
    "feedback": "Excellent -- correct formula with good explanation. Minor mark deducted for not using mathematical notation."
  }
]
```

---

## Deployment

### Backend on Render

1. Push the code to GitHub.
2. Create a new Web Service on [render.com](https://render.com).
3. Set the root directory to `src/backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Add `ANTHROPIC_API_KEY` as an environment variable.

### Frontend on Netlify

1. Connect your GitHub repo on [netlify.com](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Update the API URL in `App.jsx` to your Render URL.

> **Note:** Render's free tier sleeps after a period of inactivity. The first request after idle may take around 30 seconds. FlashLearn shows a message while the server wakes up.

---

## How It Works

```
User fills in the form
      ↓
React sends a POST request to the Flask backend
      ↓
Flask constructs a prompt and calls Claude AI via apifree.ai
      ↓
Claude returns a JSON array of flashcards
      ↓
Flask parses and validates the response
      ↓
React displays the flashcards or quiz
      ↓
For quiz marking: student answers are sent back to Flask, Claude marks them, and scores are returned
```

---

## Programming Concepts Demonstrated

| Concept | Where |
|---|---|
| **Sequence** | The flashcard and quiz flow runs step by step in order |
| **Selection** | Answer checking, score colour coding, and error handling |
| **Iteration** | Looping through cards and mapping over quiz results |

---

## License

Built for educational purposes as part of a Year 11 Software Engineering assessment.

---

*Made by Angad*
