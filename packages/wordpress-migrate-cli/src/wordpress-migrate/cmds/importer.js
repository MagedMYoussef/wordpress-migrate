import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from '../logger';
import { connect } from '../utils';

const axios = require('axios');


function validBaseDir(basedir) {
  return fs.existsSync(path.join(basedir, 'dump', 'assets')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'post')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'category')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'tag'));
}

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

  await categories.forEach((category) => {
    const existingCategory = existingCategories.filter(item => item.slug === category.slug);

    if (existingCategory && existingCategory.length > 0) {
      logger.warn(`Category already exists: ${existingCategory.slug}`);
      newCategories.push(existingCategory[0]);
    } else {
      logger.info(`Creating category with slug: ${category.slug}`);

      wp.categories()
        .create({
          name: category.name,
          slug: category.slug,
          taxonomy: category.taxonomy,
        })
        .then((response) => {
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
    const users = await getAllUsers(basedir);
    logger.info(`Retrieved ${users.length} users`);

    logger.info('Getting posts from files...');
    const posts = await getAllPosts(basedir);
    logger.info(`Retrieved ${posts.length} posts`);

    // Inserting into the new wordpress instance
    categories = categories.filter(item => item.count > 0);
    logger.info(`Migrating ${categories.length} categories...`);
    categories = await insertAllCategories(wp, categories);

    tags = tags.filter(item => item.count > 0);
    logger.info(`Migrating ${tags.length} tags...`);

    logger.info(`Migrating ${users.length} users...`);

    logger.info(`Migrating ${posts.length} posts...`);
  } catch (error) {
    logger.error(error);
    logger.info('Exiting...');
    process.exit(1);
  }
}

