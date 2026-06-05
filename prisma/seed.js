import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Очистка в правильном порядке
  await prisma.postTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  // Сброс счётчиков (только для PostgreSQL)
  await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE tags_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE posts_id_seq RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE comments_id_seq RESTART WITH 1`;

  // Пользователи
  const users = await prisma.user.createMany({
    data: [
      { email: 'alice@example.com', name: 'Alice', role: 'admin' },
      { email: 'bob@example.com', name: 'Bob', role: 'user' },
      { email: 'carol@example.com', name: 'Carol', role: 'user' },
      { email: 'dave@example.com', name: 'Dave', role: 'user' },
      { email: 'eve@example.com', name: 'Eve', role: 'admin' },
    ],
  });

  // Теги
  const tags = await prisma.tag.createMany({
    data: [
      { name: 'technology' },
      { name: 'health' },
      { name: 'travel' },
      { name: 'food' },
      { name: 'lifestyle' },
    ],
  });

  // Получаем созданные id
  const allUsers = await prisma.user.findMany();
  const allTags = await prisma.tag.findMany();

  // Посты (по 2 на пользователя)
  for (const user of allUsers) {
    for (let i = 1; i <= 2; i++) {
      await prisma.post.create({
        data: {
          userId: user.id,
          title: `Post ${i} by ${user.name}`,
          body: `Content of post ${i} by ${user.name}`,
          status: i === 1 ? 'draft' : 'published',
        },
      });
    }
  }

  // Комментарии (20 шт)
  const allPosts = await prisma.post.findMany();
  for (let i = 0; i < 20; i++) {
    const post = allPosts[i % allPosts.length];
    const author = i % 2 === 0 ? allUsers[i % allUsers.length] : null;
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: author?.id || null,
        body: `Comment ${i+1}: Interesting!`,
      },
    });
  }

  // Связи post_tags (каждый пост – 1-3 случайных тега)
  const freshPosts = await prisma.post.findMany();
  for (const post of freshPosts) {
    const num = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...allTags];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, num);
    for (const tag of selected) {
      await prisma.postTag.create({
        data: {
          postId: post.id,
          tagId: tag.id,
        },
      });
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });