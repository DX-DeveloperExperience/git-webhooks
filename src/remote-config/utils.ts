import { logger } from '../logger/logger.service';

const execa = require('execa');
const fs = require('fs');

interface ConfigEnv {
  gitRepo: string;
  gitApi: string;
  gitToken: string;
}

function getPath(splitedURL: string[]): string {
  return (
    splitedURL[splitedURL.length - 2] +
    '/' +
    splitedURL[splitedURL.length - 1].replace('.git', '')
  );
}

/**
 * Clone the repository associate to the `cloneURL`. If this repo already exist, update it.
 * @param cloneURL
 * @return the location of the .git-webhooks/ repo
 */
export function cloneOrUpdateGitRepository(cloneURL: string): string {
  const target: string = 'remote-rules/' + getPath(cloneURL.split('/'));

  const gitWebhooksFolder: string = target + '/.git-webhooks';
  try {
    // If we already download the repo, juste need to pull
    if (fs.existsSync(`${target}`)) {
      execa.shellSync(
        `git -C ${target} reset --hard HEAD && git -C ${target} pull`,
      );
    } else {
      // Otherwise, clone the repo
      execa.shellSync(
        `git clone --no-checkout --single-branch --no-tags --depth 1 ${cloneURL} ${target}`,
      );
      execa.shellSync(
        // tslint:disable-next-line:max-line-length
        `cd ${target} && git config core.sparseCheckout true && echo ".git-webhooks/rules.yml" > .git/info/sparse-checkoutech && git fetch && git checkout HEAD .git-webhooks`,
      );
    }
    return gitWebhooksFolder;
  } catch (e) {
    logger.error(e);
    return gitWebhooksFolder;
  }
}

/**
 * Create the `config.env` file with `gitApi` URL and the corresponding `gitToken`
 * @param gitApi
 * @param gitToken
 * @param nodeEnv
 * @return an Object with the success status (true if registration succeed, false otherwise) and if the file already exist
 */
export function registerConfigEnv(configEnv: ConfigEnv): any {
  const result: any = {
    succeed: true,
    alreadyExist: false,
  };

  const configFile: string =
    'remote-envs/' + getPath(configEnv.gitRepo.split('/')) + '/config.env';

  const content: string = `gitApi=${configEnv.gitApi}
gitToken=${configEnv.gitToken}`;

  const path = require('path');

  if (fs.existsSync(configFile)) {
    result.alreadyExist = true;
  }

  fs.promises.mkdir(path.dirname(configFile), { recursive: true }).then(x =>
    fs.writeFileSync(configFile, content, err => {
      if (err) {
        throw err;
      }
    }),
  );

  return result;
}