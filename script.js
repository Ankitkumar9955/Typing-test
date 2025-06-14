// Array of sentences for the typing test (fallback if LLM fails or not used)
const sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Never underestimate the power of a good book.",
    "Innovation distinguishes between a leader and a follower.",
    "The early bird catches the worm, but the second mouse gets the cheese.",
    "Learning to code is a valuable skill in the modern world.",
    "The only way to do great work is to love what you do.",
    "Technology has transformed the way we live and work.",
    "Believe you can and you're halfway there.",
    "The sun always shines brightest after the rain.",
    "Creativity is intelligence having fun."
];

// DOM elements
const sentenceDisplay = document.getElementById('sentence-display');
const typedInput = document.getElementById('typed-input');
const timeDisplay = document.getElementById('time');
const wpmDisplay = document.getElementById('wpm');
const mistakesDisplay = document.getElementById('mistakes');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const generateSentenceBtn = document.getElementById('generate-sentence-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn'); // New theme toggle button
const resultsModal = document.getElementById('results-modal');
const modalTime = document.getElementById('modal-time');
const modalWPM = document.getElementById('modal-wpm');
const modalMistakes = document.getElementById('modal-mistakes');
const modalScore = document.getElementById('modal-score');
const modalRestartBtn = document.getElementById('modal-restart-btn');

// Game state variables
let currentSentence = '';
let sentenceCharacters = [];
let typedCharacters = [];
let characterIndex = 0;
let startTime = 0;
let timerInterval = null;
let totalMistakes = 0;
let correctCharactersCount = 0;
let isTypingStarted = false;

/**
 * Initializes the game by setting up a new sentence and resetting all metrics.
 * @param {string|null} sentenceToUse - Optional: A specific sentence to use. If null, a random static sentence is chosen.
 */
function initializeGame(sentenceToUse = null) {
    // Reset all game state variables
    characterIndex = 0;
    totalMistakes = 0;
    correctCharactersCount = 0;
    isTypingStarted = false;
    typedInput.value = '';
    typedInput.disabled = true; // Disable input until start button is clicked
    clearInterval(timerInterval); // Clear any existing timer
    startTime = 0;

    // Reset display metrics
    timeDisplay.textContent = '0';
    wpmDisplay.textContent = '0';
    mistakesDisplay.textContent = '0';
    scoreDisplay.textContent = '0/100';

    // Hide restart button and show start button
    startBtn.classList.remove('hidden');
    restartBtn.classList.add('hidden');
    generateSentenceBtn.disabled = false; // Enable generate button
    themeToggleBtn.disabled = false; // Enable theme toggle after restart

    // Select sentence: use provided, or random static one
    currentSentence = sentenceToUse || sentences[Math.floor(Math.random() * sentences.length)];
    sentenceCharacters = currentSentence.split('');

    // Render the sentence in the display area with each character in a span
    sentenceDisplay.innerHTML = '';
    sentenceCharacters.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.id = `char-${index}`; // Add an ID for easy access
        sentenceDisplay.appendChild(span);
    });

    // Highlight the first character as current
    if (sentenceCharacters.length > 0) {
        document.getElementById(`char-0`).classList.add('current');
    }

    // Close modal if open
    resultsModal.classList.remove('show');
}

/**
 * Starts the typing test timer.
 */
function startTimer() {
    startTime = new Date().getTime(); // Record the start time
    timerInterval = setInterval(() => {
        const currentTime = new Date().getTime();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000); // Time in seconds
        timeDisplay.textContent = elapsedTime;
        calculateMetrics(); // Update WPM and Score continuously
    }, 1000); // Update every second
}

/**
 * Calculates and updates WPM, Mistakes, and Score.
 */
function calculateMetrics() {
    const currentTime = new Date().getTime();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    const elapsedTimeInMinutes = elapsedTimeInSeconds / 60;

    // WPM calculation: (Correct Characters / 5) / Time in Minutes
    // A "word" is typically considered 5 characters.
    let wpm = 0;
    if (elapsedTimeInMinutes > 0) {
        wpm = Math.round((correctCharactersCount / 5) / elapsedTimeInMinutes);
    }
    wpmDisplay.textContent = wpm;

    // Mistakes are already tracked by totalMistakes
    mistakesDisplay.textContent = totalMistakes;

    // Score calculation: (Correct Characters - Mistakes) / Total Characters * 100
    // Penalize mistakes more heavily. Max score 100.
    let score = 0;
    if (sentenceCharacters.length > 0) {
        // Base score on accuracy
        score = (correctCharactersCount / sentenceCharacters.length) * 100;
        // Deduct points for mistakes (e.g., 5 points per mistake)
        score -= (totalMistakes * 5);
        // Ensure score doesn't go below 0
        score = Math.max(0, Math.round(score));
    }
    scoreDisplay.textContent = `${score}/100`;
}

/**
 * Handles user input in the typing field.
 * @param {Event} event - The input event object.
 */
/**
 * Handles user input in the typing field.
 * @param {Event} event - The input event object.
 */
