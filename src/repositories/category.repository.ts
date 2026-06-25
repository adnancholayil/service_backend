import { BaseRepository } from './base.repository';
import { ICategory } from '../interfaces/category.interface';
import { Category } from '../models/Category';

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(Category);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return this.model.findOne({ slug }).exec();
  }
}
