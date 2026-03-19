from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv(".env.local")
import os, requests, json, re

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "https://flashlearnai.netlify.app", "http://192.168.0.5:5173", "http://192.168.0.5:3000", "http://192.168.0.5:8080"])

API_KEY = os.getenv("ANTHROPIC_API_KEY")

GENERATE_SYSTEM_PROMPT = """You are an expert NSW educational assistant generating flashcards strictly based on the NESA 2026 syllabus.
Return ONLY a raw JSON array with 'question' and 'answer' fields.
No markdown, no code fences, no explanation, just the raw JSON array.

IMPORTANT LATEX RULES:
- Every mathematical expression MUST be wrapped in $ for inline math or $$ for block math
- Every opening $ must have a matching closing $. Never leave a $ unclosed.
- CORRECT: "The formula is $A = P(1 + r)^n$"
- INCORRECT: "The formula is A = P(1 + r)^n$" (missing opening $)
- For display equations use $$...$$
- Never mix LaTeX and plain text inside the same expression
- Currency values must be written as plain text only, never inside LaTeX dollar signs. Write 2315.25 not $2,315.25

NESA SYLLABUS RULES:
- Only generate content from the official NSW NESA 2026 syllabus for the given subject and year
- Use correct NESA terminology and dot point language
- Do not invent content or include topics outside the syllabus
- Questions should reflect NESA outcomes and working mathematically / thinking skills

Example format:
[
  {"question": "What is the compound interest formula?", "answer": "The compound interest formula is $A = P(1 + r)^n$ where $A$ is the final amount, $P$ is the principal, $r$ is the interest rate per period, and $n$ is the number of periods."}
]"""

TUTOR_SYSTEM_PROMPT = """You are FlashLearn Tutor, an expert NSW educational assistant specialised in the NESA 2026 syllabus.
You help students understand concepts clearly and deeply.

Your teaching style:
- Explain concepts step by step, building from fundamentals
- Use worked examples relevant to the NSW syllabus
- Ask guiding questions to check understanding rather than just giving answers
- When a student is stuck, break the problem into smaller parts
- Use Australian English and NESA terminology
- Reference specific syllabus dot points when relevant
- For maths and science, show full working using LaTeX ($...$ for inline, $$...$$ for block)
- Be encouraging and patient
- Keep responses concise but complete — avoid walls of text
- If asked something outside the NSW syllabus, gently redirect back to curriculum content

Never just give the answer outright — guide the student to work it out themselves when possible."""

MARKING_SYSTEM_PROMPT = """You are a teacher marking student answers based on the NSW NESA 2026 syllabus.
For each question and answer pair, compare the student's answer to the correct answer and give a score out of 10 and brief feedback.
Return ONLY a raw JSON array like this:
[
  {"score": 8, "feedback": "Good answer, but missing..."}
]
One object per question, in the same order. No markdown, no code fences."""

QUIZ_SYSTEM_PROMPT = """You are an expert NSW exam question writer strictly following the NESA 2026 syllabus.
Generate a mix of short answer and multiple choice questions for the given subject, year, and topic.
Return ONLY a raw JSON array. No markdown, no code fences, no explanation.

Each question object must follow one of these two formats:

Short answer:
{
  "type": "short",
  "question": "Explain why...",
  "answer": "The correct answer is..."
}

Multiple choice:
{
  "type": "multiple_choice",
  "question": "Which of the following...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "answer": "A",
  "explanation": "A is correct because..."
}

LATEX RULES:
- Wrap all mathematical expressions in $ for inline or $$ for block math
- Every opening $ must have a matching closing $
- Currency values must be plain text, never inside LaTeX dollar signs

NESA RULES:
- Only use content from the official NSW NESA 2026 syllabus
- Use NESA terminology and dot point language
- Roughly half short answer, half multiple choice
- Questions should vary in difficulty from straightforward to challenging"""

QUIZ_MARKING_PROMPT = """You are a NSW teacher marking a student exam based on the NESA 2026 syllabus.
For each question, the correct answer is provided. Mark the student's response generously but accurately.
For multiple choice: full marks (10) if correct letter selected, 0 if wrong.
For short answer: mark out of 10 based on accuracy and completeness.
Return ONLY a raw JSON array:
[
  {"score": 8, "feedback": "Good explanation, but missed the key term..."}
]
One object per question in the same order. No markdown, no code fences."""


