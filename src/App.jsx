import { useState, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function renderText(text) {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true, throwOnError: false }) }} />;
    } else if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1);
      return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: false, throwOnError: false }) }} />;
    }
    return <span key={i}>{part}</span>;
  });
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type} animate-slide-in`}>
      <div className="toast-content">
        <span className="toast-icon">{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

function App() {
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [cardCount, setCardCount] = useState(5);
  const [cards, setCards] = useState([]);
  const [customCards, setCustomCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [error, setError] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [currentStudyCards, setCurrentStudyCards] = useState([]);
  const [studyType, setStudyType] = useState("");
  const [toast, setToast] = useState(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('focus');

  // Quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizCards, setQuizCards] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [quizResults, setQuizResults] = useState(null);
  const [isMarking, setIsMarking] = useState(false);

  const apiBase = window.location.hostname === 'localhost'
    ? "http://localhost:5000"
    : "https://flashlearn-v05j.onrender.com";

  const showToast = (message, type = 'success') => setToast({ message, type, id: Date.now() });
  const hideToast = () => setToast(null);

  const startPomodoro = () => setIsPomodoroActive(true);
  const pausePomodoro = () => setIsPomodoroActive(false);
  const resetPomodoro = () => { setIsPomodoroActive(false); setPomodoroTimeLeft(pomodoroMinutes * 60); };

  const changePomodoroMode = (mode) => {
    const minutes = mode === 'focus' ? 25 : mode === 'shortBreak' ? 5 : 15;
    setPomodoroMode(mode);
    setPomodoroMinutes(minutes);
    setPomodoroTimeLeft(minutes * 60);
    setIsPomodoroActive(false);
  };

  useEffect(() => {
    let interval;
    if (isPomodoroActive && pomodoroTimeLeft > 0) {
      interval = setInterval(() => setPomodoroTimeLeft(prev => prev - 1), 1000);
    } else if (pomodoroTimeLeft === 0) {
      setIsPomodoroActive(false);
      showToast(`🍅 ${pomodoroMode === 'focus' ? 'Focus time complete!' : 'Break time complete!'}`, 'success');
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroTimeLeft, pomodoroMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateCards = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setSlowLoad(false);
    setShowAnswer(false);
    setError("");
    const slowTimer = setTimeout(() => setSlowLoad(true), 6000);

    try {
      const response = await fetch(`${apiBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        mode: "cors",
        body: JSON.stringify({ year, subject, topic: syllabus, count: cardCount })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) { setError(data.error); showToast(data.error, 'error'); return; }
      if (!Array.isArray(data) || data.length === 0) { setError("No flashcards generated."); return; }

      setCards(data);
      showToast(`✅ Generated ${data.length} flashcards!`, 'success');
    } catch (err) {
      setError(`Failed: ${err.message}`);
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      clearTimeout(slowTimer);
      setSlowLoad(false);
      setIsLoading(false);
    }
  };

  // ── Quiz functions ──────────────────────────────────────

  const startQuiz = () => {
    setQuizCards(cards);
    setQuizIndex(0);
    setStudentAnswers([]);
    setCurrentAnswer("");
    setQuizResults(null);
    setQuizMode(true);
    setStudyMode(false);
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const updated = [...studentAnswers, currentAnswer.trim()];
    setStudentAnswers(updated);
    setCurrentAnswer("");

    if (quizIndex < quizCards.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      markQuiz(updated);
    }
  };

  const markQuiz = async (answers) => {
    setIsMarking(true);
    const slowTimer = setTimeout(() => setSlowLoad(true), 6000);

    try {
      const questions = quizCards.map((card, i) => ({
        question: card.question,
        correctAnswer: card.answer,
        studentAnswer: answers[i] || ""
      }));

      const response = await fetch(`${apiBase}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ questions })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const results = await response.json();
      setQuizResults(results);
    } catch (err) {
      showToast(`Marking failed: ${err.message}`, 'error');
    } finally {
      clearTimeout(slowTimer);
      setSlowLoad(false);
      setIsMarking(false);
    }
  };

  const exitQuiz = () => {
    setQuizMode(false);
    setQuizResults(null);
    setStudentAnswers([]);
    setQuizIndex(0);
    setCurrentAnswer("");
  };

  const getTotalScore = () => {
    if (!quizResults) return 0;
    const total = quizResults.reduce((sum, r) => sum + (r.score || 0), 0);
    return Math.round((total / (quizResults.length * 10)) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--green)';
    if (score >= 50) return 'var(--accent)';
    return 'var(--red)';
  };

  // ── Study mode functions ────────────────────────────────

  const startAICardsStudy = () => {
    setCurrentStudyCards(cards);
    setStudyType("ai");
    setStudyMode(true);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const startCustomCardsStudy = () => {
    setCurrentStudyCards(customCards);
    setStudyType("custom");
    setStudyMode(true);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const addCustomCard = (event) => {
    event.preventDefault();
    if (customQuestion.trim() && customAnswer.trim()) {
      setCustomCards([...customCards, { question: customQuestion.trim(), answer: customAnswer.trim(), isCustom: true }]);
      setCustomQuestion("");
      setCustomAnswer("");
      showToast("✅ Custom flashcard added!", 'success');
    }
  };

  const deleteCustomCard = (index) => {
    setCustomCards(customCards.filter((_, i) => i !== index));
    showToast("🗑️ Deleted", 'info');
  };

  const nextCard = () => { if (currentIndex < currentStudyCards.length - 1) { setCurrentIndex(currentIndex + 1); setShowAnswer(false); } };
  const prevCard = () => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setShowAnswer(false); } };
  const toggleAnswer = () => setShowAnswer(!showAnswer);

  const exitStudyMode = () => {
    setStudyMode(false);
    setCurrentStudyCards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const resetAll = () => {
    setCards([]); setCustomCards([]); setCurrentStudyCards([]);
    setCurrentIndex(0); setShowAnswer(false); setError("");
    setShowCustomForm(false); setStudyMode(false); setStudyType("");
    setQuizMode(false); setQuizResults(null);
  };

  const getProgressPercentage = () => currentStudyCards.length > 0 ? ((currentIndex + 1) / currentStudyCards.length) * 100 : 0;
  const currentCard = currentStudyCards[currentIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-container">
            <img src="/src/assets/logo.png" alt="FlashLearn Logo" className="logo-image" />
            <h1>FlashLearn</h1>
          </div>
          <p className="tagline">AI-Powered Flashcard Generator</p>
          <p className="made-by">Made by Angad</p>
        </div>
      </header>

      <main className="main-content">

        {/* ── Quiz Mode ── */}
        {quizMode && (
          <section className="quiz-section">
            <div className="study-header">
              <div className="progress-info">
                {!quizResults && (
                  <>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${((quizIndex + 1) / quizCards.length) * 100}%` }}></div>
                    </div>
                    <p className="progress-text">Question {quizIndex + 1} of {quizCards.length}</p>
                  </>
                )}
                {quizResults && <p className="progress-text">Quiz Complete</p>}
              </div>
              <button onClick={exitQuiz} className="exit-btn">🏠 Exit Quiz</button>
            </div>

            {/* Marking loading */}
            {isMarking && (
              <div className="quiz-card">
                <div className="quiz-marking">
                  <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></span>
                  <p>{slowLoad ? "Still marking, hang tight..." : "AI is marking your answers..."}</p>
                </div>
              </div>
            )}

            {/* Question */}
            {!isMarking && !quizResults && (
              <div className="quiz-card">
                <div className="question-label">Question {quizIndex + 1}</div>
                <div className="question-text" style={{ marginBottom: '2rem' }}>
                  {renderText(quizCards[quizIndex]?.question)}
                </div>
                <div className="form-group">
                  <label>Your Answer</label>
                  <textarea
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }}
                    rows={4}
                    autoFocus
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ctrl + Enter to submit</span>
                </div>
                <button onClick={submitAnswer} disabled={!currentAnswer.trim()} className="generate-btn" style={{ marginTop: '1rem' }}>
                  {quizIndex < quizCards.length - 1 ? 'Next Question →' : '✅ Submit Quiz'}
                </button>
              </div>
            )}

            {/* Results */}
            {!isMarking && quizResults && (
              <div className="quiz-results">
                <div className="quiz-score-header">
                  <div className="quiz-total-score" style={{ color: getScoreColor(getTotalScore()) }}>
                    {getTotalScore()}
                    <span className="quiz-score-label">/100</span>
                  </div>
                  <p className="quiz-score-message">
                    {getTotalScore() >= 80 ? '🎉 Excellent work!' : getTotalScore() >= 50 ? '👍 Good effort!' : '📚 Keep studying!'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button onClick={startQuiz} className="run-btn">🔄 Retake Quiz</button>
                    <button onClick={exitQuiz} className="exit-btn">← Back</button>
                  </div>
                </div>

                <div className="quiz-breakdown">
                  {quizResults.map((result, i) => (
                    <div key={i} className="quiz-result-item">
                      <div className="quiz-result-header">
                        <span className="question-label" style={{ margin: 0 }}>Q{i + 1}</span>
                        <span className="quiz-item-score" style={{ color: getScoreColor(result.score * 10) }}>
                          {result.score}/10
                        </span>
                      </div>
                      <div className="quiz-result-question">{renderText(quizCards[i]?.question)}</div>
                      <div className="quiz-result-row">
                        <div className="quiz-result-block student">
                          <div className="quiz-result-block-label">Your answer</div>
                          <div>{studentAnswers[i]}</div>
                        </div>
                        <div className="quiz-result-block correct">
                          <div className="quiz-result-block-label">Correct answer</div>
                          <div>{renderText(quizCards[i]?.answer)}</div>
                        </div>
                      </div>
                      <div className="quiz-feedback">{result.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Study Mode ── */}
        {studyMode && !quizMode && (
          <section className="study-section">
            <div className="study-header">
              <div className="progress-info">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
                </div>
                <p className="progress-text">
                  {currentIndex + 1} of {currentStudyCards.length} cards
                  <span className="card-type-badge">{studyType === "ai" ? "🤖 AI" : "📝 Custom"}</span>
                </p>
              </div>
              <div className="study-controls">
                <button onClick={exitStudyMode} className="exit-btn">🏠 Exit Study</button>
                <button onClick={resetAll} className="reset-btn">🔄 Start Over</button>
              </div>
            </div>

            <div className="flashcard-viewer">
              <div className="flashcard-header">
                <span className="subject-badge">{subject}</span>
                <span className="topic-badge">{syllabus}</span>
                {currentCard?.isCustom && <span className="custom-badge">📝 Custom</span>}
              </div>

              <div className="flashcard-single">
                <div className="question-section">
                  <div className="question-label">Question {currentIndex + 1}</div>
                  <div className="question-text">{renderText(currentCard?.question)}</div>
                </div>
                {showAnswer && (
                  <div className="answer-section">
                    <div className="answer-label">Answer</div>
                    <div className="answer-text">{renderText(currentCard?.answer)}</div>
                  </div>
                )}
              </div>

              <div className="flashcard-controls">
                <button onClick={prevCard} disabled={currentIndex === 0} className="nav-button prev-btn">← Previous</button>
                <button onClick={toggleAnswer} className="answer-toggle-btn">
                  {showAnswer ? <>🙈 Hide Answer</> : <>👁️ Show Answer</>}
                </button>
                <button onClick={nextCard} disabled={currentIndex === currentStudyCards.length - 1} className="nav-button next-btn">Next →</button>
              </div>
            </div>

            {/* Show quiz button after last card */}
            {currentIndex === currentStudyCards.length - 1 && studyType === "ai" && (
              <div className="quiz-prompt">
                <p>Ready to test yourself?</p>
                <button onClick={startQuiz} className="generate-btn">
                  🧪 Take Quiz
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Home / Form ── */}
        {!studyMode && !quizMode && (
          <>
            {!showCustomForm && (
              <section className="generator-section">
                <div className="form-container">
                  <h2>Create AI Flashcards</h2>
                  <p className="form-description">Enter your study details and let AI generate personalized flashcards</p>

                  <form onSubmit={generateCards} className="flashcard-form">
                    <div className="form-group">
                      <label htmlFor="year">Academic Level</label>
                      <input id="year" type="text" placeholder="e.g., Year 11, Grade 10, University" value={year} onChange={(e) => setYear(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <input id="subject" type="text" placeholder="e.g., Mathematics, Physics, History" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="topic">Topic/Syllabus</label>
                      <input id="topic" type="text" placeholder="e.g., Algebra, World War II, Cell Biology" value={syllabus} onChange={(e) => setSyllabus(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="count">Number of Flashcards</label>
                      <div className="count-selector">
                        <select id="count" value={cardCount} onChange={(e) => setCardCount(Number(e.target.value))} className="count-select">
                          <option value={3}>3 flashcards</option>
                          <option value={5}>5 flashcards</option>
                          <option value={8}>8 flashcards</option>
                          <option value={10}>10 flashcards</option>
                          <option value={12}>12 flashcards</option>
                          <option value={15}>15 flashcards</option>
                          <option value={20}>20 flashcards (max)</option>
                        </select>
                        <span className="count-info">AI generates up to 20 cards • Custom cards unlimited</span>
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="generate-btn">
                      {isLoading ? (<><span className="spinner"></span>{slowLoad ? "Waking up server..." : "Generating Flashcards..."}</>) : <>⚡ Generate Flashcards</>}
                    </button>

                    {slowLoad && (
                      <div className="slow-load-message">☕ Server is waking up — first request takes ~30 seconds.</div>
                    )}
                  </form>

                  {cards.length > 0 && (
                    <div className="generated-cards">
                      <h3>✅ AI Flashcards Generated ({cards.length})</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={startAICardsStudy} className="run-btn">🚀 Study Flashcards</button>
                        <button onClick={startQuiz} className="generate-btn" style={{ flex: 1 }}>🧪 Take Quiz</button>
                      </div>
                    </div>
                  )}

                  <div className="divider"><span>OR</span></div>

                  <button onClick={() => setShowCustomForm(true)} className="custom-btn" disabled={isLoading}>
                    ✏️ Create Your Own Flashcards
                  </button>

                  {error && <div className="error-message"><strong>Error:</strong> {error}</div>}
                </div>
              </section>
            )}

            {showCustomForm && (
              <section className="custom-section">
                <div className="form-container">
                  <h2>Create Custom Flashcards</h2>
                  <p className="form-description">Add your own questions and answers</p>

                  <form onSubmit={addCustomCard} className="flashcard-form">
                    <div className="form-group">
                      <label htmlFor="custom-question">Question</label>
                      <textarea id="custom-question" placeholder="Enter your question here..." value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} required rows={3} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="custom-answer">Answer</label>
                      <textarea id="custom-answer" placeholder="Enter the answer here..." value={customAnswer} onChange={(e) => setCustomAnswer(e.target.value)} required rows={3} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="generate-btn">➕ Add Flashcard</button>
                      <button type="button" onClick={() => { setShowCustomForm(false); setCustomQuestion(""); setCustomAnswer(""); }} className="cancel-btn">Back to AI</button>
                    </div>
                  </form>

                  {customCards.length > 0 && (
                    <div className="custom-cards-preview">
                      <h3>📝 Custom Flashcards ({customCards.length})</h3>
                      <div className="custom-cards-list">
                        {customCards.map((card, index) => (
                          <div key={index} className="custom-card-item">
                            <div className="custom-card-content">
                              <div className="custom-card-question"><strong>Q:</strong> {card.question}</div>
                              <div className="custom-card-answer"><strong>A:</strong> {card.answer}</div>
                            </div>
                            <button onClick={() => deleteCustomCard(index)} className="delete-btn">🗑️</button>
                          </div>
                        ))}
                      </div>
                      <div className="run-section">
                        <button onClick={startCustomCardsStudy} className="run-btn">🚀 Run Custom Flashcards</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>🚀 Powered by AI • Learn Smarter, Not Harder</p>
      </footer>

      {/* Pomodoro */}
      <div className={`pomodoro-container ${showPomodoro ? 'expanded' : ''}`}>
        <button className="pomodoro-toggle" onClick={() => setShowPomodoro(!showPomodoro)}>⏱️ Pomodoro</button>
        {showPomodoro && (
          <div className="pomodoro-panel">
            <div className="pomodoro-header">
              <h3>⏱️ Pomodoro Timer</h3>
              <button className="pomodoro-close" onClick={() => setShowPomodoro(false)}>×</button>
            </div>
            <div className="pomodoro-modes">
              <button className={`mode-btn ${pomodoroMode === 'focus' ? 'active' : ''}`} onClick={() => changePomodoroMode('focus')}>🎯 Focus (25m)</button>
              <button className={`mode-btn ${pomodoroMode === 'shortBreak' ? 'active' : ''}`} onClick={() => changePomodoroMode('shortBreak')}>☕ Short Break (5m)</button>
              <button className={`mode-btn ${pomodoroMode === 'longBreak' ? 'active' : ''}`} onClick={() => changePomodoroMode('longBreak')}>🌴 Long Break (15m)</button>
            </div>
            <div className="pomodoro-display">
              <div className="pomodoro-timer">{formatTime(pomodoroTimeLeft)}</div>
              <div className="pomodoro-controls">
                {!isPomodoroActive
                  ? <button onClick={startPomodoro} className="control-btn start-btn">▶️ Start</button>
                  : <button onClick={pausePomodoro} className="control-btn pause-btn">⏸️ Pause</button>}
                <button onClick={resetPomodoro} className="control-btn reset-btn">🔄 Reset</button>
              </div>
            </div>
            <div className="pomodoro-progress">
              <div className="progress-ring" style={{ background: `conic-gradient(var(--accent) ${(pomodoroTimeLeft / (pomodoroMinutes * 60)) * 360}deg, var(--surface-3) 0deg)` }}>
                <div className="progress-ring-inner">
                  {pomodoroMode === 'focus' ? '🎯' : pomodoroMode === 'shortBreak' ? '☕' : '🌴'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </div>
  );
}

export default App;