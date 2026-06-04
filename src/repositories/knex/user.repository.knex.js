import { db } from '../../db.js';

export function createKnexUserRepository() {
  return {
    async findAll({ page = 1, limit = 20, role } = {}) {
      const query = db('users').select('*');
      if (role) query.where('role', role);
      const offset = (page - 1) * limit;
      const data = await query.clone().limit(limit).offset(offset);
      const totalResult = await query.clone().clearSelect().clearOrder().count('id as count').first();
      const total = parseInt(totalResult?.count || 0);
      return { data, total, page, limit };
    },

    async findById(id) {
      const user = await db('users').where({ id }).first();
      return user || null;
    },

    async create(data) {
      const [user] = await db('users').insert(data).returning('*');
      return user;
    },

    async update(id, data) {
      const [updated] = await db('users').where({ id }).update(data).returning('*');
      return updated || null;
    },

    async remove(id) {
      const deleted = await db('users').where({ id }).del();
      return deleted > 0;
    },
  };
}