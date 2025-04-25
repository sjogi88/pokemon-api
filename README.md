# Pokemon Shakespearean Description API

## 📚 Table of Contents
- [Features](#features)
- [💡 Design Choice: Why Only Node.js](#-design-choice-why-only-nodejs)
- [🧩 Implementation](#-implementation)
  - [Node.js](#nodejs)
  - [Jest](#jest)
- [Requirements](#requirements)
- [📦 Installation](#-installation)
- [🛠️ Setup](#-setup)
- [🚀 Using the API](#-using-the-api)
- [🧪 Testing](#-testing)
- [📁 File Overview](#-file-overview)
- [📝 Notes](#-notes)


This REST API returns a Shakespearean-style description of a given Pokémon.

## 📁 File Overview
- `app.js`: The main API server (no Express or third-party modules used).
- `app.test.js`: Unit tests with mocked HTTPS interactions.
- `app.integration.test.js`: Integration tests simulating real user behavior.
- `package.json`: Project and test configuration.

## Features
- Fetches Pokémon data using the [PokeAPI](https://pokeapi.co/).
- Retrieves English description from the Pokémon species endpoint.
- Translates each sentence in the description to Shakespearean English using the [FunTranslations API](https://funtranslations.com/api/shakespeare).
- Gracefully handles translation API rate limits by falling back to the original description with a helpful note.

## 💡 Design Choice: Why Only Node.js

This project was intentionally built using only core Node.js modules (`http`, `https`, `url`) instead of external frameworks like Express.

### Why?
- 📚 **Demonstrates understanding of low-level server logic** — shows how HTTP requests and responses work.
- ⚡ **Lightweight** — no unnecessary dependencies.
- 🔍 **Transparency** — every step is clearly written without magic from frameworks.
- 📦 **No install required for core logic** — only testing tools like Jest are added as dev dependencies.

This choice makes the code more educational, transparent, and is ideal for foundational learning. 

## 🧩 Implementation

### Node.js
Node.js is a JavaScript runtime built on Chrome's V8 engine. It allows developers to run JavaScript on the server instead of only in the browser. In this project, Node.js powers the web server, handles HTTP requests, fetches data from external APIs, and processes responses — all using only built-in modules.

**Why Node.js for this project?**
- Perfect for building lightweight APIs
- Handles asynchronous operations (like fetching data) efficiently
- Keeps the project minimal without the need for third-party frameworks

### Jest
Jest is a JavaScript testing framework used to write and run unit and integration tests. It allows you to verify that your code behaves as expected without relying on manual testing.

**Why Jest for this project?**
- Simple syntax, fast setup, and easy to mock external APIs
- Ensures the API is reliable and bug-free
- Makes it easier to catch issues

## Requirements
- Node.js (v14 or later)
- Jest (for running tests)

## 📦 Installation
1. Clone the repository or download the code.
2. Open a terminal and navigate to the project directory.

## 🛠️ Setup
Before you begin, make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org).

### Check if Node is already installed
Open your terminal and run:
```bash
node -v
npm -v  # npm is included with Node.js and used for installing packages like Jest
```
If you see version numbers, Node.js and npm are already installed.

### Install Node.js

#### On macOS:
1. Open Terminal
2. Download and install the Node.js macOS installer from [nodejs.org](https://nodejs.org)
3. Follow the prompts to complete the installation

#### On Windows:
1. Download the Windows installer from [nodejs.org](https://nodejs.org) and run it
2. Follow the prompts to complete the installation

### macOS Shell Tip
If your terminal shows this message:
```
The default interactive shell is now zsh.
To update your account to use zsh, please run `chsh -s /bin/zsh`.
```
You can switch to zsh by running:
```bash
chsh -s /bin/zsh
```
Then close and reopen your Terminal.
bash
node -v
npm -v
```

If you need to install or manage different Node versions, consider using [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18
```
1. To run the server:
   ```bash
   npm start
   ```

The server runs on port `3000` by default.

## 🚀 Using the API
You can access the API with a request like:
```
http://localhost:3000/pokemon/pikachu
```

### Sample Response
```json
{
  "name": "pikachu",
  "description": "Yond creature emits sparks from its cheeks and dances 'pon the fields."
}
```

### Rate Limit Example
If the translation API rate limit is hit:
```json
{
  "name": "pikachu",
  "description": "Pikachu that can generate powerful electricity have cheek sacs that are extra soft and super stretchy.",
  "note": "Translation rate limit exceeded. Returning original description."
}
```

## 🧪 Testing

### Test Structure
- `app.test.js`: Unit tests for helper functions like `fetchJSON()` and `postTranslation()`
- `app.integration.test.js`: Full end-to-end tests for the API routes including:
  - A valid Pokémon
  - A non-existent Pokémon
  - Simulated translation API rate limit

  ### Install Jest
To install Jest and other development dependencies, run:
```bash
npm install --save-dev jest
```

> ⚠️ You may see warnings like `deprecated inflight@1.0.6` or `glob@7.2.3`. These come from packages Jest depends on and do not affect functionality. Jest will still install and work correctly.

This project uses **Jest** for unit and integration testing.

### Run All Tests
Run all unit and integration tests:
```bash
npm test
```

### Run Specific Tests
To run only **unit tests**:
```bash
npx jest app.test.js
```

To run only **integration tests**:
```bash
npx jest app.integration.test.js
```

### Live Test Example
When running the server locally:
```bash
http://localhost:3000/pokemon/charizard
```
Should return a translated or fallback description.

### Important Testing Note
- **FunTranslations API Rate Limit**: Integration tests may occasionally fail and return a 429 status code (Too Many Requests) if the free API request limit is reached. This is expected behavior when testing against the live API.

### Best Practices for Integration Testing
- In integration tests, avoid matching specific translated sentences because live external APIs (like PokeAPI) can return varying flavor texts.
- Instead, verify that key fields exist (like `description`) and contain non-empty strings.
- This approach makes tests more robust, reliable, and less sensitive to changes in real-world API data.

### Troubleshooting Common Issues
- **No tests found**: Double-check the exact filename you are running. Example: `npx jest app.test.js`.
- **404 Error when running tests**: Make sure you are using `npx jest` to run tests, not `npm install`.
- **Warnings during npm install**: Warnings about deprecated packages like `inflight` or `glob` are safe to ignore.
- **Server already running**: Open a second terminal window or tab to run tests without stopping your server.

### Running Tests While Server is Running
- You can run your API server and tests at the same time without stopping the server.
- Open a **second terminal** or **terminal tab**.
- Navigate to the project directory again, and run:
  ```bash
  npm test
  ```
- This keeps your server running in one window while your tests run separately in another.

## 📝 Notes
- You must be connected to the internet to use the live APIs.
- Rate limits for FunTranslations API may affect test behavior without mocks.
- All network interactions in tests are mocked for consistency and speed.

---

Hope you enjoy playing with the API.

🎭 To Pokemon... or not to Pokemon... that is the question! 
