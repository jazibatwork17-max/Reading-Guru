/**
 * Lumina Reading Coach - Main Application Logic
 * Implements real-time speech matching, dynamic programming sequence alignment,
 * metrics calculation, and dictionary/pronunciation helpers.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // FIREBASE INITIALIZATION & CONFIGURATION
  // ==========================================
  // Paste your web credentials here to activate cloud user syncing.
  const firebaseConfig = {
    apiKey: "AIzaSyAgvc2dL6M79EFuRu7OF0QvdWnZD8KmZek",
    authDomain: "reading-guru-5c41e.firebaseapp.com",
    projectId: "reading-guru-5c41e",
    storageBucket: "reading-guru-5c41e.firebasestorage.app",
    messagingSenderId: "1052500647870",
    appId: "1:1052500647870:web:0a74cb6549d99b1ae963ef"
  };

  let auth = null;
  let db = null;
  let isFirebaseActive = false;

  // Initialize Firebase compat mode if config is updated
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      isFirebaseActive = true;
    } catch (e) {
      console.warn("Failed to initialize Firebase:", e);
    }
  }

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let currentUser = null;
  let activePassage = null;
  let originalWords = [];         // Array of objects representing the original passage words
  let spokenWordsAccumulated = []; // All final spoken words from the SpeechRecognition session
  let isRecording = false;
  let recognition = null;
  
  // Timer state
  let timerInterval = null;
  let secondsElapsed = 0;
  
  // Real-time alignment state
  let lastAlignedOriginalIdx = -1;
  let lastAlignedSpokenIdx = -1;
  
  // Speech synthesis configuration
  const synth = window.speechSynthesis;
  
  // Dictionary cache to save network calls
  const dictionaryCache = {};

  // Single word practice state
  let wordPracticeRecognition = null;
  let wordPracticeTarget = "";

  // History state
  let readingHistory = JSON.parse(localStorage.getItem('lumina_reading_history') || '[]');

  // Accent state
  let selectedAccent = localStorage.getItem('guru_accent') || 'en-US';

  // Tap-to-read & browser speech-backend detection state
  let isTapToReadActive = false;
  let speechTimeout = null;
  let speechResultsReceived = false;

  // ==========================================
  // DOM ELEMENT SELECTIONS
  // ==========================================
  // Navigation
  // Navigation elements are selected dynamically via document.querySelectorAll('.nav-*')
  
  // Views
  const viewDashboard = document.getElementById('view-dashboard');
  const viewPractice = document.getElementById('view-practice');
  const viewReport = document.getElementById('view-report');
  
  // Library & Custom passage elements
  const libraryGrid = document.getElementById('library-grid');
  const btnCustomPassage = document.getElementById('btn-custom-passage');
  const modalCustom = document.getElementById('modal-custom');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelCustom = document.getElementById('btn-cancel-custom');
  const formCustom = document.getElementById('form-custom');
  const customTitleInput = document.getElementById('custom-title');
  const customTextTextarea = document.getElementById('custom-text');
  const customDifficultySelect = document.getElementById('custom-difficulty');
  
  // Dashboard history
  const historyList = document.getElementById('history-list');
  const emptyHistory = document.getElementById('empty-history');
  
  // Practice screen elements
  const practiceTitle = document.getElementById('practice-title');
  const practiceDifficulty = document.getElementById('practice-difficulty');
  const practiceTime = document.getElementById('practice-time');
  const readingTextContainer = document.getElementById('reading-text');
  const recordBtn = document.getElementById('record-btn');
  const btnFinishPractice = document.getElementById('btn-finish-practice');
  const voiceWaveContainer = document.getElementById('voice-wave-container');
  const micWarning = document.getElementById('mic-warning');
  const backToLibraryBtn = document.getElementById('back-to-library');
  
  // Report screen elements
  const reportTitle = document.getElementById('report-title');
  const radialProgress = document.getElementById('radial-progress');
  const accuracyText = document.getElementById('accuracy-text');
  const wpmText = document.getElementById('wpm-text');
  const totalTimeText = document.getElementById('total-time-text');
  const errorsCountText = document.getElementById('errors-count-text');
  const skippedCountText = document.getElementById('skipped-count-text');
  const analysisWordsContainer = document.getElementById('analysis-words');
  const explanationCard = document.getElementById('explanation-card');
  const explainWord = document.getElementById('explain-word');
  const explainPhonetic = document.getElementById('explain-phonetic');
  const errorTypeTag = document.getElementById('error-type-tag');
  const expectedText = document.getElementById('expected-text');
  const spokenTextWrapper = document.getElementById('spoken-text-wrapper');
  const spokenTextVal = document.getElementById('spoken-text-val');
  const audioGuideBtn = document.getElementById('audio-guide-btn');
  const dictPartOfSpeech = document.getElementById('dict-part-of-speech');
  const dictDefinition = document.getElementById('dict-definition');
  
  // Practice single word panel
  const practiceWordText = document.getElementById('practice-word-text');
  const practiceWordMicBtn = document.getElementById('practice-word-mic-btn');
  const practiceFeedbackText = document.getElementById('practice-feedback-text');
  
  // Report action buttons
  const btnRetryReading = document.getElementById('btn-retry-reading');
  const btnNewReading = document.getElementById('btn-new-reading');

  // Accent calibration selectors
  const practiceAccentBtn = document.getElementById('practice-accent-btn');
  const practiceAccentFlag = document.getElementById('practice-accent-flag');
  const practiceAccentName = document.getElementById('practice-accent-name');
  const practiceSetupCard = document.getElementById('practice-setup-card');
  const practiceActiveFooter = document.getElementById('practice-active-footer');
  const btnStartReading = document.getElementById('btn-start-reading');
  const accentGrid = document.getElementById('accent-grid');
  const practiceLayout = viewPractice ? viewPractice.querySelector('.practice-layout') : null;

  // Firebase Auth DOM Elements
  const cloudModeBadge = document.getElementById('cloud-mode-badge');
  const btnAuthTrigger = document.getElementById('btn-auth-trigger');
  const userProfileMenu = document.getElementById('user-profile-menu');
  const btnProfileToggle = document.getElementById('btn-profile-toggle');
  const userAvatarChar = document.getElementById('user-avatar-char');
  const userDropdownCard = document.getElementById('user-dropdown-card');
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayEmail = document.getElementById('user-display-email');
  const btnSignOut = document.getElementById('btn-sign-out');
  
  const modalAuth = document.getElementById('modal-auth');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const authErrorBanner = document.getElementById('auth-error-banner');
  const authErrorMsg = document.getElementById('auth-error-msg');
  const btnGoogleAuth = document.getElementById('btn-google-auth');
  
  const formSignIn = document.getElementById('form-sign-in');
  const signinEmail = document.getElementById('signin-email');
  const signinPassword = document.getElementById('signin-password');
  const linkShowSignup = document.getElementById('link-show-signup');
  
  const formSignUp = document.getElementById('form-sign-up');
  const signupName = document.getElementById('signup-name');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const linkShowSignin = document.getElementById('link-show-signin');

  // ==========================================
  // INIT & PASSAGE LOADING
  // ==========================================
  function init() {
    loadLibrary();
    loadDashboardHistory();
    setupSpeechRecognition();
    setupEventListeners();
    initAuthListener();
    showView('dashboard');
  }

  // ==========================================
  // FIREBASE AUTHENTICATION & SYNC MANAGEMENT
  // ==========================================
  function initAuthListener() {
    if (!isFirebaseActive || !auth) {
      updateCloudStatusUI('local');
      return;
    }

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = user;
        updateCloudStatusUI('cloud');
        
        // Hide standard sign-in button, show profile dropdown menu
        btnAuthTrigger.style.display = 'none';
        userProfileMenu.style.display = 'block';
        
        const displayName = user.displayName || user.email.split('@')[0];
        userDisplayName.textContent = displayName;
        userDisplayEmail.textContent = user.email;
        userAvatarChar.textContent = displayName.charAt(0).toUpperCase();
        
        // Synchronize local browser cache with Firestore
        await syncUserHistory(user.uid);
      } else {
        currentUser = null;
        updateCloudStatusUI('local');
        btnAuthTrigger.style.display = 'block';
        userProfileMenu.style.display = 'none';
        
        // Restore local offline history
        readingHistory = JSON.parse(localStorage.getItem('lumina_reading_history') || '[]');
        loadDashboardHistory();
      }
    });
  }

  function updateCloudStatusUI(status) {
    if (!cloudModeBadge) return;
    
    if (status === 'cloud') {
      cloudModeBadge.className = 'cloud-mode-badge cloud';
      cloudModeBadge.querySelector('.label').textContent = 'Cloud';
      cloudModeBadge.title = 'Connected: Syncing to Cloud Firestore';
    } else {
      cloudModeBadge.className = 'cloud-mode-badge local';
      cloudModeBadge.querySelector('.label').textContent = 'Local';
      cloudModeBadge.title = 'Offline: Local Storage Only';
    }
  }

  async function syncUserHistory(uid) {
    if (!isFirebaseActive || !db) return;
    
    try {
      // 1. Fetch user records from firestore
      const snapshot = await db.collection('users').doc(uid).collection('history').orderBy('timestamp', 'asc').get();
      const cloudHistoryMap = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        cloudHistoryMap[data.id || doc.id] = data;
      });
      
      // 2. Fetch user-specific local storage records
      const userHistoryKey = `lumina_history_${uid}`;
      const localHistory = JSON.parse(localStorage.getItem(userHistoryKey) || '[]');
      
      // 3. Fetch anonymous local storage records to merge (e.g. first-time login)
      const anonymousHistory = JSON.parse(localStorage.getItem('lumina_reading_history') || '[]');
      
      // 4. Merge any anonymous history into user's account
      if (anonymousHistory.length > 0) {
        for (const anonSession of anonymousHistory) {
          const sid = anonSession.id;
          if (!cloudHistoryMap[sid]) {
            await db.collection('users').doc(uid).collection('history').doc(sid).set(anonSession);
            cloudHistoryMap[sid] = anonSession;
          }
        }
        // Clear anonymous storage so it doesn't linger after sign-out or get merged into another user's account
        localStorage.removeItem('lumina_reading_history');
      }

      // 5. Upload local user-specific records that are not in cloud history
      for (const localSession of localHistory) {
        const sid = localSession.id;
        if (!cloudHistoryMap[sid]) {
          await db.collection('users').doc(uid).collection('history').doc(sid).set(localSession);
          cloudHistoryMap[sid] = localSession;
        }
      }
      
      // 6. Update the user-specific cache and readingHistory state with the full sorted list
      const mergedHistory = Object.values(cloudHistoryMap).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      readingHistory = mergedHistory;
      localStorage.setItem(userHistoryKey, JSON.stringify(readingHistory));
      
      // 7. Reload dashboard history UI
      loadDashboardHistory();
      
    } catch (e) {
      console.error("History cloud sync failed:", e);
    }
  }

  function showAuthError(msg) {
    if (authErrorBanner && authErrorMsg) {
      authErrorMsg.textContent = msg;
      authErrorBanner.style.display = 'flex';
    }
  }

  function clearAuthError() {
    if (authErrorBanner) {
      authErrorBanner.style.display = 'none';
    }
  }

  function updateNavActiveState(tabName) {
    document.querySelectorAll('.nav-dashboard, .nav-library, .nav-report').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll(`.nav-${tabName}`).forEach(btn => {
      btn.classList.add('active');
    });
  }

  function showView(viewName) {
    // Auto-stop recording if leaving the practice room
    if (viewName !== 'practice' && isRecording) {
      stopRecording();
    }

    // Hide all views
    viewDashboard.classList.remove('active-view');
    viewPractice.classList.remove('active-view');
    viewReport.classList.remove('active-view');
    
    // Deactivate and activate nav links across both desktop & mobile menus
    if (viewName === 'dashboard') {
      viewDashboard.classList.add('active-view');
      updateNavActiveState('dashboard');
    } else if (viewName === 'practice') {
      viewPractice.classList.add('active-view');
      updateNavActiveState('library'); // Practice uses Library tab active state
    } else if (viewName === 'report') {
      viewReport.classList.add('active-view');
      document.querySelectorAll('.nav-report').forEach(btn => btn.style.display = 'flex');
      updateNavActiveState('report');
    }
  }

  // Load predefined passages into the library grid
  function loadLibrary() {
    libraryGrid.innerHTML = '';
    
    READING_PASSAGES.forEach(passage => {
      const card = createPassageCard(passage);
      libraryGrid.appendChild(card);
    });
    
    // Add custom card at the end
    const customCard = document.createElement('div');
    customCard.className = 'glass-panel passage-card custom-card';
    customCard.innerHTML = `
      <div class="icon-circle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <h3>Add Custom Text</h3>
      <p>Paste your own reading material, article, or story to practice.</p>
    `;
    customCard.addEventListener('click', () => {
      modalCustom.classList.add('active');
    });
    libraryGrid.appendChild(customCard);
  }

  function createPassageCard(passage) {
    const card = document.createElement('div');
    card.className = 'glass-panel passage-card';
    
    const wordCount = passage.text.split(/\s+/).length;
    const estTime = Math.ceil(wordCount / 130); // Average reading speed ~130 WPM
    
    const diffClass = passage.difficulty.toLowerCase();
    
    card.innerHTML = `
      <div class="card-meta">
        <span class="category-tag">${passage.category}</span>
        <span class="difficulty-badge ${diffClass}">${passage.difficulty}</span>
      </div>
      <h3>${passage.title}</h3>
      <p>${passage.description}</p>
      <div class="card-footer">
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          ${wordCount} words
        </span>
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ~${estTime} min
        </span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      startPracticeSession(passage);
    });
    
    return card;
  }

  // Load locally saved reading history
  function loadDashboardHistory() {
    if (readingHistory.length === 0) {
      emptyHistory.style.display = 'block';
      historyList.style.display = 'none';
      return;
    }
    
    emptyHistory.style.display = 'none';
    historyList.style.display = 'grid';
    historyList.innerHTML = '';
    
    // Show last 5 sessions
    const recentHistory = [...readingHistory].reverse().slice(0, 5);
    
    recentHistory.forEach(session => {
      const date = new Date(session.timestamp).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const item = document.createElement('div');
      item.className = 'glass-panel';
      item.style.padding = '1.25rem';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.flexWrap = 'wrap';
      item.style.gap = '1rem';
      
      const difficultyClass = session.passageDifficulty.toLowerCase();
      
      item.innerHTML = `
        <div style="flex: 1; min-width: 200px;">
          <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem; font-weight: 600;">${session.passageTitle}</h4>
          <div style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.82rem; color: var(--text-secondary);">
            <span class="difficulty-badge ${difficultyClass}" style="padding: 0.1rem 0.4rem; font-size: 0.7rem;">${session.passageDifficulty}</span>
            <span>${date}</span>
          </div>
        </div>
        <div style="display: flex; gap: 2rem; text-align: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Accuracy</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-success);">${session.accuracy}%</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Speed</div>
            <div style="font-size: 1.35rem; font-weight: 700; color: var(--color-accent);">${session.wpm} WPM</div>
          </div>
        </div>
        <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" id="btn-view-report-${session.id}">
          Report
        </button>
      `;
      
      historyList.appendChild(item);
      
      document.getElementById(`btn-view-report-${session.id}`).addEventListener('click', () => {
        showSavedReport(session);
      });
    });
  }

  // ==========================================
  // SPEECH RECOGNITION SETUP
  // ==========================================
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser. Tap-to-Read Mode will be active.");
      return;
    }
    
    let consecutiveFastRestarts = 0;
    let lastRestartTime = 0;
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedAccent;
    
    recognition.onstart = () => {
      isRecording = true;
      recordBtn.classList.add('recording');
      voiceWaveContainer.classList.add('listening');
      startTimer();
      micWarning.style.display = 'none';
      
      // Start timeout checker for missing speech backend (e.g. Opera GX)
      speechResultsReceived = false;
      clearTimeout(speechTimeout);
      speechTimeout = setTimeout(() => {
        if (isRecording && !speechResultsReceived && !isTapToReadActive) {
          showSpeechBackendWarning();
        }
      }, 6000);
    };
    
    recognition.onresult = (event) => {
      speechResultsReceived = true;
      clearTimeout(speechTimeout);
      
      let interimTranscript = '';
      let finalTranscriptSegments = [];
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptSegments.push(event.results[i][0].transcript);
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // Parse final spoken words and append
      if (finalTranscriptSegments.length > 0) {
        const newWords = finalTranscriptSegments.join(' ')
          .trim()
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
          .split(/\s+/)
          .filter(w => w.length > 0);
          
        spokenWordsAccumulated.push(...newWords);
      }
      
      // Merge all established words + any temporary interim words for real-time tracking
      const tempInterimWords = interimTranscript
        .trim()
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .split(/\s+/)
        .filter(w => w.length > 0);
        
      const allSpokenSoFar = [...spokenWordsAccumulated, ...tempInterimWords];
      
      // Align real-time progress
      alignRealTime(allSpokenSoFar);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      clearTimeout(speechTimeout);
      
      const criticalErrors = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture'];
      
      if (criticalErrors.includes(event.error)) {
        // Stop standard recording state to break the infinite restart loop
        isRecording = false;
        stopRecording();
        
        if (event.error === 'not-allowed') {
          micWarning.style.display = 'flex';
          micWarning.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            <span><strong>Microphone access blocked.</strong> Please allow microphone permissions in your browser address bar and try again.</span>
          `;
        } else {
          // Display the backend engine warning immediately
          showSpeechBackendWarning(event.error);
        }
      }
    };
    
    recognition.onend = () => {
      clearTimeout(speechTimeout);
      
      // Auto-restart if the session ends but user is still in "recording" state.
      if (isRecording) {
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTime;
        lastRestartTime = now;
        
        if (timeSinceLastRestart < 1000) {
          consecutiveFastRestarts++;
        } else {
          consecutiveFastRestarts = 0;
        }
        
        if (consecutiveFastRestarts > 3) {
          console.warn("Speech recognition is failing to start repeatedly. Halting to prevent browser freeze.");
          isRecording = false;
          stopRecording();
          showSpeechBackendWarning('service-not-allowed');
          return;
        }
        
        // Add a 1s delay on fast restarts to avoid UI thread lockup
        const restartDelay = timeSinceLastRestart < 1000 ? 1000 : 50;
        
        setTimeout(() => {
          if (isRecording) {
            try {
              recognition.start();
            } catch (e) {
              console.warn("Auto-restart failed to trigger:", e);
            }
          }
        }, restartDelay);
      } else {
        recordBtn.classList.remove('recording');
        voiceWaveContainer.classList.remove('listening');
        stopTimer();
      }
    };
  }

  // ==========================================
  // REAL-TIME ALIGNMENT ENGINE (SLIDING WINDOW)
  // ==========================================
  // Stop words to prevent low-entropy word matching drift
  const COMMON_STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 
    'for', 'with', 'about', 'from', 'up', 'down', 'is', 'am', 'are', 'was', 
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 
    'its', 'our', 'their', 'this', 'that', 'these', 'those'
  ]);

  function alignRealTime(spokenWords) {
    if (spokenWords.length === 0 || originalWords.length === 0) return;
    
    // Reset all original words to pending status for a clean, stateless rebuild
    originalWords.forEach(w => {
      w.status = 'pending';
      w.spokenText = null;
    });
    
    let origIdx = 0;
    
    for (let s = 0; s < spokenWords.length; s++) {
      const spokenWord = spokenWords[s];
      let bestMatchIdx = -1;
      let isPerfect = false;
      let minDistance = 999;
      
      // Look back up to 2 words from current expected origIdx to recover from incorrect jumps
      const startOrig = Math.max(0, origIdx - 2);
      
      // Stop words can only lookahead 2 words; content words lookahead 6 words
      const lookaheadLimit = COMMON_STOP_WORDS.has(spokenWord) ? 2 : 6;
      const endOrig = Math.min(originalWords.length, origIdx + lookaheadLimit);
      
      for (let o = startOrig; o < endOrig; o++) {
        const origWord = originalWords[o].normalized;
        
        if (origWord === spokenWord) {
          bestMatchIdx = o;
          isPerfect = true;
          break;
        }
        
        // Check edit distance for fuzzy matching
        const distance = getEditDistance(origWord, spokenWord);
        const threshold = Math.max(2, Math.floor(origWord.length * 0.3));
        
        if (distance <= threshold && distance < minDistance) {
          minDistance = distance;
          bestMatchIdx = o;
        }
      }
      
      // If we found a match (exact or close) in our lookahead/lookback window
      if (bestMatchIdx !== -1) {
        // 1. Mark skipped words in between (only if they are currently pending)
        for (let o = origIdx; o < bestMatchIdx; o++) {
          if (originalWords[o].status === 'pending') {
            originalWords[o].status = 'skipped';
          }
        }
        
        // 2. Mark the matched word
        if (isPerfect) {
          originalWords[bestMatchIdx].status = 'correct';
        } else {
          originalWords[bestMatchIdx].status = 'mispronounced';
          originalWords[bestMatchIdx].spokenText = spokenWord;
        }
        
        // 3. Advance pointer to the next word after the matched word
        origIdx = bestMatchIdx + 1;
      }
    }
    
    // Find the last aligned original index to update UI highlights correctly
    let lastAligned = -1;
    for (let o = originalWords.length - 1; o >= 0; o--) {
      if (originalWords[o].status === 'correct' || originalWords[o].status === 'mispronounced') {
        lastAligned = o;
        break;
      }
    }
    lastAlignedOriginalIdx = lastAligned;
    
    // Update active highlight style in HTML
    updateReadingBoardUI();
  }

  function updateReadingBoardUI() {
    const wordSpans = readingTextContainer.querySelectorAll('.word');
    
    originalWords.forEach((wordObj, i) => {
      const span = wordSpans[i];
      if (!span) return;
      
      // Clean up previous classes
      span.className = 'word';
      
      // Apply status classes
      if (wordObj.status === 'pending') {
        span.classList.add('pending');
      } else {
        span.classList.add(wordObj.status);
      }
      
      // Set active word indicator for the next pending word
      if (i === lastAlignedOriginalIdx + 1) {
        span.classList.add('active');
        // Scroll the word into view if needed
        span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // ==========================================
  // FINAL ALIGNMENT ENGINE (DYNAMIC PROGRAMMING)
  // ==========================================
  function alignFinalNeedlemanWunsch() {
    const X = originalWords.map(w => w.normalized);
    const Y = spokenWordsAccumulated;
    
    const N = X.length;
    const M = Y.length;
    
    if (N === 0) return;
    if (M === 0) {
      // Nothing was read, all marked skipped
      originalWords.forEach(w => w.status = 'skipped');
      return;
    }
    
    // DP Table init
    const dp = Array(N + 1).fill(null).map(() => Array(M + 1).fill(0));
    
    const GAP_PENALTY = -1;
    const MATCH_SCORE = 2;
    const CLOSE_SCORE = 1;
    const MISMATCH_SCORE = -1;
    
    // Boundaries
    for (let i = 0; i <= N; i++) dp[i][0] = i * GAP_PENALTY;
    for (let j = 0; j <= M; j++) dp[0][j] = j * GAP_PENALTY;
    
    // Fill matrix
    for (let i = 1; i <= N; i++) {
      const orig = X[i - 1];
      for (let j = 1; j <= M; j++) {
        const spoken = Y[j - 1];
        
        let matchVal = MISMATCH_SCORE;
        if (orig === spoken) {
          matchVal = MATCH_SCORE;
        } else {
          const distance = getEditDistance(orig, spoken);
          const threshold = Math.max(2, Math.floor(orig.length * 0.3));
          if (distance <= threshold) {
            matchVal = CLOSE_SCORE;
          }
        }
        
        dp[i][j] = Math.max(
          dp[i - 1][j - 1] + matchVal,      // Diagonal (Match / Substitution)
          dp[i - 1][j] + GAP_PENALTY,       // Top (Gap in Y - Skip original word)
          dp[i][j - 1] + GAP_PENALTY        // Left (Gap in X - Extra word spoken)
        );
      }
    }
    
    // Backtrace to map optimal alignment
    let i = N;
    let j = M;
    
    // Reset original word statuses before applying final alignment
    originalWords.forEach(w => {
      w.status = 'skipped';
      w.spokenText = null;
    });
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const orig = X[i - 1];
        const spoken = Y[j - 1];
        
        let matchVal = MISMATCH_SCORE;
        let scoreType = 'mispronounced';
        
        if (orig === spoken) {
          matchVal = MATCH_SCORE;
          scoreType = 'correct';
        } else {
          const distance = getEditDistance(orig, spoken);
          const threshold = Math.max(2, Math.floor(orig.length * 0.3));
          if (distance <= threshold) {
            matchVal = CLOSE_SCORE;
            scoreType = 'mispronounced';
          }
        }
        
        if (dp[i][j] === dp[i - 1][j - 1] + matchVal) {
          originalWords[i - 1].status = scoreType;
          if (scoreType === 'mispronounced') {
            originalWords[i - 1].spokenText = Y[j - 1];
          }
          i--;
          j--;
          continue;
        }
      }
      
      if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + GAP_PENALTY)) {
        originalWords[i - 1].status = 'skipped';
        originalWords[i - 1].spokenText = null;
        i--;
        continue;
      }
      
      if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + GAP_PENALTY)) {
        // Extra spoken word (stutter/noise), doesn't map to original list
        j--;
        continue;
      }
      
      // Fallback
      if (i > 0 && j > 0) {
        i--; j--;
      } else if (i > 0) {
        i--;
      } else {
        j--;
      }
    }
  }

  // Helper: Levenshtein distance
  function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // ==========================================
  // PRACTICE CONTROLS
  // ==========================================
  function updateAccentBadgeUI() {
    const accents = {
      'en-US': { flag: '🇺🇸', name: 'US English' },
      'en-GB': { flag: '🇬🇧', name: 'UK English' },
      'en-PK': { flag: '🇵🇰', name: 'Pakistani' },
      'en-IN': { flag: '🇮🇳', name: 'Indian' },
      'en-AU': { flag: '🇦🇺', name: 'Australian' },
      'en-CA': { flag: '🇨🇦', name: 'Canadian' },
      'en-NZ': { flag: '🇳🇿', name: 'New Zealand' },
      'en-ZA': { flag: '🇿🇦', name: 'South African' },
      'en-IE': { flag: '🇮🇪', name: 'Irish' },
      'en-SG': { flag: '🇸🇬', name: 'Singaporean' },
      'en-PH': { flag: '🇵🇭', name: 'Philippine' },
      'en-NG': { flag: '🇳🇬', name: 'Nigerian' },
      'en-KE': { flag: '🇰🇪', name: 'Kenyan' },
      'en-GH': { flag: '🇬🇭', name: 'Ghanaian' }
    };
    
    const info = accents[selectedAccent] || { flag: '🇺🇸', name: 'US English' };
    if (practiceAccentFlag) {
      const countryCode = selectedAccent.split('-')[1].toLowerCase();
      const img = practiceAccentFlag.querySelector('img');
      if (img) {
        img.src = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/${countryCode}.svg`;
        img.alt = info.name + ' Flag';
      } else {
        practiceAccentFlag.textContent = info.flag;
      }
    }
    if (practiceAccentName) practiceAccentName.textContent = info.name;

    // Highlight the active button in the accent grid
    if (accentGrid) {
      const buttons = accentGrid.querySelectorAll('.accent-btn');
      buttons.forEach(btn => {
        if (btn.getAttribute('data-lang') === selectedAccent) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  function startPracticeSession(passage) {
    activePassage = passage;
    
    // Initialize passage words
    const cleanText = passage.text.trim();
    const rawWords = cleanText.split(/\s+/);
    
    originalWords = rawWords.map((word, index) => {
      // Strip punctuation for matching, keep original word for render
      const normalized = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      return {
        index,
        word,
        normalized,
        status: 'pending',
        spokenText: null
      };
    });
    
    spokenWordsAccumulated = [];
    lastAlignedOriginalIdx = -1;
    lastAlignedSpokenIdx = -1;
    
    // Check speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      isTapToReadActive = true;
      micWarning.style.display = 'flex';
      micWarning.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span><strong>Tap-to-Read Mode Active:</strong> Speech recognition is not supported in this browser. Tap words as you read them, then click finished.</span>
      `;
    } else {
      isTapToReadActive = false;
      micWarning.style.display = 'none';
    }
    
    // Prepare practice UI
    practiceTitle.textContent = passage.title;
    practiceDifficulty.textContent = passage.difficulty;
    practiceDifficulty.className = `difficulty-badge ${passage.difficulty.toLowerCase()}`;
    practiceTime.textContent = '00:00';
    secondsElapsed = 0;
    
    // Setup accent calibration state view
    if (practiceSetupCard) practiceSetupCard.style.display = 'flex';
    if (practiceActiveFooter) practiceActiveFooter.style.display = 'none';
    const layout = document.querySelector('.practice-layout');
    if (layout) layout.classList.add('in-setup-mode');
    updateAccentBadgeUI();

    // Load words in container
    readingTextContainer.innerHTML = '';
    originalWords.forEach((wordObj, i) => {
      const span = document.createElement('span');
      span.className = 'word pending';
      span.textContent = wordObj.word;
      
      // Bind click handler for Tap-to-Read Mode
      span.addEventListener('click', () => {
        if (isTapToReadActive && isRecording) {
          handleWordTap(i);
        }
      });
      
      readingTextContainer.appendChild(span);
    });
    
    // Enable finished button directly for Tap-to-Read, otherwise disabled until start
    btnFinishPractice.disabled = !isTapToReadActive;
    
    showView('practice');
  }

  function toggleRecording() {
    if (isTapToReadActive) {
      toggleTapToReadSession();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }

  function toggleTapToReadSession() {
    if (isRecording) {
      // Pause session
      isRecording = false;
      recordBtn.classList.remove('recording');
      voiceWaveContainer.classList.remove('listening');
      stopTimer();
    } else {
      // Start session
      isRecording = true;
      recordBtn.classList.add('recording');
      voiceWaveContainer.classList.add('listening');
      startTimer();
      btnFinishPractice.disabled = false;
      updateReadingBoardUI();
    }
  }

  function startRecording() {
    if (!recognition) {
      setupSpeechRecognition();
    }
    
    if (!recognition) {
      isTapToReadActive = true;
      toggleTapToReadSession();
      return;
    }
    
    try {
      synth.cancel(); // Stop any pronunciation feedback running
      recognition.start();
    } catch (e) {
      console.error("Recognition start failed:", e);
      isRecording = false;
      stopRecording();
      showSpeechBackendWarning('service-not-allowed');
    }
  }

  function stopRecording() {
    isRecording = false;
    clearTimeout(speechTimeout);
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Recognition stop failed:", e);
      }
    }
    stopTimer();
    btnFinishPractice.disabled = false;
  }

  // Warning for missing speech backend (common in Opera GX, Brave, Vivaldi)
  function showSpeechBackendWarning(errorType = '') {
    micWarning.style.display = 'flex';
    
    let errorDetail = "Your browser isn't returning voice recognition results.";
    if (errorType === 'network') {
      errorDetail = "Speech recognition network request failed (unable to connect to Google Speech Servers).";
    } else if (errorType === 'service-not-allowed') {
      errorDetail = "The browser's speech service is unavailable in this browser build.";
    } else if (errorType === 'not-allowed') {
      errorDetail = "Microphone access is blocked or unavailable (note: browsers block microphone on local file:// links, requiring HTTPS or localhost).";
    } else if (errorType === 'audio-capture') {
      errorDetail = "No microphone was found or audio capture failed.";
    }
    
    micWarning.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top: 3px;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div style="display:flex; flex-direction:column; gap:0.4rem; flex:1; text-align: left;">
        <span><strong>Microphone/Speech Engine Issue:</strong> ${errorDetail}</span>
        <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; margin-top: 0.25rem;">
          <button id="btn-activate-tap" class="btn btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.8rem; background:rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: #fff;">Switch to Tap-to-Read Mode</button>
          <span style="font-size:0.8rem; color:var(--text-secondary);">or use Google Chrome/Edge.</span>
        </div>
      </div>
    `;
    
    const btnActivateTap = document.getElementById('btn-activate-tap');
    if (btnActivateTap) {
      btnActivateTap.addEventListener('click', activateTapToReadFromWarning);
    }
  }

  function activateTapToReadFromWarning() {
    isTapToReadActive = true;
    
    // Stop standard recognition
    if (recognition) {
      try {
        isRecording = false; // set false momentarily to prevent auto-restart on end
        recognition.stop();
      } catch(e){}
    }
    
    // Resume simulated recording / practice mode
    isRecording = true;
    recordBtn.classList.add('recording');
    voiceWaveContainer.classList.add('listening');
    
    // Re-start timer
    startTimer();
    
    micWarning.style.display = 'flex';
    micWarning.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="stroke: var(--color-success)">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span style="color: var(--color-success)"><strong>Tap-to-Read Mode Enabled:</strong> Tap words to mark them read, tap again to cycle status (Correct ➔ Mispronounced ➔ Skipped ➔ Pending). Click the checkmark when done.</span>
    `;
    
    btnFinishPractice.disabled = false;
    updateReadingBoardUI();
  }

  // Cycling tap logic for Tap-to-Read Mode
  function handleWordTap(idx) {
    const wordObj = originalWords[idx];
    
    if (wordObj.status === 'pending') {
      // Mark it correct
      wordObj.status = 'correct';
      
      // Mark any previous pending words as skipped! (Handles skips automatically)
      for (let o = lastAlignedOriginalIdx + 1; o < idx; o++) {
        if (originalWords[o].status === 'pending') {
          originalWords[o].status = 'skipped';
        }
      }
      
      lastAlignedOriginalIdx = idx;
    } else if (wordObj.status === 'correct') {
      // Cycle to mispronounced
      wordObj.status = 'mispronounced';
      wordObj.spokenText = '(attempted)';
    } else if (wordObj.status === 'mispronounced') {
      // Cycle to skipped
      wordObj.status = 'skipped';
      wordObj.spokenText = null;
    } else if (wordObj.status === 'skipped') {
      // Cycle back to pending
      wordObj.status = 'pending';
      
      // Adjust last aligned pointer if we unset the current peak word
      if (lastAlignedOriginalIdx === idx) {
        let newLastIdx = -1;
        for (let o = idx - 1; o >= 0; o--) {
          if (originalWords[o].status !== 'pending') {
            newLastIdx = o;
            break;
          }
        }
        lastAlignedOriginalIdx = newLastIdx;
      }
    }
    
    updateReadingBoardUI();
  }

  // ==========================================
  // TIMER FUNCTIONS
  // ==========================================
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
      const secs = (secondsElapsed % 60).toString().padStart(2, '0');
      practiceTime.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ==========================================
  // REPORT GENERATION & RENDERING
  // ==========================================
  function finishPracticeAndShowReport() {
    // 1. Only run DP alignment if we used speech recognition
    if (!isTapToReadActive) {
      alignFinalNeedlemanWunsch();
    }
    
    // 2. Calculate statistics
    const totalWords = originalWords.length;
    const correctWords = originalWords.filter(w => w.status === 'correct').length;
    const mispronouncedWords = originalWords.filter(w => w.status === 'mispronounced').length;
    const skippedWords = originalWords.filter(w => w.status === 'skipped').length;
    
    // Accuracy
    const accuracy = Math.round((correctWords / totalWords) * 100);
    
    // WPM: words correctly spoken divided by time in minutes
    const timeInMinutes = Math.max(secondsElapsed, 1) / 60;
    const wpm = Math.round(correctWords / timeInMinutes);
    
    const timeStr = formatTime(secondsElapsed);
    
    // 3. Save report to history
    const sessionReport = {
      id: Date.now().toString(),
      passageId: activePassage.id,
      passageTitle: activePassage.title,
      passageDifficulty: activePassage.difficulty,
      accuracy: accuracy,
      wpm: wpm,
      timeElapsed: secondsElapsed,
      timeStr: timeStr,
      errorsCount: mispronouncedWords,
      skippedCount: skippedWords,
      wordsData: JSON.parse(JSON.stringify(originalWords)), // Deep copy of aligned words
      timestamp: new Date().toISOString()
    };
    
    readingHistory.push(sessionReport);
    
    if (isFirebaseActive && currentUser) {
      localStorage.setItem(`lumina_history_${currentUser.uid}`, JSON.stringify(readingHistory));
      if (db) {
        db.collection('users').doc(currentUser.uid).collection('history').doc(sessionReport.id).set(sessionReport)
          .catch(e => console.error("Failed to save session to cloud database:", e));
      }
    } else {
      localStorage.setItem('lumina_reading_history', JSON.stringify(readingHistory));
    }
    
    loadDashboardHistory(); // Refresh dashboard list
    
    // 4. Render Report
    renderReport(sessionReport);
  }

  function renderReport(report) {
    reportTitle.textContent = report.passageTitle;
    
    // Update stats cards
    accuracyText.textContent = `${report.accuracy}%`;
    wpmText.textContent = report.wpm;
    totalTimeText.textContent = report.timeStr;
    errorsCountText.textContent = report.errorsCount;
    skippedCountText.textContent = report.skippedCount;
    
    // Animate radial progress circle
    // Circumference is 439.8
    const offset = 439.8 - (439.8 * report.accuracy) / 100;
    radialProgress.style.strokeDashoffset = offset;
    
    // Load words in evaluation panel
    analysisWordsContainer.innerHTML = '';
    report.wordsData.forEach((wordObj, idx) => {
      const span = document.createElement('span');
      span.className = `analysis-word ${wordObj.status}`;
      span.textContent = wordObj.word;
      
      // Bind click handler for detailed pronunciation helper
      span.addEventListener('click', () => {
        selectWordForExplanation(wordObj, true);
      });
      
      analysisWordsContainer.appendChild(span);
    });
    
    // Reset explanation card
    explanationCard.classList.remove('active');
    
    // Auto-select the first mistake if any exists (no autoplay)
    const firstMistake = report.wordsData.find(w => w.status === 'mispronounced' || w.status === 'skipped');
    if (firstMistake) {
      selectWordForExplanation(firstMistake, false);
    }
    
    showView('report');
  }

  function showSavedReport(report) {
    activePassage = READING_PASSAGES.find(p => p.id === report.passageId) || {
      id: report.passageId,
      title: report.passageTitle,
      difficulty: report.passageDifficulty,
      text: report.wordsData.map(w => w.word).join(' ')
    };
    secondsElapsed = report.timeElapsed;
    renderReport(report);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  }

  // ==========================================
  // WORD DICTIONARY & PRONUNCIATION EXPLANATION
  // ==========================================
  async function selectWordForExplanation(wordObj, autoPlaySpeech = false) {
    // Show panel
    explanationCard.classList.add('active');
    
    explainWord.textContent = wordObj.word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
    explainPhonetic.textContent = 'Loading phonetics...';
    dictPartOfSpeech.textContent = '';
    dictDefinition.textContent = 'Fetching definitions...';
    
    // Handle error tags
    errorTypeTag.className = 'error-type-tag';
    if (wordObj.status === 'correct') {
      errorTypeTag.textContent = 'Read Correctly';
      errorTypeTag.classList.add('correct');
    } else if (wordObj.status === 'mispronounced') {
      errorTypeTag.textContent = 'Mispronounced';
      errorTypeTag.classList.add('mispronounced');
    } else {
      errorTypeTag.textContent = 'Skipped';
      errorTypeTag.classList.add('skipped');
    }
    
    // Handle Expected vs Spoken comparison
    if (wordObj.status === 'mispronounced' && wordObj.spokenText) {
      expectedText.textContent = wordObj.word;
      spokenTextVal.textContent = wordObj.spokenText;
      spokenTextWrapper.style.display = 'flex';
    } else {
      spokenTextWrapper.style.display = 'none';
    }
    
    // Initialize practice block for this word
    setupSingleWordPractice(wordObj.normalized);
    
    // Fetch Dictionary data
    const cleanWord = wordObj.normalized;
    const data = await fetchWordDetails(cleanWord);
    
    if (data) {
      explainPhonetic.textContent = data.phonetic || '';
      if (data.definition) {
        dictPartOfSpeech.textContent = data.partOfSpeech || '';
        dictDefinition.textContent = data.definition;
      } else {
        dictDefinition.textContent = 'No definition found for this word.';
      }
    } else {
      // Fallback
      explainPhonetic.textContent = '';
      dictDefinition.textContent = 'Dictionary details unavailable (offline fallback active). Use the speaker button to hear correct pronunciation.';
    }
    
    // Autoplay pronunciation audio if requested
    if (autoPlaySpeech) {
      speakWord(cleanWord);
    }
  }

  async function fetchWordDetails(word) {
    if (dictionaryCache[word]) {
      return dictionaryCache[word];
    }
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) throw new Error('Word not found');
      
      const data = await response.json();
      const entry = data[0];
      
      let phonetic = entry.phonetic || '';
      if (!phonetic && entry.phonetics && entry.phonetics.length > 0) {
        // Find first entry with text phonetic
        const validPhonetic = entry.phonetics.find(p => p.text);
        if (validPhonetic) phonetic = validPhonetic.text;
      }
      
      let definition = '';
      let partOfSpeech = '';
      if (entry.meanings && entry.meanings.length > 0) {
        const meaning = entry.meanings[0];
        partOfSpeech = meaning.partOfSpeech;
        if (meaning.definitions && meaning.definitions.length > 0) {
          definition = meaning.definitions[0].definition;
        }
      }
      
      const result = { phonetic, partOfSpeech, definition };
      dictionaryCache[word] = result;
      return result;
      
    } catch (e) {
      console.warn(`Failed to fetch dictionary data for word: "${word}"`, e);
      return null;
    }
  }

  // Audio Pronunciation via SpeechSynthesis
  function speakWord(word) {
    if (!synth) return;
    
    synth.cancel(); // Stop current speech
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.82; // Speak slightly slower for educational clarity
    utterance.pitch = 1.0;
    
    // Find a voice matching selectedAccent dialect
    const voices = synth.getVoices();
    let matchedVoice = voices.find(v => v.lang.toLowerCase() === selectedAccent.toLowerCase());
    
    // If Pakistani English en-PK is chosen, try Indian en-IN as closest regional voice
    if (!matchedVoice && selectedAccent === 'en-PK') {
      matchedVoice = voices.find(v => v.lang.toLowerCase() === 'en-in');
    }
    
    // Fallback: standard Google English voice or any English voice
    if (!matchedVoice) {
      matchedVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en-'));
    }
    
    if (matchedVoice) utterance.voice = matchedVoice;
    
    synth.speak(utterance);
  }

  // ==========================================
  // SINGLE WORD PRACTICE CHAMBER
  // ==========================================
  function setupSingleWordPractice(word) {
    wordPracticeTarget = word;
    practiceWordText.textContent = word;
    practiceFeedbackText.textContent = 'Click the mic to read this word.';
    practiceFeedbackText.className = 'practice-feedback-text';
    practiceWordMicBtn.classList.remove('active');
    
    // Tear down any running practice recognition
    if (wordPracticeRecognition) {
      try { wordPracticeRecognition.abort(); } catch(e){}
      wordPracticeRecognition = null;
    }
  }

  function toggleSingleWordPracticeRecording() {
    if (wordPracticeRecognition) {
      stopSingleWordPractice();
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    wordPracticeRecognition = new SpeechRecognition();
    wordPracticeRecognition.continuous = false;
    wordPracticeRecognition.interimResults = false;
    wordPracticeRecognition.lang = 'en-US';
    
    wordPracticeRecognition.onstart = () => {
      practiceWordMicBtn.classList.add('active');
      practiceFeedbackText.textContent = 'Listening... Speak now.';
      practiceFeedbackText.className = 'practice-feedback-text';
    };
    
    wordPracticeRecognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      const spokenWord = result.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      
      if (spokenWord === wordPracticeTarget) {
        practiceFeedbackText.textContent = `Correct! Perfect pronunciation.`;
        practiceFeedbackText.className = 'practice-feedback-text success';
      } else {
        // Double check phonetic edit distance
        const distance = getEditDistance(wordPracticeTarget, spokenWord);
        if (distance <= 1) {
          practiceFeedbackText.textContent = `Close enough! You said: "${spokenWord}".`;
          practiceFeedbackText.className = 'practice-feedback-text success';
        } else {
          practiceFeedbackText.textContent = `Try again. Detected: "${spokenWord}".`;
          practiceFeedbackText.className = 'practice-feedback-text retry';
        }
      }
    };
    
    wordPracticeRecognition.onerror = (e) => {
      console.error(e);
      practiceFeedbackText.textContent = 'Error listening. Please try again.';
      practiceFeedbackText.className = 'practice-feedback-text retry';
      stopSingleWordPractice();
    };
    
    wordPracticeRecognition.onend = () => {
      stopSingleWordPractice();
    };
    
    try {
      wordPracticeRecognition.start();
    } catch(e) {
      console.error(e);
    }
  }

  function stopSingleWordPractice() {
    if (wordPracticeRecognition) {
      try { wordPracticeRecognition.stop(); } catch(e){}
      wordPracticeRecognition = null;
    }
    practiceWordMicBtn.classList.remove('active');
  }

  // ==========================================
  // EVENT LISTENERS & MODAL HANDLERS
  // ==========================================
  function setupEventListeners() {
    // Navigation (Desktop & Mobile)
    document.querySelectorAll('.nav-dashboard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboard');
      });
    });
    
    document.querySelectorAll('.nav-library').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboard');
        // Scroll to library section
        const librarySection = document.querySelector('.library-title');
        if (librarySection) {
          librarySection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    document.querySelectorAll('.nav-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (readingHistory.length > 0) {
          showSavedReport(readingHistory[readingHistory.length - 1]);
        }
      });
    });
    
    // Back to library button in Practice room
    backToLibraryBtn.addEventListener('click', () => {
      if (isRecording) stopRecording();
      showView('dashboard');
    });

    // Logo home click handler
    const appLogo = document.getElementById('app-logo');
    if (appLogo) {
      appLogo.addEventListener('click', () => {
        if (isRecording) stopRecording();
        showView('dashboard');
      });
    }
    
    // Custom passage modal controls
    btnCloseModal.addEventListener('click', () => {
      modalCustom.classList.remove('active');
    });
    btnCancelCustom.addEventListener('click', () => {
      modalCustom.classList.remove('active');
    });
    
    // Custom passage form submission
    formCustom.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const title = customTitleInput.value.trim() || 'Custom Reading Passage';
      const text = customTextTextarea.value.trim();
      const difficulty = customDifficultySelect.value;
      
      if (!text) return;
      
      const customPassage = {
        id: `custom-${Date.now()}`,
        title,
        difficulty,
        category: 'Custom',
        description: 'Your custom assigned reading text.',
        text
      };
      
      // Close modal & reset form
      modalCustom.classList.remove('active');
      formCustom.reset();
      
      // Launch practice
      startPracticeSession(customPassage);
    });

    // Accent Selector grid selection click handlers
    if (accentGrid) {
      accentGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.accent-btn');
        if (btn) {
          selectedAccent = btn.getAttribute('data-lang');
          updateAccentBadgeUI();
        }
      });
    }

    // Confirm & Start Reading button click
    if (btnStartReading) {
      btnStartReading.addEventListener('click', () => {
        localStorage.setItem('guru_accent', selectedAccent);
        if (recognition) {
          recognition.lang = selectedAccent;
        }
        
        // Hide calibration panel, show recording controls
        if (practiceSetupCard) practiceSetupCard.style.display = 'none';
        if (practiceActiveFooter) practiceActiveFooter.style.display = 'flex';
        const layout = document.querySelector('.practice-layout');
        if (layout) layout.classList.remove('in-setup-mode');
        
        updateAccentBadgeUI();
      });
    }

    // Header accent badge click handler (re-open setup/calibration)
    if (practiceAccentBtn) {
      practiceAccentBtn.addEventListener('click', () => {
        if (isRecording) {
          stopRecording();
        }
        if (practiceSetupCard) practiceSetupCard.style.display = 'flex';
        if (practiceActiveFooter) practiceActiveFooter.style.display = 'none';
        const layout = document.querySelector('.practice-layout');
        if (layout) layout.classList.add('in-setup-mode');
        updateAccentBadgeUI();
      });
    }
    
    // Recording controls
    recordBtn.addEventListener('click', toggleRecording);
    btnFinishPractice.addEventListener('click', finishPracticeAndShowReport);
    
    // Audio guide in explanation
    audioGuideBtn.addEventListener('click', () => {
      const word = explainWord.textContent;
      if (word) speakWord(word);
    });
    
    // Single word practice microphone button
    practiceWordMicBtn.addEventListener('click', toggleSingleWordPracticeRecording);
    
    // Report actions
    btnRetryReading.addEventListener('click', () => {
      if (activePassage) startPracticeSession(activePassage);
    });
    
    btnNewReading.addEventListener('click', () => {
      showView('dashboard');
    });
    
    // Global speech voice precache (Chrome voice load delay fix)
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {
        // Pre-fetch voices into browser cache
        synth.getVoices();
      };
    }

    // ==========================================
    // USER AUTHENTICATION EVENT LISTENERS
    // ==========================================
    // Toggle dropdown profile menu card
    if (btnProfileToggle) {
      btnProfileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfileMenu.classList.toggle('active');
      });
    }

    // Close dropdown menu when clicking anywhere else
    document.addEventListener('click', () => {
      if (userProfileMenu && userProfileMenu.classList.contains('active')) {
        userProfileMenu.classList.remove('active');
      }
    });

    // Open Auth Modal
    if (btnAuthTrigger) {
      btnAuthTrigger.addEventListener('click', () => {
        if (modalAuth) {
          clearAuthError();
          // Reset forms to default (show sign in, hide sign up)
          formSignIn.style.display = 'block';
          formSignUp.style.display = 'none';
          document.getElementById('auth-modal-title').textContent = 'Sign In to Reading Guru';
          modalAuth.classList.add('active');
        }
      });
    }

    // Close Auth Modal
    if (btnCloseAuthModal) {
      btnCloseAuthModal.addEventListener('click', () => {
        if (modalAuth) modalAuth.classList.remove('active');
      });
    }

    // Toggle between Sign In and Sign Up forms
    if (linkShowSignup) {
      linkShowSignup.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthError();
        formSignIn.style.display = 'none';
        formSignUp.style.display = 'block';
        document.getElementById('auth-modal-title').textContent = 'Create Reading Guru Account';
      });
    }

    if (linkShowSignin) {
      linkShowSignin.addEventListener('click', (e) => {
        e.preventDefault();
        clearAuthError();
        formSignIn.style.display = 'block';
        formSignUp.style.display = 'none';
        document.getElementById('auth-modal-title').textContent = 'Sign In to Reading Guru';
      });
    }

    // Handle Sign In submission
    if (formSignIn) {
      formSignIn.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAuthError();
        
        const email = signinEmail.value.trim();
        const password = signinPassword.value;
        
        if (!isFirebaseActive || !auth) {
          showAuthError("Firebase is not initialized. Please configure credentials in app.js.");
          return;
        }
        
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            modalAuth.classList.remove('active');
            formSignIn.reset();
          })
          .catch((error) => {
            console.error(error);
            showAuthError(error.message || "Failed to sign in. Check email and password.");
          });
      });
    }

    // Handle Sign Up submission
    if (formSignUp) {
      formSignUp.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAuthError();
        
        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        
        if (!isFirebaseActive || !auth) {
          showAuthError("Firebase is not initialized. Please configure credentials in app.js.");
          return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            return user.updateProfile({ displayName: name });
          })
          .then(() => {
            modalAuth.classList.remove('active');
            formSignUp.reset();
          })
          .catch((error) => {
            console.error(error);
            showAuthError(error.message || "Failed to create account.");
          });
      });
    }

    // Handle Google Sign In click
    if (btnGoogleAuth) {
      btnGoogleAuth.addEventListener('click', () => {
        if (!isFirebaseActive || !auth) {
          showAuthError("Firebase is not initialized. Please configure credentials in app.js.");
          return;
        }
        clearAuthError();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then(() => {
            if (modalAuth) modalAuth.classList.remove('active');
          })
          .catch((error) => {
            console.error(error);
            showAuthError(error.message || "Google Sign-In failed.");
          });
      });
    }

    // Handle Sign Out click
    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        if (isFirebaseActive && auth) {
          auth.signOut()
            .then(() => {
              if (userProfileMenu) userProfileMenu.classList.remove('active');
            })
            .catch((error) => console.error("Sign out error:", error));
        }
      });
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    // Check saved preference
    const savedTheme = localStorage.getItem('lumina_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      document.body.classList.remove('light-theme');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
    
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme');
      if (isLight) {
        localStorage.setItem('lumina_theme', 'light');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        localStorage.setItem('lumina_theme', 'dark');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    });
  }

  // Run the initializer
  init();
});
