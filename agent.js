import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cliSpinners from 'cli-spinners';
import readline from 'readline';
import chalk from 'chalk';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Constants
const JOOBLE_API_URL = 'https://pl.jooble.org/api';
const CV_DIR = path.join(__dirname, 'generated_cvs');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(chalk.gray(`[${new Date().toISOString()}] ${req.method} ${req.path}`));
    next();
});

// CV Templates
const polishCV = `ARTUR BEDNARSKI
Junior Web Developer
Email:
Tel.:
________________________________________
O MNIE
Mechatronik zmieniajacy branze na IT. 10-letnie doswiadczenie w samodzielnym programowaniu w JavaScript/HTML/CSS, Python i C++. Trainee Node.js Developer w firmie Innowise. Tutor programowania w Fundacji Aktywizacja. Od roku zajmuje sie automatyzacja procesow technologicznych i biznesowych oraz rozwiazaniami AI/ML. Szukam mozliwosci nauki nowoczesnych praktyk programistycznych pod okiem najlepszych fachowcow.
________________________________________
DOSWIADCZENIE ZAWODOWE
Freelance Fullstack Developer
2024-2025
Zbudowalem system ETL dla zamowien publicznych, ktory zastapil platne API scrapingiem. Automatyczna dokumentacja danych w SQL. Technologie: Node.js (Axios, Puppeteer, Cheerio), SQLite.
Pracuje nad modelem AI do automatycznej detekcji uszkodzen uszczelek hydrauliki silowej. Model wytrenowany lokalnie przy zerowych kosztach infrastruktury. Technologie: ONNX, Pytorch, WebGPU.
Elektromechanika Ogolna Andrzej Bednarski / Mechatronika Artur Bednarski
2001-2024
Mechatronik
Serwis i projekty napedow hydraulicznych i pneumatycznych
________________________________________
EDUKACJA
Politechnika Warszawska - Wydzial Samochodow i Maszyn Roboczych
2025-2026 
przyjety na 1 rok
Kierunek: Mechatronika Pojazdow i Maszyn Roboczych 
________________________________________
UMIEJETNOSCI
Implementuje proste integracje systemow poprzez Express.js, API, Socket.io.
Zapewniam bezpieczenstwo danych uzytkownika z JWT, bcrypt, crypto. 
Dobieram struktury bazodanowe (SQL/MongDB) pod katem wymagan automatyzacji. 
Udzielam dostepu do aplikacji terminalowych C++ przegladarce - podstawy Docker.
Jezyk angielski - C1
________________________________________
PROJEKTY
Tworze edukacyjna platforme webowa - AI/ML do rozwiazywania zadan z fizyki. Gotowe dwa dzialajace prototypy mikrouslug.
Budowa chatu z szyfrowaniem wiadomosci - Socket.io, SQLite, JWT.
https://cipherconnect.onrender.com
Stworzylem forum filmowe w Typescript (Nest.js), React, TMDB API. 
https://movieranker-react.onrender.com
________________________________________
ZAINTERESOWANIA
Game Dev (Unreal Engine, C++)
Tutoring AI/ML 
Wyrazam zgode na przetwarzanie moich danych osobowych przez firme Digispot - agencja CRO w celu prowadzenia rekrutacji na aplikowane przeze mnie stanowisko.`;

