import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { BaseRepository } from './base.repository';
import { QueryOptions } from '../../../common/interfaces/repository.interface';

@Injectable()
export abstract class MongoRepository<
  T extends Document,
> extends BaseRepository<T> {
  constructor(protected model: Model<T>) {
    super();
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    return this.model.findOne(filter as any).exec();
  }

  async findMany(filter?: Partial<T>, options?: QueryOptions): Promise<T[]> {
    let query = this.model.find(filter as any);
    query = this.applyQueryOptions(query, options);
    return query.exec();
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.model
      .findByIdAndUpdate(id, data as any, {
        new: true,
      })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async count(filter?: Partial<T>): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }
}
