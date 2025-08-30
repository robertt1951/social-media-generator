// api/generate-post.js
// Complete version with AI generation AND Airtable saving!

export default async function handler(req, res) {
  // Add CORS headers
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
    const openaiKey = process.env.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
    
    let generatedPost;
    
    if (openaiKey && openaiKey.startsWith('sk-')) {
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
          'Authorization': `Bearer ${openaiKey}`
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
      // FALLBACK TO TEMPLATES
      console.log('No OpenAI key found, using templates...');
      
      const templates = {
        professional: `Exploring the importance of ${topic} in today's professional landscape. What are your thoughts on this?`,
        casual: `Just thinking about ${topic} today. Anyone else find this fascinating?`,
        humorous: `${topic} is like that friend who always shows up uninvited but somehow makes everything better 😄`,
        informative: `Key insight about ${topic}: Understanding its impact can transform how we approach our daily challenges.`,
        inspirational: `${topic} reminds us that every challenge is an opportunity for growth. Keep pushing forward! 💪`
      };
      
      generatedPost = templates[tone] || templates.professional;
    }
    
    // SAVE TO AIRTABLE
    let airtableRecord = null;
    const airtableKey = process.env.pattUlzsgrisYYASN.2263e66d7f10d51b11fcad3c35f3f97bad9610a46f8266353e6dbd04d7298406;
    const airtableBase = process.env.apptBcLqWiroAs0DV;
    
    if (airtableKey && airtableBase) {
      console.log('Saving to Airtable...');
      
      try {
        const airtableResponse = await fetch(
          `https://api.airtable.com/v0/${airtableBase}/PostIdeas`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${airtableKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              records: [
                {
                  fields: {
                    Content: generatedPost,
                    Topic: topic,
                    Tone: tone,
                    Platform: platform,
                    Status: 'draft',
                    CreatedDate: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
                  }
                }
              ]
            })
          }
        );

        if (!airtableResponse.ok) {
          const errorText = await airtableResponse.text();
          console.error('Airtable error:', errorText);
          throw new Error(`Airtable error: ${airtableResponse.status}`);
        }

        const airtableData = await airtableResponse.json();
        airtableRecord = airtableData.records[0];
        console.log('Saved to Airtable with ID:', airtableRecord.id);
        
      } catch (airtableError) {
        console.error('Airtable save failed:', airtableError);
        // Don't fail the whole request if Airtable fails
        // Just log the error and continue
      }
    } else {
      console.log('Airtable credentials not configured');
    }
    
    // Return successful response
    return res.status(200).json({
      success: true,
      post: generatedPost,
      recordId: airtableRecord ? airtableRecord.id : 'not-saved',
      preferences: {
        topic: topic,
        tone: tone,
        platform: platform
      },
      generated_at: new Date().toISOString(),
      ai_powered: openaiKey ? true : false,
      saved_to_airtable: airtableRecord ? true : false,
      message: airtableRecord 
        ? '✅ Post generated with AI and saved to Airtable!' 
        : openaiKey 
          ? '⚠️ Post generated with AI (Airtable not configured)'
          : '⚠️ Post generated (template mode)'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate post',
      details: error.message,
      hint: 'Check your API keys in Vercel environment variables'
    });
  }
}
