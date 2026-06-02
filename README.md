# FlashLearn

FlashLearn is a study tool I created in react, using Python as my backend, accessing ApiFree for the AI model. This tool can generate flashcards, generate quizzes and features a tailored ai-tutor structured to your year and subject.

**Live demo:** [flashlearnai.netlify.app](https://flashlearnai.netlify.app)

---
## What it does

Enter a subject, year level and topic. FlashLearn will then generate flashcards (takes around 30s if not used since the backend winds down :( sorry about that), lets you study them, then quizzes you on your answers, the AI also marks your answers at the end.

+ Generate flashcards from any subject and topic from NESA syllabus
+ Create your own custom cards
+ Take a written quiz with AI marking and scores
+ Built-in Pomodoro timer (25/5/15 min)

---
## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, KaTeX |
| Backend | Python 3, Flask |
| AI | Claude |
| Hosting | Netlify (frontend), Render (backend) |

---
## File structure

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
## How to use

You can use it from the link provided above, but if you want to git clone here are the steps. 

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
APIFREE_API_KEY=your-api-key-here
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
**created by Angad**
