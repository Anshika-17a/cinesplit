const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCatalogSnapshot, rateLimitIp } = require('../services/cacheService');
const pgClient = require('../config/postgres');

const processChat = async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    // Rate limiting: max 10 messages per minute per IP
    const allowed = await rateLimitIp(`chat_${ip}`, 10, 60);
    if (!allowed) {
      return res.status(429).json({ 
        text: "You're sending messages too fast! Please wait a moment." 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ text: "Sorry, the AI is currently misconfigured on the server." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use flash-lite to avoid 503 overload and guarantee maximum speed
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    // 1. Fetch catalog snapshot
    const catalog = await getCatalogSnapshot();

    // 2. Build strict prompt
    const systemPrompt = `
You are the booking assistant for CineSplit, a movie ticket booking app.
You ONLY answer questions about:
1. Movies currently in our catalog (use the CATALOG data below — never invent movies, actors, or showtimes not in it).
2. How booking, cancellation, seat selection, and payment work on this app.
3. Movie recommendations strictly from the CATALOG below.

CRITICAL RULES:
- KEEP ANSWERS SHORT AND CONCISE. Do not write long essays.
- INTERACTIVE RECOMMENDATIONS: If a user asks for a recommendation but is vague (e.g., "Recommend me something"), DO NOT recommend a movie immediately! Instead, ask a quick clarifying question (e.g., "Are you looking for action, comedy, or sci-fi?" or "What language do you prefer?"). Wait for their reply. Once you know their preferences, THEN recommend the best matches.
- If asked anything unrelated to this app (general knowledge, other apps, personal advice, coding help, etc.), respond briefly and politely: "I can only help with movies and bookings on CineSplit — try asking me for a recommendation or how booking works!" Do not answer the off-topic question even partially.
- ALWAYS end your reply with a machine-readable line if you are recommending movies: "RECOMMEND: [id1, id2]". E.g., if you recommend movies with IDs 5 and 7, end your response EXACTLY with: RECOMMEND: [5, 7]

CATALOG:
${JSON.stringify(catalog, null, 2)}
`;

    // 3. Format history for Gemini SDK
    // SDK expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const formattedHistory = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory) {
        // Only valid roles are 'user' and 'model'
        const role = turn.sender === 'user' ? 'user' : 'model';
        formattedHistory.push({
          role,
          parts: [{ text: turn.text }]
        });
      }
    }

    // 4. Start chat and send message
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I will strictly follow these rules and only assist with CineSplit bookings and catalog recommendations." }] },
        ...formattedHistory
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2,
      },
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // 5. Parse Recommendations
    let cleanText = responseText;
    let recommendedIds = [];

    const recommendRegex = /RECOMMEND:\s*\[([\d,\s]*)\]/i;
    const match = responseText.match(recommendRegex);
    
    if (match) {
      // Strip the RECOMMEND line from the user-facing text
      cleanText = responseText.replace(match[0], '').trim();
      
      const idsRaw = match[1];
      if (idsRaw) {
        recommendedIds = idsRaw.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }
    }

    // 6. Fetch full movie objects if recommended
    let recommendedMovies = [];
    if (recommendedIds.length > 0) {
      const dbMovies = await pgClient.query(`
        SELECT id, title, poster_url as "posterUrl", genre, languages 
        FROM movies 
        WHERE id = ANY($1)
      `, [recommendedIds]);
      recommendedMovies = dbMovies.rows;
    }

    return res.json({
      text: cleanText,
      movies: recommendedMovies
    });

  } catch (error) {
    console.error('Gemini Chatbot Error:', error);
    return res.status(500).json({ 
      text: "Sorry, I'm having trouble right now — try browsing by city and language instead." 
    });
  }
};

module.exports = {
  processChat
};
