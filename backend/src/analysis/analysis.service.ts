import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class AnalysisService {
  private groq: Groq;

  constructor(private readonly prisma: PrismaService) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  // ===================== AUTO DIFFICULTY DETECTION =====================
  private async detectDifficulty(
    problem: string,
    code: string,
  ): Promise<'easy' | 'medium' | 'hard'> {
    const prompt = `
Classify the difficulty of this coding problem.
Return ONLY one word: easy | medium | hard.

Problem:
${problem}

Code:
${code}
`;

    const res = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      res.choices[0]?.message?.content?.toLowerCase().trim() || 'easy';

    if (raw.includes('hard')) return 'hard';
    if (raw.includes('medium')) return 'medium';
    return 'easy';
  }

  // ===================== ANALYZE CODE =====================
  async analyze(data: any) {
    try {
      if (!data.email) {
        return { error: 'User not authenticated.' };
      }

      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return { error: 'User not found.' };
      }

      const detectedLevel = await this.detectDifficulty(
        data.problem,
        data.code,
      );

      const prompt = `
You are a competitive programming mentor.

Return ONLY valid JSON.
No markdown. No explanation outside JSON.

JSON FORMAT:
{
  "explanation": string,
  "timeComplexity": string,
  "spaceComplexity": string,
  "betterApproaches": [
    {
      "title": string,
      "description": string,
      "code": string,
      "timeComplexity": string,
      "spaceComplexity": string
    }
  ],
  "nextSteps": string
}

Problem:
${data.problem}

User Code:
${data.code}
`;

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content || '{}';

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {
          explanation: raw,
          timeComplexity: '',
          spaceComplexity: '',
          betterApproaches: [],
          nextSteps: '',
        };
      }

      const submission = await this.prisma.submission.create({
        data: {
          problem: data.problem,
          code: data.code,
          analysis: raw,
          level: detectedLevel,
          user: { connect: { id: user.id } },
        },
      });

      return {
        id: submission.id,
        level: detectedLevel,
        analysis: parsed,
      };
    } catch (err) {
      console.error('Groq analyze error:', err);
      return {
        error: 'Analysis failed. Check backend logs.',
      };
    }
  }

  // ===================== RECOMMENDATIONS =====================
  async getRecommendations(email: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { user: { email } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (submissions.length === 0) {
      return 'Not enough data.';
    }

    const summary = submissions
      .map((s) => `Level: ${s.level}\nProblem: ${s.problem}`)
      .join('\n\n');

    const prompt = `
Based on these submissions, suggest:
1. Weak areas
2. Topics to improve
3. 3 next LeetCode problems

${summary}
`;

    const res = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    });

    return res.choices[0]?.message?.content || '';
  }
}
