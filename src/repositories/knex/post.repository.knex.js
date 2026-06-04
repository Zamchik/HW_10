import { db } from '../../db.js';

export function createKnexPostRepository() {
  return {
    async findAll({ page = 1, limit = 20, tagId } = {}) {
      let query = db('posts as p')
        .select(
          'p.id', 'p.user_id', 'p.title', 'p.body', 'p.status',
          'p.created_at', 'p.updated_at',
          'u.id as author_id', 'u.name as author_name', 'u.email as author_email'
        )
        .leftJoin('users as u', 'p.user_id', 'u.id');

      if (tagId) {
        query = query
          .innerJoin('post_tags as pt', 'p.id', 'pt.post_id')
          .where('pt.tag_id', tagId);
      }

      const offset = (page - 1) * limit;
      const data = await query.clone().limit(limit).offset(offset);

      // Подсчёт общего количества (без пагинации)
      let countQuery = db('posts as p');
      if (tagId) {
        countQuery = countQuery
          .innerJoin('post_tags as pt', 'p.id', 'pt.post_id')
          .where('pt.tag_id', tagId);
      }
      const [{ count }] = await countQuery.count('*');
      const total = Number(count);

      // Для каждого поста подгружаем теги
      const postsWithTags = await Promise.all(
        data.map(async (post) => {
          const tags = await db('tags as t')
            .join('post_tags as pt', 't.id', 'pt.tag_id')
            .where('pt.post_id', post.id)
            .select('t.id', 't.name');
          return {
            id: post.id,
            userId: post.user_id,
            title: post.title,
            body: post.body,
            status: post.status,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            author: {
              id: post.author_id,
              name: post.author_name,
              email: post.author_email,
            },
            tags: tags.map(t => ({ id: t.id, name: t.name })),
          };
        })
      );

      return { data: postsWithTags, total, page, limit };
    },

    // findById с автором и тегами
    async findById(id) {
      const post = await db('posts as p')
        .select(
          'p.id', 'p.user_id', 'p.title', 'p.body', 'p.status',
          'p.created_at', 'p.updated_at',
          'u.id as author_id', 'u.name as author_name', 'u.email as author_email'
        )
        .leftJoin('users as u', 'p.user_id', 'u.id')
        .where('p.id', id)
        .first();

      if (!post) return null;

      const tags = await db('tags as t')
        .join('post_tags as pt', 't.id', 'pt.tag_id')
        .where('pt.post_id', id)
        .select('t.id', 't.name');

      return {
        id: post.id,
        userId: post.user_id,
        title: post.title,
        body: post.body,
        status: post.status,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          id: post.author_id,
          name: post.author_name,
          email: post.author_email,
        },
        tags: tags.map(t => ({ id: t.id, name: t.name })),
      };
    },

    // игнорирует tagIds, так как они вставляются отдельно (через createWithTags)
    async create(data) {
      const { tagIds, ...postData } = data;
      const [post] = await db('posts')
        .insert({
          user_id: postData.userId,
          title: postData.title,
          body: postData.body,
          status: postData.status || 'draft',
        })
        .returning('*');
      return this.findById(post.id);
    },

    // транзакция для создания поста с тегами
    async createWithTags({ userId, title, body = null, status = 'draft', tagIds = [] }) {
      return db.transaction(async (trx) => {
        const [post] = await trx('posts')
          .insert({ user_id: userId, title, body, status })
          .returning('*');

        if (tagIds && tagIds.length) {
          await trx('post_tags').insert(
            tagIds.map(tagId => ({ post_id: post.id, tag_id: tagId }))
          );
        }

        return this.findById(post.id);
      });
    },

    async update(id, data) {
      const fields = {};
      if (data.title !== undefined) fields.title = data.title;
      if (data.body !== undefined) fields.body = data.body;
      if (data.status !== undefined) fields.status = data.status;

      const [post] = await db('posts')
        .where({ id })
        .update(fields)
        .returning('*');

      return post ? this.findById(post.id) : null;
    },

    async remove(id) {
      const deleted = await db('posts').where({ id }).del();
      return deleted > 0;
    },
  };
}