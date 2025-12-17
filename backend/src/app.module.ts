import { Module } from '@nestjs/common';
import { AnalysisModule } from './analysis/analysis.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [PrismaModule, AnalysisModule, UserModule, AuthModule],
})
export class AppModule {}
