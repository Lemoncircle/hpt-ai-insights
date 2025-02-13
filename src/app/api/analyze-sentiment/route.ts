import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key is not configured');
      return NextResponse.json(
        { sentiment: 'neutral' },
        { status: 200 }
      );
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-small-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with only one word: positive, neutral, or negative.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.statusText);
      return NextResponse.json(
        { sentiment: 'neutral' },
        { status: 200 }
      );
    }

    const data = await response.json();
    const sentiment = data.choices[0].message.content.toLowerCase().trim();

    // Validate sentiment
    if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
      return NextResponse.json({ sentiment: 'neutral' });
    }

    return NextResponse.json({ sentiment });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // Return neutral sentiment instead of error to prevent UI disruption
    return NextResponse.json(
      { sentiment: 'neutral' },
      { status: 200 }
    );
  }
} 