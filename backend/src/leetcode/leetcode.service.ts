import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LeetCodeService {
  private LEETCODE_URL = 'https://leetcode.com/graphql';

  private extractSlug(input: string): string {
    // Link
    if (input.includes('leetcode.com/problems/')) {
      return input.split('/problems/')[1].split('/')[0];
    }

    // Number → map later (phase-2)
    if (/^\d+$/.test(input)) {
      throw new Error('Question number mapping coming in Phase-2');
    }

    // Assume slug
    return input.trim();
  }

  async fetchProblem(input: string) {
    const slug = this.extractSlug(input);

    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          difficulty
          content
          exampleTestcases
          topicTags {
            name
          }
        }
      }
    `;

    const res = await axios.post(
      this.LEETCODE_URL,
      {
        query,
        variables: { titleSlug: slug },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const q = res.data?.data?.question;

    if (!q) {
      return { error: 'Problem not found' };
    }

    return {
      id: q.questionId,
      title: q.title,
      difficulty: q.difficulty,
      statement: q.content, // HTML
      examples: q.exampleTestcases,
      topics: q.topicTags.map((t) => t.name),
    };
  }
}
