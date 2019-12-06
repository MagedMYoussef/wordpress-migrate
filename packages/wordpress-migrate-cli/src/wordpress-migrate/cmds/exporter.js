import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';
import { connect, confirmAuth } from '../utils';
import { fetchAllPosts, fetchAllCategories, fetchAllMedia, fetchAllTags, fetchAllUsers } from '../wp-utils';

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
    const me = await confirmAuth(wp);
    logger.info(`Authenticated with ${me.slug}`);

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

    logger.info('Fetching media...');
    const media = await fetchAllMedia(wp);
    logger.info(`Retrieved ${media.length} media`);

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

    logger.info('Exporting media...');
    media.map(async (item) => {
      const file = path.join(basedir, 'dump', 'entries', 'media', `${site}-${item.id}.json`);
      logger.info(`Outputting media ${item.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, item, { site, type: 'media' }));
    });
  } catch (error) {
    logger.error(JSON.stringify(error));
    logger.info('Exiting...');
    process.exit(1);
  }
}
