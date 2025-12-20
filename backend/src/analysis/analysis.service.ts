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

  // ===================== NORMALIZER (CRITICAL) =====================
  private normalizeAnalysis(parsed: any) {
    return {
      explanation: parsed?.explanation || '',
      timeComplexity: parsed?.timeComplexity || '',
      spaceComplexity: parsed?.spaceComplexity || '',
      betterApproaches: Array.isArray(parsed?.betterApproaches)
        ? parsed.betterApproaches.map((a: any) => ({
            title: a?.title || '',
            description: a?.description || '',
            code: a?.code || '',
            timeComplexity: a?.timeComplexity || '',
            spaceComplexity: a?.spaceComplexity || '',
          }))
        : [],
      nextSteps: parsed?.nextSteps || '',
    };
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

      // ✅ SINGLE SOURCE OF TRUTH FOR LEVEL
      const finalLevel =
        data.leetcodeDifficulty &&
        ['easy', 'medium', 'hard'].includes(data.leetcodeDifficulty)
          ? data.leetcodeDifficulty
          : 'medium';

      const prompt = `
You are a competitive programming mentor.

Difficulty: ${finalLevel}

You MUST return VALID JSON only.
DO NOT add any text outside JSON.
DO NOT merge sections.

STRICT RULES:
- explanation: concept only
- timeComplexity: Big-O only
- spaceComplexity: Big-O only
- betterApproaches: array (can be empty)
- nextSteps: learning advice only

JSON FORMAT (EXACT):
{
  "explanation": "",
  "timeComplexity": "",
  "spaceComplexity": "",
  "betterApproaches": [
    {
      "title": "",
      "description": "",
      "code": "",
      "timeComplexity": "",
      "spaceComplexity": ""
    }
  ],
  "nextSteps": ""
}

Problem:
${data.problem}

User Code:
${data.code}
`;

      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 900,
      });

      const raw = response.choices[0]?.message?.content || '{}';

      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const normalized = this.normalizeAnalysis(parsed);

      const submission = await this.prisma.submission.create({
        data: {
          problem: data.problem,
          code: data.code,
          analysis: raw,
          level: finalLevel,
          user: { connect: { id: user.id } },
        },
      });

      return {
        id: submission.id,
        level: finalLevel,
        analysis: normalized,
      };
    } catch (err) {
      console.error('Groq analyze error:', err);
      return {
        error: 'Analysis failed. Please try again later.',
      };
    }
  }

  // ===================== RECOMMENDATIONS =====================
  async getRecommendations(email: string) {
    try {
      const submissions = await this.prisma.submission.findMany({
        where: { user: { email } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (submissions.length === 0) {
        return 'Not enough data.';
      }

      const summary = submissions
        .map(
          (s) =>
            `Difficulty: ${s.level}\nProblem: ${s.problem.substring(0, 120)}`
        )
        .join('\n\n');

      const prompt = `
You are a competitive programming mentor.

Based on these submissions:
- Weak areas
- Topics to improve
- 3 next LeetCode problems

Be concise.

${summary}
`;

      const res = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      });

      return res.choices[0]?.message?.content || '';
    } catch (err: any) {
      if (err?.status === 429) {
        console.warn('Groq rate limit hit, skipping recommendations');
        return 'Recommendations temporarily unavailable.';
      }
      throw err;
    }
  }
}
