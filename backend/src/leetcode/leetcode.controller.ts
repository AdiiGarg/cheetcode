import { Controller, Get, Query } from '@nestjs/common';
import { LeetCodeService } from './leetcode.service';

@Controller('leetcode')
export class LeetCodeController {
  constructor(private readonly service: LeetCodeService) {}

  @Get('fetch')
  async fetch(@Query('input') input: string) {
    if (!input) {
      return { error: 'Input required' };
    }
    return this.service.fetchProblem(input);
  }
}
