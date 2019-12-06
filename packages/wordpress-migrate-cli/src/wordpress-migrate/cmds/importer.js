import path from 'path';
import logger from '../logger';
import { connect, confirmAuth, validBaseDir } from '../utils';
import { getAllCategories, getAllMedia, getAllTags, getAllPosts, getAllUsers } from '../parse-utils';
import { insertAllCategories, insertAllMedia, insertAllPosts, insertAllTags, insertAllUsers } from '../insert-utils';


export const command = 'import';
export const describe = 'Import json to site';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to import data from',
    default: `.${path.sep}data`,
  });
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

    logger.info('Getting media from files...');
    let media = await getAllMedia(basedir);
    oldData.media = media;
    logger.info(`Retrieved ${media.length} media`);

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

    logger.info(`Migrating ${media.length} media...`);
    media = await insertAllMedia(wp, media, basedir);
    newData.media = media;
    logger.info('media were inserted successfully.');

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

