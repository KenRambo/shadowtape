// app/api/generate-quiz/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { action, recentCandles, confluenceOptions } = await request.json();

    // Build detailed candlestick description for prompt
    const barsText = recentCandles
      .map((c: any) =>
        `• Time: ${new Date(c.time * 1000).toISOString()}, Open: ${c.open}, High: ${c.high}, Low: ${c.low}, Close: ${c.close}`
      )
      .join('\n');

    // Describe selected confluence signals
    const confluenceText = confluenceOptions && confluenceOptions.length
      ? `\n
Confluence signals in play: ${confluenceOptions.join(', ')}.`
      : '';

    const prompt = `You are an expert technical analysis coach. A user has chosen to go ${action} after observing these recent candlestick bars and market context:${confluenceText}

${barsText}

Using advanced technical analysis concepts (e.g., trendlines, support/resistance zones, moving averages, RSI, MACD, volume patterns, chart patterns, and specified Strat/ICT confluences), generate a robust multiple-choice question:
1. 'question': A concise question asking why this trade makes sense based on the setup.
2. 'options': An array of exactly 3 plausible, detailed TA-based reasons (one correct, two distractors) that reference indicators, patterns, or confluence signals.
3. 'correctIndex': The 0-based index of the best answer.
4. 'feedback': Specific feedback for each option, explaining why it's correct or not, citing TA principles and any selected confluences.

Return only valid JSON. No markdown or code fences.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Produce precise JSON based on technical analysis.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response');
    const quiz = JSON.parse(match[0]);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
