# Relay Attack Backend (FastAPI)

This backend provides a simulation engine for a relay attack (Adversarial Red Team), a rule evaluation engine, and AI integration (Gemini) to generate attacks and patches.

Quick start

1. Copy .env.example to .env and fill in GOOGLE_API_KEY and GEMINI_ENDPOINT.
2. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Initialize the database:

```bash
python scripts/create_db.py
```

4. Run the server:

```bash
uvicorn main:app --reload
```

API Endpoints

- GET / -> health check
- POST /simulate/run -> run a simulation (optional scenario)
- POST /simulate/apply_patch -> apply a blue-team patch (activate rule)
- GET /simulate/logs -> list past runs
- POST /ai/red_team -> generate red-team scenario via Gemini
- POST /ai/blue_team -> request blue-team patch via Gemini

Sample curl:

```bash
curl -X POST http://127.0.0.1:8000/simulate/run -H "Content-Type: application/json" -d '{}'

curl -X POST http://127.0.0.1:8000/ai/blue_team -H "Content-Type: application/json" -d '{"attack_log":{}, "current_rule":{}}'
```

Frontend Integration Hints

API_URL = "http://127.0.0.1:8000"

Example runSimulation fetch:

```js
const res = await fetch(`${API_URL}/simulate/run`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({}) })
```

Example generatePatch fetch:

```js
const res = await fetch(`${API_URL}/ai/blue_team`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ attack_log: runResult, current_rule: rule }) })
```
# Unified Command Center — Indian Border Defense

This is a comprehensive, demo-ready React application that serves as a unified command center for Indian border security operations. It integrates two primary modules: an **Adversarial Red Team Simulator** and a **Social Media & News Threat Radar**. The entire application is designed to run in a fully functional mock mode, requiring no backend setup for demonstration purposes.

## Features

-   **Dual-Pane Interface**: Seamlessly switch between the Red Team and Social Radar modules.
-   **India-Centric Scenarios**: All mock data, locations, and simulations are focused on the India-Pakistan border region (Punjab).
-   **Multilingual OSINT**: The Social Radar simulates ingestion of posts in English, Hindi, and Punjabi.
-   **Robust Mock API**: A unified API client with a switchable mock mode and graceful fallback for robust demonstrations.
-   **Persistent Mock Database**: Uses `localStorage` to persist applied rules and logs across tabs and sessions.
-   **Global Correlation**: A dedicated metrics page shows correlations between physical vulnerabilities and social threats.
-   **Cyber-Defense Aesthetics**: A dark, modern UI built with Tailwind CSS and Framer Motion.
-   **Live Debug Panel**: An on-screen panel shows the current API mode and last call status for clear demoing.

---

## Installation & Setup

You will need a basic environment to serve static files.

### 1. Project Structure (Static Assets)

This project loads mock data dynamically. Ensure you have a `public` folder in your project root and place the `sample_data` directory inside it.

Your project root should look like this:

```
/
|-- public/
|   |-- sample_data/
|   |   |-- mock_scenarios.json
|   |   |-- mock_feeds.json
|   |   |-- geocode_index.json
|-- src/
|-- index.html
... and other project files
```

### 2. Running the Application

Use a local development server to run the project. If you are using a tool like Vite or Create React App:

```bash
npm install
npm start
```

The application will open in your browser, usually at `http://localhost:3000`.

### 3. Toggling Mock Mode

By default, the application runs in **Mock Mode**. You can toggle this live using the switch in the top-right corner. To change the default, edit the `MOCK_MODE_ENABLED_BY_DEFAULT` constant in `src/api/backendClient.ts`.

---

## Verifying the Fixes (Browser Console Tests)

After starting the app, open your browser's developer console (F12) and run these tests:

1.  **Test dynamic JSON fetching:**
    ```javascript
    fetch('/sample_data/mock_feeds.json').then(r=>r.json()).then(c=>console.log(c))
    // Expected: Object with a "feeds" array containing multilingual posts.
    ```
2.  **Test the API client (exposed on `window.apiClient` for demo):**
    ```javascript
    window.apiClient.runSimulation('relay_attack_wagah').then(console.log)
    // Expected: An event sequence for the Wagah relay attack.
    ```
3.  **Test mock geocoding:**
     ```javascript
    window.apiClient.geocodeLocation('A post about Fazilka').then(console.log)
    // Expected: { lat: 30.4040, lon: 73.9690 }
    ```

