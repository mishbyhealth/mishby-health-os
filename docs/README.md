# GloWell – Developer Guide

Welcome to the GloWell codebase.

## Folder Structure

- `/core` – global configs, context, hooks
- `/features` – all feature modules (auth, planner, tracking, services, etc.)
- `/public` – static assets
- `/docs` – documentation
- `.env` – environment config

## Dev Setup

1. Copy `.env.example` to `.env` and fill your Firebase keys
2. Run `npm install`
3. Start dev server with `npm run dev`

## Build & Deploy

```bash
npm run build
