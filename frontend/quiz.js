/* ==========================================================================
   INTERACTIVE QUIZ MASTER ENGINE (quiz.js)
   Assessment interactions, AI explanations, and quiz generation
   ========================================================================== */

// Default Quiz Questions Dataset (Array of Objects)
const defaultQuestions = [
  {
    id: 1,
    question: "What is the primary purpose of HTML in web development?",
    options: [
      "To style and design web pages",
      "To structure and organize web content",
      "To add backend database logic",
      "To perform complex mathematical calculations"
    ],
    correctAnswer: 1,
    explanation: "HTML (HyperText Markup Language) defines the semantic structure and skeleton of a web page."
  },
  {
    id: 2,
    question: "Which CSS property is crucial for intuitive Box Model calculations?",
    options: [
      "border-collapse: collapse",
      "box-sizing: border-box",
      "display: flex",
      "list-style: none"
    ],
    correctAnswer: 1,
    explanation: "'box-sizing: border-box' ensures element padding and border are included in the total width and height."
  },
  {
    id: 3,
    question: "What does the JS DOM (Document Object Model) represent?",
    options: [
      "A database table structure",
      "An object-oriented tree representation of the HTML document",
      "A CSS styling framework",
      "An external API key"
    ],
    correctAnswer: 1,
    explanation: "The DOM is a programming interface for web documents. It represents the page as a nodes tree so JS can modify content and styles."
  },
  {
    id: 4,
    question: "Which array method creates a new array by transforming every element in an existing array?",
    options: [
      ".forEach()",
      ".filter()",
      ".map()",
      ".reduce()"
    ],
    correctAnswer: 2,
    explanation: ".map() creates a new array populated with the results of calling a provided function on every element in the calling array."
  }
];

// State Management Variables (let for values that change)
let quizData = [...defaultQuestions];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('quizBox')) {
    initQuiz();
  }
});

// Initialize Quiz State
function initQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  displayQuestion();
}

// Display Current Question using ES6 Destructuring & Template Literals
function displayQuestion() {
  const container = document.getElementById('quizBox');
  if (!container) return;

  if (currentQuestionIndex >= quizData.length) {
    showResults();
    return;
  }

  const currentQ = quizData[currentQuestionIndex];
  const { question, options, id } = currentQ;

  // Render Question HTML
  container.innerHTML = `
    <div class="quiz-header">
      <span class="quiz-progress">Question ${currentQuestionIndex + 1} of ${quizData.length}</span>
      <span style="font-weight: 600; color: #64748b;">Score: ${score}/${quizData.length}</span>
    </div>

    <h3>${id}. ${question}</h3>

    <div class="options-container" id="optionsBox">
      ${options.map((opt, idx) => `
        <button class="option-btn" onclick="selectAnswer(${idx})">
          <strong>${String.fromCharCode(65 + idx)}.</strong> ${opt}
        </button>
      `).join('')}
    </div>

    <div class="ai-explain-box" id="aiExplainBox"></div>

    <div style="display: flex; gap: 10px; margin-top: 1.5rem; justify-content: space-between;">
      <button class="btn btn-secondary" id="explainBtn" onclick="explainWithAI()" style="display: none;">
        <i class="fas fa-brain"></i> Explain Answer with AI
      </button>

      <button class="btn" id="nextBtn" onclick="nextQuestion()" style="display: none;">
        Next Question <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  `;
}

// Handle Option Selection
function selectAnswer(selectedIndex) {
  const currentQ = quizData[currentQuestionIndex];
  const optionButtons = document.querySelectorAll('.option-btn');

  // Disable all option buttons once answered
  optionButtons.forEach(btn => btn.disabled = true);

  // Check correctness using ES6 Conditional Statement (if/else)
  if (selectedIndex === currentQ.correctAnswer) {
    optionButtons[selectedIndex].classList.add('correct');
    score++;
  } else {
    optionButtons[selectedIndex].classList.add('incorrect');
    optionButtons[currentQ.correctAnswer].classList.add('correct');
  }

  // Show Next and Explain Buttons
  document.getElementById('nextBtn').style.display = 'inline-flex';
  document.getElementById('explainBtn').style.display = 'inline-flex';
}