def call_ai(system_prompt, user_prompt):
    response = requests.post(
        "https://api.apifree.ai/v1/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        },
        json={
            "model": "anthropic/claude-haiku-4.5",
            "max_tokens": 2048,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
    )
    if not response.ok:
        raise Exception(f"API request failed: {response.status_code}")
    data = response.json()
    if "choices" not in data or not data["choices"]:
        raise Exception("Invalid API response format")
    return data["choices"][0]["message"]["content"]


def parse_json_list(content):
    content = re.sub(r'```json|```', '', content).strip()
    try:
        result = json.loads(content)
        if not isinstance(result, list):
            raise ValueError("Not a list")
        return result
    except (json.JSONDecodeError, ValueError):
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise Exception("Could not parse JSON list from response")


@app.route("/generate", methods=["POST", "OPTIONS"])
def generate_flashcards():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json
        year = body.get("year", "")
        subject = body.get("subject", "")
        topic = body.get("topic", "")
        count = body.get("count", 5)

        if count > 20:
            count = 20
        elif count < 1:
            count = 5

        user_prompt = f"Generate {count} flashcard questions for {subject} at {year} level about {topic}."
        system_prompt = GENERATE_SYSTEM_PROMPT + f"\nGenerate exactly {count} questions."

        print("=== GENERATE REQUEST ===")
        print(f"Year: {year}, Subject: {subject}, Topic: {topic}, Count: {count}")

        content = call_ai(system_prompt, user_prompt)

        print("=== RAW RESPONSE ===")
        print(content)

        cards = parse_json_list(content)
        return jsonify(cards)

    except Exception as e:
        print(f"Error in /generate: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/generate-quiz", methods=["POST", "OPTIONS"])
def generate_quiz():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json
        year = body.get("year", "")
        subject = body.get("subject", "")
        topic = body.get("topic", "")
        count = body.get("count", 5)

        if count > 20:
            count = 20
        elif count < 1:
            count = 3

        user_prompt = f"Generate {count} exam questions (mix of short answer and multiple choice) for {subject} at {year} level about {topic}. Roughly half of each type."
        system_prompt = QUIZ_SYSTEM_PROMPT + f"\nGenerate exactly {count} questions total."

        print("=== GENERATE QUIZ REQUEST ===")
        print(f"Year: {year}, Subject: {subject}, Topic: {topic}, Count: {count}")

        content = call_ai(system_prompt, user_prompt)

        print("=== QUIZ RAW RESPONSE ===")
        print(content)

        questions = parse_json_list(content)
        return jsonify(questions)

    except Exception as e:
        print(f"Error in /generate-quiz: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/mark", methods=["POST", "OPTIONS"])
def mark_answers():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json
        questions = body.get("questions", [])

        qa_text = ""
        for i, q in enumerate(questions):
            qa_text += f"Question {i+1}: {q['question']}\n"
            qa_text += f"Correct Answer: {q['correctAnswer']}\n"
            qa_text += f"Student Answer: {q['studentAnswer']}\n\n"

        print("=== MARK REQUEST ===")
        print(qa_text)

        content = call_ai(MARKING_SYSTEM_PROMPT, qa_text)
        results = parse_json_list(content)

        print("=== PARSED RESULTS ===")
        print(results)

        return jsonify(results)

    except Exception as e:
        print(f"Error in /mark: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/tutor", methods=["POST", "OPTIONS"])
def tutor():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json
        messages = body.get("messages", [])
        year = body.get("year", "")
        subject = body.get("subject", "")
        topic = body.get("topic", "")

        # Build context-aware system prompt
        context = TUTOR_SYSTEM_PROMPT
        if year or subject or topic:
            context += f"\n\nCurrent student context: {year} level, studying {subject}"
            if topic:
                context += f", currently on the topic of {topic}"
            context += ". Tailor all explanations to this level and subject."

        print("=== TUTOR REQUEST ===")
        print(f"Messages: {len(messages)}, Context: {year} {subject} {topic}")

        response = requests.post(
            "https://api.apifree.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json={
                "model": "anthropic/claude-haiku-4.5",
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": context},
                    *messages
                ],
                "stream": False
            }
        )

        if not response.ok:
            raise Exception(f"API request failed: {response.status_code}")

        data = response.json()
        if "choices" not in data or not data["choices"]:
            raise Exception("Invalid API response format")

        reply = data["choices"][0]["message"]["content"]

        print("=== TUTOR REPLY ===")
        print(reply)

        return jsonify({"reply": reply})

    except Exception as e:
        print(f"Error in /tutor: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/mark-quiz", methods=["POST", "OPTIONS"])
def mark_quiz():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json
        questions = body.get("questions", [])

        qa_text = ""
        for i, q in enumerate(questions):
            qa_text += f"Question {i+1} ({q.get('type', 'short')}):\n"
            qa_text += f"Question: {q['question']}\n"
            if q.get('type') == 'multiple_choice':
                qa_text += f"Options: {', '.join(q.get('options', []))}\n"
                qa_text += f"Correct Answer: {q['answer']} — {q.get('explanation', '')}\n"
            else:
                qa_text += f"Correct Answer: {q['answer']}\n"
            qa_text += f"Student Answer: {q['studentAnswer']}\n\n"

        print("=== MARK QUIZ REQUEST ===")
        print(qa_text)

        content = call_ai(QUIZ_MARKING_PROMPT, qa_text)
        results = parse_json_list(content)

        print("=== QUIZ MARKING RESULTS ===")
        print(results)

        return jsonify(results)

    except Exception as e:
        print(f"Error in /mark-quiz: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)