const OpenAI = require('openai');

const SYSTEM_PROMPT = `You are Shubham AI, the friendly assistant for Shubham Computers — a printing store and stationery mart in Jhajjar, Haryana.

About the store:
- We offer printing services (B&W, Color, Documents, Photos, ID Cards, Visiting Cards, Banners, etc.)
- We have a stationery mart with pens, notebooks, files, registers, art supplies, office supplies, etc.
- We deliver within 3km radius from our store in Jhajjar under 30 minutes
- Payment is through our in-app wallet (minimum top-up ₹50, via UPI)
- Store coordinates: 28.605441, 76.653198

You help users with:
- Finding print services and their pricing
- Navigating the mart products
- Understanding how to place orders
- Wallet and payment queries
- Delivery related questions
- General stationery recommendations

Be concise, helpful, and friendly. Use Hindi words occasionally (like "Namaste", "Ji") since our customers are from Jhajjar.
Keep responses short (2-3 sentences max unless detailed explanation needed).
Always be positive about the store's services.`;

// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long. Please keep it under 500 characters.' });
    }

    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      // Fallback responses when API key not configured
      return res.json({
        success: true,
        reply: getFallbackReply(message)
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add conversation history (last 10 messages max)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content.substring(0, 500) });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.json({
        success: true,
        reply: 'Namaste! Our AI is taking a short break. For quick help, explore our services on the home page or call our store directly. 🙏'
      });
    }

    res.status(500).json({ error: 'AI service temporarily unavailable.' });
  }
};

// Fallback responses when OpenAI is not configured
function getFallbackReply(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste')) {
    return 'Namaste! 🙏 Welcome to Shubham Computers. I can help you with printing services, stationery products, orders, and wallet queries. What would you like to know?';
  }
  if (msg.includes('print') || msg.includes('printing')) {
    return 'We offer various printing services — B&W prints, color prints, photo prints, ID cards, visiting cards, banners and more! Check out our Services section on the home page for full details and pricing.';
  }
  if (msg.includes('delivery') || msg.includes('deliver') || msg.includes('time')) {
    return 'We deliver within 3km radius from our store in Jhajjar. Most orders are delivered under 30 minutes! ⚡';
  }
  if (msg.includes('wallet') || msg.includes('payment') || msg.includes('pay') || msg.includes('upi')) {
    return 'You can top-up your wallet using UPI (minimum ₹50). Go to the Wallet section, enter the amount, and pay via any UPI app. Orders are paid directly from your wallet balance.';
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate')) {
    return 'Our prices start from as low as ₹2 for B&W prints. Check each service in our Services section for detailed pricing with different options.';
  }
  if (msg.includes('location') || msg.includes('address') || msg.includes('where')) {
    return 'We\'re located in Jhajjar, Haryana. We serve within a 3km radius from our store. Make sure to set your delivery address in the app!';
  }
  if (msg.includes('mart') || msg.includes('stationery') || msg.includes('shop')) {
    return 'Our Mart has a wide range of stationery — pens, notebooks, files, registers, art supplies, and office supplies. Browse categories on the home page!';
  }
  
  return 'Namaste! I\'m Shubham AI, your assistant at Shubham Computers. I can help with printing services, stationery products, orders, wallet, and delivery queries. How can I help you today? 🙏';
}
