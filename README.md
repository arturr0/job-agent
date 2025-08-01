# Job Application Agent

**Job Application Agent** is a Node.js-powered automation tool designed to simplify and personalize your job search. It connects to the Jooble API to find relevant job listings based on your criteria, analyzes each job description, and uses AI (via Ollama) to customize your CV to match the requirements—without altering your original layout. The tool supports both English and Polish CVs, saves generated versions locally, and exposes a simple API endpoint to trigger the entire process.

## Features
- Job search via Jooble API
- AI-driven CV personalization (Ollama)
- Support for both English and Polish job markets
- Preserves original CV formatting
- Saves generated CVs locally
- `/search` API endpoint
- Console progress tracking and error handling

## Installation
```bash
npm install
cp .env.example .env
# Add your Jooble and Ollama API configuration in the .env file
