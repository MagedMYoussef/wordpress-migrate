import { argv } from 'yargs';
import Promise from 'bluebird';
import logger from './logger';
import { fetchFeaturedImage, fetchViralPressContent, sleep } from './utils';

export async function fetchAllPosts(wp, { offset = 0, perPage = argv.test ? 10 : 50 } = {}) {
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

export async function fetchAllCategories(wp, { offset = 0, perPage = 100 } = {}) {
  const categories = wp.categories().perPage(perPage).offset(offset);

  if (categories.length === perPage) {
    return categories.concat(await fetchAllCategories(wp, { offset: offset + perPage }));
  }

  return categories;
}

export async function fetchAllTags(wp, { offset = 0, perPage = 100 } = {}) {
  const tags = await wp.tags({ hideEmpty: true }).perPage(perPage).offset(offset);

  if (tags.length === perPage) {
    return tags.concat(await fetchAllTags(wp, { offset: offset + perPage }));
  }

  return tags;
}

export async function fetchAllUsers(wp, { offset = 0, perPage = 100 } = {}) {
  const users = await wp.users({ hideEmpty: true }).perPage(perPage).offset(offset);

  if (users.length === perPage) {
    return users.concat(await fetchAllUsers(wp, { offset: offset + perPage }));
  }

  return users;
}

export async function fetchAllMedia(wp, { offset = 0, perPage = 100 } = {}) {
  const media = await wp.media({ hideEmpty: true }).perPage(perPage).offset(offset);

  if (media.length === perPage) {
    return media.concat(await fetchAllMedia(wp, { offset: offset + perPage }));
  }

  return media;
}
