# Exam Paper Generator

This repository contains a simple exam paper generator app with a React frontend and an Express + MongoDB backend.

Project structure
- `Frontend/` — React + Vite frontend
- `Backend/` — Express server, Mongoose models, controllers

Quick start (local)
1. Backend:
   - cd Backend
   - copy `.env.example` to `.env` and set `MONGO_URI`
   - npm install
   - node server.js
2. Frontend:
   - cd Frontend
   - npm install
   - npm run dev

Notes
- Do not commit `.env` or secrets. Use `.env` + `.gitignore`.
