import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from '../logger';
import { connect, asyncForEach, validBaseDir, fetchFeaturedImage } from '../utils';

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
          first_name: user.name,
          email: user.user_email,
          slug: user.slug,
          password: 'zicQ3wmuj0Y8ba3',
          username: user.slug,
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

/**
 * Construct mapping for categories/tags/users from old site to new one.
 * maaping should follow oldId:newId stucture for each of the given items.
 */
function constructMapping(oldData, newData) {
  const mapping = {};

  Object.keys(oldData).forEach((field) => {
    logger.info(`Mapping field: ${field}`);
    if (!newData[field]) {
      return;
    }

    if (!mapping[field]) {
      mapping[field] = {};
    }

    // field objects ...
    const fieldOldArr = oldData[field];
    const fieldNewArr = newData[field];

    fieldOldArr.forEach((oldItem) => {
      // get the correspoding new item with the same slug..
      const newItem = fieldNewArr.filter(item => item.slug === oldItem.slug);
      if (!newItem || newItem.length === 0) {
        logger.warn(`Cannot find a corresponding ${field} with slug ${oldItem.slug}.`);
      } else {
        // add the id mapping oldId:newId ..
        mapping[field][oldItem.id] = {
          id: newItem[0].id,
          slug: newItem[0].slug,
        };
      }
    });
  });

  logger.info(`Mapping: ${JSON.stringify(mapping)}`);
  return mapping;
}

async function fetchAllPosts(wp, { offset = 0, perPage = argv.test ? 10 : 100 } = {}) {
  let posts = await wp.posts().perPage(perPage).offset(offset);
  posts = await Promise.mapSeries(posts, async (post) => {
    const res = fetchFeaturedImage(wp, post);
    return res;
  });


  if (posts.length === perPage && !argv.test) {
    return posts.concat(await fetchAllPosts(wp, { offset: offset + perPage }));
  }

  return posts;
}

async function insertAllPosts(wp, posts, mapping) {
  const newPosts = [];

  const existingPosts = await fetchAllPosts(wp);

  await asyncForEach(posts, async (post) => {
    const existingPost = existingPosts.filter(item => item.slug === post.slug);

    if (existingPost && existingPost.length > 0) {
      logger.warn(`Post already exists: ${existingPost[0].slug}`);
      newPosts.push(existingPost[0]);
    } else {
      logger.info(`Creating post with slug: ${post.slug} / categories: ${post.categories} / tags: ${post.tags}`);

      await wp.posts()
        .create({
          slug: post.slug,
          date: post.date,
          date_gmt: post.date_gmt,
          title: post.title.rendered,
          status: post.status,
          content: post.content.rendered,
          author: mapping.users[post.author],
          featured_media: 13, // TODO: Fix to use correct media id
          categories: post.categories.map(item => (mapping.categories[`${item}`] ? mapping.categories[`${item}`].id : null)).join(','),
          tags: post.tags.map(item => (mapping.tags[`${item}`] ? mapping.tags[`${item}`].id : null)).join(','),
        })
        .then((response) => {
          logger.info(`Post with slug: ${response.slug} was created.`);
          newPosts.push(response);
        })
        .catch((err) => {
          logger.error('Error happened on creating the post.');
          logger.error(err.message);
        });
    }
  });

  return newPosts;
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

    // Keep track of old/new data to be used for mapping
    const oldData = {};
    const newData = {};

    // Retrieve all the saved files from the exporter
    logger.info('Getting categories from files...');
    let categories = await getAllCategories(basedir);
    oldData.categories = categories;
    logger.info(`Retrieved ${categories.length} categories`);

    logger.info('Getting tags from files...');
    let tags = await getAllTags(basedir);
    oldData.tags = tags;
    logger.info(`Retrieved ${tags.length} tags`);

    logger.info('Getting users from files...');
    let users = await getAllUsers(basedir);
    oldData.users = users;
    logger.info(`Retrieved ${users.length} users`);

    logger.info('Getting posts from files...');
    let posts = await getAllPosts(basedir);
    oldData.posts = posts;
    logger.info(`Retrieved ${posts.length} posts`);

    // Inserting into the new wordpress instance
    categories = categories.filter(item => item.count > 0);
    logger.info(`Migrating ${categories.length} categories...`);
    categories = await insertAllCategories(wp, categories);
    newData.categories = categories;
    logger.info(`Categories were inserted successfully: ${categories.length}`);

    tags = tags.filter(item => item.count > 0);
    logger.info(`Migrating ${tags.length} tags...`);
    tags = await insertAllTags(wp, tags);
    newData.tags = tags;
    logger.info('Tags were inserted successfully.');

    logger.info(`Migrating ${users.length} users...`);
    users = await insertAllUsers(wp, users);
    newData.users = users;
    logger.info('Users were inserted successfully.');

    logger.info('Constructing the mapping for posts...');
    const mapping = constructMapping(oldData, newData);
    logger.info('Mapping was constructed successfully!');

    logger.info(`Migrating ${posts.length} posts...`);
    posts = await insertAllPosts(wp, posts, mapping);
    logger.info('Posts were inserted successfully.');
  } catch (error) {
    logger.error(error);
    logger.info('Exiting...');
    process.exit(1);
  }
}

