// api/generate-post.js
// Now with REAL AI generation!

export default async function handler(req, res) {
  // Add CORS headers (fixes the CodePen issue)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      hint: 'Send a POST request with topic in the body' 
    });
  }

  // Get the data from the request
  const { 
    topic,
    tone = 'professional',
    platform = 'LinkedIn'
  } = req.body;

  // Make sure topic was provided
  if (!topic || topic.trim() === '') {
    return res.status(400).json({ 
      error: 'Missing required field: topic',
      hint: 'Please provide a topic for the post' 
    });
  }

  try {
    // Check if we have OpenAI key
    const apiKey = process.env.OPENAI_API_KEY;
    
    let generatedPost;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      // USE REAL AI GENERATION
      console.log('Using OpenAI to generate post...');
      
      const prompt = `Create a ${tone} social media post about "${topic}" optimized for ${platform}.
      
Requirements:
- Tone: ${tone} voice
- Length: ${platform === 'Twitter' ? 'Under 280 characters' : platform === 'LinkedIn' ? '100-300 characters' : '100-200 characters'}
- Make it engaging and authentic
- Include relevant emoji if appropriate for the tone
- No hashtags
- Write in first person when appropriate

Just return the post text, nothing else.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a social media expert who writes engaging, authentic posts.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      generatedPost = data.choices[0].message.content.trim();
      
    } else {
      // FALLBACK TO TEMPLATES (if no API key)
      console.log('No OpenAI key found, using templates...');
      
      const templates = {
        professional: `Here's an insightful perspective on ${topic} that highlights its importance in today's landscape. This would be perfect for ${platform}.`,
        casual: `Let's chat about ${topic}! I've been thinking about this lately and wanted to share some thoughts. Great for ${platform}!`,
        humorous: `You know what's funny about ${topic}? This made me laugh and I had to share it on ${platform}!`,
        informative: `Did you know these facts about ${topic}? Here's what everyone should understand about this topic on ${platform}.`,
        inspirational: `Let ${topic} inspire you today! Here's a motivational take perfect for ${platform}.`
      };
      
      generatedPost = templates[tone] || templates.professional;
    }
    
    // Add timestamp
    const timestamp = new Date().toISOString();

    // Return successful response
    return res.status(200).json({
      success: true,
      post: generatedPost,
      recordId: 'temp-' + Date.now(),
      preferences: {
        topic: topic,
        tone: tone,
        platform: platform
      },
      generated_at: timestamp,
      ai_powered: apiKey ? true : false,
      message: apiKey ? 'Post generated with AI!' : 'Post generated (template mode - add OpenAI key for AI)'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate post',
      details: error.message,
      hint: 'Check if your OpenAI API key is set correctly in Vercel environment variables'
    });
  }
}
