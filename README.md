# TriCoach - Sprint Triathlon Training App 🏊‍♂️🚴🏃

A personalized training web app for your **April 11, 2026 Sprint Triathlon**. Built with recovery-first training principles, designed specifically for athletes coming back from injury (Lisfranc recovery).

![TriCoach Dashboard](https://via.placeholder.com/1200x600/0a0a0f/00d4ff?text=TriCoach+Dashboard)

## Features

### 🎯 Personalized Training Plan
- **10-week progressive plan** tailored for sprint triathlon
- **3 phases**: Rebuild & Protect → Build & Sharpen → Peak & Taper
- Detailed workouts with exercises, sets, reps, and intensity levels
- **Injury-aware programming** (limited running, foot-safe exercises)

### 📊 Whoop Integration
- Sync recovery, strain, and sleep data
- **Automatic workout recalibration** based on recovery score
- Visual recovery tracking with 7-day trends
- Training recommendations based on HRV and recovery

### 📅 Calendar Sync
- Google Calendar integration
- Automatic workout scheduling
- Color-coded by workout type
- Smart reminders before each session

### 🔔 Notifications
- Push notifications for workout reminders
- Recovery alerts when scores are low
- Weekly training summaries

### 💪 Complete Lifting Program
- **Upper body** (2x/week): Bench, Pull-ups, OHP, Rows + accessories
- **Lower body** (1-2x/week): Trap bar deadlifts, Split squats, Hip thrusts
- Foot-safe exercises to protect Lisfranc recovery
- RPE-based intensity guidelines

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/triathlon.git
cd triathlon

# Install dependencies
npm install

# Set up the database
npx prisma db push

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (optional - for Calendar sync)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Whoop OAuth (optional - for Whoop sync)
WHOOP_CLIENT_ID="your-whoop-client-id"
WHOOP_CLIENT_SECRET="your-whoop-client-secret"

# Push Notifications (optional)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

## Training Plan Overview

### Weekly Structure
| Day | Workouts |
|-----|----------|
| Monday | Upper Body Lift + Swim |
| Tuesday | Bike + Short Run |
| Wednesday | Lower Body Lift |
| Thursday | Swim + Brick Workout |
| Friday | Mobility/Recovery (Optional Light Lift) |
| Saturday | Long Bike |
| Sunday | REST |

### Phase Breakdown

#### Phase 1: Rebuild & Protect (Weeks 1-3)
- Build aerobic base safely
- Test foot tolerance
- Establish strength foundation
- Max run volume: 45 min/week

#### Phase 2: Build & Sharpen (Weeks 4-7)
- Race-specific endurance
- Increase intensity
- Perfect transitions
- Max run volume: 60 min/week

#### Phase 3: Peak & Taper (Weeks 8-10)
- Reduce volume by 30-40%
- Maintain intensity
- Race day preparation
- Lifting drops to 2x/week

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom dark theme
- **Animation**: Framer Motion
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Notifications**: Web Push API

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── workouts/      # Workout CRUD
│   │   ├── whoop/         # Whoop integration
│   │   ├── calendar/      # Calendar sync
│   │   ├── notifications/ # Push notifications
│   │   └── recalibrate/   # Recovery-based adjustments
│   ├── schedule/          # Weekly schedule view
│   ├── workouts/          # Workout library
│   ├── whoop/             # Whoop dashboard
│   ├── settings/          # User settings
│   └── profile/           # User profile
├── components/            # React components
│   ├── RecoveryRing.tsx   # Circular recovery indicator
│   ├── WorkoutCard.tsx    # Workout display card
│   ├── WeeklyCalendar.tsx # Week overview
│   └── ...
└── lib/                   # Utilities and data
    ├── training-plan.ts   # Complete training program
    ├── whoop.ts           # Whoop API integration
    ├── calendar.ts        # Google Calendar API
    └── prisma.ts          # Database client
```

## Race Day Goals

- 🏊 **Swim 750m** - Confident, efficient strokes
- 🚴 **Bike 12.4 miles** - Strong and steady
- 🏃 **Run 5K** - Finish strong, protect the foot
- 🏆 **Cross the finish line** - Complete your first triathlon!

## Recovery-Based Training

The app automatically adjusts workouts based on your Whoop recovery score:

| Recovery | Adjustment |
|----------|------------|
| 🟢 67-100% | Train as planned |
| 🟡 34-66% | Reduce intensity/volume 15-20% |
| 🔴 0-33% | Rest day or light mobility only |

## Contributing

This is a personal training app, but feel free to fork and customize for your own training!

## License

MIT

---

**Good luck with your triathlon! You've got this! 🏊‍♂️🚴🏃💪**
