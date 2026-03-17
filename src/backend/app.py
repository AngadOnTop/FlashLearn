from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

API_KEY = os.getenv("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """
You are an assistant that generates educational flashcard questions.
The user will provide a year, subject, and syllabus/topic.
Generate exactly 5 questions relevant to that year, subject, and topic.
Return them as an array of JSON objects with 'question' and 'answer' fields.
Do not include extra explanation, just the 5 Q&A pairs.
"""

@app.route("/generate", methods=["POST", "OPTIONS"])
def generate_flashcards():
    if request.method == "OPTIONS":
        # Preflight request
        return jsonify({}), 200

    try:
        data = request.json
        year = data.get("year", "")
        subject = data.get("subject", "")
        topic = data.get("topic", "")

        # Example: simple 5 flashcards (replace with AI call)
        cards = [
            {"question": f"{subject} Q1 ({year}) about {topic}", "answer": "Answer 1"},
            {"question": f"{subject} Q2 ({year}) about {topic}", "answer": "Answer 2"},
            {"question": f"{subject} Q3 ({year}) about {topic}", "answer": "Answer 3"},
            {"question": f"{subject} Q4 ({year}) about {topic}", "answer": "Answer 4"},
            {"question": f"{subject} Q5 ({year}) about {topic}", "answer": "Answer 5"},
        ]

        return jsonify(cards)

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)