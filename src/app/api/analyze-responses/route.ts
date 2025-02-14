import { NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

// Helper function to clean text from markdown and special characters
function cleanText(text: string): string {
  return text
    .replace(/\*\*?|##?|`|\\|\[|\]|\{|\}/g, '') // Remove markdown characters
    .replace(/^[-•*+]\s*/gm, '') // Remove list markers
    .replace(/\n+/g, ' ') // Replace multiple newlines with single space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

export async function POST(request: Request) {
  try {
    const { responses } = await request.json();
    console.log('API received responses:', responses);

    if (!responses || !Array.isArray(responses)) {
      console.error('Invalid responses format:', responses);
      return NextResponse.json(
        { error: 'Invalid responses format' },
        { status: 400 }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key is not configured');
      return NextResponse.json(
        { error: 'AI analysis service is not configured' },
        { status: 500 }
      );
    }

    // Format the responses into a readable format for the AI
    const formattedResponses = responses
      .map(r => `Question: "${r.question}"\nResponse: "${r.answer}"\nCategory: ${r.section}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: 'You are an expert HR analyst. Provide clear, specific insights about the employee in plain text format without any special characters, markdown, or formatting. Use simple periods and commas for punctuation.'
      },
      {
        role: 'user',
        content: `Analyze these survey responses and provide a concise analysis (max 250 words) in plain text:

${formattedResponses}

Provide your response in exactly this format, using plain text only:

Individual Traits:
Write 2-3 key personality traits and work preferences as simple statements.

Growth Opportunities:
Write 2-3 specific areas for professional development as simple statements.

Manager Support Recommendations:
Write 2-3 concrete actions for managers as simple statements.

Important: Do not use any special characters, bullet points, or markdown formatting. Write in plain text only.`
      }
    ];

    console.log('Sending request to Perplexity API...');
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: 'sonar',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 0.7,
          stream: false
        })
      });

      console.log('API Response Status:', response.status);
      const responseText = await response.text();
      console.log('API Response Text:', responseText);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed API Response:', data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      const analysisText = data.choices[0].message.content;
      console.log('Raw Analysis:', analysisText);

      // Parse sections with more precise regex
      const sections = {
        traits: '',
        growth: '',
        managerSupport: ''
      };

      const traitsMatch = analysisText.match(/Individual Traits:[\r\n]*([\s\S]*?)(?=\s*Growth Opportunities:|$)/i);
      const growthMatch = analysisText.match(/Growth Opportunities:[\r\n]*([\s\S]*?)(?=\s*Manager Support Recommendations:|$)/i);
      const supportMatch = analysisText.match(/Manager Support Recommendations:[\r\n]*([\s\S]*?)$/i);

      // Clean and format each section
      sections.traits = cleanText(traitsMatch?.[1]?.trim() || 'Unable to analyze traits at this time.');
      sections.growth = cleanText(growthMatch?.[1]?.trim() || 'Unable to analyze growth opportunities at this time.');
      sections.managerSupport = cleanText(supportMatch?.[1]?.trim() || 'Unable to provide manager support recommendations at this time.');

      // Validate meaningful content
      const hasValidContent = Object.values(sections).every(section => 
        section && 
        !section.includes('Unable to') && 
        section.length >= 10
      );

      if (!hasValidContent) {
        throw new Error('Failed to generate meaningful analysis');
      }

      console.log('Final parsed sections:', sections);
      return NextResponse.json(sections);

    } catch (apiError: any) {
      console.error('API or Parsing Error:', apiError);
      return NextResponse.json({
        traits: 'Unable to analyze traits at this time.',
        growth: 'Unable to analyze growth opportunities at this time.',
        managerSupport: 'Unable to provide manager support recommendations at this time.'
      });
    }

  } catch (error) {
    console.error('Request Processing Error:', error);
    return NextResponse.json({
      traits: 'Unable to analyze traits at this time.',
      growth: 'Unable to analyze growth opportunities at this time.',
      managerSupport: 'Unable to provide manager support recommendations at this time.'
    });
  }
} 