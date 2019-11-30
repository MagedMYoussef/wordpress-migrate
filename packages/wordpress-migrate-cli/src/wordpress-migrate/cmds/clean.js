import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from '../logger';


function cleanDir(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      fs.unlink(path.join(dir, file), (error) => {
        if (error) throw error;
      });
    });
  });
}

function validBaseDir(basedir) {
  return fs.existsSync(path.join(basedir, 'dump', 'assets')) &&
    fs.existsSync(path.join(basedir, 'dump', 'entries', 'post')) &&
    fs.existsSync(path.join(basedir, 'dump', 'entries', 'category')) &&
    fs.existsSync(path.join(basedir, 'dump', 'entries', 'tag'));
}

export const command = 'clean';
export const describe = 'Clean the json files';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to clean data',
    default: `.${path.sep}data`,
  });
}
export async function handler({
  host, lang, site, dir,
}) {
  try {
    const basedir = path.join(path.resolve(dir), lang);

    if (!validBaseDir(basedir)) {
      throw new Error(`Directory ${dir} is not setup properly, please run init first`);
    }

    logger.info('Cleaning the tags directory...');
    const tagsDir = path.join(basedir, 'dump', 'entries', 'tag');
    cleanDir(tagsDir);

    logger.info('Cleaning the categories directory...');
    const categoriesDir = path.join(basedir, 'dump', 'entries', 'category');
    cleanDir(categoriesDir);

    logger.info('Cleaning the posts directory...');
    const postsDir = path.join(basedir, 'dump', 'entries', 'post');
    cleanDir(postsDir);

    logger.info('Cleaning the users directory...');
    const usersDir = path.join(basedir, 'dump', 'entries', 'user');
    cleanDir(usersDir);
  } catch (error) {
    logger.error(error);
    logger.info('Exiting...');
    process.exit(1);
  }
}
