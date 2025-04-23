# Pokemon Shakespearean Description API

This REST API returns a Shakespearean-style description of a given Pokémon.

## Features
- Fetches Pokémon data using the [PokeAPI](https://pokeapi.co/).
- Retrieves English description from the Pokémon species endpoint.
- Translates the description to Shakespearean English using the [FunTranslations API](https://funtranslations.com/api/shakespeare).

## Requirements
- Node.js (v14 or later)

## Installation
1. Clone the repository or download the code.
2. Open a terminal and navigate to the project directory.

No third-party dependencies are needed — everything uses built-in Node.js modules.

## Running the Server
To start the server, run:
```bash
node app.js
```

### Terminal Compatibility
You can run the server from any terminal shell. On macOS, you may see this message:
```
The default interactive shell is now zsh.
To update your account to use zsh, please run `chsh -s /bin/zsh`.
```
This means you're currently using **Bash**, but macOS prefers **Zsh**. Both will work. To switch to Zsh, run:
```bash
chsh -s /bin/zsh
```
Then close and reopen your Terminal.

By default, the server runs on port **3000**. You can access it by visiting:
```
http://localhost:3000/pokemon/<pokemon-name>
```
Replace `<pokemon-name>` with the name of the Pokémon you want information about.

## Example
Request:
```
GET http://localhost:3000/pokemon/charizard
```
Response:
```json
{
  "name": "charizard",
  "description": "At which hour expelling a blast of super hot fire, the fiery charizard flyeth 'round the sky, burning fields and foes alike."
}
```

## Error Handling
- If the Pokémon does not exist:
```json
{
  "error": "Sorry, it looks like that Pokemon doesn't exist. Please double check the spelling or try with another name."
}
```
- If translation rate limit is reached:
```json
{
  "error": "Translation rate limit exceeded. Please try again later."
}
```

## Notes
- This version of the API uses only **core Node.js modules**: `http`, `https`, and `url` — no external libraries.
- The FunTranslations API has a **rate limit** for free usage. If you hit this limit, you will receive a rate limit error message.
- Ensure you have an active internet connection as the API depends on third-party services.

---
Hope you enjoy using this simple API.

To Pokemon, or not to Pokemon: that is the question!