const englishCV = `ARTUR BEDNARSKI
Junior Web Developer
Email: 
Phone:
________________________________________
ABOUT ME
Mechatronics specialist transitioning into IT. 10 years of self-taught experience in JavaScript/HTML/CSS, Python, and C++. Node.js Trainee Developer at Innowise. Programming tutor at the Activation Foundation. For the past year, I've focused on automating technological and business processes and building AI/ML solutions. I seek opportunities to learn modern programming practices under the mentorship of experts.
________________________________________
WORK EXPERIENCE
Freelance Fullstack Developer
2024-2025
Built an ETL system for public procurement data that replaced paid APIs using scraping. Automated SQL documentation. Technologies: Node.js (Axios, Puppeteer, Cheerio), SQLite.
Working on an AI model to detect hydraulic seal damages, trained locally with zero infrastructure costs. Technologies: ONNX, Pytorch, WebGPU.
Elektromechanika Ogolna Andrzej Bednarski / Mechatronika Artur Bednarski
2001-2024
Mechatronics Engineer
Servicing and designing hydraulic and pneumatic drive systems
________________________________________
EDUCATION
Warsaw University of Technology - Faculty of Vehicles and Construction Machinery Engineering
2025-2026 
Accepted for 1st year
Field: Mechatronics of Vehicles and Machines
________________________________________
SKILLS
Develop simple system integrations using Express.js, API, Socket.io.
Ensure user data security with JWT, bcrypt, crypto.
Design SQL/MongoDB database structures for automation needs.
Enable terminal-based C++ apps to run in a browser - Docker basics.
English - C1
________________________________________
PROJECTS
Creating an educational web platform - AI/ML for solving physics problems. Two working microservice prototypes completed.
Built a chat with message encryption - Socket.io, SQLite, JWT.
https://cipherconnect.onrender.com
Developed a movie forum in TypeScript (Nest.js), React, TMDB API.
https://movieranker-react.onrender.com
________________________________________
INTERESTS
Game Development (Unreal Engine, C++)
Tutoring AI/ML 
I consent to the processing of my personal data by Digispot - CRO agency for the purpose of recruitment.`;

// Helpers
function sanitizeFilename(str) {
    return str.replace(/[^a-z0-9-]/gi, '-').toLowerCase().substring(0, 50);
}

function isPolish(text) {
    return /[a-z]/i.test(text); // Simplified check for Polish
}

