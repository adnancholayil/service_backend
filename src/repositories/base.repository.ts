import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(item: Partial<T>): Promise<T> {
    return this.model.create(item);
  }

  async findById(
    id: string,
    select?: string,
    populate?: any
  ): Promise<T | null> {
    let query: any = this.model.findById(id);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    select?: string,
    populate?: any
  ): Promise<T | null> {
    let query: any = this.model.findOne(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return query.exec();
  }

  async find(
    filter: FilterQuery<T>,
    select?: string,
    populate?: any,
    sort?: any
  ): Promise<T[]> {
    let query: any = this.model.find(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    if (sort) query = query.sort(sort);
    return query.exec();
  }

  async update(id: string, item: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, item, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async paginate(
    filter: FilterQuery<T>,
    page = 1,
    limit = 10,
    sort: any = { createdAt: -1 },
    populate: any = null
  ): Promise<{ data: T[]; total: number; page: number; pages: number }> {
    const skip = (page - 1) * limit;
    
    let query: any = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) {
      query = query.populate(populate);
    }

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
