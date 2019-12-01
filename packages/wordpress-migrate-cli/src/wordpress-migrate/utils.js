import fs from 'fs-extra';
import path from 'path';
import WPAPI from 'wpapi';
import logger from './logger';

const jsdom = require('jsdom');

const { JSDOM } = jsdom;

const axios = require('axios');


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


export async function fetchFeaturedImage(wp, post) {
  const featuredImageId = post.featured_media;

  if (featuredImageId) {
    try {
      const featuredImage = await wp.media().id(featuredImageId);

      return Object.assign(
        {},
        post,
        { featured_media_url: featuredImage.guid.rendered },
      );
    } catch (error) {
      logger.error(`Couldn't fetch featured image for post ${post.id}`);
      logger.error(error.stack);

      return post;
    }
  }

  logger.warn(`Post ${post.id} with category ${post.categories[0]} is missing the featured image.`);

  return post;
}

export async function fetchViralPressContent(wp, post) {
  const content = post.content.rendered;
  if (content.length >= 10) {
    return post;
  }

  logger.info('Will fetch the viralpress content.');

  // try to get the post content from viralpress
  let data = '';

  logger.info(`Url ${post.link}`);

  await axios.get(post.link)
    .then((res) => {
      logger.info('Fetched the viralpress content...');
      const dom = new JSDOM(res.data);
      const postInnerContent = dom.window.document.querySelector('div.vp-entry').innerHTML;
      data = postInnerContent;
    })
    .catch((err) => {
      logger.error(err);
    });

  return Object.assign(
    {},
    post,
    { content: { rendered: data } },
  );
}
