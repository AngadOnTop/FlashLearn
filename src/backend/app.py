from flask import Flask, request, jsonify
import os
import requests
import json
import re

app = Flask(__name__)

@app.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    header['Access-Control-Allow-Credentials'] = 'true'
    header['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Accept'
    header['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

API_KEY = os.getenv("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """
You are an assistant that generates educational flashcard questions.
The user will provide a year, subject, and syllabus/topic.
Generate exactly 5 questions relevant to that year, subject, and topic.
Return them as an array of JSON objects with 'question' and 'answer' fields.
Do not include extra explanation, just the 5 Q&A pairs.
Format your response as valid JSON like this:
[
  {"question": "What is...", "answer": "The answer is..."},
  {"question": "How do you...", "answer": "You can..."}
]
"""

@app.route("/generate", methods=["POST", "OPTIONS"])
def generate_flashcards():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        body = request.json  # ← renamed from 'data'
        year = body.get("year", "")
        subject = body.get("subject", "")
        topic = body.get("topic", "")
        
        user_prompt = f"Generate 5 flashcard questions for {subject} at {year} level about {topic}."
        
        api_response = requests.post(  # ← renamed from 'response'
            "https://api.apifree.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json={
                "model": "anthropic/claude-haiku-4.5",
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
        )

        if not api_response.ok:
            raise Exception(f"API request failed: {api_response.status_code}")
        
        api_data = api_response.json()  # ← renamed from 'data'
        
        if "choices" not in api_data or not api_data["choices"]:
            raise Exception("Invalid API response format")
        
        content = api_data["choices"][0]["message"]["content"]
        
        try:
            cards = json.loads(content)
            if not isinstance(cards, list):
                raise ValueError("Response is not a list")
        except (json.JSONDecodeError, ValueError):
            json_match = re.search(r'\[.*?\]', content, re.DOTALL)
            if json_match:
                cards = json.loads(json_match.group())
            else:
                raise Exception("Could not parse flashcards from AI response")
        
        return jsonify(cards)  # ← no reassignment, just return directly

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)