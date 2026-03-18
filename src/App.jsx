import { useState } from "react";

function App() {
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [cards, setCards] = useState([]);

  const generateCards = async (event) => {
    event.preventDefault(); // prevent form reload

    const response = await fetch("http://127.0.0.1:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, subject, topic: syllabus })
    });

    const data = await response.json();
    setCards(data);
    console.log(data);
  };

  return (
    <div>
      <h1>Flashcard Generator</h1>
      <form onSubmit={generateCards}>
        <input
          type="text"
          placeholder="Year e.g. Year 11"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="text"
          placeholder="Subject e.g. Maths"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          type="text"
          placeholder="Syllabus topic e.g. Algebra"
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
        />
        <button type="submit">Generate Flashcards</button>
      </form>

      <div className="flashcards-container">
        {cards.length === 0 ? (
          <div className="no-cards">No flashcards yet. Generate some to get started!</div>
        ) : (
          cards.map((card, index) => (
            <div key={index} className="flashcard">
              <strong>Q:</strong>
              <div className="question">{card.question}</div>
              <strong>A:</strong>
              <div className="answer">{card.answer}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;