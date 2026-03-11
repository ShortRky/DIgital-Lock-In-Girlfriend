/**
 * Digital Lock-In Girlfriend - Main Application Logic
 */

(function() {
    'use strict';
    
    // ========================================
    // Configuration
    // ========================================
    const CONFIG = {
        SCOLD_THRESHOLD: 10,       // Seconds before scolding
        SCOLD_COOLDOWN: 15,        // Seconds between scolds
        DETECTION_INTERVAL: 500,   // ms between face detection checks
        FACE_DETECTION_FREQUENCY: 2 // Times per second
    };
    
    // ========================================
    // State
    // ========================================
    const AppState = {
        isRunning: false,
        isProcessing: false,
        sessionActive: false,
        secondsLooking: 0,
        lastFaceDetected: false,
        canScold: true,
        streak: 0,
        videoStream: null,
        detectionInterval: null,
        timerInterval: null,
        faceDetectionLoaded: false
    };
    
    // ========================================
    // DOM Elements
    // ========================================
    const Elements = {
        startBtn: document.getElementById('startBtn'),
        stopBtn: document.getElementById('stopBtn'),
        video: document.getElementById('videoElement'),
        cameraPreview: document.getElementById('cameraPreview'),
        cameraStatus: document.getElementById('cameraStatus'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        errorModal: document.getElementById('errorModal'),
        errorMessage: document.getElementById('errorMessage'),
        retryBtn: document.getElementById('retryBtn'),
        moodStatus: document.getElementById('moodStatus'),
        streakCount: document.getElementById('streakCount'),
        timerContainer: document.getElementById('timerContainer')
    };
    
    // ========================================
    // Initialization
    // ========================================
    async function init() {
        // Setup event listeners
        setupEventListeners();
        
        // Load face detection models
        await loadFaceDetection();
        
        // Hide loading overlay
        if (Elements.loadingOverlay) {
            Elements.loadingOverlay.classList.add('hidden');
        }
        
        // Register service worker for PWA
        registerServiceWorker();
        
        console.log('Digital Lock-In Girlfriend initialized!');
    }
    
    // ========================================
    // Event Listeners
    // ========================================
    function setupEventListeners() {
        // Start button
        if (Elements.startBtn) {
            Elements.startBtn.addEventListener('click', startSession);
        }
        
        // Stop button
        if (Elements.stopBtn) {
            Elements.stopBtn.addEventListener('click', stopSession);
        }
        
        // Retry button
        if (Elements.retryBtn) {
            Elements.retryBtn.addEventListener('click', closeErrorModal);
        }
        
        // Page visibility API - pause when tab hidden
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // ========================================
    // Face Detection Setup
    // ========================================
    async function loadFaceDetection() {
        try {
            // Check if face-api is loaded
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded');
            }
            
            // Load TinyFaceDetector model (smallest and fastest)
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
            
            AppState.faceDetectionLoaded = true;
            console.log('Face detection models loaded!');
            
        } catch (error) {
            console.error('Failed to load face detection:', error);
            showError('Failed to load face detection. Please refresh and try again.');
        }
    }
    
    // ========================================
    // Camera Functions
    // ========================================
    async function startCamera() {
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });
            
            // Store stream reference
            AppState.videoStream = stream;
            
            // Set video source
            Elements.video.srcObject = stream;
            
            // Show camera preview
            Elements.cameraPreview.classList.add('visible');
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                Elements.video.onloadedmetadata = resolve;
            });
            
            return true;
            
        } catch (error) {
            console.error('Camera error:', error);
            
            if (error.name === 'NotAllowedError') {
                showError('Camera permission denied. Please allow camera access to use this app.');
            } else if (error.name === 'NotFoundError') {
                showError('No camera found. Please connect a webcam.');
            } else {
                showError('Could not access camera: ' + error.message);
            }
            
            return false;
        }
    }
    
    function stopCamera() {
        // Stop all tracks in the stream
        if (AppState.videoStream) {
            AppState.videoStream.getTracks().forEach(track => {
                track.stop();
            });
            AppState.videoStream = null;
        }
        
        // Clear video source
        if (Elements.video) {
            Elements.video.srcObject = null;
        }
        
        // Hide camera preview
        if (Elements.cameraPreview) {
            Elements.cameraPreview.classList.remove('visible');
        }
    }
    
    // ========================================
    // Face Detection
    // ========================================
    async function detectFace() {
        if (!AppState.sessionActive || !AppState.faceDetectionLoaded) return;
        
        try {
            // Detect faces using TinyFaceDetector
            const detections = await faceapi.detectAllFaces(
                Elements.video,
                new faceapi.TinyFaceDetectorOptions()
            );
            
            const faceDetected = detections.length > 0;
            
            // Handle face detection state change
            handleFaceDetection(faceDetected);
            
        } catch (error) {
            console.error('Face detection error:', error);
        }
    }
    
    function handleFaceDetection(faceDetected) {
        // State changed
        if (faceDetected !== AppState.lastFaceDetected) {
            AppState.lastFaceDetected = faceDetected;
            
            if (faceDetected) {
                // Face appeared - start watching
                CharacterAnimations.setState('watching');
            } else {
                // Face disappeared - go back to idle
                resetTimer();
                CharacterAnimations.setState('idle');
            }
        }
        
        // Update camera status indicator
        updateCameraStatus(faceDetected);
    }
    
    function updateCameraStatus(detected) {
        const statusDot = Elements.cameraStatus?.querySelector('.status-dot');
        const statusText = Elements.cameraStatus?.querySelector('.status-text');
        
        if (statusDot) {
            statusDot.style.background = detected ? '#4ecca3' : '#ffc107';
        }
        
        if (statusText) {
            statusText.textContent = detected ? 'Watching' : 'Searching...';
        }
    }
    
    // ========================================
    // Timer Logic
    // ========================================
    function startTimer() {
        // Reset timer state
        AppState.secondsLooking = 0;
        AppState.canScold = true;
        
        // Update UI
        TimerAnimations.resetTimer();
        
        // Start detection loop
        AppState.detectionInterval = setInterval(detectFace, CONFIG.DETECTION_INTERVAL);
        
        // Start timer display update
        AppState.timerInterval = setInterval(() => {
            if (AppState.lastFaceDetected && AppState.sessionActive) {
                incrementTimer();
            }
        }, 1000);
    }
    
    function incrementTimer() {
        AppState.secondsLooking++;
        
        // Update timer display
        TimerAnimations.updateTimer(AppState.secondsLooking, CONFIG.SCOLD_THRESHOLD);
        
        // Check for scold threshold
        if (AppState.secondsLooking >= CONFIG.SCOLD_THRESHOLD && AppState.canScold) {
            triggerScold();
        }
    }
    
    function resetTimer() {
        AppState.secondsLooking = 0;
        TimerAnimations.resetTimer();
    }
    
    function stopTimer() {
        // Clear intervals
        if (AppState.detectionInterval) {
            clearInterval(AppState.detectionInterval);
            AppState.detectionInterval = null;
        }
        
        if (AppState.timerInterval) {
            clearInterval(AppState.timerInterval);
            AppState.timerInterval = null;
        }
        
        // Reset timer
        resetTimer();
    }
    
    // ========================================
    // Scolding System
    // ========================================
    function triggerScold() {
        // Prevent re-triggering
        AppState.canScold = false;
        
        // Increment streak
        AppState.streak++;
        updateStreak();
        
        // Change character state to angry
        CharacterAnimations.setState('angry');
        
        // Get random scold message
        const message = CharacterAnimations.getRandomScoldMessage();
        
        // Show speech bubble
        CharacterAnimations.showSpeech(message, 4000);
        
        // Screen shake
        CharacterAnimations.shakeScreen();
        
        // Play scolding voice
        speakScold(message);
        
        // Reset timer
        resetTimer();
        
        // After scold, go to worried state briefly, then reset
        setTimeout(() => {
            if (AppState.sessionActive) {
                CharacterAnimations.setState('worried');
                
                setTimeout(() => {
                    if (AppState.sessionActive) {
                        // Check if face is still there
                        if (AppState.lastFaceDetected) {
                            CharacterAnimations.setState('watching');
                        } else {
                            CharacterAnimations.setState('idle');
                        }
                    }
                }, 2000);
            }
        }, 2000);
        
        // Start cooldown
        setTimeout(() => {
            AppState.canScold = true;
        }, CONFIG.SCOLD_COOLDOWN * 1000);
    }
    
    function speakScold(message) {
        // Use Web Speech API for voice
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(message);
            
            // Configure voice
            utterance.rate = 1.2;    // Slightly faster
            utterance.pitch = 0.9;   // Slightly lower
            utterance.volume = 1;
            
            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
                v.name.includes('Female') || 
                v.name.includes('Samantha') ||
                v.name.includes('Karen') ||
                v.name.includes('Microsoft Zira')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            // Speak
            window.speechSynthesis.speak(utterance);
        }
    }
    
    function updateStreak() {
        if (Elements.streakCount) {
            Elements.streakCount.textContent = AppState.streak;
        }
    }
    
    // ========================================
    // Session Management
    // ========================================
    async function startSession() {
        if (AppState.isProcessing || AppState.isRunning) return;
        
        AppState.isProcessing = true;
        
        try {
            // Check if face detection is loaded
            if (!AppState.faceDetectionLoaded) {
                await loadFaceDetection();
            }
            
            // Start camera
            const cameraStarted = await startCamera();
            if (!cameraStarted) {
                AppState.isProcessing = false;
                return;
            }
            
            // Update UI state
            AppState.sessionActive = true;
            AppState.isRunning = true;
            AppState.isProcessing = false;
            
            // Toggle buttons
            Elements.startBtn.classList.add('hidden');
            Elements.stopBtn.classList.remove('hidden');
            
            // Show timer
            Elements.timerContainer.style.display = 'block';
            
            // Set character to watching
            CharacterAnimations.setState('watching');
            
            // Start timer and detection
            startTimer();
            
            console.log('Session started!');
            
        } catch (error) {
            console.error('Failed to start session:', error);
            showError('Failed to start session. Please try again.');
            AppState.isProcessing = false;
        }
    }
    
    function stopSession() {
        // Stop everything
        AppState.sessionActive = false;
        AppState.isRunning = false;
        
        // Stop timer and detection
        stopTimer();
        
        // Stop camera
        stopCamera();
        
        // Reset state
        AppState.lastFaceDetected = false;
        
        // Toggle buttons
        Elements.startBtn.classList.remove('hidden');
        Elements.stopBtn.classList.add('hidden');
        
        // Hide timer
        Elements.timerContainer.style.display = 'none';
        
        // Reset character
        CharacterAnimations.setState('idle');
        CharacterAnimations.hideSpeech();
        
        // Update camera status
        updateCameraStatus(false);
        
        // Stop any speech
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        console.log('Session stopped!');
    }
    
    // ========================================
    // Visibility Handling
    // ========================================
    function handleVisibilityChange() {
        if (document.hidden && AppState.sessionActive) {
            // Pause detection when tab is hidden
            if (AppState.detectionInterval) {
                clearInterval(AppState.detectionInterval);
                AppState.detectionInterval = null;
            }
        } else if (!document.hidden && AppState.sessionActive) {
            // Resume detection when tab is visible
            if (!AppState.detectionInterval) {
                AppState.detectionInterval = setInterval(detectFace, CONFIG.DETECTION_INTERVAL);
            }
        }
    }
    
    // ========================================
    // Error Handling
    // ========================================
    function showError(message) {
        if (Elements.errorMessage) {
            Elements.errorMessage.textContent = message;
        }
        
        if (Elements.errorModal) {
            Elements.errorModal.classList.remove('hidden');
        }
    }
    
    function closeErrorModal() {
        if (Elements.errorModal) {
            Elements.errorModal.classList.add('hidden');
        }
    }
    
    // ========================================
    // Service Worker (PWA)
    // ========================================
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
    
    // ========================================
    // Initialize when DOM is ready
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
