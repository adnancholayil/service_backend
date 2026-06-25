import { Schema, model } from 'mongoose';
import { IBanner } from '../interfaces/banner.interface';

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Banner = model<IBanner>('Banner', BannerSchema);
