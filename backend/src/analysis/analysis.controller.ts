import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analyze')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async analyze(@Body() body: any) {
    return this.analysisService.analyze(body);
  }

  @Get('my-submissions')
  async mySubmissions(@Query('email') email: string) {
    if (!email) {
      return [];
    }

    return this.prisma.submission.findMany({
      where: {
        user: {
          email,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  @Get('stats')
  async stats(@Query('email') email: string) {
    if (!email) {
      return {
        total: 0,
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      };
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        user: {
          email,
        },
      },
    });

    const stats = {
      total: submissions.length,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    submissions.forEach((s) => {
      if (stats[s.level] !== undefined) {
        stats[s.level]++;
      }
    });

    return stats;
  }
  @Get('recommendations')
  async recommendations(@Query('email') email: string) {
    if (!email) {
      return {
        result: 'Email is required to generate recommendations.',
      };
    }
  
    const result = await this.analysisService.getRecommendations(email);
    return { result };
  }
  
}
