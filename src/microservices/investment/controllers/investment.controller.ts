import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InvestmentService } from '../services/investment.service';
import { ResponseHandler } from '../../../common/utils/response.handler';

interface InvestmentQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  campaignId?: string;
}

interface CreateInvestmentDto {
  campaignId: string;
  amount: number;
  paymentMethod?: string;
}

@Controller('investments')
export class InvestmentController {
  constructor(private investmentService: InvestmentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllInvestments(@Query() query: InvestmentQueryDto, @Req() req: any) {
    const investments = await this.investmentService.getAllInvestments(
      query,
      req.user.id
    );
    return ResponseHandler.success(
      'Investments retrieved successfully',
      200,
      investments
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getInvestmentById(@Param('id') id: string, @Req() req: any) {
    const investment = await this.investmentService.getInvestmentById(
      id,
      req.user.id
    );
    return ResponseHandler.success(
      'Investment retrieved successfully',
      200,
      investment
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvestment(
    @Body(ValidationPipe) createInvestmentDto: CreateInvestmentDto,
    @Req() req: any
  ) {
    const investment = await this.investmentService.createInvestment(
      createInvestmentDto,
      req.user.id
    );
    return ResponseHandler.created(
      'Investment created successfully',
      investment
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelInvestment(@Param('id') id: string, @Req() req: any) {
    const investment = await this.investmentService.cancelInvestment(
      id,
      req.user.id
    );
    return ResponseHandler.success(
      'Investment cancelled successfully',
      200,
      investment
    );
  }

  @Get('campaign/:campaignId')
  async getInvestmentsByCampaign(
    @Param('campaignId') campaignId: string,
    @Query() query: InvestmentQueryDto
  ) {
    const investments = await this.investmentService.getInvestmentsByCampaign(
      campaignId,
      query
    );
    return ResponseHandler.success(
      'Campaign investments retrieved successfully',
      200,
      investments
    );
  }
}
