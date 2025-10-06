import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordType } from '../../common/enums/database-type.enum';

export type SettingsDocument = Settings & Document;

@Schema({
  collection: 'settings',
  timestamps: true,
  versionKey: false,
})
export class Settings {
  @Prop({ required: true, trim: true })
  groupType!: string;

  @Prop({
    type: String,
    enum: RecordType,
    default: RecordType.STRING,
    required: true,
  })
  recordType!: RecordType;

  @Prop({ required: true, trim: true, lowercase: true })
  key!: string;

  @Prop({ required: true, trim: true })
  value!: string;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// Create compound unique index for groupType and key
SettingsSchema.index({ groupType: 1, key: 1 }, { unique: true });

// Create index on groupType for performance
SettingsSchema.index({ groupType: 1 });

// Auto-update updatedAt field on save
SettingsSchema.pre('save', function (this: SettingsDocument) {
  this.updatedAt = new Date();
});

// Auto-update updatedAt field on update operations
SettingsSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  this.set({ updatedAt: new Date() });
});
