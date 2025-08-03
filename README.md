# PhysioRoyale - Gamified Physical Therapy

Transform physical therapy from an isolating and monotonous chore into an engaging, motivating, and clinically effective digital experience.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application screens
│   ├── WelcomePage.tsx
│   ├── CameraSetupPage.tsx
│   ├── ExerciseSelectionPage.tsx
│   ├── InstructionsPage.tsx
│   ├── GameplayPage.tsx
│   ├── ResultsPage.tsx
│   └── GardenPage.tsx
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── poseUtils.ts    # Pose estimation helpers
│   └── storage.ts      # localStorage management
├── types/              # TypeScript type definitions
├── data/               # Exercise templates and static data
└── assets/             # Images, videos, etc.
```

## 🎯 Hackathon Objectives

### Core Features (Must Have)
- [x] Welcome page and navigation flow
- [x] Camera integration with MediaPipe Pose
- [x] Real-time pose estimation and overlay
- [x] Shoulder abduction exercise with template matching
- [x] Tree garden leaderboard

### User Flow
1. **Welcome** → Click "Start Your Journey"
2. **Camera Setup** → Enable camera permissions
3. **Exercise Selection** → Choose shoulder abduction
4. **Instructions** → Learn how to perform exercise
5. **Gameplay** → AI-guided exercise with real-time feedback
6. **Results** → View score, accuracy, XP gained
7. **Garden** → See progress visualization

## 🔧 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **AI/Pose**: MediaPipe Pose (JavaScript)
- **Graphics**: HTML5 Canvas
- **State**: React Hooks + localStorage
- **Deployment**: Vercel

## 👥 Team Development

### Parallel Work Streams

1. **MediaPipe Integration** (`src/hooks/`, `src/utils/poseUtils.ts`)
   - Camera access and pose estimation
   - Real-time landmark tracking
   - Pose overlay rendering

2. **Game Logic** (`src/pages/GameplayPage.tsx`, `src/utils/`)
   - Exercise template matching
   - Scoring algorithm
   - Sky Painter canvas game

3. **UI/UX Polish** (`src/components/`, `src/pages/`)
   - Component styling improvements
   - Animations and transitions
   - Mobile responsiveness

4. **Data & Progress** (`src/utils/storage.ts`, `src/data/`)
   - Exercise template creation
   - Progress persistence
   - Level calculation logic

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```