function createSpinner(text) {
    const spinner = cliSpinners.dots;
    let i = 0;
    
    const interval = setInterval(() => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${spinner.frames[i]} ${text}`);
        i = (i + 1) % spinner.frames.length;
    }, spinner.interval);

    return {
        stop: (message) => {
            clearInterval(interval);
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(chalk.green('✓') + ` ${message}`);
        },
        fail: (message) => {
            clearInterval(interval);
            readline.cursorTo(process.stdout, 0);
            readline.clearLine(process.stdout, 0);
            console.log(chalk.red('✗') + ` ${message}`);
        }
    };
}

function createProgressBar(total) {
    let current = 0;
    const barLength = 20;
    
    return {
        update: () => {
            current++;
            const progress = Math.min(current / total, 1);
            const filled = Math.round(barLength * progress);
            const empty = barLength - filled;
            
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
                `[${'#'.repeat(filled)}${'-'.repeat(empty)}] ${current}/${total}\n`
            );
            
            if (current >= total) {
                readline.cursorTo(process.stdout, 0);
                readline.clearLine(process.stdout, 0);
                console.log(chalk.green(`Completed ${current} of ${total} tasks`));
            }
        }
    };
}

async function queryOllama(prompt, language, retries = 3) {
    const spinner = createSpinner(`Generating CV (${language})...`);
    
    try {
        const messages = [
            {
                role: "system",
                content: `You are a professional CV customizer. Modify ONLY existing sections. Keep the exact same format. CV in ${language === 'polish' ? 'Polish' : 'English'}`
            },
            {
                role: "user",
                content: prompt
            }
        ];

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.post(
                    process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat',
                    {
                        model: process.env.OLLAMA_MODEL || 'mistral',
                        messages,
                        stream: false,
                        options: {
                            temperature: 0.3,
                            num_ctx: 1024,
                            num_gpu: 0
                        }
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: parseInt(process.env.OLLAMA_TIMEOUT || 180000)
                    }
                );

                if (!response.data?.message?.content) {
                    throw new Error('Invalid Ollama response');
                }

                spinner.stop('CV generated successfully');
                return response.data.message.content;
            } catch (err) {
                console.log(chalk.yellow(`Attempt ${attempt} failed: ${err.message}`));
                if (attempt === retries) throw err;
                await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            }
        }
    } catch (err) {
        spinner.fail(`Failed to generate CV: ${err.message}`);
        throw err;
    }
}

async function getJoobleJobs(params) {
    const spinner = createSpinner('Fetching jobs from Jooble...');
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) {
        spinner.fail('JOOBLE_API_KEY is required in .env');
        throw new Error('JOOBLE_API_KEY is required in .env');
    }

    try {
        const response = await axios.post(`${JOOBLE_API_URL}/${apiKey}`, {
            keywords: params.query,
            location: params.location || '',
            radius: "40",
            page: "1",
            searchMode: "1",
            ResultOnPage: "10"
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const jobs = response.data?.jobs || [];
        const seen = new Set();

        const filteredJobs = jobs.filter(job => {
            const key = job.title + job.company;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).map(job => ({
            title: job.title,
            company: job.company,
            location: job.location,
            snippet: job.snippet,
            salary: job.salary,
            link: job.link
        }));

        spinner.stop(`Found ${filteredJobs.length} jobs`);
        return filteredJobs;
    } catch (err) {
        spinner.fail('Jooble API error: ' + err.message);
        throw new Error('Failed to fetch jobs from Jooble');
    }
}

async function generateCV(job) {
    const polishJob = isPolish(job.snippet);
    const base = polishJob ? polishCV : englishCV;
    const language = polishJob ? 'polish' : 'english';

    console.log(chalk.blue(`Processing: ${job.title} at ${job.company} (${polishJob ? 'PL' : 'EN'})`));

    const prompt = polishJob 
        ? `Dostosuj ponizsze CV do oferty pracy. Skup sie na doswiadczeniu, umiejetnosciach i projektach zwiazanych z wymaganiami. Zachowaj dokladnie ten sam format. CV w jezyku polskim.

OFERTA PRACY:
Stanowisko: ${job.title || 'Nie podano'}
Firma: ${job.company || 'Nie podano'}
Lokalizacja: ${job.location || 'Nie podano'}
Wymagania: ${job.snippet || 'Brak wymagan'}

CV DO DOSTOSOWANIA:
${base}`
        : `Customize the following CV for this job offer. Focus on experience, skills and projects related to the requirements. Keep exactly the same format. CV in English.

JOB OFFER:
Position: ${job.title || 'Not specified'}
Company: ${job.company || 'Not specified'}
Location: ${job.location || 'Not specified'}
Requirements: ${job.snippet || 'No requirements'}

CV TO CUSTOMIZE:
${base}`;

    const generatedCV = await queryOllama(prompt, language);

    if (!fs.existsSync(CV_DIR)) {
        fs.mkdirSync(CV_DIR, { recursive: true });
    }

    const filename = `cv_${sanitizeFilename(job.company)}_${Date.now()}.txt`;
    fs.writeFileSync(path.join(CV_DIR, filename), generatedCV);

    console.log(chalk.green(`CV saved to: ${filename}`));
    return { ...job, cv: generatedCV, cv_filename: filename };
}

// Endpoint
app.post('/search', async (req, res) => {
    try {
        const { query, location } = req.body;
        if (!query) {
            console.log(chalk.red('Query is required'));
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(chalk.cyan('\nStarting job search...'));
        const jobs = await getJoobleJobs({ query, location });

        if (jobs.length === 0) {
            console.log(chalk.yellow('No jobs found'));
            return res.json({ success: true, count: 0, results: [] });
        }

        console.log(chalk.cyan(`\nGenerating CVs for ${jobs.length} jobs...`));
        const progressBar = createProgressBar(jobs.length);
        const results = [];

        for (const job of jobs) {
            try {
                const result = await generateCV(job);
                results.push(result);
            } catch (err) {
                console.log(chalk.yellow(`Skipping job due to error: ${err.message}`));
            }
            progressBar.update();
        }

        console.log(chalk.green('\nProcess completed successfully'));
        res.json({ success: true, count: results.length, results });
    } catch (err) {
        console.log(chalk.red('\nError during /search: ' + err.message));
        res.status(500).json({
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Serve CVs
app.use('/cvs', express.static(CV_DIR));

// Start Server
app.listen(PORT, () => {
    console.log(chalk.green(`
  _____ _____ _____ _____ _____ 
 |     |     |     |     |     |
 |   __|  |  |  |  | | | |  |  |
 |__|  |_____|_____|_|_|_|_____| v1.0

`));
    console.log(chalk.cyan(`
Server running at http://localhost:${PORT}
Jooble API: ${JOOBLE_API_URL}
Ollama Model: ${process.env.OLLAMA_MODEL || 'llama3'}

Try it with:
POST http://localhost:${PORT}/search
{
  "query": "junior javascript",
  "location": "warszawa"
}
`));
});
