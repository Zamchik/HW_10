export async function up(knex) {
  // функция обновления updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
    // Юзеры
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('email', 255).unique().notNullable();
    t.string('name', 100).notNullable();
    t.string('role', 20).defaultTo('user');
    t.timestamps(true, true);
  });
  await knex.raw(`
    CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
    // Посты    
  await knex.schema.createTable('posts', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.string('title', 300).notNullable();
    t.text('body');
    t.string('status', 20).defaultTo('draft');
    t.timestamps(true, true);
  });
  await knex.raw(`
    CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
    // Комменты
  await knex.schema.createTable('comments', (t) => {
    t.increments('id');
    t.integer('post_id').unsigned().notNullable()
      .references('id').inTable('posts').onDelete('CASCADE');
    t.integer('author_id').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    t.text('body').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
    // Теги
  await knex.schema.createTable('tags', (t) => {
    t.increments('id');
    t.string('name', 50).unique().notNullable();
  });
    // Связь постов и тегов (многие-ко-многим)
  await knex.schema.createTable('post_tags', (t) => {
    t.integer('post_id').unsigned().notNullable()
      .references('id').inTable('posts').onDelete('CASCADE');
    t.integer('tag_id').unsigned().notNullable()
      .references('id').inTable('tags').onDelete('CASCADE');
    t.primary(['post_id', 'tag_id']);
  });
}
// Функция отката - удаляем таблицы и триггеры
export async function down(knex) {
  await knex.schema.dropTableIfExists('post_tags');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('users');
  await knex.raw(`DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;`);
  await knex.raw(`DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;`);
  await knex.raw(`DROP FUNCTION IF EXISTS update_updated_at();`);
}