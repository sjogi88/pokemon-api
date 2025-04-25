// Import core Node.js modules to set up the server and handle external HTTPS requests
const http = require('http');
const url = require('url');
const https = require('https');

// Define the server's port (use environment variable if available, otherwise default to 3000)
const PORT = process.env.PORT || 3000;

// Helper function to fetch and parse JSON from an HTTPS endpoint
const fetchJSON = function(apiUrl) {
  return new Promise(function(resolve, reject) {
    https.get(apiUrl, function(res) {
      let data = '';

      // Listen for incoming data chunks
      res.on('data', function(chunk) { data += chunk; });
      
      // When all data is received, parse it into JSON
      res.on('end', function() {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON'));
        }
      });
    }).on('error', reject); // Handle request errors
  });
};

// Helper function to send a POST request to the FunTranslations API
const postTranslation = function(text) {
  const params = new URLSearchParams({ text });
  const options = {
    hostname: 'api.funtranslations.com',
    path: `/translate/shakespeare.json?${params.toString()}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  return new Promise(function(resolve, reject) {
    const req = https.request(options, function(res) {
      let data = '';

      // Collect response data
      res.on('data', function(chunk) { data += chunk; });
      
      // Parse and handle the response once fully received
      res.on('end', function() {
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

    req.on('error', reject); // Handle request errors
    req.end(); // Finalize the request
  });
};

// Create the main HTTP server
const server = http.createServer(async function(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  // Handle only requests starting with /pokemon/:name
  if (req.method === 'GET' && pathParts[0] === 'pokemon' && pathParts[1]) {
    const pokemonName = pathParts[1].toLowerCase();

    // Step 1: Verify that the Pokémon exists by fetching its basic info
    try {
      await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ error: "Sorry, it looks like that Pokemon doesn't exist. Please double check the spelling or try with another name." }, null, 2));
      return;
    }

    // Step 2: Fetch species data to retrieve the flavor text
    try {
      const speciesData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
      const entries = speciesData.flavor_text_entries;
      const firstEnglishEntry = entries.find(function(entry) {
        return entry.language.name === 'en';
      });

      if (!firstEnglishEntry) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No English description found for this Pokémon.' }, null, 2));
        return;
      }

      // Clean the description by removing unwanted characters
      const cleanedDescription = firstEnglishEntry.flavor_text.replace(/\f|\n|\r/g, ' ');
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
              break; // If rate limit exceeded, stop translating
            } else {
              translatedSentences.push(sentence); // Fallback to original if individual translation fails
            }
          }
        }
      }

      const finalDescription = rateLimitHit
        ? cleanedDescription
        : translatedSentences.join(' ');

      // Send the final JSON response back to the client
      res.writeHead(rateLimitHit ? 429 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: pokemonName,
        description: finalDescription,
        ...(rateLimitHit && { note: 'Translation rate limit exceeded. Returning original description.' })
      }, null, 2));
    } catch (err) {
      console.error('Error retrieving Pokémon species data:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'An error occurred while retrieving Pokémon species data.' }, null, 2));
    }
  } else {
    // Handle invalid routes or methods
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Please use /pokemon/:name endpoint.' }, null, 2));
  }
});

// Start the HTTP server only if this script is run directly
if (require.main === module) {
  server.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the fetchJSON, postTranslation, and server functions so they can be imported and tested in other files
module.exports = {
  fetchJSON,
  postTranslation,
  server
};
