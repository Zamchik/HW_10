import { prisma } from '../prisma.js';

async function badExample() {
  console.time('N+1');
  const posts = await prisma.post.findMany();
  for (const post of posts) {
    const user = await prisma.user.findUnique({ where: { id: post.userId } });
    console.log(`"${post.title}" by ${user.name}`);
  }
  console.timeEnd('N+1'); // много запросов
}

async function goodExample() {
  console.time('Include');
  const posts = await prisma.post.findMany({
    include: { user: { select: { name: true } } },
  });
  for (const post of posts) {
    console.log(`"${post.title}" by ${post.user.name}`);
  }
  console.timeEnd('Include'); // всего 1-2 запроса
}

badExample().then(() => goodExample()).finally(() => prisma.$disconnect());