# Digital Lock-In Girlfriend - Project Specification

## 1. Project Overview

**Project Name:** Digital Lock-In Girlfriend  
**Type:** Web Application (PWA)  
**Core Functionality:** A "FaceTime-style" video call interface where an animated girlfriend character monitors the user via webcam and scolds them when they spend too long looking at the screen (doom scrolling).  
**Target Users:** Students and productivity-focused individuals who need motivation to stay focused during study sessions.

---

## 2. UI/UX Specification

### Layout Structure

**Main Screen Layout:**
- Full-viewport "video call" container
- Central area: Animated girlfriend character (takes 60% of screen height)
- Bottom area: Status bar showing current mood and timer
- Overlay: Camera preview (small, corner positioned, semi-transparent)
- Control bar: Start/Stop call button at bottom

**Responsive Breakpoints:**
- Mobile: < 768px (character scales to fit, controls at bottom)
- Tablet: 768px - 1024px
- Desktop: > 1024px (comfortable spacing, larger character)

### Visual Design

**Color Palette:**
- Primary Background: `#1a1a2e` (deep navy)
- Secondary Background: `#16213e` (darker navy)
- Accent Pink: `#e94560` (vibrant pink for highlights)
- Accent Cyan: `#0f3460` (calm blue for UI elements)
- Text Primary: `#eaeaea` (soft white)
- Text Secondary: `#a0a0a0` (muted gray)
- Success/Active: `#4ecca3` (mint green)
- Warning: `#ffc107` (amber)

**Typography:**
- Primary Font: 'Nunito', sans-serif (friendly, rounded)
- Heading Size: 2rem (32px)
- Body Size: 1rem (16px)
- Small/Caption: 0.875rem (14px)

**Spacing System:**
- Base unit: 8px
- Padding: 16px (2 units), 24px (3 units), 32px (4 units)
- Margins: 8px, 16px, 24px

**Visual Effects:**
- Soft glow behind character (`box-shadow: 0 0 40px rgba(233, 69, 96, 0.3)`)
- Subtle floating animation on character
- Pulsing indicator when "watching"
- Screen shake effect when scolding

### Components

**1. Girlfriend Character (CSS Animated)**
- Anime-style avatar using pure CSS/SVG
- States:
  - `idle`: Default smiling, blinking occasionally
  - `watching`: Eyes open wider, curious expression
  - `worried`: Eyebrows raised, slight concern
  - `angry/scolding`: Red face, shouting expression
  - `happy`: When session ends or cooldown
- Smooth transitions between states (0.3s ease)

**2. Camera Preview**
- Small box in top-right corner (120x90px)
- Rounded corners (8px)
- Semi-transparent border
- Hidden by default, shows when session active

**3. Timer Display**
- Circular progress indicator
- Shows seconds remaining until scolding
- Color transitions: green → yellow → red as time approaches threshold

**4. Control Buttons**
- Primary CTA: "Start Call" / "End Call"
- Rounded pill shape
- Hover: scale(1.05) + glow
- Active: scale(0.98)

**5. Status Bar**
- Shows current character mood
- Session duration
- "Streak" counter (consecutive focus periods)

---

## 3. Functionality Specification

### Core Features

**F1: Camera Access**
- Request webcam permission on "Start Call"
- Display live preview (hidden/visible toggle)
- Handle permission denied gracefully with error message

**F2: Face Detection**
- Use face-api.js (TinyFaceDetector for performance)
- Detect if user is present in frame
- Detection runs at 2 FPS (every 500ms) to balance performance
- Output: boolean "faceDetected"

**F3: Doom Scroll Timer**
- Start at 0 when session begins
- Increment every second while face is detected
- Reset to 0 when no face detected
- Configurable threshold: 10 seconds (MVP default)
- Visual countdown display

**F4: Scolding Trigger**
- When timer reaches threshold:
  1. Change character to "angry" state
  2. Play scolding audio (Web Speech API: "Hey! Get back to work!")
  3. Apply screen shake effect
  4. Reset timer to 0
  5. Start 15-second cooldown before next scolding allowed

**F5: Session Management**
- Start: Initialize camera, start detection loop
- Stop: Release camera, reset all state
- Pause: Temporarily halt detection (for breaks)

**F6: Offline Support (PWA)**
- Service worker for offline capability
- Cache all assets on first load
- Works without internet after initial visit

### User Interactions & Flows

**Main Flow:**
1. User opens app → sees idle character + "Start Call" button
2. User clicks "Start Call" → permission prompt appears
3. If granted → camera preview appears, character changes to "watching"
4. User looks at screen → timer increments
5. Timer hits 10s → scolding triggers
6. User looks away → timer resets
7. User clicks "End Call" → session ends, stats shown

### Edge Cases

- **Camera denied**: Show friendly message, allow retry
- **No face detected initially**: Character shows "confused" state
- **Multiple faces**: Use largest/closest face
- **Poor lighting**: Show warning if detection fails repeatedly
- **Tab hidden**: Pause detection when tab not visible (Page Visibility API)

---

## 4. Technical Implementation

### Tech Stack
- **Framework**: Vanilla HTML5/CSS3/JavaScript
- **Face Detection**: face-api.js (TensorFlow.js wrapper)
- **Audio**: Web Speech API (free, no assets needed)
- **PWA**: Service Worker + Web App Manifest

### File Structure
```
/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── script.js           # Main application logic
├── animations.js       # Character animation definitions
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── models/             # face-api.js models (loaded from CDN)
└── assets/             # (empty - using CSS/SVG character)
```

### External Dependencies (CDN)
- face-api.js: `https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js`
- Google Fonts (Nunito)

---

## 5. Acceptance Criteria

### Visual Checkpoints
- [ ] Character displays with idle animation on load
- [ ] Character expressions change smoothly between states
- [ ] Camera preview appears when session starts
- [ ] Timer displays and counts up correctly
- [ ] Screen shake effect works during scolding
- [ ] Responsive layout works on mobile and desktop

### Functional Checkpoints
- [ ] Camera permission request works
- [ ] Face detection accurately detects presence
- [ ] Timer increments while face detected
- [ ] Timer resets when face leaves frame
- [ ] Scolding triggers at 10 seconds
- [ ] Cooldown prevents immediate re-trigger
- [ ] Start/Stop controls work correctly
- [ ] App works offline after first load

### Performance
- [ ] Detection runs at acceptable frame rate (not laggy)
- [ ] No memory leaks during extended sessions
- [ ] Smooth animations (60fps)
