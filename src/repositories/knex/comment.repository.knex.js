import { db } from '../../db.js';

export function createKnexCommentRepository() {
  return {
    async findAll({ postId, page = 1, limit = 20 } = {}) {
      const query = db('comments').select('*');
      if (postId) query.where('post_id', postId);
      const offset = (page - 1) * limit;
      const data = await query.limit(limit).offset(offset);
      const countQuery = db('comments').count();
      if (postId) countQuery.where('post_id', postId);
      const [{ count }] = await countQuery;
      return { data, total: parseInt(count), page, limit };
    },
    async findById(id) {
      return db('comments').where({ id }).first();
    },
    async create(data) {
      const [comment] = await db('comments').insert(data).returning('*');
      return comment;
    },
    async update(id, data) {
      const [updated] = await db('comments').where({ id }).update(data).returning('*');
      return updated;
    },
    async remove(id) {
      return db('comments').where({ id }).del();
    },
  };
}