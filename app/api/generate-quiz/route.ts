// app/api/generate-quiz/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    // Validate and parse request body
    interface Candle { time: number; open: number; high: number; low: number; close: number; }
    interface QuizRequest { action: 'LONG' | 'SHORT' | 'NONE'; recentCandles: Candle[]; }
    const { action, recentCandles } = (await request.json()) as QuizRequest;

    // Build detailed candlestick description for prompt
    const barsText = recentCandles
      .map((c) =>
        `• Time: ${new Date(c.time * 1000).toISOString()}, Open: ${c.open}, High: ${c.high}, Low: ${c.low}, Close: ${c.close}`
      )
      .join('\n');

    const prompt = `You are an expert technical analysis coach. A user has chosen to go ${action} after observing these recent candlestick bars and associated market context:
${barsText}

Using advanced technical analysis concepts (e.g., trendlines, support/resistance zones, moving averages, RSI, MACD, volume patterns, chart patterns), generate a robust multiple-choice question:
1. 'question': A clear, concise question asking why this trade makes sense.
2. 'options': An array of exactly 3 plausible, detailed TA-based reasons (one correct, two distractors) that reference indicators, patterns, or price action.
3. 'correctIndex': The index (0-based) of the best answer.
4. 'feedback': Provide specific informative feedback for each option, explaining why it's correct or not, and referencing TA principles.

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
    if (!match) throw new Error('No JSON found');
    const quiz = JSON.parse(match[0]);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
