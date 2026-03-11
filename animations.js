/**
 * Digital Lock-In Girlfriend - Animations Module
 * Character animation utilities and state management
 */

const CharacterAnimations = {
    // State definitions
    states: {
        idle: 'state-idle',
        watching: 'state-watching',
        worried: 'state-worried',
        angry: 'state-angry',
        happy: 'state-happy'
    },
    
    // Current state
    currentState: 'idle',
    
    // Get character element
    getCharacter() {
        return document.getElementById('girlfriend');
    },
    
    // Set character state
    setState(stateName) {
        const character = this.getCharacter();
        if (!character) return;
        
        // Remove all state classes
        Object.values(this.states).forEach(state => {
            character.classList.remove(state);
        });
        
        // Add new state
        if (this.states[stateName]) {
            character.classList.add(this.states[stateName]);
            this.currentState = stateName;
        }
        
        // Update mood status
        this.updateMoodStatus(stateName);
    },
    
    // Update mood status in UI
    updateMoodStatus(state) {
        const moodStatus = document.getElementById('moodStatus');
        if (!moodStatus) return;
        
        const moods = {
            idle: 'Idle 💕',
            watching: 'Watching you 👀',
            worried: 'Something wrong? 😟',
            angry: 'HEY! 😠',
            happy: 'Good job! ✨'
        };
        
        moodStatus.textContent = moods[state] || moods.idle;
    },
    
    // Show speech bubble with message
    showSpeech(message, duration = 3000) {
        const bubble = document.getElementById('speechBubble');
        const text = document.getElementById('speechText');
        
        if (!bubble || !text) return;
        
        text.textContent = message;
        bubble.classList.add('visible');
        
        // Auto hide after duration
        setTimeout(() => {
            bubble.classList.remove('visible');
        }, duration);
    },
    
    // Hide speech bubble
    hideSpeech() {
        const bubble = document.getElementById('speechBubble');
        if (bubble) {
            bubble.classList.remove('visible');
        }
    },
    
    // Trigger screen shake
    shakeScreen() {
        const container = document.querySelector('.app-container');
        if (!container) return;
        
        container.classList.add('shake');
        
        setTimeout(() => {
            container.classList.remove('shake');
        }, 500);
    },
    
    // Scolding messages pool
    scoldMessages: [
        "Hey! Get back to work!",
        "Stop scrolling! Study time!",
        "Are you serious right now?!",
        "Hey!! Focus!!",
        "NOT THE PHONE!!",
        "Study!! Now!!",
        "Are you looking at memes?!!",
        "STOP!! WORK!!",
        "I'm watching you!!",
        "Focus dammit!!"
    ],
    
    // Get random scold message
    getRandomScoldMessage() {
        return this.scoldMessages[Math.floor(Math.random() * this.scoldMessages.length)];
    },
    
    // Worried messages
    worryMessages: [
        "Are you okay?",
        "You look tired...",
        "Take a break?",
        "Everything alright?"
    ],
    
    // Get random worry message
    getRandomWorryMessage() {
        return this.worryMessages[Math.floor(Math.random() * this.worryMessages.length)];
    }
};

// Timer animation utilities
const TimerAnimations = {
    // Update timer display
    updateTimer(seconds, maxSeconds) {
        const timerValue = document.getElementById('timerValue');
        const timerProgress = document.getElementById('timerProgress');
        const timerHint = document.getElementById('timerHint');
        
        if (timerValue) {
            timerValue.textContent = seconds;
        }
        
        if (timerProgress) {
            // Calculate stroke dash offset (283 is circumference of circle with r=45)
            const circumference = 283;
            const progress = seconds / maxSeconds;
            const offset = circumference - (progress * circumference);
            timerProgress.style.strokeDashoffset = offset;
            
            // Update color based on progress
            timerProgress.classList.remove('warning', 'danger');
            if (progress >= 0.8) {
                timerProgress.classList.add('danger');
            } else if (progress >= 0.5) {
                timerProgress.classList.add('warning');
            }
        }
        
        if (timerHint) {
            timerHint.classList.remove('warning', 'danger');
            if (seconds >= 8) {
                timerHint.classList.add('danger');
                timerHint.textContent = "Okay that's enough!!";
            } else if (seconds >= 5) {
                timerHint.classList.add('warning');
                timerHint.textContent = "You've been looking a while...";
            } else if (seconds >= 3) {
                timerHint.textContent = "What are you looking at?";
            } else {
                timerHint.textContent = "Keep looking at me~";
            }
        }
    },
    
    // Reset timer display
    resetTimer() {
        this.updateTimer(0, 10);
    }
};

// Export for use in main script
window.CharacterAnimations = CharacterAnimations;
window.TimerAnimations = TimerAnimations;
