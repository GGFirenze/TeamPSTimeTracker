# PS Time Tracker

A time-tracking web app for Amplitude Professional Services. Track time against billable and non-billable projects with precise timer controls and session notes.

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

- **Timer controls**: Start, Pause, Resume, Stop per project
- **Billable vs Non-Billable**: Projects organized by category with visual indicators
- **Session notes**: Capture notes when stopping a timer (great for biweekly reports)
- **Daily summary**: See total billable and non-billable hours at a glance
- **Time log**: Full history of today's entries with durations and notes
- **Persistent**: Timer state and entries survive page refresh (LocalStorage)
- **Tab title**: Shows running timer in the browser tab

## Tech Stack

- React 18 + TypeScript + Vite
- LocalStorage for persistence
- No external UI libraries — custom CSS
