import { prisma } from '../../prisma.js';

export function createPrismaUserRepository() {
  return {
    async findAll({ page = 1, limit = 20, role } = {}) {
      const where = {};
      if (role) where.role = role;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.user.count({ where }),
      ]);
      return { data, total, page, limit };
    },
    async findById(id) {
      return prisma.user.findUnique({ where: { id } });
    },
    async create(data) {
      return prisma.user.create({ data });
    },
    async update(id, data) {
      return prisma.user.update({ where: { id }, data });
    },
    async remove(id) {
      await prisma.user.delete({ where: { id } });
      return true;
    },
  };
}