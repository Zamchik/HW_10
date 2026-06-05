import { prisma } from '../../prisma.js';

export function createPrismaCommentRepository() {
  return {
    async findAll({ postId, page = 1, limit = 20 } = {}) {
      const where = {};
      if (postId) where.postId = postId;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        prisma.comment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.comment.count({ where }),
      ]);
      return { data, total, page, limit };
    },
    async findById(id) {
      return prisma.comment.findUnique({ where: { id } });
    },
    async create(data) {
      return prisma.comment.create({ data });
    },
    async update(id, data) {
      return prisma.comment.update({ where: { id }, data });
    },
    async remove(id) {
      await prisma.comment.delete({ where: { id } });
      return true;
    },
  };
}