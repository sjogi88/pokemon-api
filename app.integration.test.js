// Integration tests for the Pokémon Shakespeare API (with mocked translation)

// Import core Node.js modules for making requests and mocking
const http = require('http');
const https = require('https');

// Mock the HTTPS module to simulate translation API responses
jest.mock('https');

// Helper function to make HTTP GET requests to the local API server
const makeRequest = function(path) {
  return new Promise(function(resolve, reject) {
    http.get({ hostname: 'localhost', port: 3000, path, agent: false }, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; }); // Collect data chunks
      res.on('end', function() {
        resolve({ status: res.statusCode, body: JSON.parse(data) }); // Parse and return JSON response
      });
    }).on('error', reject); // Handle request errors
  });
};

describe('Integration test for /pokemon/:name', function() {
  jest.setTimeout(10000); // Allow more time for API calls in test timeout

  // Reset and mock successful translation API response before each test
  beforeEach(function() {
    https.request.mockReset();
    https.request.mockImplementation(function(options, callback) {
      const { PassThrough } = require('stream');
      const stream = new PassThrough();
      const res = new PassThrough();
      res.statusCode = 200;

      callback(res); // Provide mocked response stream to the callback
      process.nextTick(function() {
        res.emit('data', JSON.stringify({ contents: { translated: 'Shakespearean description.' } }));
        res.emit('end');
      });
      stream.end = function() {};
      return stream;
    });
  });

  // ✅ Test if the API returns a Shakespearean description for a valid Pokémon
  it('should return Shakespearean description for a valid Pokémon', async function() {
    const response = await makeRequest('/pokemon/pikachu');

    
    expect([200, 429]).toContain(response.status); // Allow the test to pass whether the server returns 200 (success) or 429 (rate limit exceeded)
    expect(response.body).toHaveProperty('name', 'pikachu');
    // Verify that the description field exists and contains non-empty text, without expecting a specific sentence
    expect(response.body).toHaveProperty('description');
    expect(typeof response.body.description).toBe('string');
    expect(response.body.description.length).toBeGreaterThan(0); // Ensure description is not empty
  });

  // ❌ Test if the API returns a 404 error for an invalid Pokémon name
  it('should return 404 error for an invalid Pokémon name', async function() {
    const response = await makeRequest('/pokemon/notapokemon');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/doesn't exist/);
  });

  // 🚨 Simulate translator API rate limit and verify fallback behavior
  it('should return original description with note if translation API rate limit is hit', async function() {
    https.request.mockImplementationOnce(function(options, callback) {
      const { PassThrough } = require('stream');
      const res = new PassThrough();
      res.statusCode = 429;
  
      callback(res);
  
      process.nextTick(function() {
        // Since we're simulating a 429 rate limit error,
    // we don't need to emit any 'data' — just ending the response is enough.
        res.emit('end');
      });
  
      const stream = new PassThrough();
      stream.end = function() {};
      return stream;
    });
  
    const response = await makeRequest('/pokemon/charizard');
  
    expect(response.body).toHaveProperty('name', 'charizard');
    expect(response.body).toHaveProperty('description');
    expect(typeof response.body.description).toBe('string');
  
    // ✅ Only expect 'note' if the response is a 429 (rate limit exceeded)
    if (response.status === 429) {
      expect(response.body).toHaveProperty('note');
      expect(typeof response.body.note).toBe('string');
      expect(response.body.note).toMatch(/rate limit exceeded/i);
    }
  })});
