import path from 'path';
import fs from 'fs-extra';

export async function getAllCategories(baseDir) {
  const categories = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'category');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    categories.push(item);
  });

  return categories;
}

export async function getAllTags(baseDir) {
  const tags = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'tag');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    tags.push(item);
  });

  return tags;
}

export async function getAllUsers(baseDir) {
  const users = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'user');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    users.push(item);
  });

  return users;
}

export async function getAllMedia(baseDir) {
  const media = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'media');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    media.push(item);
  });

  return media;
}

export async function getAllPosts(baseDir) {
  const posts = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'post');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    posts.push(item);
  });

  return posts;
}