function handleInput(event) {
    if (!isTypingStarted) {
        startTimer();
        isTypingStarted = true;
    }

    const allTypedText = typedInput.value;

    // Remove all previous highlights and current character highlight for a clean re-evaluation
    sentenceCharacters.forEach((_, idx) => {
        const charSpan = document.getElementById(`char-${idx}`);
        if (charSpan) {
            charSpan.classList.remove('correct', 'incorrect', 'current');
        }
    });

    // Re-evaluate all typed characters for highlighting and mistake/correct count
    totalMistakes = 0;
    correctCharactersCount = 0;

    for (let i = 0; i < sentenceCharacters.length; i++) { // Loop through the original sentence characters
        const charSpan = document.getElementById(`char-${i}`);
        if (!charSpan) continue; // Skip if element not found (shouldn't happen)

        if (i < allTypedText.length) {
            // User has typed a character for this position
            if (allTypedText[i] === sentenceCharacters[i]) {
                charSpan.classList.add('correct');
                correctCharactersCount++;
            } else {
                charSpan.classList.add('incorrect');
                totalMistakes++;
            }
        } else if (i === allTypedText.length) {
            // This is the next character the user needs to type
            charSpan.classList.add('current');
        }
    }

    // Update characterIndex based on current input length
    characterIndex = allTypedText.length;

    calculateMetrics(); // Update metrics after each input

    // Check if the test is finished
    if (characterIndex === sentenceCharacters.length) {
        endGame();
    }
}
 
function endGame() {
    clearInterval(timerInterval);
    typedInput.disabled = true; // Disable input
    startBtn.classList.add('hidden'); // Hide start button
    restartBtn.classList.remove('hidden'); // Show restart button
    generateSentenceBtn.disabled = false; // Enable generate button
    themeToggleBtn.disabled = false; // Enable theme toggle after restart

    // Populate modal with final results
    modalTime.textContent = `${timeDisplay.textContent}s`;
    modalWPM.textContent = wpmDisplay.textContent;
    modalMistakes.textContent = mistakesDisplay.textContent;
    modalScore.textContent = scoreDisplay.textContent;

    // Show the results modal
    resultsModal.classList.add('show');
}

/**
 * Fetches a new sentence from the Gemini API using gemini-2.0-flash.
 * Shows a loading indicator during the API call.
 * @returns {Promise<string>} A promise that resolves with the generated sentence.
 */
async function generateSentenceFromLLM() {
    generateSentenceBtn.disabled = true;
    const originalBtnText = generateSentenceBtn.textContent;
    generateSentenceBtn.textContent = 'Generating...';
    sentenceDisplay.textContent = 'Generating a new sentence, please wait...'; // Loading message

    try {
        let chatHistory = [];
        const prompt = "Generate a single, grammatically correct English sentence suitable for a typing test. The sentence should be between 50 and 100 characters long, including spaces. Avoid numbers, special characters (like !, @, #, $, %, ^, &, *, (, ), -, _, =, +, [, ], {, }, \\, |, ;, :, ', \", <, >, ,, ., ?, /), and proper nouns. The sentence should contain a good mix of common letters.";
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            // Basic cleanup: remove leading/trailing quotes if the LLM adds them
            return text.replace(/^"|"$/g, '').trim();
        } else {
            console.error("LLM response structure unexpected:", result);
            return sentences[Math.floor(Math.random() * sentences.length)]; // Fallback to static sentence
        }
    } catch (error) {
        console.error("Error generating sentence from LLM:", error);
        // Fallback to a random static sentence in case of API error
        return sentences[Math.floor(Math.random() * sentences.length)];
    } finally {
        generateSentenceBtn.textContent = originalBtnText; // Restore button text
        generateSentenceBtn.disabled = false; // Re-enable button
    }
}

/**
 * Toggles the theme between dark and light mode.
 */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark'); // Save preference
    themeToggleBtn.textContent = isLightMode ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode';
}

// Event Listeners
startBtn.addEventListener('click', () => {
    typedInput.disabled = false; // Enable input
    typedInput.focus(); // Focus the input field
    startBtn.classList.add('hidden'); // Hide start button
    restartBtn.classList.remove('hidden'); // Show restart button
    generateSentenceBtn.disabled = true; // Disable generate button during test
    themeToggleBtn.disabled = true; // Disable theme toggle during test
});

restartBtn.addEventListener('click', () => {
    initializeGame(); // Restart with a random static sentence
    themeToggleBtn.disabled = false; // Enable theme toggle after restart
});
modalRestartBtn.addEventListener('click', () => {
    initializeGame(); // Restart with a random static sentence
    themeToggleBtn.disabled = false; // Enable theme toggle after restart
});
typedInput.addEventListener('input', handleInput);

// Event listener for the new Gemini-powered sentence generation
generateSentenceBtn.addEventListener('click', async () => {
    const newSentence = await generateSentenceFromLLM();
    initializeGame(newSentence); // Initialize game with the LLM-generated sentence
    typedInput.disabled = false; // Enable input after new sentence is loaded
    typedInput.focus(); // Focus the input field
    startBtn.classList.add('hidden'); // Hide start button
    restartBtn.classList.remove('hidden'); // Show restart button
    generateSentenceBtn.disabled = true; // Disable generate button during test
    themeToggleBtn.disabled = true; // Disable theme toggle during test
});

// Event listener for theme toggle button
themeToggleBtn.addEventListener('click', toggleTheme);

// Initialize the game and apply saved theme on page load
window.onload = () => {
    const savedTheme = localStorage.getItem('theme');
    // Apply light mode if saved preference is 'light' or if system prefers light and no preference saved
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggleBtn.textContent = '🌙 Switch to Dark Mode';
    } else {
        // Default to dark mode (your provided palette)
        themeToggleBtn.textContent = '☀️ Switch to Light Mode';
    }
    initializeGame();
};