---

## Hackathon Demo Script

This script provides a compelling, step-by-step narrative for presenting the application to judges.

### **Part 1: The Physical Threat (Red Team Simulator)**

1.  **Introduction:** "Good morning. We present the Unified Command Center, a next-gen platform for Indian border defense. We're starting in the **Adversarial Red Team Simulator**, where we test our defenses against known attack patterns. Our current area of focus is the **Wagah border**."
2.  **Initial State:** "Our system has a basic rule: 'Alert if any entity loiters for more than 60 seconds'. Let's see if this is enough. We will run a 'Relay Attack' scenario."
3.  **Run Simulation #1 (Bypass):**
    *   Click **"Run Simulation"**.
    *   **Narrate:** "As you see on the map, a drone enters the restricted zone, drops a package, and exits quickly. Moments later, an operative on foot enters, retrieves the package, and leaves. The total time-in-zone for each entity is less than 60 seconds."
    *   Point to the **Timeline Console**. "The logs confirm the actions, but critically, the final event is marked **[BYPASSED]**. Our simple rule has failed. The system is compromised."
4.  **AI-Powered Defense:** "This is where our AI comes in. We feed this failed attack log to our Blue Team AI to generate a countermeasure."
    *   Click **"Generate AI Patch"**.
    *   Point to the **Blue Patch Panel**. "The AI has generated a new, more intelligent rule. It's not about loitering anymore; it's a 'Stateful Zone' rule. It looks for a *sequence* of events: a drop followed by a pickup in a specific time and distance window."
5.  **Apply Patch:**
    *   Click **"Apply Patch"**.
    *   **Narrate:** "With one click, this machine-readable rule is now active in our defense system."
6.  **Run Simulation #2 (Detection):**
    *   Click **"Run Simulation"** again.
    *   **Narrate:** "We run the exact same attack. The drone drops the package, and the map zone turns **amber**, indicating 'Pending Handoff'. Now, watch what happens when the operative enters to retrieve it..."
    *   As the pickup happens, a **cinematic alert modal** appears. "…**[DETECTED]**! A critical alert is triggered instantly. The system is now secure against this vector."
    *   Point to the **Metrics Strip**. "Our metrics confirm it: our detection rate is now 50%, and the vulnerability is patched."

### **Part 2: The Social & Digital Threat (Social Radar)**

1.  **Pivot:** "But physical security is only half the battle. Threats are now coordinated online. Let's switch to our **Social Threat Radar**."
    *   Click the **Social Radar tab**.
2.  **OSINT Monitoring:**
    *   **Narrate:** "This module monitors open-source intelligence—social media, news—for chatter related to our areas of interest. We're tracking keywords like 'protest', 'convoy', and 'Wagah' in English, Hindi, and Punjabi."
    *   Click **"Start Stream"**.
3.  **Threat Identification:**
    *   Point to the **Live Feed Panel**. "Instantly, our system starts pulling in relevant posts. Notice the language tags—we're processing multilingual data in real-time. We can even get mock translations for regional languages." (Click a translate button).
    *   Point to the **Threat Map**. "Posts are geocoded, and a **threat heatmap** is forming. We see a significant cluster forming right over the **Wagah region**—the same place our physical simulation just occurred."
4.  **AI Analysis:**
    *   Point to the **AI Analyst Panel**. "Our AI is analyzing this data stream. It has raised a **CRITICAL** threat assessment, summarizing the chatter as a 'Coordinated protest action' planned near Wagah. It recommends dispatching a field team."

### **Part 3: The Correlation (Global Metrics)**

1.  **Synthesize:** "The true power of this platform is not in these silos, but in their integration. Let's go to **Global Metrics**."
    *   Click the **Global Metrics tab**.
2.  **The 'Aha!' Moment:**
    *   Point to the **Correlation Card**. "This is the force multiplier. The system has automatically correlated the two events we just witnessed: a **CRITICAL** OSINT signal about a protest at Wagah, and a known physical **Vulnerability** to 'Relay Attacks' in the *exact same location*."
    *   **Narrate:** "Initially, this was an active threat. But because we patched the vulnerability, the status is now **MITIGATED**. We've not only identified a complex, multi-domain threat but also proactively confirmed our defense against it."
3.  **Conclusion:** "The Unified Command Center provides actionable, correlated intelligence, allowing security forces to move from a reactive to a proactive defense posture. Thank you."
