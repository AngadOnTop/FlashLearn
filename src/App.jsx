import { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function renderText(text) {
  if (!text) return null;

  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(math, { displayMode: true, throwOnError: false })
          }}
        />
      );
    } else if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1);
      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(math, { displayMode: false, throwOnError: false })
          }}
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function App() {
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const generateCards = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setShowAnswer(false);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        mode: "cors",
        body: JSON.stringify({ year, subject, topic: syllabus })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError("No flashcards were generated. Please try again.");
        return;
      }

      setCards(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error generating cards:", error);
      setError(`Failed to generate flashcards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const resetCards = () => {
    setCards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
    setError("");
  };

  const getProgressPercentage = () => {
    return cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <h1>🧠 FlashLearn</h1>
          <p className="tagline">AI-Powered Flashcard Generator</p>
        </div>
      </header>

      <main className="main-content">
        {!cards.length && (
          <section className="generator-section">
            <div className="form-container">
              <h2>Create Your Study Flashcards</h2>
              <p className="form-description">
                Enter your study details and let AI generate personalized flashcards for you
              </p>

              <form onSubmit={generateCards} className="flashcard-form">
                <div className="form-group">
                  <label htmlFor="year">Academic Level</label>
                  <input
                    id="year"
                    type="text"
                    placeholder="e.g., Year 11, Grade 10, University"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="e.g., Mathematics, Physics, History"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="topic">Topic/Syllabus</label>
                  <input
                    id="topic"
                    type="text"
                    placeholder="e.g., Algebra, World War II, Cell Biology"
                    value={syllabus}
                    onChange={(e) => setSyllabus(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className="generate-btn">
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Generating Flashcards...
                    </>
                  ) : (
                    <>⚡ Generate Flashcards</>
                  )}
                </button>
              </form>

              {error && (
                <div className="error-message">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          </section>
        )}

        {cards.length > 0 && (
          <section className="study-section">
            <div className="study-header">
              <div className="progress-info">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  {currentIndex + 1} of {cards.length} cards
                </p>
              </div>
              <button onClick={resetCards} className="reset-btn">
                🔄 Create New Set
              </button>
            </div>

            <div className="flashcard-viewer">
              <div className="flashcard-header">
                <span className="subject-badge">{subject}</span>
                <span className="topic-badge">{syllabus}</span>
              </div>

              <div className="flashcard-single">
                <div className="question-section">
                  <div className="question-label">Question {currentIndex + 1}</div>
                  <div className="question-text">
                    {renderText(cards[currentIndex].question)}
                  </div>
                </div>

                {showAnswer && (
                  <div className="answer-section">
                    <div className="answer-label">Answer</div>
                    <div className="answer-text">
                      {renderText(cards[currentIndex].answer)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flashcard-controls">
                <button
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="nav-button prev-btn"
                >
                  ← Previous
                </button>

                <button onClick={toggleAnswer} className="answer-toggle-btn">
                  {showAnswer ? <>🙈 Hide Answer</> : <>👁️ Show Answer</>}
                </button>

                <button
                  onClick={nextCard}
                  disabled={currentIndex === cards.length - 1}
                  className="nav-button next-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>🚀 Powered by AI • Learn Smarter, Not Harder</p>
      </footer>
    </div>
  );
}

export default App;