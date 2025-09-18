import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtUserGuard } from '../../common/guards/jwt-user.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import { RequestWithUser } from '../../common/types/user.types';

@Controller('users')
@UseGuards(JwtUserGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('change-password')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Get('slug/:slug')
  async getUserBySlug(@Param('slug') slug: string) {
    return this.usersService.getUserBySlug(slug);
  }

  @Delete('deactivate')
  async deactivateAccount(@Req() req: RequestWithUser) {
    return this.usersService.deactivateAccount(req.user.id);
  }
}
