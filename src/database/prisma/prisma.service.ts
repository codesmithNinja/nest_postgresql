import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    const dbType = this.configService.get<string>('DATABASE_TYPE');
    if (dbType === 'postgres') {
      await this.$connect();
    }
  }
}
