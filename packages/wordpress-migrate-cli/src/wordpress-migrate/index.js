import path from 'path';
import logger from './logger';

const options = require('yargs') // eslint-disable-line
  .usage('\nUsage: wordpress-migrate [options] <cmd> [args]')
  .option('host', {
    describe: 'choose a host',
    default: 'http://bel3raby.net',
  })
  .option('lang', {
    describe: 'choose locale',
    default: 'en',
    choices: ['en', 'fr', 'de', 'it', 'es', 'pt', 'tr'],
  })
  .option('site', {
    describe: 'choose a site',
    default: 'bel3raby',
    choices: ['bel3raby'],
  })
  .option('settings', {
    describe: 'provide settings file path',
    default: `.${path.sep}settings.js`,
    // eslint-disable-next-line global-require, import/no-dynamic-require
    coerce: arg => require(path.join(path.resolve(arg))),
  })
  .option('silent', {
    boolean: true,
    describe: 'disable all logging',
  })
  .option('verbose', {
    alias: 'debug',
    boolean: true,
    describe: 'enable all logging',
  })
  .option('info', {
    boolean: true,
    describe: 'display contextual information',
  })
  .option('verbosity', {
    choices: ['all', 'error', 'warn', 'notice', 'info', 'none'],
    default: 'notice',
  })
  .option('test', {
    boolean: true,
    describe: 'Test mode. Fetch only 10 results',
  })
  .commandDir('cmds')
  .demandCommand()
  .argv;

if (options.silent) {
  logger.verbosity = 'none';
} else if (options.verbose || options.debug || options.info) {
  logger.verbosity = 'all';
} else {
  logger.verbosity = options.verbosity;
}
