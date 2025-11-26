// Constants
const API = 'https://api.textreader.pro/tts';
const COOLDOWN = 5;

// State
let state = {
    cooldown: 0,
    text: '',
    voice: 'Brian',
    buttonText: 'Play',
    buttonLoading: false,
    warningText: '',
    audioUrl: '',
};

// Elements
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const submitButton = document.getElementById('submit-button');
const warningText = document.getElementById('warning-text');
const audioPlayer = document.getElementById('audio-player');
const ttsForm = document.getElementById('tts-form');

// Theme Elements
const themeLightBtn = document.getElementById('theme-light');
const themeDarkBtn = document.getElementById('theme-dark');
const themeSystemBtn = document.getElementById('theme-system');

// Initialize
function init() {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme('system');
    }

    // Event Listeners
    textInput.addEventListener('input', (e) => {
        state.text = e.target.value;
    });

    voiceSelect.addEventListener('change', (e) => {
        state.voice = e.target.value;
    });

    ttsForm.addEventListener('submit', handleSubmit);

    themeLightBtn.addEventListener('click', () => setTheme('light'));
    themeDarkBtn.addEventListener('click', () => setTheme('dark'));
    themeSystemBtn.addEventListener('click', () => setTheme('system'));

    // Greeting
    greet();
}

// Theme Logic
function setTheme(theme) {
    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        localStorage.removeItem('theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
}

// Form Submission
function handleSubmit(event) {
    event.preventDefault();

    // Update UI for loading
    state.buttonLoading = true;
    updateButtonState();

    fetch(`${API}?voice=${state.voice}&text=${state.text}`)
        .then((data) => {
            if (data.status === 200) {
                return data.blob().then((bytes) => {
                    state.audioUrl = URL.createObjectURL(bytes);
                    state.cooldown = state.cooldown < COOLDOWN ? state.cooldown : COOLDOWN;
                    state.warningText = '';
                    
                    updateAudioPlayer();
                    updateWarningText();
                    log(state.voice, state.text);
                });
            } else {
                throw new Error('API Error');
            }
        })
        .catch((err) => {
            console.log('We got an error:', err);
            state.warningText = `We're getting some upstream API errors. Cooldown adjusted to ${state.cooldown + COOLDOWN} seconds.`;
            state.cooldown += COOLDOWN;
            updateWarningText();
        })
        .finally(() => {
            let count = 0;
            let timer = setInterval(() => {
                state.buttonText = `Please wait ${state.cooldown - Math.floor(count * 0.1)}s`;
                updateButtonState();
                count++;

                if (count >= state.cooldown * 10) {
                    state.buttonText = 'Play';
                    state.buttonLoading = false;
                    updateButtonState();
                    clearInterval(timer);
                }
            }, 100);
        });
}

// UI Updates
function updateButtonState() {
    submitButton.value = state.buttonText;
    submitButton.disabled = state.buttonLoading;
}

function updateWarningText() {
    warningText.textContent = state.warningText;
    warningText.style.display = state.warningText !== '' ? 'block' : 'none';
}

function updateAudioPlayer() {
    if (state.audioUrl) {
        audioPlayer.src = state.audioUrl;
        audioPlayer.style.display = 'inline-block';
        audioPlayer.play();
    } else {
        audioPlayer.style.display = 'none';
    }
}

// Logging
async function log(voice, text) {
    try {
        await fetch('https://logs.textreader.pro/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voice,
                text,
            }),
        });
    } catch (e) {
        console.error('Logging failed', e);
    }
}

// Greeting
const GOOSE = `

                               ,-""   \`.
                             ,'  _   e )\`-._
                            /  ,' \`-._<.===-'
                           /  /
                          /  ;
              _          /   ;
 (\`._    _.-"" ""--..__,'    |
 <_  \`-""                     \\
  <\`-                          :
   (__   <__.                  ;
     \`-.   '-.__.      _.'    /
        \\      \`-.__,-'    _,'
         \`._    ,    /__,-'
            ""._\\__,'< <____
                 | |  \`----.\`.
                 | |        \\ \`.
                 ; |___      \\-\`\`
                 \\   --<
                  \`.\`.<
                    \`-'

                                    GREETINGS!


This website is made by Telepathy from Twitch!!
https://www.twitch.tv/telepathy/about


Its' open source, feel free to check out the code if you're interested
https://github.com/petercunha/tts
`;

function greet() {
    console.log(GOOSE);
}

// Start
init();
