import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Controller('analyze')
export class AnalysisController {
  constructor(
    private analysisService: AnalysisService,
    private prisma: PrismaService,
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
          email: email,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

}
