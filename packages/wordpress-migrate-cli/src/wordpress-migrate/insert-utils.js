import path from 'path';
import fs from 'fs-extra';
import logger from './logger';
import { downloadFile, asyncForEach } from './utils';
import { fetchAllPosts, fetchAllCategories, fetchAllMedia, fetchAllTags, fetchAllUsers } from './wp-utils';

export async function insertAllCategories(wp, categories) {
  const newCategories = [];
  const existingCategories = await fetchAllCategories(wp);

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

export async function insertAllTags(wp, tags) {
  const newTags = [];
  const existingTags = await fetchAllTags(wp);

  await asyncForEach(tags, async (tag) => {
    const existingTag = existingTags.filter(item => item.slug === tag.slug);

    if (existingTag && existingTag.length > 0) {
      logger.warn(`tag already exists: ${existingTag[0].slug}`);
      newTags.push(existingTag[0]);
    } else {
      logger.info(`Creating tag with slug: ${tag.slug}`);

      await wp.tags()
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

export async function insertAllUsers(wp, users) {
  const newUsers = [];
  const existingUsers = await fetchAllUsers(wp);

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


export async function insertAllMedia(wp, media, baseDir) {
  const newMedia = [];
  const existingMedias = await fetchAllMedia(wp);

  await asyncForEach(media, async (mediaItem) => {
    const existingMedia = existingMedias.filter(item => item.slug === mediaItem.slug);

    if (existingMedia && existingMedia.length > 0) {
      logger.warn(`Media already exists: ${existingMedia[0].slug}`);
      newMedia.push(existingMedia[0]);
    } else {
      // download the file from the url
      const mediaUrl = mediaItem.guid.rendered;
      const dir = path.join(baseDir, 'export', 'media');
      const filename = mediaUrl.split('/').slice(-1)[0];
      logger.info(`Media url: ${mediaUrl}, filename: ${filename}`);

      if (!mediaUrl || !filename) {
        return;
      }

      try {
        // skip downloading if exists..
        if (!fs.existsSync(`${dir}/${filename}`)) {
          logger.info(`Downloading media from url: ${mediaItem.guid.rendered} into ${filename}`);
          await downloadFile(mediaUrl, `${dir}/${filename}`);
          logger.info(`Media download successful @ ${filename}`);
        } else {
          logger.info(`Media exists @ ${filename}`);
        }

        // Failed to download the file
        if (!fs.existsSync(`${dir}/${filename}`)) {
          logger.info('Download failed. Skipping...');
          return;
        }

        logger.info(`Creating media with slug: ${filename}`);
        await wp.media()
          .file(`${dir}/${filename}`)
          .create({
            slug: mediaItem.slug,
            title: mediaItem.title.rendered,
            alt_text: mediaItem.alt_text,
            caption: mediaItem.caption.rendered,
            description: mediaItem.description.rendered,
          })
          .then((response) => {
            logger.info(`Media with slug: ${response.slug} was created.`);
            newMedia.push(response);
          })
          .catch((err) => {
            logger.error('Error happened on creating the media.');
            logger.error(err.message);
          });
      } catch (err) {
        logger.info(`Error @ ${err}`);
      }
    }
  });

  return newMedia;
}


export async function insertAllPosts(wp, posts, mapping) {
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
          author: mapping.users[post.author] ? mapping.users[post.author].id : 1,
          featured_media: mapping.media[post.featured_media].id,
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
