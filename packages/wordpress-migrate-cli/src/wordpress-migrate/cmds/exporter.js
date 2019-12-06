import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from '../logger';
import { connect, fetchFeaturedImage, fetchViralPressContent, sleep } from '../utils';

async function fetchAllPosts(wp, { offset = 0, perPage = argv.test ? 10 : 50 } = {}) {
  let posts = await wp.posts()
    .status(['draft', 'publish', 'pending'])
    .perPage(perPage)
    .offset(offset);

  posts = await Promise.mapSeries(posts, async (post) => {
    let res = fetchFeaturedImage(wp, post);
    // if the post is a viralpress post
    res = fetchViralPressContent(wp, post);
    return res;
  });


  if (posts.length === perPage && !argv.test) {
    logger.info('Waiting for 5 seconds until the next request...');
    await sleep(5000); // wait for 5 sec to avoid server hang
    return posts.concat(await fetchAllPosts(wp, { offset: offset + perPage }));
  }

  return posts;
}

async function fetchAllCategories(wp, { offset = 0, perPage = 100 } = {}) {
  const categories = wp.categories().perPage(perPage).offset(offset);

  if (categories.length === perPage) {
    return categories.concat(await fetchAllCategories(wp, { offset: offset + perPage }));
  }

  return categories;
}

async function fetchAllTags(wp, { offset = 0, perPage = 100 } = {}) {
  const tags = await wp.tags({ hideEmpty: true }).perPage(perPage).offset(offset);

  if (tags.length === perPage) {
    return tags.concat(await fetchAllTags(wp, { offset: offset + perPage }));
  }

  return tags;
}

async function fetchAllUsers(wp, { offset = 0, perPage = 100 } = {}) {
  const users = await wp.users({ hideEmpty: true }).perPage(perPage).offset(offset);

  if (users.length === perPage) {
    return users.concat(await fetchAllUsers(wp, { offset: offset + perPage }));
  }

  return users;
}

function validBaseDir(basedir) {
  return fs.existsSync(path.join(basedir, 'dump', 'assets')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'post')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'category')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'tag'));
}

export const command = 'export';
export const describe = 'Export site to json';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to export data',
    default: `.${path.sep}data`,
  });
}
export async function handler({
  host, lang, site, dir,
}) {
  const wp = await connect({ host });
  logger.info('Connection to Wordpress established.');

  try {
    const basedir = path.join(path.resolve(dir), lang);

    if (!validBaseDir(basedir)) {
      throw new Error(`Directory ${dir} is not setup properly, please run init first`);
    }

    logger.info('Fetching categories...');
    const categories = await fetchAllCategories(wp);
    logger.info(`Retrieved ${categories.length} categories`);

    logger.info('Fetching tags...');
    const tags = await fetchAllTags(wp);
    logger.info(`Retrieved ${tags.length} tags`);

    logger.info('Fetching posts...');
    const posts = await fetchAllPosts(wp);
    logger.info(`Retrieved ${posts.length} posts`);

    logger.info('Fetching users...');
    const users = await fetchAllUsers(wp);
    logger.info(`Retrieved ${users.length} users`);

    logger.info('Exporting categories...');
    categories.map(async (category) => {
      const file = path.join(basedir, 'dump', 'entries', 'category', `${site}-${category.id}.json`);
      logger.info(`Outputting category ${category.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, category, { site, type: 'category' }));
    });

    logger.info('Exporting tags...');
    tags.map(async (tag) => {
      const file = path.join(basedir, 'dump', 'entries', 'tag', `${site}-${tag.id}.json`);
      logger.info(`Outputting tag ${tag.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, tag, { site, type: 'tag' }));
    });

    logger.info('Exporting posts...');
    posts.map(async (post) => {
      const file = path.join(basedir, 'dump', 'entries', 'post', `${site}-${post.id}.json`);
      logger.info(`Outputting post ${post.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, post, { site, type: 'post' }));
    });

    logger.info('Exporting users...');
    users.map(async (user) => {
      const file = path.join(basedir, 'dump', 'entries', 'user', `${site}-${user.id}.json`);
      logger.info(`Outputting user ${user.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, user, { site, type: 'user' }));
    });
  } catch (error) {
    logger.error(JSON.stringify(error));
    logger.info('Exiting...');
    process.exit(1);
  }
}
