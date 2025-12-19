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
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `
Classify difficulty as ONE word only:
easy, medium, or hard.

Problem:
${problem}

Code:
${code}
`,
        },
      ],
    });

    const raw =
      response.choices[0].message.content?.toLowerCase() ?? 'easy';

    if (raw.includes('hard')) return 'hard';
    if (raw.includes('medium')) return 'medium';
    return 'easy';
  }

  // ===================== ANALYZE CODE =====================
  async analyze(data: any) {
    try {
      if (!data.email) {
        return { error: 'User not authenticated' };
      }

      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        return { error: 'User not found' };
      }

      const detectedLevel = await this.detectDifficulty(
        data.problem,
        data.code,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' }, // 🔥 FORCE JSON
        messages: [
          {
            role: 'user',
            content: `
You are a competitive programming mentor.

Return ONLY valid JSON in this format:

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
`,
          },
        ],
      });

      const parsedAnalysis = JSON.parse(
        response.choices[0].message.content ?? '{}',
      );

      // 💾 Save submission (raw JSON saved for history)
      const submission = await this.prisma.submission.create({
        data: {
          problem: data.problem,
          code: data.code,
          analysis: JSON.stringify(parsedAnalysis),
          level: detectedLevel,
          user: {
            connect: { id: user.id },
          },
        },
      });

      // ✅ FINAL API RESPONSE
      return {
        id: submission.id,
        level: detectedLevel,
        analysis: parsedAnalysis,
      };
    } catch (error) {
      console.error('Analyze error:', error);
      return {
        error: 'Error while analyzing code.',
      };
    }
  }

  // ===================== AI RECOMMENDATIONS =====================
  async getRecommendations(email: string) {
    const submissions = await this.prisma.submission.findMany({
      where: { user: { email } },
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

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `
Based on these submissions:

${summary}

Tell:
1. Weak areas
2. Topics to improve
3. 3 next LeetCode problem types
`,
        },
      ],
    });

    return response.choices[0].message.content ?? '';
  }
}
