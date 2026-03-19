import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import katex from "katex";
import "katex/dist/katex.min.css";

function renderInlineMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    } else if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'var(--surface-3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace', color: 'var(--accent)' }}>{part.slice(1, -1)}</code>;
    } else if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true, throwOnError: false }) }} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: false, throwOnError: false }) }} />;
    }
    return <span key={i}>{part}</span>;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1rem 0 0.4rem' }}>{renderInlineMarkdown(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1rem 0 0.4rem' }}>{renderInlineMarkdown(line.slice(3))}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1rem 0 0.5rem' }}>{renderInlineMarkdown(line.slice(2))}</h2>);
    } else if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.75rem 0' }} />);
    } else if (line.match(/^[\-\*] /)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.2rem 0', paddingLeft: '0.25rem' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.05rem' }}>•</span>
          <span>{renderInlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\. /)) {
      const match = line.match(/^(\d+)\. (.*)/);
      elements.push(
        <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.2rem 0', paddingLeft: '0.25rem' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, fontWeight: 600, minWidth: '1rem' }}>{match[1]}.</span>
          <span>{renderInlineMarkdown(match[2])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '0.4rem' }} />);
    } else {
      elements.push(<p key={i} style={{ margin: '0.15rem 0', lineHeight: 1.65 }}>{renderInlineMarkdown(line)}</p>);
    }
    i++;
  }
  return <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{elements}</div>;
}

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

  // Flashcard quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizCards, setQuizCards] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [quizResults, setQuizResults] = useState(null);
  const [isMarking, setIsMarking] = useState(false);

  // Generated quiz state
  const [genQuizMode, setGenQuizMode] = useState(false);
  const [genQuizCount, setGenQuizCount] = useState(5);
  const [genQuizQuestions, setGenQuizQuestions] = useState([]);
  const [genQuizIndex, setGenQuizIndex] = useState(0);
  const [genQuizAnswers, setGenQuizAnswers] = useState([]);
  const [genCurrentAnswer, setGenCurrentAnswer] = useState("");
  const [genSelectedOption, setGenSelectedOption] = useState(null);
  const [genQuizResults, setGenQuizResults] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isMarkingQuiz, setIsMarkingQuiz] = useState(false);

  // Tutor state
  const [tutorMode, setTutorMode] = useState(false);
  const [tutorYear, setTutorYear] = useState("");
  const [tutorSubject, setTutorSubject] = useState("");
  const [tutorTopic, setTutorTopic] = useState("");
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [tutorStarted, setTutorStarted] = useState(false);
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tutorMessages]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Tutor ───────────────────────────────────────────────────────

  const startTutor = () => {
    if (!tutorYear || !tutorSubject) {
      showToast("Please enter your year level and subject", 'error');
      return;
    }
    const greeting = `Hi! I'm your FlashLearn Tutor 👋 I'm here to help you with **${tutorSubject}** at **${tutorYear}** level${tutorTopic ? `, focusing on **${tutorTopic}**` : ''}.\n\nWhat would you like to learn or work through today?`;
    setTutorMessages([{ role: 'assistant', content: greeting }]);
    setTutorStarted(true);
  };

  const sendTutorMessage = async () => {
    if (!tutorInput.trim() || isTutorLoading) return;
    const userMsg = { role: 'user', content: tutorInput.trim() };
    const updatedMessages = [...tutorMessages, userMsg];
    setTutorMessages(updatedMessages);
    setTutorInput("");
    setIsTutorLoading(true);
    try {
      const response = await fetch(`${apiBase}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ messages: updatedMessages, year: tutorYear, subject: tutorSubject, topic: tutorTopic })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTutorMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      showToast(`Tutor error: ${err.message}`, 'error');
      setTutorMessages(updatedMessages);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const exitTutor = () => {
    setTutorMode(false);
    setTutorStarted(false);
    setTutorMessages([]);
    setTutorInput("");
    setTutorYear("");
    setTutorSubject("");
    setTutorTopic("");
  };

  const resetTutorSession = () => {
    setTutorStarted(false);
    setTutorMessages([]);
    setTutorInput("");
  };

  // ── Flashcard generation ────────────────────────────────────────

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

  // ── Generated Quiz ──────────────────────────────────────────────

  const generateQuiz = async () => {
    if (!year || !subject || !syllabus) {
      showToast("Please fill in Academic Level, Subject and Topic first", 'error');
      return;
    }
    setIsGeneratingQuiz(true);
    setSlowLoad(false);
    const slowTimer = setTimeout(() => setSlowLoad(true), 6000);
    try {
      const response = await fetch(`${apiBase}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ year, subject, topic: syllabus, count: genQuizCount })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) { showToast(data.error, 'error'); return; }
      if (!Array.isArray(data) || data.length === 0) { showToast("No questions generated.", 'error'); return; }
      setGenQuizQuestions(data);
      setGenQuizIndex(0);
      setGenQuizAnswers([]);
      setGenCurrentAnswer("");
      setGenSelectedOption(null);
      setGenQuizResults(null);
      setGenQuizMode(true);
      showToast(`✅ Generated ${data.length} quiz questions!`, 'success');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      clearTimeout(slowTimer);
      setSlowLoad(false);
      setIsGeneratingQuiz(false);
    }
  };

  const submitGenAnswer = () => {
    const q = genQuizQuestions[genQuizIndex];
    const answer = q.type === 'multiple_choice' ? genSelectedOption : genCurrentAnswer.trim();
    if (!answer) return;
    const updated = [...genQuizAnswers, answer];
    setGenQuizAnswers(updated);
    setGenCurrentAnswer("");
    setGenSelectedOption(null);
    if (genQuizIndex < genQuizQuestions.length - 1) {
      setGenQuizIndex(genQuizIndex + 1);
    } else {
      markGeneratedQuiz(updated);
    }
  };

  const markGeneratedQuiz = async (answers) => {
    setIsMarkingQuiz(true);
    const slowTimer = setTimeout(() => setSlowLoad(true), 6000);
    try {
      const questions = genQuizQuestions.map((q, i) => ({
        type: q.type, question: q.question, answer: q.answer,
        options: q.options || [], explanation: q.explanation || "",
        studentAnswer: answers[i] || ""
      }));
      const response = await fetch(`${apiBase}/mark-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ questions })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const results = await response.json();
      setGenQuizResults(results);
    } catch (err) {
      showToast(`Marking failed: ${err.message}`, 'error');
    } finally {
      clearTimeout(slowTimer);
      setSlowLoad(false);
      setIsMarkingQuiz(false);
    }
  };

  const getGenTotalScore = () => {
    if (!genQuizResults) return 0;
    return Math.round((genQuizResults.reduce((sum, r) => sum + (r.score || 0), 0) / (genQuizResults.length * 10)) * 100);
  };

  const exitGenQuiz = () => {
    setGenQuizMode(false); setGenQuizResults(null); setGenQuizAnswers([]);
    setGenQuizIndex(0); setGenCurrentAnswer(""); setGenSelectedOption(null);
  };

  const retakeGenQuiz = () => {
    setGenQuizIndex(0); setGenQuizAnswers([]); setGenCurrentAnswer("");
    setGenSelectedOption(null); setGenQuizResults(null);
  };

  // ── Flashcard quiz ──────────────────────────────────────────────

  const startQuiz = () => {
    setQuizCards(cards); setQuizIndex(0); setStudentAnswers([]);
    setCurrentAnswer(""); setQuizResults(null); setQuizMode(true); setStudyMode(false);
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
        question: card.question, correctAnswer: card.answer, studentAnswer: answers[i] || ""
      }));
      const response = await fetch(`${apiBase}/mark`, {
        method: "POST", headers: { "Content-Type": "application/json" }, mode: "cors",
        body: JSON.stringify({ questions })
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      setQuizResults(await response.json());
    } catch (err) {
      showToast(`Marking failed: ${err.message}`, 'error');
    } finally {
      clearTimeout(slowTimer); setSlowLoad(false); setIsMarking(false);
    }
  };

  const exitQuiz = () => {
    setQuizMode(false); setQuizResults(null); setStudentAnswers([]); setQuizIndex(0); setCurrentAnswer("");
  };

  const getTotalScore = () => {
    if (!quizResults) return 0;
    return Math.round((quizResults.reduce((sum, r) => sum + (r.score || 0), 0) / (quizResults.length * 10)) * 100);
  };

  const getScoreColor = (score) => score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--accent)' : 'var(--red)';

  // ── Study mode ──────────────────────────────────────────────────

  const startAICardsStudy = () => {
    setCurrentStudyCards(cards); setStudyType("ai"); setStudyMode(true); setCurrentIndex(0); setShowAnswer(false);
  };

  const startCustomCardsStudy = () => {
    setCurrentStudyCards(customCards); setStudyType("custom"); setStudyMode(true); setCurrentIndex(0); setShowAnswer(false);
  };

  const addCustomCard = (event) => {
    event.preventDefault();
    if (customQuestion.trim() && customAnswer.trim()) {
      setCustomCards([...customCards, { question: customQuestion.trim(), answer: customAnswer.trim(), isCustom: true }]);
      setCustomQuestion(""); setCustomAnswer("");
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
    setStudyMode(false); setCurrentStudyCards([]); setCurrentIndex(0); setShowAnswer(false);
  };

  const resetAll = () => {
    setCards([]); setCustomCards([]); setCurrentStudyCards([]);
    setCurrentIndex(0); setShowAnswer(false); setError("");
    setShowCustomForm(false); setStudyMode(false); setStudyType("");
    setQuizMode(false); setQuizResults(null);
    setGenQuizMode(false); setGenQuizResults(null);
  };

  const getProgressPercentage = () => currentStudyCards.length > 0 ? ((currentIndex + 1) / currentStudyCards.length) * 100 : 0;
  const currentCard = currentStudyCards[currentIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-container">
            <img src={logo} alt="FlashLearn Logo" className="logo-image" />
            <h1>FlashLearn</h1>
          </div>
          <p className="tagline">AI-Powered Flashcard Generator</p>
          <p className="made-by">Made by Angad</p>
        </div>
        <button
          className={`tutor-header-btn ${tutorMode ? 'active' : ''}`}
          onClick={() => tutorMode ? exitTutor() : setTutorMode(true)}
        >
          {tutorMode ? '← Back' : '🎓 AI Tutor'}
        </button>
      </header>

      <main className="main-content">

        {/* ── Tutor Mode ── */}
        {tutorMode && (
          <section className="tutor-section">
            {!tutorStarted ? (
              <div className="tutor-setup">
                <div className="tutor-setup-card">
                  <div className="tutor-avatar">🎓</div>
                  <h2>FlashLearn Tutor</h2>
                  <p className="form-description">Your personal NSW NESA tutor — ask questions, work through problems, and get guided explanations tailored to your syllabus.</p>
                  <div className="flashcard-form" style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                      <label>Academic Level</label>
                      <input type="text" placeholder="e.g., Year 11, Year 12" value={tutorYear} onChange={(e) => setTutorYear(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <input type="text" placeholder="e.g., Mathematics Advanced, Physics, Chemistry" value={tutorSubject} onChange={(e) => setTutorSubject(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Topic <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                      <input type="text" placeholder="e.g., Financial Mathematics, Waves" value={tutorTopic} onChange={(e) => setTutorTopic(e.target.value)} />
                    </div>
                    <button onClick={startTutor} className="generate-btn" style={{ marginTop: '0.5rem' }}>
                      🎓 Start Tutoring Session
                    </button>
                  </div>
                  <div className="tutor-suggestions">
                    <p className="tutor-suggestions-label">You can ask things like:</p>
                    <div className="tutor-suggestion-chips">
                      <span className="chip">"Explain compound interest step by step"</span>
                      <span className="chip">"Help me solve this quadratic equation"</span>
                      <span className="chip">"What's the difference between speed and velocity?"</span>
                      <span className="chip">"Quiz me on the causes of WWI"</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tutor-chat">
                <div className="tutor-chat-header">
                  <div className="tutor-chat-info">
                    <span className="tutor-avatar-sm">🎓</span>
                    <div>
                      <div className="tutor-chat-title">FlashLearn Tutor</div>
                      <div className="tutor-chat-context">{tutorYear} · {tutorSubject}{tutorTopic ? ` · ${tutorTopic}` : ''}</div>
                    </div>
                  </div>
                  <button onClick={resetTutorSession} className="reset-btn">🔄 New Session</button>
                </div>

                <div className="tutor-messages">
                  {tutorMessages.map((msg, i) => (
                    <div key={i} className={`tutor-message ${msg.role}`}>
                      {msg.role === 'assistant' && <span className="msg-avatar">🎓</span>}
                      <div className="msg-bubble">
                        {msg.role === 'assistant' ? renderMarkdown(msg.content) : renderInlineMarkdown(msg.content)}
                      </div>
                      {msg.role === 'user' && <span className="msg-avatar user-avatar">👤</span>}
                    </div>
                  ))}
                  {isTutorLoading && (
                    <div className="tutor-message assistant">
                      <span className="msg-avatar">🎓</span>
                      <div className="msg-bubble typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="tutor-input-area">
                  <textarea
                    className="tutor-input"
                    placeholder="Ask your tutor anything... (Enter to send, Shift+Enter for new line)"
                    value={tutorInput}
                    onChange={(e) => setTutorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTutorMessage(); } }}
                    rows={3}
                    disabled={isTutorLoading}
                  />
                  <button onClick={sendTutorMessage} disabled={!tutorInput.trim() || isTutorLoading} className="tutor-send-btn">
                    {isTutorLoading ? <span className="spinner" style={{ borderTopColor: '#0f0f0f', borderColor: 'rgba(15,15,15,0.3)' }}></span> : '↑'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Generated Quiz Mode ── */}
        {!tutorMode && genQuizMode && (
          <section className="quiz-section">
            <div className="study-header">
              <div className="progress-info">
                {!genQuizResults && !isMarkingQuiz && (
                  <>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${((genQuizIndex + 1) / genQuizQuestions.length) * 100}%` }}></div>
                    </div>
                    <p className="progress-text">Question {genQuizIndex + 1} of {genQuizQuestions.length}
                      <span className="card-type-badge">{genQuizQuestions[genQuizIndex]?.type === 'multiple_choice' ? '🔤 Multiple Choice' : '✏️ Short Answer'}</span>
                    </p>
                  </>
                )}
                {(genQuizResults || isMarkingQuiz) && <p className="progress-text">{isMarkingQuiz ? 'Marking...' : 'Quiz Complete'}</p>}
              </div>
              <button onClick={exitGenQuiz} className="exit-btn">🏠 Exit Quiz</button>
            </div>

            {isMarkingQuiz && (
              <div className="quiz-card">
                <div className="quiz-marking">
                  <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></span>
                  <p>{slowLoad ? "Still marking, hang tight..." : "AI is marking your answers..."}</p>
                </div>
              </div>
            )}

            {!isMarkingQuiz && !genQuizResults && genQuizQuestions[genQuizIndex] && (() => {
              const q = genQuizQuestions[genQuizIndex];
              return (
                <div className="quiz-card">
                  <div className="question-label">Question {genQuizIndex + 1}</div>
                  <div className="question-text" style={{ marginBottom: '2rem' }}>{renderText(q.question)}</div>
                  {q.type === 'multiple_choice' ? (
                    <div className="mc-options">
                      {q.options.map((opt, i) => (
                        <button key={i} className={`mc-option ${genSelectedOption === opt.charAt(0) ? 'selected' : ''}`} onClick={() => setGenSelectedOption(opt.charAt(0))}>
                          {renderText(opt)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Your Answer</label>
                      <textarea placeholder="Type your answer here..." value={genCurrentAnswer} onChange={(e) => setGenCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) submitGenAnswer(); }} rows={4} autoFocus />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ctrl + Enter to submit</span>
                    </div>
                  )}
                  <button onClick={submitGenAnswer} disabled={q.type === 'multiple_choice' ? !genSelectedOption : !genCurrentAnswer.trim()} className="generate-btn" style={{ marginTop: '1.5rem' }}>
                    {genQuizIndex < genQuizQuestions.length - 1 ? 'Next Question →' : '✅ Submit Quiz'}
                  </button>
                </div>
              );
            })()}

            {!isMarkingQuiz && genQuizResults && (
              <div className="quiz-results">
                <div className="quiz-score-header">
                  <div className="quiz-total-score" style={{ color: getScoreColor(getGenTotalScore()) }}>
                    {getGenTotalScore()}<span className="quiz-score-label">/100</span>
                  </div>
                  <p className="quiz-score-message">{getGenTotalScore() >= 80 ? '🎉 Excellent work!' : getGenTotalScore() >= 50 ? '👍 Good effort!' : '📚 Keep studying!'}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button onClick={retakeGenQuiz} className="run-btn">🔄 Retake Quiz</button>
                    <button onClick={exitGenQuiz} className="exit-btn">← Back</button>
                  </div>
                </div>
                <div className="quiz-breakdown">
                  {genQuizResults.map((result, i) => {
                    const q = genQuizQuestions[i];
                    return (
                      <div key={i} className="quiz-result-item">
                        <div className="quiz-result-header">
                          <span className="question-label" style={{ margin: 0 }}>Q{i + 1} <span className="card-type-badge">{q.type === 'multiple_choice' ? 'MC' : 'Short Answer'}</span></span>
                          <span className="quiz-item-score" style={{ color: getScoreColor(result.score * 10) }}>{result.score}/10</span>
                        </div>
                        <div className="quiz-result-question">{renderText(q.question)}</div>
                        {q.type === 'multiple_choice' && (
                          <div className="mc-options-review">
                            {q.options.map((opt, j) => (
                              <div key={j} className={`mc-option-review ${opt.charAt(0) === q.answer ? 'correct' : ''} ${opt.charAt(0) === genQuizAnswers[i] && opt.charAt(0) !== q.answer ? 'wrong' : ''}`}>
                                {renderText(opt)}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="quiz-result-row">
                          <div className="quiz-result-block student">
                            <div className="quiz-result-block-label">Your answer</div>
                            <div>{genQuizAnswers[i]}</div>
                          </div>
                          <div className="quiz-result-block correct">
                            <div className="quiz-result-block-label">Correct answer</div>
                            <div>{renderText(q.type === 'multiple_choice' ? `${q.answer}) ${q.explanation || ''}` : q.answer)}</div>
                          </div>
                        </div>
                        <div className="quiz-feedback">{result.feedback}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Flashcard Quiz Mode ── */}
        {!tutorMode && quizMode && !genQuizMode && (
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
            {isMarking && (
              <div className="quiz-card">
                <div className="quiz-marking">
                  <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></span>
                  <p>{slowLoad ? "Still marking, hang tight..." : "AI is marking your answers..."}</p>
                </div>
              </div>
            )}
            {!isMarking && !quizResults && (
              <div className="quiz-card">
                <div className="question-label">Question {quizIndex + 1}</div>
                <div className="question-text" style={{ marginBottom: '2rem' }}>{renderText(quizCards[quizIndex]?.question)}</div>
                <div className="form-group">
                  <label>Your Answer</label>
                  <textarea placeholder="Type your answer here..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }} rows={4} autoFocus />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ctrl + Enter to submit</span>
                </div>
                <button onClick={submitAnswer} disabled={!currentAnswer.trim()} className="generate-btn" style={{ marginTop: '1rem' }}>
                  {quizIndex < quizCards.length - 1 ? 'Next Question →' : '✅ Submit Quiz'}
                </button>
              </div>
            )}
            {!isMarking && quizResults && (
              <div className="quiz-results">
                <div className="quiz-score-header">
                  <div className="quiz-total-score" style={{ color: getScoreColor(getTotalScore()) }}>
                    {getTotalScore()}<span className="quiz-score-label">/100</span>
                  </div>
                  <p className="quiz-score-message">{getTotalScore() >= 80 ? '🎉 Excellent work!' : getTotalScore() >= 50 ? '👍 Good effort!' : '📚 Keep studying!'}</p>
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
                        <span className="quiz-item-score" style={{ color: getScoreColor(result.score * 10) }}>{result.score}/10</span>
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
        {!tutorMode && studyMode && !quizMode && !genQuizMode && (
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
            {currentIndex === currentStudyCards.length - 1 && studyType === "ai" && (
              <div className="quiz-prompt">
                <p>Ready to test yourself?</p>
                <button onClick={startQuiz} className="generate-btn">🧪 Take Flashcard Quiz</button>
              </div>
            )}
          </section>
        )}

        {/* ── Home / Form ── */}
        {!tutorMode && !studyMode && !quizMode && !genQuizMode && (
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
                      <input id="topic" type="text" placeholder="e.g., Financial Mathematics, Waves, WWI" value={syllabus} onChange={(e) => setSyllabus(e.target.value)} required />
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
                    {slowLoad && <div className="slow-load-message">☕ Server is waking up — first request takes ~30 seconds.</div>}
                  </form>

                  <div className="divider"><span>OR</span></div>

                  <div className="gen-quiz-box">
                    <h3>📝 Generate a Topic Quiz</h3>
                    <p className="form-description" style={{ marginBottom: '1rem' }}>
                      Get a mix of short answer and multiple choice questions directly on your topic.
                    </p>
                    <div className="form-group">
                      <label>Number of Questions</label>
                      <select value={genQuizCount} onChange={(e) => setGenQuizCount(Number(e.target.value))} className="count-select">
                        <option value={3}>3 questions</option>
                        <option value={5}>5 questions</option>
                        <option value={8}>8 questions</option>
                        <option value={10}>10 questions</option>
                        <option value={15}>15 questions</option>
                        <option value={20}>20 questions (max)</option>
                      </select>
                    </div>
                    <button onClick={generateQuiz} disabled={isGeneratingQuiz} className="generate-btn" style={{ background: 'var(--surface-3)', border: '1px solid var(--accent)', color: 'var(--accent)', marginTop: '0.5rem' }}>
                      {isGeneratingQuiz
                        ? (<><span className="spinner" style={{ borderTopColor: 'var(--accent)', borderColor: 'rgba(201,169,110,0.3)' }}></span>{slowLoad ? "Waking up server..." : "Generating Quiz..."}</>)
                        : <>🧪 Generate Quiz</>}
                    </button>
                  </div>

                  {cards.length > 0 && (
                    <div className="generated-cards" style={{ marginTop: '1.5rem' }}>
                      <h3>✅ AI Flashcards Generated ({cards.length})</h3>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        <button onClick={startAICardsStudy} className="run-btn">🚀 Study Flashcards</button>
                        <button onClick={startQuiz} className="generate-btn" style={{ flex: 1 }}>🧪 Flashcard Quiz</button>
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