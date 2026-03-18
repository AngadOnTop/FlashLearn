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
  const [customCards, setCustomCards] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [currentStudyCards, setCurrentStudyCards] = useState([]);
  const [studyType, setStudyType] = useState(""); // "ai" or "custom"

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
      // Don't automatically start study mode - let user click "Run" button
    } catch (error) {
      console.error("Error generating cards:", error);
      setError(`Failed to generate flashcards: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startAICardsStudy = () => {
    if (cards.length > 0) {
      setCurrentStudyCards(cards);
      setStudyType("ai");
      setStudyMode(true);
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  const startCustomCardsStudy = () => {
    if (customCards.length > 0) {
      setCurrentStudyCards(customCards);
      setStudyType("custom");
      setStudyMode(true);
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  };

  const addCustomCard = (event) => {
    event.preventDefault();
    if (customQuestion.trim() && customAnswer.trim()) {
      const newCard = {
        question: customQuestion.trim(),
        answer: customAnswer.trim(),
        isCustom: true
      };
      const updatedCustomCards = [...customCards, newCard];
      setCustomCards(updatedCustomCards);
      setAllCards([...cards, ...updatedCustomCards]);
      setCustomQuestion("");
      setCustomAnswer("");
      setShowCustomForm(false);
      
      // If this is the first card overall, set it as current
      if (allCards.length === 0) {
        setCurrentIndex(0);
      }
    }
  };

  const deleteCustomCard = (index) => {
    const updatedCustomCards = customCards.filter((_, i) => i !== index);
    setCustomCards(updatedCustomCards);
    setAllCards([...cards, ...updatedCustomCards]);
    
    // Adjust current index if necessary
    if (currentIndex >= allCards.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const nextCard = () => {
    if (currentIndex < allCards.length - 1) {
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
    setCustomCards([]);
    setAllCards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
    setError("");
    setShowCustomForm(false);
  };

  const getProgressPercentage = () => {
    return allCards.length > 0 ? ((currentIndex + 1) / allCards.length) * 100 : 0;
  };

  const currentCard = allCards[currentIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <h1>🧠 FlashLearn</h1>
          <p className="tagline">AI-Powered Flashcard Generator</p>
        </div>
      </header>

      <main className="main-content">
        {!allCards.length && (
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

              <div className="divider">
                <span>OR</span>
              </div>

              <button 
                onClick={() => setShowCustomForm(true)} 
                className="custom-btn"
                disabled={isLoading}
              >
                ✏️ Create Your Own Flashcards
              </button>

              {error && (
                <div className="error-message">
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>
          </section>
        )}

        {showCustomForm && !allCards.length && (
          <section className="custom-section">
            <div className="form-container">
              <h2>Create Custom Flashcard</h2>
              <p className="form-description">
                Add your own questions and answers
              </p>

              <form onSubmit={addCustomCard} className="flashcard-form">
                <div className="form-group">
                  <label htmlFor="custom-question">Question</label>
                  <textarea
                    id="custom-question"
                    placeholder="Enter your question here..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="custom-answer">Answer</label>
                  <textarea
                    id="custom-answer"
                    placeholder="Enter the answer here..."
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="generate-btn">
                    ➕ Add Flashcard
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomQuestion("");
                      setCustomAnswer("");
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {allCards.length > 0 && (
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
                  {currentIndex + 1} of {allCards.length} cards
                  {customCards.length > 0 && (
                    <span className="card-count">
                      ({cards.length} AI + {customCards.length} custom)
                    </span>
                  )}
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
                {currentCard?.isCustom && (
                  <span className="custom-badge">📝 Custom</span>
                )}
              </div>

              <div className="flashcard-single">
                <div className="question-section">
                  <div className="question-label">Question {currentIndex + 1}</div>
                  <div className="question-text">
                    {renderText(currentCard?.question)}
                  </div>
                </div>

                {showAnswer && (
                  <div className="answer-section">
                    <div className="answer-label">Answer</div>
                    <div className="answer-text">
                      {renderText(currentCard?.answer)}
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

            {/* Custom Card Management */}
            <div className="custom-management">
              <div className="custom-header">
                <h3>Custom Flashcards ({customCards.length})</h3>
                <button 
                  onClick={() => setShowCustomForm(true)}
                  className="add-custom-btn"
                >
                  ➕ Add Custom Card
                </button>
              </div>

              {customCards.length > 0 && (
                <div className="custom-cards-list">
                  {customCards.map((card, index) => (
                    <div key={index} className="custom-card-item">
                      <div className="custom-card-content">
                        <div className="custom-card-question">
                          <strong>Q:</strong> {card.question}
                        </div>
                        <div className="custom-card-answer">
                          <strong>A:</strong> {card.answer}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteCustomCard(index)}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Custom Form Modal/Overlay */}
        {showCustomForm && allCards.length > 0 && (
          <div className="custom-overlay">
            <div className="custom-modal">
              <h3>Add Custom Flashcard</h3>
              <form onSubmit={addCustomCard}>
                <div className="form-group">
                  <label htmlFor="modal-question">Question</label>
                  <textarea
                    id="modal-question"
                    placeholder="Enter your question here..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-answer">Answer</label>
                  <textarea
                    id="modal-answer"
                    placeholder="Enter the answer here..."
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="generate-btn">
                    ➕ Add Flashcard
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomQuestion("");
                      setCustomAnswer("");
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>🚀 Powered by AI • Learn Smarter, Not Harder</p>
      </footer>
    </div>
  );
}

export default App;