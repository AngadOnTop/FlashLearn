from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv(".env.local")
import os, requests, json, re

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

API_KEY = os.getenv("ANTHROPIC_API_KEY")

SYSTEM_PROMPT = """
You are an assistant that generates educational flashcard questions.
Generate exactly {count} questions relevant to that year, subject, and topic.
Return ONLY a raw JSON array with 'question' and 'answer' fields.
No markdown, no code fences, no explanation, just the raw JSON array.
For any mathematical expressions, use LaTeX notation wrapped in $ for inline math
and $$ for block math. For example: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$"
[
  {"question": "What is...", "answer": "The answer is..."}
]
"""

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
        
        # Validate count (max 20)
        if count > 20:
            count = 20
        elif count < 1:
            count = 5

        # Create dynamic system prompt
        system_prompt = f"""You are an assistant that generates educational flashcard questions.
Generate exactly {count} questions relevant to that year, subject, and topic.
Return ONLY a raw JSON array with 'question' and 'answer' fields.
No markdown, no code fences, no explanation, just the raw JSON array.
For any mathematical expressions, use LaTeX notation wrapped in $ for inline math
and $$ for block math. For example: "The quadratic formula is $x = \\frac{{-b \\pm \\sqrt{{b^2-4ac}}}}{{2a}}$"
[
  {{"question": "What is...", "answer": "The answer is..."}}
]"""

        user_prompt = f"Generate {count} flashcard questions for {subject} at {year} level about {topic}."

        api_response = requests.post(
            "https://api.apifree.ai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json={
                "model": "anthropic/claude-haiku-4.5",
                "max_tokens": 1024,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False
            }
        )

        if not api_response.ok:
            raise Exception(f"API request failed: {api_response.status_code}")

        api_data = api_response.json()

        if "choices" not in api_data or not api_data["choices"]:
            raise Exception("Invalid API response format")

        content = api_data["choices"][0]["message"]["content"]

        # Strip markdown code fences if present
        content = re.sub(r'```json|```', '', content).strip()

        try:
            cards = json.loads(content)
            if not isinstance(cards, list):
                raise ValueError("Response is not a list")
        except (json.JSONDecodeError, ValueError):
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                cards = json.loads(json_match.group())
            else:
                raise Exception("Could not parse flashcards from AI response")

        return jsonify(cards)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)