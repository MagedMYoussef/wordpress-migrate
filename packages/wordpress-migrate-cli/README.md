# Wordpress Exporter CLI

## Get Started

To build the package simply run:

```
$ yarn run build
```

To watch for changes and rebuild simply run:

```
$ yarn run watch
```

To run the CLI in development mode, simply run:

```
$ ./bin/wordpress-migrate.js --help
```

Note: Globally installing the package will make the CLI easier to access, meaning you will be able to access it like:

```
$ wordpress-migrate --help
```

## Proceed to Migration

### Prerequisites
1. Configure library settings in `settings.js`. See the [Configure settings.js](#configure-settingsjs) section for details.

2. You need to generate `Personal Access Token` in Contentful. To do it go to any space in Contentful, then go to `APIs`, then `Content management tokens` and click `Generate personal token`. The generated token can be used with all spaces you got access to. Set `CONTENTFUL_MANAGEMENT_TOKEN` environment variable to value of the generated token.

### Creating a Workspace

Migrations are performed one language at a time. Each migration is performed in a *workspace*. To create a workspace for the English language migration simply do:

```
$ wordpress-migrate init --lang="en"
```

Note: by default the workspace is created in a `data` folder, to change this behavior simply use `--dir="some/path"`.

### Managing Spaces

Each migration is done toward a Contentful space, therefore a space must be created for each migration. Since we are merging `blog` and `knowledge` sites, into one space, you must provide which site is the reference: meaning which site will receive the content of the other one. To manage space associated to a migration simply use the `space` command:

* create a space for the English language, using `blog` as a reference:
  ```
  $ wordpress-migrate space create --lang="en" --site="blog"
  ```
* delete the space for the English language using `blog` as a reference:
  ```
  $ wordpress-migrate space delete --lang="en" --site="blog"
  ```

### Exporting Content from Wordpress

Once the a workspace and a space has been created for your migration it is time to export the content from Wordpress. Each site must be exported independently:

```
$ wordpress-migrate export --lang="en" --site="blog"
$ wordpress-migrate export --lang="en" --site="knowledge"
```

This will export all categories and posts for all sites.

## Configure Settings.js

The `settings.js` is used by the `wordpress-migrate` to access some information required during the preparation of the entries such as: selecting the source language, remapping ids, merging categories, ignoring posts, etc.

A working example is provided below.

```js
module.exports = {
  source: {
    lang: 'en',
  },
  prepare: {
    // Maps of Wordpress entry IDs in English "knowledge" site to English "blog" site.
    remap: {
      categories: {
        6: '19', // nutrition
        7: '330', // training
        333: '471', // science
        334: '472', // well-being
      },

      tags: {
        383: 571, // anatomy
        352: 555, // app
        360: 28, // carbohydrates
        388: 574, // exercises
        344: 500, // fat
        345: 533, // habits
        351: 531, // healthy-eating
        359: 465, // hiit
        361: 121, // hunger
        369: 268, // hydration
        375: 333, // losing-weight
        370: 496, // marathon
        346: 299, // mental-strength
        348: 135, // muscle-growth
        386: 570, // nutrients
        368: 541, // outdoor-training
        356: 234, // protein
        349: 444, // recovery
        358: 16, // running
        350: 122, // sleep
        357: 536, // strength-training
        342: 473, // stretching
        382: 61, // summer
        341: 338, // technique
        374: 54, // wear
        366: 106, // winter
        380: 556, // workout
      },
    },
  },
};
```

* `source.lang`: provides the source language, in the case of all our migrations it is English.
* `prepare.remap`: provides the remapping of `knowledge` categories to `blog` categories. This settings should not be changed as already configured properly.
