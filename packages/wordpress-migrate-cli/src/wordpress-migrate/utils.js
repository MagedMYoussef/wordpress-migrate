import fs from 'fs-extra';
import path from 'path';
import WPAPI from 'wpapi';
import logger from './logger';

export function connect({ host }) {
  logger.info(`Create connection with ${host}/wp-json`);

  return new WPAPI({
    endpoint: `${host}/wp-json`,
    username: 'magedm',
    password: 'mg01069745475',
  });
}

export function isFunction(thing) {
  return typeof thing === 'function';
}

export function timestamp({ date = new Date() } = {}) {
  return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

export function rewriteWithCDN(url) {
  return url.replace(/^\/\/www./, '//cdn.');
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function validBaseDir(basedir) {
  return fs.existsSync(path.join(basedir, 'dump', 'assets')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'post')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'user')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'category')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'tag'));
}
