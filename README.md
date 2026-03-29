<p align="center">
  <img src="https://img.shields.io/badge/version-3.2.0-d4af37?style=for-the-badge&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-f5820b?style=for-the-badge&logo=firebase&logoColor=white&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white&labelColor=0a0e1a" />
  <img src="https://img.shields.io/badge/Netlify-Deployed-00c7b7?style=for-the-badge&logo=netlify&logoColor=white&labelColor=0a0e1a" />
</p>

<h1 align="center">
  🏟️ TakkArena
</h1>

<p align="center">
  <strong>Gamified donor-collection platform for Takk ehf.</strong><br/>
  <em>Turns daily phone fundraising into a competitive, data-driven experience.</em>
</p>

<p align="center">
  <code>React</code> · <code>TypeScript</code> · <code>Firebase</code> · <code>Tailwind CSS</code> · <code>Recharts</code> · <code>Framer Motion</code> · <code>Gemini AI</code>
</p>

---

## 🎯 What is TakkArena?

TakkArena is an internal gamification tool for **Takk** — Iceland's leading non-profit donor collection company. Agents call donors on behalf of charities (Samhjálp, Stígamót, Þroskahjálp, etc.) and register donations. TakkArena transforms that daily grind into a competitive arena with:

- **Real-time leaderboards** across three teams
- **Boss Battles** — cooperative PvE challenges with tiers and roles
- **Duels & League System** — 1v1 and team competitions
- **Achievement System** — unlockable badges and milestones
- **AI-powered insights** — Gemini analyzes performance and gives strategic advice
- **TV Mode** — large-screen dashboard for the office
- **Manager Dashboard** — team metrics, agent tables, and weekly trends

---

## 🏗️ Architecture

```
takkarena/
├── App.tsx                    # Main app shell, routing, auth
├── firebase.ts                # Firebase config + Microsoft OAuth
├── geminiService.ts           # Gemini AI integration
├── types.ts                   # TypeScript interfaces
│
├── components/
│   ├── Registration.tsx       # Sale & shift registration (core workflow)
│   ├── SaleForm.tsx           # Quick-add donation form
│   ├── ShiftForm.tsx          # Clock in/out + shift tracking
│   ├── DailyStats.tsx         # Personal daily metrics (circular progress)
│   ├── Dashboard.tsx          # Agent main dashboard
│   ├── StatsView.tsx          # Deep analytics & charts
│   ├── ManagerDashboard.tsx   # Team overview (heild, fjöldi, meðal + chart)
│   ├── ManagerCoachingView.tsx # 1-on-1 coaching tools
│   ├── Admin.tsx              # User management, team assignment
│   ├── Login.tsx              # Microsoft SSO + anonymous auth
│   │
│   ├── Competitions/          # 🏟️ The Arena
│   │   ├── CompetitionsPage.tsx
│   │   ├── BossBattleCreator.tsx   # PvE boss fights (custom teams + captain)
│   │   ├── BossBattleLiveView.tsx  # Live battle progress
│   │   ├── DuelArenaView.tsx       # 1v1 challenges
│   │   ├── LeagueSystemView.tsx    # Seasonal league
│   │   ├── TeamsView.tsx           # Team standings
│   │   ├── LeaderboardView.tsx     # Global rankings
│   │   ├── TrophyRoomView.tsx      # Trophy collection
│   │   ├── StoreView.tsx           # Coin shop + battle buffs
│   │   ├── LuckyWheelModal.tsx     # Spin-to-win rewards
│   │   └── ...                     # 15+ more competition components
│   │
│   ├── Store/
│   │   └── BattleBuffsTab.tsx      # Power-ups for boss battles
│   │
│   └── TVMode/                # 📺 Office TV Dashboard
│       ├── TVDashboard.tsx
│       ├── TVLeaderboard.tsx
│       ├── TVBattles.tsx
│       ├── TVStats.tsx
│       └── TVCelebration.tsx
│
├── utils/
│   ├── teams.ts               # Team definitions (Hringurinn, Verið, Götugengið)
│   ├── calculations.ts        # Wage, efficiency, velocity formulas
│   ├── autoPauseScheduler.ts  # Scheduled break reminders per team
│   └── managerAnalytics.ts    # Cross-team analytics engine
│
├── constants/
│   └── bossBattle.ts          # Boss tiers, battle types, roles, target calculations
│
└── netlify/
    └── functions/
        └── mytimeplan-proxy.js  # Serverless proxy for MyTimePlan API
```

