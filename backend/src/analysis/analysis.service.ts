import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisService {
  private openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ===================== AUTO DIFFICULTY DETECTION =====================
  private async detectDifficulty(
    problem: string,
    code: string,
  ): Promise<'easy' | 'medium' | 'hard'> {
    const prompt = `
You are a competitive programming expert.

Based on the problem statement and solution code below,
classify the difficulty as ONE of:
easy, medium, hard.

Return ONLY one word.

Problem:
${problem}

Code:
${code}
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      response.choices[0].message.content
        ?.toLowerCase()
        .trim() || 'easy';

    if (raw.includes('hard')) return 'hard';
    if (raw.includes('medium')) return 'medium';
    return 'easy';
  }

  // ===================== ANALYZE CODE =====================
  async analyze(data: any) {
    try {
      // 🔐 Auth guard
      if (!data.email) {
        return { result: 'User not authenticated.' };
      }

      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return { result: 'User not found in database.' };
      }

      // 🔍 Detect difficulty FIRST
      const detectedLevel = await this.detectDifficulty(
        data.problem,
        data.code,
      );

      // 🧠 Main analysis prompt
      const prompt = `
You are a competitive programming mentor.

Detected difficulty: ${detectedLevel}

Problem:
${data.problem}

User code:
${data.code}

Tasks:
1. Explain the approach
2. Point out mistakes
3. Suggest 3 better approaches
4. Rewrite optimized code
5. Give key takeaways
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const analysisText =
        response.choices[0].message.content ?? '';

      // 💾 Save submission
      const submission = await this.prisma.submission.create({
        data: {
          problem: data.problem,
          code: data.code,
          analysis: analysisText,
          level: detectedLevel, // easy | medium | hard
          user: {
            connect: { id: user.id },
          },
        },
      });

      return {
        id: submission.id,
        result: submission.analysis,
        level: detectedLevel,
      };
    } catch (error) {
      console.error('Analyze error:', error);
      return {
        result:
          'Error while analyzing code. Please check backend logs for details.',
      };
    }
  }

  // ===================== AI RECOMMENDATIONS =====================
  async getRecommendations(email: string) {
    const submissions = await this.prisma.submission.findMany({
      where: {
        user: { email },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (submissions.length === 0) {
      return 'Not enough data to generate recommendations.';
    }

    const summary = submissions
      .map(
        (s, i) =>
          `${i + 1}. Difficulty: ${s.level}\nProblem: ${s.problem}`,
      )
      .join('\n\n');

    const prompt = `
You are a competitive programming mentor.

Based on the following recent submissions:

${summary}

Identify:
1. Weak areas
2. Topics to improve
3. 3 recommended next problem types (LeetCode focused)

Be concise and actionable.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content ?? '';
  }
}
