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

  // ===================== ANALYZE CODE =====================
  async analyze(data: any) {
    try {
      // 🔐 Auth guard
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

      // 🧠 STRUCTURED PROMPT (JSON ONLY)
      const prompt = `
You are a competitive programming mentor.

Difficulty: ${finalLevel}

Analyze the following submission and return ONLY valid JSON.
NO markdown. NO explanations outside JSON.

IMPORTANT RULES:
- Code MUST contain \\n for line breaks
- Code MUST be properly indented
- Do NOT compress code into one line
- Code must look like real editor code
- ALL fields MUST exist (use empty string "" if needed)

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

      // 🛡️ SAFE JSON PARSE
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

      // 💾 SAVE SUBMISSION (LEVEL IS FINAL & CORRECT)
      const submission = await this.prisma.submission.create({
        data: {
          problem: data.problem,
          code: data.code,
          analysis: raw,
          level: finalLevel,
          user: { connect: { id: user.id } },
        },
      });

      // ✅ FRONTEND RESPONSE
      return {
        id: submission.id,
        level: finalLevel,
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
      .map((s) => `Difficulty: ${s.level}\nProblem: ${s.problem}`)
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