---

## 👥 Teams

| Team | Color | Icon | Description |
|------|-------|------|-------------|
| **Hringurinn** | 🔵 Blue | `#3B82F6` | Phone team |
| **Verið** | 🟢 Green | `#10B981` | Phone team |
| **Götugengið** | 🟡 Amber | `#F59E0B` | Street team |

---

## 🎮 Features In-Depth

### 📊 Registration & Stats
The core workflow — agents register donations as they happen. Real-time metrics update:
- **Circular progress ring** toward daily goal
- **Hourly rate** (ISK/klst) with live timer
- **Sale-by-sale feed** with project attribution

### 🏟️ The Arena (Competitions)
TakkArena's signature feature — multiple competition formats:

| Format | Type | Description |
|--------|------|-------------|
| **Boss Battle** | PvE (Co-op) | Team fights a boss with HP bar. Tiers: Bronze → Silver → Gold → Diamond → Legendary |
| **Duel** | PvP (1v1) | Head-to-head sales battles with wagered coins |
| **League** | Seasonal | Monthly league system with promotion/relegation |
| **Team Battle** | PvP (Team) | Team vs team with custom rosters and captains |

**Boss Battle Creator** supports:
- 5 difficulty tiers (locked progression)
- 3 battle types (target amount, sale count, efficiency)
- Pre-built teams OR custom team builder (name your team, pick members, assign captain)
- Role assignment (Tank, DPS, Healer, Support)
- Configurable duration (1h–8h)

### 👔 Manager Dashboard
Clean, focused team overview:
- **3 metric cards** — Heild (total), Fjöldi (count), Meðal (average)
- **Star of the day** — top performer highlight
- **Agent table** — ranked by performance with per-agent metrics
- **7-day bar chart** — weekly team trend
- Scoped to manager's own team

### 📺 TV Mode
Designed for office display screens:
- Auto-rotating views (leaderboard → battles → stats → celebrations)
- Large typography, dark theme, ambient animations
- Real-time updates via Firestore listeners

### 🤖 AI Integration (Gemini)
- **Strategic advice** for managers based on charity performance data
- **Coaching insights** — per-agent improvement suggestions
- **Speech assistant** — voice-powered interaction

### 🏆 Achievements & Rewards
- Unlockable achievement badges
- Coin economy (earn from sales, spend on buffs and store items)
- Personal bests tracking
- Lucky wheel spins

---

## 🔐 Authentication

- **Microsoft SSO** via Firebase Auth (OAuthProvider) — primary for Takk corporate accounts
- **Anonymous auth** — fallback for quick testing
- Role-based access: `agent` | `manager` | `admin`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Styling** | Tailwind CSS + custom `glass` morphism |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Firebase Firestore (real-time) |
| **Auth** | Firebase Auth (Microsoft + Anonymous) |
| **AI** | Google Gemini API |
| **Hosting** | Netlify (auto-deploy from GitHub) |
| **Serverless** | Netlify Functions (MyTimePlan proxy) |

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/arnar111/wagetrack2.git
cd wagetrack2

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

### Environment

Firebase config is in `firebase.ts`. Gemini API key is in `geminiService.ts`.

---

## 📋 User Roles

| Role | Access |
|------|--------|
| **Agent** | Registration, personal stats, competitions, achievements, store |
| **Manager** | Agent access + team dashboard, coaching view, boss battle creation |
| **Admin** | Manager access + user management, project config, team assignment |

---

## 🗺️ Roadmap

- [ ] Push notifications for battle events
- [ ] Seasonal rewards & trophies
- [ ] MyTimePlan deep integration (auto-import shifts)
- [ ] Mobile-optimized PWA
- [ ] Inter-company competitions (Takk vs Takk branches)

---

## 👨‍💻 Development

| Who | Role |
|-----|------|
| **Arnar Kjartansson** | Creator, developer, Takk agent |
| **Guðjón Einar** | Project manager |
| **Blær** 🌀 | AI co-developer |

---

<p align="center">
  <em>Built with ❤️ and competitive spirit at Takk ehf.</em><br/>
  <strong>🏟️ Every call is a battle. Every donation is a victory.</strong>
</p>
