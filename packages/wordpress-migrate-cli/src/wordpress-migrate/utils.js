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
