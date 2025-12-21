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

  // ===================== NORMALIZER =====================
  private normalizeAnalysis(parsed: any) {
    return {
      explanation: parsed?.explanation ?? '',
      timeComplexity: parsed?.timeComplexity ?? '',
      spaceComplexity: parsed?.spaceComplexity ?? '',
      betterApproaches: Array.isArray(parsed?.betterApproaches)
        ? parsed.betterApproaches.map((a: any) => ({
            title: a?.title ?? '',
            description: a?.description ?? '',
            code: a?.code ?? '',
            timeComplexity: a?.timeComplexity ?? '',
            spaceComplexity: a?.spaceComplexity ?? '',
          }))
        : [],
      nextSteps: parsed?.nextSteps ?? '',
    };
  }

  // ===================== ANALYZE =====================
  async analyze(data: any) {
    try {
      // 🔐 Auth guard
      if (!data.email) {
        return { error: 'Please login to continue.' };
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

      // 🧠 STRICT STRUCTURED PROMPT
      const prompt = `
You are a competitive programming mentor.

Difficulty: ${finalLevel}

You MUST return VALID JSON ONLY.
NO markdown.
NO extra text.
NO merging of sections.

STRICT RULES:
- explanation: conceptual explanation ONLY
- timeComplexity: Big-O ONLY (example: O(n log n))
- spaceComplexity: Big-O ONLY
- betterApproaches: ARRAY (can be empty)
- nextSteps: learning advice ONLY
- If unsure, return EMPTY STRING "" but KEEP the key
- Time complexity and space complexity should be of the submitted code in complexity section.
- for better approaches Time complexity and space complexity should be of only that code.

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

      // 🛡️ SAFE PARSE
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const normalized = this.normalizeAnalysis(parsed);

      // 💾 SAVE SUBMISSION (NO topics!)
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
        return 'Not enough data yet.';
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

Keep it concise.

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
        console.warn('Groq rate limit hit');
        return 'Recommendations temporarily unavailable.';
      }
      throw err;
    }
  }
}
