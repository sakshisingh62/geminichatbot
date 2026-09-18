/* ==========================================================================
   AI CONTENT GENERATOR CONTROLLER (generator.js)
   AI Studio interactions and Gemini API integration
   ========================================================================== */

const API_ENDPOINT = 'http://localhost:5004/ask';

// ES6 Helper Arrow Function for Fetching Gemini API
const callGeminiAPI = async (prompt) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt })
    });

    // ES6 Destructuring response JSON
    const data = await response.json();
    if (response.ok && data.answer) {
      return { success: true, answer: data.answer };
    }
    return { success: false, error: data.error || 'Failed to get response' };
  } catch (error) {
    return { success: false, error: 'Network error! Check server at port 5004.' };
  }
};

// 1. Feature: Ask Me Anything (Q&A)
const handleAskAnything = async () => {
  const inputEl = document.getElementById('askInput');
  const resultEl = document.getElementById('askResult');
  const question = inputEl.value.trim();

  if (!question) {
    resultEl.innerHTML = `<span style="color: var(--danger);">Please enter a question!</span>`;
    return;
  }

  resultEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Fetching answer from Gemini AI...`;

  const { success, answer, error } = await callGeminiAPI(question);

  if (success) {
    resultEl.innerHTML = `<div style="white-space: pre-line;">${answer}</div>`;
  } else {
    resultEl.innerHTML = `<span style="color: var(--danger);">${error}</span>`;
  }
};

// 2. Feature: Quick Summarizer with Copy to Clipboard
const handleSummarize = async () => {
  const inputEl = document.getElementById('summaryInput');
  const resultEl = document.getElementById('summaryResult');
  const copyBtn = document.getElementById('copySummaryBtn');
  const text = inputEl.value.trim();

  if (!text) {
    resultEl.innerHTML = `<span style="color: var(--danger);">Please paste some text to summarize!</span>`;
    return;
  }

  resultEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Summarizing content...`;
  if (copyBtn) copyBtn.style.display = 'none';

  const prompt = `Please provide a concise, clear bulleted summary of the following text:\n\n${text}`;
  const { success, answer, error } = await callGeminiAPI(prompt);

  if (success) {
    resultEl.innerHTML = `<div id="summaryText" style="white-space: pre-line;">${answer}</div>`;
    if (copyBtn) copyBtn.style.display = 'inline-flex';
  } else {
    resultEl.innerHTML = `<span style="color: var(--danger);">${error}</span>`;
  }
};

// Copy Summary Text to Clipboard
const copySummaryToClipboard = () => {
  const summaryText = document.getElementById('summaryText')?.innerText;
  if (summaryText) {
    navigator.clipboard.writeText(summaryText).then(() => {
      alert('✓ Summary copied to clipboard!');
    });
  }
};

// 3. Feature: Idea Spark Generator
const handleIdeaSpark = async () => {
  const topicEl = document.getElementById('ideaTopic');
  const resultEl = document.getElementById('ideaResult');
  const topic = topicEl.value.trim();

  if (!topic) {
    resultEl.innerHTML = `<span style="color: var(--danger);">Please enter a topic for ideas!</span>`;
    return;
  }

  resultEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating creative ideas for "${topic}"...`;

  const prompt = `Give me 5 creative, actionable ideas or suggestions about: "${topic}". Format as a numbered list with bold titles.`;
  const { success, answer, error } = await callGeminiAPI(prompt);

  if (success) {
    resultEl.innerHTML = `<div style="white-space: pre-line;">${answer}</div>`;
  } else {
    resultEl.innerHTML = `<span style="color: var(--danger);">${error}</span>`;
  }
};

// 4. Feature: Definition Finder
const handleDefinitionFinder = async () => {
  const termEl = document.getElementById('termInput');
  const resultEl = document.getElementById('termResult');
  const term = termEl.value.trim();

  if (!term) {
    resultEl.innerHTML = `<span style="color: var(--danger);">Please enter a technical term!</span>`;
    return;
  }

  resultEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Looking up definition for "${term}"...`;

  const prompt = `Define the term "${term}" clearly in plain English. Include a simple analogy and a code/practical example if applicable.`;
  const { success, answer, error } = await callGeminiAPI(prompt);

  if (success) {
    resultEl.innerHTML = `<div style="white-space: pre-line;">${answer}</div>`;
  } else {
    resultEl.innerHTML = `<span style="color: var(--danger);">${error}</span>`;
  }
};

// 5. Mini Tool: AI Joke & Affirmation Generator
const handleRandomJoke = async () => {
  const jokeResult = document.getElementById('jokeResult');
  jokeResult.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Fetching a programming joke...`;

  const { success, answer, error } = await callGeminiAPI('Tell me a clean, short programming or tech joke.');
  if (success) {
    jokeResult.innerHTML = `<em>"${answer}"</em>`;
  } else {
    jokeResult.innerHTML = `<span style="color: var(--danger);">${error}</span>`;
  }
};
