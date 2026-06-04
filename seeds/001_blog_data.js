export async function seed(knex) {
  // Очистка в порядке, обратном созданию (сначала дочерние)
  await knex('post_tags').del();
  await knex('comments').del();
  await knex('posts').del();
  await knex('tags').del();
  await knex('users').del();

  // Сброс счётчиков последовательностей (чтобы id начинались с 1)
  await knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE tags_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE posts_id_seq RESTART WITH 1');
  await knex.raw('ALTER SEQUENCE comments_id_seq RESTART WITH 1');

  // Вставка пользователей (id начнутся с 1)
  const users = [
    { email: 'alice@example.com', name: 'Alice', role: 'admin' },
    { email: 'bob@example.com', name: 'Bob', role: 'user' },
    { email: 'carol@example.com', name: 'Carol', role: 'user' },
    { email: 'dave@example.com', name: 'Dave', role: 'user' },
    { email: 'eve@example.com', name: 'Eve', role: 'admin' },
  ];
  const insertedUsers = await knex('users').insert(users).returning('id');
  const userIds = insertedUsers.map(row => row.id);

  //Теги (id с 1)
  const tags = [
    { name: 'technology' },
    { name: 'health' },
    { name: 'travel' },
    { name: 'food' },
    { name: 'lifestyle' },
  ];
  const insertedTags = await knex('tags').insert(tags).returning('id');
  const tagIds = insertedTags.map(row => row.id);

  // Посты (по 2 на пользователя)
  const posts = [];
  for (let i = 0; i < userIds.length; i++) {
    for (let j = 1; j <= 2; j++) {
      posts.push({
        user_id: userIds[i],
        title: `Post ${j} by user ${userIds[i]}`,
        body: `Content of post ${j} from user ${userIds[i]}`,
        status: j === 1 ? 'draft' : 'published',
      });
    }
  }
  const insertedPosts = await knex('posts').insert(posts).returning('id');
  const postIds = insertedPosts.map(row => row.id);

  // Комментарии (20 шт)
  const comments = [];
  for (let i = 0; i < 20; i++) {
    comments.push({
      post_id: postIds[i % postIds.length],
      author_id: i % 2 === 0 ? userIds[i % userIds.length] : null,
      body: `Comment ${i+1}: Interesting!`,
    });
  }
  await knex('comments').insert(comments);

  // Связи post_tags (каждый пост – 1-3 случайных тега)
  const postTags = [];
  for (const postId of postIds) {
    const num = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...tagIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, num);
    for (const tagId of selected) {
      postTags.push({ post_id: postId, tag_id: tagId });
    }
  }
  // удаление дубликатов
  const unique = [];
  const seen = new Set();
  for (const pt of postTags) {
    const key = `${pt.post_id}|${pt.tag_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(pt);
    }
  }
  await knex('post_tags').insert(unique);
}