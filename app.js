// app.js (no Express, no Axios)

// Import core Node.js modules
const http = require('http');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;

// Helper function to fetch and parse JSON from an HTTPS endpoint
function fetchJSON(apiUrl) {
  return new Promise((resolve, reject) => {
    https.get(apiUrl, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON'));
        }
      });
    }).on('error', reject);
  });
}

// Helper function to send a POST request to the FunTranslations API
function postTranslation(text) {
  const params = new URLSearchParams({ text });
  const options = {
    hostname: 'api.funtranslations.com',
    path: `/translate/shakespeare.json?${params.toString()}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 429) {
            reject({ code: 429, message: 'Rate limit exceeded' });
          } else {
            resolve(json.contents.translated);
          }
        } catch (e) {
          reject(new Error('Failed to parse translation response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Main HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  // Route handler for GET /pokemon/:name
  if (req.method === 'GET' && pathParts[0] === 'pokemon' && pathParts[1]) {
    const pokemonName = pathParts[1].toLowerCase();

    // Verify that the Pokémon exists
    try {
      await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Sorry, it looks like that Pokemon doesn't exist. Please double check the spelling or try with another name." }));
      return;
    }

    // Fetch species data to get the description
    try {
      const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
      const entries = speciesData.flavor_text_entries;
      const firstEnglishEntry = entries.find(entry => entry.language.name === 'en');

      if (!firstEnglishEntry) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No English description found for this Pokémon.' }));
        return;
      }

      // Clean and split the description into individual sentences
      const cleanedDescription = firstEnglishEntry.flavor_text.replace(/\f|\n|\r/g, ' ');
      // Split the cleaned description into individual sentences using a regex that matches periods followed by whitespace
      const sentences = cleanedDescription.split(/(?<=\.)\s+/);
      const translatedSentences = [];

      let rateLimitHit = false;

      // Translate each sentence individually
      for (const sentence of sentences) {
        if (sentence.trim()) {
          try {
            const translated = await postTranslation(sentence);
            translatedSentences.push(translated);
          } catch (err) {
            if (err.code === 429) {
              rateLimitHit = true;
              break;
            } else {
              // If translation fails for any sentence, fallback to the original sentence
              translatedSentences.push(sentence);
            }
          }
        }
      }

      const finalDescription = rateLimitHit
        ? cleanedDescription // fallback to original if rate limit hit
        : translatedSentences.join(' ');

      // Send the final response
      res.writeHead(rateLimitHit ? 429 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: pokemonName,
        description: finalDescription,
        ...(rateLimitHit && { note: 'Translation rate limit exceeded. Returning original description.' })
      }));
    } catch (err) {
      console.error('Error retrieving Pokémon species data:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'An error occurred while retrieving Pokémon species data.' }));
    }
  } else {
    // Default 404 handler for invalid routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Please use /pokemon/:name endpoint.' }));
  }
});

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

