import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        slug: true,
        photo: true,
        coverPhoto: true,
        email: true,
        phoneNumber: true,
        userLocation: true,
        zipcode: true,
        aboutYourself: true,
        outsideLinks: true,
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        active: true,
        enableNotification: true,
        notificationLanguage: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Profile retrieved successfully',
      user,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { email, firstName, lastName, ...rest } = updateProfileDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new BadRequestException('Email is already taken');
      }
    }

    // Generate new slug if name is being updated
    let slug = existingUser.slug;
    if (firstName || lastName) {
      const newFirstName = firstName || existingUser.firstName;
      const newLastName = lastName || existingUser.lastName;
      const fullName = `${newFirstName} ${newLastName}`;
      const timeString = new Date().getTime().toString().substr(7, 5);
      slug = `${slugify(fullName, { lower: true })}-${timeString}`;
    }

    // Prepare update data
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (slug !== existingUser.slug) updateData.slug = slug;
    if (rest.photo !== undefined) updateData.photo = rest.photo;
    if (rest.coverPhoto !== undefined) updateData.coverPhoto = rest.coverPhoto;
    if (rest.phoneNumber !== undefined)
      updateData.phoneNumber = rest.phoneNumber;
    if (rest.userLocation !== undefined)
      updateData.userLocation = rest.userLocation;
    if (rest.zipcode !== undefined) updateData.zipcode = rest.zipcode;
    if (rest.aboutYourself !== undefined)
      updateData.aboutYourself = rest.aboutYourself;
    if (rest.userTypeId) updateData.userTypeId = rest.userTypeId;
    if (rest.walletAddress !== undefined)
      updateData.walletAddress = rest.walletAddress;
    if (rest.outsideLinks !== undefined)
      updateData.outsideLinks = JSON.stringify(rest.outsideLinks);

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        slug: true,
        photo: true,
        coverPhoto: true,
        email: true,
        phoneNumber: true,
        userLocation: true,
        zipcode: true,
        aboutYourself: true,
        outsideLinks: true,
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        active: true,
        enableNotification: true,
        notificationLanguage: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async getUserBySlug(slug: string) {
    const user = await this.prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        slug: true,
        photo: true,
        coverPhoto: true,
        aboutYourself: true,
        outsideLinks: true,
        userType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userLocation: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  async deactivateAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        active: 'INACTIVE',
      },
    });

    return {
      message: 'Account deactivated successfully',
    };
  }
}
