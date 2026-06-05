import { prisma } from '../../prisma.js';

export function createPrismaTagRepository() {
  return {
    async findAll({ page = 1, limit = 20 } = {}) {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        prisma.tag.findMany({ skip, take: limit, orderBy: { id: 'asc' } }),
        prisma.tag.count(),
      ]);
      return { data, total, page, limit };
    },
    async findById(id) {
      return prisma.tag.findUnique({ where: { id } });
    },
    async findByName(name) {
      return prisma.tag.findUnique({ where: { name } });
    },
    async create(data) {
      return prisma.tag.create({ data });
    },
    async update(id, data) {
      return prisma.tag.update({ where: { id }, data });
    },
    async remove(id) {
      await prisma.tag.delete({ where: { id } });
      return true;
    },
    // доп. метод для получения тегов поста
    async findByPostId(postId) {
      const postTags = await prisma.postTag.findMany({
        where: { postId },
        include: { tag: true },
      });
      return postTags.map(pt => pt.tag);
    },
  };
}