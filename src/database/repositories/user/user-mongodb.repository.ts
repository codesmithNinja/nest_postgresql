import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoRepository } from '../base/mongodb.repository';
import { IUserRepository } from './user.repository.interface';
import { User, UserDocument } from '../../schemas/user.schema';
import { ActiveStatus } from '../../../common/enums/database-type.enum';

@Injectable()
export class UserMongoRepository
  extends MongoRepository<UserDocument>
  implements IUserRepository
{
  constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ email }).exec();
  }

  async findBySlug(slug: string): Promise<User | null> {
    return this.model
      .findOne({ slug })
      .select(
        'firstName lastName slug photo coverPhoto aboutYourself outsideLinks userTypeId userLocation walletAddress createdAt'
      )
      .exec();
  }

  async findByActivationToken(token: string): Promise<User | null> {
    return this.model
      .findOne({
        accountActivationToken: token,
        active: ActiveStatus.PENDING,
      })
      .exec();
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.model
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();
  }

  async activateUser(id: string): Promise<User> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          active: ActiveStatus.ACTIVE,
          accountActivationToken: null,
        },
        { new: true }
      )
      .exec();
  }

  async deactivateUser(id: string): Promise<User> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          active: ActiveStatus.INACTIVE,
        },
        { new: true }
      )
      .exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.model
      .findByIdAndUpdate(
        id,
        {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
        },
        { new: true }
      )
      .exec();
  }
}
