// api/generate-post.js
// This is your serverless function that will generate posts

export default async function handler(req, res) {
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
    // For now, we'll use templates (we'll add AI later)
    // This is just to test that everything connects properly
    const templates = {
      professional: `Here's an insightful perspective on ${topic} that highlights its importance in today's landscape. This would be perfect for ${platform}.`,
      casual: `Let's chat about ${topic}! I've been thinking about this lately and wanted to share some thoughts. Great for ${platform}!`,
      humorous: `You know what's funny about ${topic}? This made me laugh and I had to share it on ${platform}!`,
      informative: `Did you know these facts about ${topic}? Here's what everyone should understand about this topic on ${platform}.`,
      inspirational: `Let ${topic} inspire you today! Here's a motivational take perfect for ${platform}.`
    };

    // Select the appropriate template
    const generatedPost = templates[tone] || templates.professional;
    
    // Add timestamp
    const timestamp = new Date().toISOString();

    // Return successful response
    return res.status(200).json({
      success: true,
      post: generatedPost,
      recordId: 'test-' + Date.now(), // Temporary ID for testing
      preferences: {
        topic: topic,
        tone: tone,
        platform: platform
      },
      generated_at: timestamp,
      message: 'Post generated successfully (template mode)'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate post',
      details: error.message 
    });
  }
}
