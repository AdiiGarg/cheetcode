import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LeetCodeService {
  async fetchProblem(input: string) {
    // Extract slug from URL
    const slug = input.split('/problems/')[1]?.split('/')[0];

    if (!slug) {
      throw new Error('Invalid LeetCode URL');
    }

    const query = {
      query: `
        query getQuestionDetail($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
            difficulty
            content
          }
        }
      `,
      variables: { titleSlug: slug },
    };

    const res = await axios.post(
      'https://leetcode.com/graphql',
      query,
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
        },
      }
    );

    const q = res.data?.data?.question;

    if (!q) {
      throw new Error('Question not found');
    }

    return {
      title: q.title,
      difficulty: q.difficulty.toLowerCase(),
      description: this.stripHtml(q.content),
    };
  }

  // 🔥 IMPORTANT: HTML → Plain text
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')   // remove tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }
}
