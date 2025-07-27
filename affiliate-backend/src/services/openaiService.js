const OpenAI = require('openai');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Set up the OpenAI client. The API key must be provided via
// OPENAI_API_KEY. Without it the OpenAI client will be null and
// the service will return empty odds.
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn('⚠️  OPENAI_API_KEY is not set. AI-generated odds will not be available.');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error.message);
}

/**
 * Generate predicted win probabilities for a sporting event.
 *
 * The prompt sent to GPT succinctly describes the matchup and asks for a
 * machine‑readable JSON object mapping each team to a probability between
 * 0 and 100. Temperature is set moderately high to encourage variation but
 * the application code will trust the structure of the JSON if returned.
 *
 * @param {import('../models/event')} event - The event document. Should
 * contain a `teams` array and a `league` property.
 * @returns {Promise<Object>} A promise that resolves to an object like
 * `{ "Team A": 60, "Team B": 40 }`. If parsing fails an empty object is returned.
 */
async function getOddsForEvent(event) {
  // Check if OpenAI client is available
  if (!openai) {
    console.warn('OpenAI client not available. Cannot generate odds for event:', event.name);
    return {};
  }

  // Construct a natural language description of the event
  const matchup = event.teams.join(' vs ');
  const eventDate = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are a sports analyst. Based on historical performance and contextual factors, estimate the win probability for each team in the following event. Return the result strictly as JSON where keys are team names and values are probabilities (numbers between 0 and 100 that sum to 100).\n\nEvent: ${matchup}\nLeague: ${event.league}\nDate: ${eventDate}\n\nJSON:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for generating sports odds.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) return {};
    // Attempt to parse the JSON from the response. If parsing fails,
    // return an empty object rather than throwing.
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.warn('Failed to parse OpenAI odds JSON:', parseError);
      return {};
    }
  } catch (err) {
    console.error('OpenAI API error:', err);
    return {};
  }
}

module.exports = { getOddsForEvent };
