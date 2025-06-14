import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 });
    }

    // Log the prompt for debugging
    console.log('Prompt sent to Perplexity AI:', prompt);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.7,
        stream: false
      }),
    });

    const data = await response.json();

    // Log the raw response for debugging
    console.log('Raw response from Perplexity AI:', JSON.stringify(data, null, 2));

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: 'No content returned from AI' }, { status: 500 });
    }

    return NextResponse.json({ report: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 