import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from '../logger';
import { connect, asyncForEach, validBaseDir } from '../utils';

const axios = require('axios');

export const command = 'import';
export const describe = 'Import json to site';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to import data from',
    default: `.${path.sep}data`,
  });
}

async function getAllCategories(baseDir) {
  const categories = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'category');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    categories.push(item);
  });

  return categories;
}

async function getAllTags(baseDir) {
  const tags = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'tag');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    tags.push(item);
  });

  return tags;
}

async function getAllUsers(baseDir) {
  const users = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'user');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    users.push(item);
  });

  return users;
}

async function getAllPosts(baseDir) {
  const posts = [];

  const dir = path.join(baseDir, 'dump', 'entries', 'post');

  await fs.readdirSync(dir).forEach((file) => {
    const item = fs.readJsonSync(`${dir}/${file}`);
    posts.push(item);
  });

  return posts;
}

async function insertAllCategories(wp, categories) {
  const newCategories = [];
  const existingCategories = await wp.categories();

  await asyncForEach(categories, async (category) => {
    const existingCategory = existingCategories.filter(item => item.slug === category.slug);

    if (existingCategory && existingCategory.length > 0) {
      logger.warn(`Category already exists: ${existingCategory[0].slug}`);
      newCategories.push(existingCategory[0]);
    } else {
      logger.info(`Creating category with slug: ${category.slug}`);

      await wp.categories()
        .create({
          name: category.name,
          slug: category.slug,
          taxonomy: category.taxonomy,
        })
        .then((response) => {
          logger.info(`Category with slug: ${category.slug} was created.`);
          newCategories.push(response);
        })
        .catch((err) => {
          logger.error('Error happened on creating the category.');
          logger.error(err.message);
        });
    }
  });

  return newCategories;
}

async function insertAllTags(wp, tags) {
  const newTags = [];
  const existingTags = await wp.tags();

  await asyncForEach(tags, async (tag) => {
    const existingTag = existingTags.filter(item => item.slug === tag.slug);

    if (existingTag && existingTag.length > 0) {
      logger.warn(`tag already exists: ${existingTag[0].slug}`);
      newTags.push(existingTag[0]);
    } else {
      logger.info(`Creating tag with slug: ${tag.slug}`);

      await wp.categories()
        .create({
          name: tag.name,
          slug: tag.slug,
          taxonomy: tag.taxonomy,
        })
        .then((response) => {
          logger.info(`Tag with slug: ${tag.slug} was created.`);
          newTags.push(response);
        })
        .catch((err) => {
          logger.error('Error happened on creating the tag.');
          logger.error(err.message);
        });
    }
  });

  return newTags;
}

async function insertAllUsers(wp, users) {
  const newUsers = [];
  const existingUsers = await wp.users();

  await asyncForEach(users, async (user) => {
    const existingUser = existingUsers.filter(item => item.slug === user.slug);

    if (existingUser && existingUser.length > 0) {
      logger.warn(`user already exists: ${existingUser[0].slug}`);
      newUsers.push(existingUser[0]);
    } else {
      logger.info(`Creating user with slug: ${user.slug}`);

      await wp.users()
        .create({
          name: user.name,
          email: user.email,
          password: 'zicQ3wmuj0Y8ba3',
          username: user.slug,
          avatar_urls: user.avatar_urls,
          description: user.description,
        })
        .then((response) => {
          logger.info(`User with slug: ${response.slug} was created.`);
          newUsers.push(response);
        })
        .catch((err) => {
          logger.error('Error happened on creating the user.');
          logger.error(err.message);
        });
    }
  });

  return newUsers;
}

export async function handler({
  host, lang, site, dir,
}) {
  const wp = connect({ host });
  logger.info('Connection to Wordpress established.');

  try {
    const basedir = path.join(path.resolve(dir), lang);

    if (!validBaseDir(basedir)) {
      throw new Error(`Directory ${dir} is not setup properly, please run init first`);
    }

    // Retrieve all the saved files from the exporter

    logger.info('Getting categories from files...');
    let categories = await getAllCategories(basedir);
    logger.info(`Retrieved ${categories.length} categories`);

    logger.info('Getting tags from files...');
    let tags = await getAllTags(basedir);
    logger.info(`Retrieved ${tags.length} tags`);

    logger.info('Getting users from files...');
    let users = await getAllUsers(basedir);
    logger.info(`Retrieved ${users.length} users`);

    logger.info('Getting posts from files...');
    const posts = await getAllPosts(basedir);
    logger.info(`Retrieved ${posts.length} posts`);

    // Inserting into the new wordpress instance
    categories = categories.filter(item => item.count > 0);
    logger.info(`Migrating ${categories.length} categories...`);
    categories = await insertAllCategories(wp, categories);
    logger.info(`Categories were inserted successfully: ${categories.length}`);

    tags = tags.filter(item => item.count > 0);
    logger.info(`Migrating ${tags.length} tags...`);
    tags = await insertAllTags(wp, tags);
    logger.info('Tags were inserted successfully.');

    logger.info(`Migrating ${users.length} users...`);
    users = await insertAllUsers(wp, users);
    logger.info('Users were inserted successfully.');

    logger.info(`Migrating ${posts.length} posts...`);
  } catch (error) {
    logger.error(error);
    logger.info('Exiting...');
    process.exit(1);
  }
}

