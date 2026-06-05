import { prisma } from '../../prisma.js';

export function createPrismaPostRepository({ tagRepo }) {
  return {
    async findAll({ page = 1, limit = 20, tagId } = {}) {
      const skip = (page - 1) * limit;
      const where = {};
      if (tagId) {
        where.tags = { some: { tagId } };
      }
      const [data, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { comments: true } },
          },
        }),
        prisma.post.count({ where }),
      ]);
      const formatted = data.map(post => ({
        id: post.id,
        userId: post.userId,
        title: post.title,
        body: post.body,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.user,
        commentsCount: post._count.comments,
      }));
      return { data: formatted, total, page, limit };
    },

    async findById(id) {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tags: {
            include: { tag: true },
          },
          comments: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!post) return null;
      return {
        id: post.id,
        userId: post.userId,
        title: post.title,
        body: post.body,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.user,
        tags: post.tags.map(pt => pt.tag),
        comments: post.comments.map(c => ({
          id: c.id,
          postId: c.postId,
          authorId: c.authorId,
          body: c.body,
          createdAt: c.createdAt,
          authorName: c.author?.name,
        })),
      };
    },

    async create(data) {
      const { tagIds, ...postData } = data;
      const post = await prisma.post.create({
        data: {
          userId: postData.userId,
          title: postData.title,
          body: postData.body,
          status: postData.status || 'draft',
        },
      });
      return this.findById(post.id);
    },

    async createWithTags({ userId, title, body = null, status = 'draft', tagIds = [] }) {
      return prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
          data: {
            userId,
            title,
            body,
            status,
          },
        });
        if (tagIds.length) {
          await tx.postTag.createMany({
            data: tagIds.map(tagId => ({ postId: post.id, tagId })),
          });
        }
        return this.findById(post.id);
      });
    },

    async update(id, data) {
      const { tagIds, ...updateData } = data;
      const post = await prisma.post.update({
        where: { id },
        data: updateData,
      });
      return this.findById(post.id);
    },

    async remove(id) {
      await prisma.post.delete({ where: { id } });
      return true;
    },
  };
}