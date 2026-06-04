import { db } from '../../db.js';

export function createKnexTagRepository() {
  return {
    async findAll() {
      const data = await db('tags').select('*');
      return data;
    },

    async findById(id) {
      const tag = await db('tags').where({ id }).first();
      return tag || null;
    },

    async create(data) {
      const [tag] = await db('tags').insert(data).returning('*');
      return tag;
    },

    async update(id, data) {
      const [updated] = await db('tags').where({ id }).update(data).returning('*');
      return updated || null;
    },

    async remove(id) {
      const deleted = await db('tags').where({ id }).del();
      return deleted > 0;
    },
  };
}