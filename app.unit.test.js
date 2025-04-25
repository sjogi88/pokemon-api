// Unit tests for fetchJSON and postTranslation

// Import functions to test and dependencies for mocking
const { fetchJSON, postTranslation } = require('./app');
const https = require('https');
const { PassThrough } = require('stream');

// Mock the https module to simulate API responses instead of making real network requests
jest.mock('https');

// Tests for fetchJSON
const fetchJSONTests = function() {
  // ✅ Test successful JSON retrieval
  it('should return parsed JSON data from a valid URL', async function() {
    const fakeResponse = { name: 'pikachu' }; // Mock data to simulate API response
    const stream = new PassThrough(); // Create a stream to simulate incoming data

    // Simulate a successful https.get request that returns valid JSON
    https.get.mockImplementation(function(url, callback) {
      callback(stream);
      process.nextTick(function() {
        stream.emit('data', JSON.stringify(fakeResponse));
        stream.emit('end');
      });
      return { on: function() {} }; // Dummy .on handler for 'error'
    });

    const data = await fetchJSON('https://fakeapi.com/pokemon/pikachu');
    expect(data).toEqual(fakeResponse); // Check that returned data matches expected result
  });

  // ❌ Test when JSON parsing fails
  it('should throw an error if JSON is invalid', async function() {
    const stream = new PassThrough();

    // Simulate invalid JSON being returned
    https.get.mockImplementation(function(url, callback) {
      callback(stream);
      process.nextTick(function() {
        stream.emit('data', '{invalid json'); // Malformed JSON
        stream.emit('end');
      });
      return { on: function() {} };
    });

    // Expect the fetchJSON call to reject with a JSON parsing error
    await expect(fetchJSON('https://fakeapi.com')).rejects.toThrow('Failed to parse JSON');
  });
};

describe('fetchJSON', fetchJSONTests);

// Tests for postTranslation
const postTranslationTests = function() {
  // ✅ Test successful translation
  it('should return translated text from FunTranslations API', async function() {
    const expectedText = 'To beest, or not to beest'; // Expected translated text
    const responseData = JSON.stringify({
      contents: { translated: expectedText }
    });

    const stream = new PassThrough();

    // Simulate a successful https.request POST response with valid translated data
    https.request.mockImplementation(function(options, callback) {
      const req = new PassThrough();
      callback(stream);
      process.nextTick(function() {
        stream.emit('data', responseData);
        stream.emit('end');
      });
      return req;
    });

    const result = await postTranslation('To be or not to be');
    expect(result).toBe(expectedText); // Check that returned translation matches expected text
  });

  // 🚨 Test API rate limiting
  it('should handle rate limit error (HTTP 429)', async function() {
    const stream = new PassThrough();
    stream.statusCode = 429; // Simulate API returning a 429 status code

    // Simulate a response that triggers a rate limit error
    https.request.mockImplementation(function(options, callback) {
      const req = new PassThrough();
      callback({
        ...stream,
        on: function(event, handler) {
          if (event === 'data') handler('{}');
          if (event === 'end') handler();
        }
      });
      req.end = function() {};
      return req;
    });

    // Expect the postTranslation call to reject with a rate limit error
    await expect(postTranslation('text')).rejects.toEqual({ code: 429, message: 'Rate limit exceeded' });
  });
};

describe('postTranslation', postTranslationTests);