// AI Question Explainer Integration (Calls backend Gemini API)
async function explainWithAI() {
  const currentQ = quizData[currentQuestionIndex];
  const explainBox = document.getElementById('aiExplainBox');
  explainBox.style.display = 'block';
  explainBox.innerHTML = `<strong><i class="fas fa-spinner fa-spin"></i> Gemini AI is generating explanation...</strong>`;

  const prompt = `Explain in simple student-friendly terms why "${currentQ.options[currentQ.correctAnswer]}" is the correct answer to the question: "${currentQ.question}".`;

  try {
    const res = await fetch('http://localhost:5004/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });

    const data = await res.json();
    if (res.ok && data.answer) {
      explainBox.innerHTML = `
        <h4 style="color: var(--primary); margin-bottom: 0.5rem;"><i class="fas fa-lightbulb"></i> AI Explanation:</h4>
        <p style="margin: 0; color: #1e293b;">${data.answer}</p>
      `;
    } else {
      explainBox.innerHTML = `<span style="color: var(--danger);">Failed to load AI explanation.</span>`;
    }
  } catch (err) {
    explainBox.innerHTML = `<span style="color: var(--danger);">Error connecting to AI service. Ensure backend is running.</span>`;
  }
}

// Advance to Next Question
function nextQuestion() {
  currentQuestionIndex++;
  displayQuestion();
}

// Show Final Score Results
function showResults() {
  const container = document.getElementById('quizBox');
  const percentage = Math.round((score / quizData.length) * 100);

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <i class="fas fa-trophy" style="font-size: 4rem; color: #f59e0b; margin-bottom: 1rem;"></i>
      <h2>Quiz Completed!</h2>
      <p style="font-size: 1.3rem; font-weight: 600; color: var(--primary);">
        You scored ${score} out of ${quizData.length} (${percentage}%)
      </p>

      <div style="margin: 2rem 0; display: flex; justify-content: center; gap: 1rem;">
        <button class="btn" onclick="initQuiz()">
          <i class="fas fa-redo"></i> Restart Quiz
        </button>
      </div>
    </div>
  `;
}

// AI Quiz Generator (Generates custom Quiz Questions using Gemini API)
async function generateAIQuiz() {
  const topicInput = document.getElementById('aiTopicInput');
  const topic = topicInput ? topicInput.value.trim() : '';

  if (!topic) {
    alert('Please enter a topic to generate quiz questions!');
    return;
  }

  const statusEl = document.getElementById('aiGenStatus');
  if (statusEl) {
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating 3 Quiz questions on "${topic}" using Gemini AI...`;
  }

  const prompt = `Generate 3 multiple choice quiz questions on the topic "${topic}". Return ONLY valid JSON format array of objects with keys: "id" (number), "question" (string), "options" (array of 4 strings), "correctAnswer" (0-indexed integer number), "explanation" (string). Do not wrap in markdown quotes if possible or send clean raw JSON.`;

  try {
    const res = await fetch('http://localhost:5004/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });

    const data = await res.json();
    if (res.ok && data.answer) {
      try {
        // Clean JSON string if wrapped in markdown code fence
        let cleanText = data.answer.replace(/```json/g, '').replace(/```/g, '').trim();
        const generated = JSON.parse(cleanText);

        if (Array.isArray(generated) && generated.length > 0) {
          quizData = generated;
          currentQuestionIndex = 0;
          score = 0;
          displayQuestion();
          if (statusEl) statusEl.innerHTML = `<span style="color: var(--success);">✓ Generated new quiz on "${topic}"!</span>`;
          return;
        }
      } catch (parseErr) {
        console.warn('Fallback parsing required:', parseErr);
      }
    }
    if (statusEl) statusEl.innerHTML = `<span style="color: var(--danger);">Could not parse AI response into quiz. Try another topic!</span>`;
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span style="color: var(--danger);">Network error generating AI quiz.</span>`;
  }
}
