import { Runnable } from './runnable.class';
import { RuleResult } from '../rules/ruleResult';

import { CallbackType } from './runnables.service';
import { RunnableDecorator } from './runnable.decorator';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitApiInfos } from '../git/gitApiInfos';
import { GitFileInfos } from '../git/gitFileInfos';
import { GitTypeEnum } from '../webhook/utils.enum';
import { Utils } from '../utils/utils';
import { EnvVarAccessor } from '../env-var/env-var.accessor';
import { AnalyticsDecorator } from '../analytics/analytics.decorator';
import { HYGIE_TYPE } from '../utils/enum';

interface DeleteFilesArgs {
  files: string[] | string;
  message: string;
  branch: string;
}

/**
 * `DeleteFilesRunnable` delete a set of files.
 */
@RunnableDecorator('DeleteFilesRunnable')
export class DeleteFilesRunnable extends Runnable {
  constructor(
    private readonly githubService: GithubService,
    private readonly gitlabService: GitlabService,
    private readonly envVarAccessor: EnvVarAccessor,
  ) {
    super();
  }

  @AnalyticsDecorator(HYGIE_TYPE.RUNNABLE)
  async run(
    callbackType: CallbackType,
    ruleResult: RuleResult,
    args: DeleteFilesArgs,
  ): Promise<void> {
    ruleResult.env = this.envVarAccessor.getAllEnvVar();

    const gitApiInfos: GitApiInfos = ruleResult.gitApiInfos;

    let filesList: string[];

    // Default
    if (typeof args !== 'undefined' && typeof args.message === 'undefined') {
      args.message = 'removing file';
    }

    if (typeof args !== 'undefined' && typeof args.files !== 'undefined') {
      filesList = Utils.transformToArray(args.files, ruleResult);

      // Replace slash hexa value
      filesList = filesList
        .toString()
        .replace(/&#x2F;/g, '/')
        .split(',')
        .filter(f => f !== '');
    } else {
      if (typeof (ruleResult as any).data.addedFiles !== 'undefined') {
        filesList = (ruleResult as any).data.addedFiles;
      }
    }

    for (let index = 0; index < filesList.length; index++) {
      // Need a for loop because Async/Wait does not work in ForEach

      const file: string = filesList[index];
      const gitFileInfos = new GitFileInfos();
      if (typeof args !== 'undefined' && typeof args.branch !== 'undefined') {
        gitFileInfos.fileBranch = Utils.render(args.branch, ruleResult);
      } else {
        // Default
        if (typeof (ruleResult as any).data.branchName !== 'undefined') {
          gitFileInfos.fileBranch = (ruleResult as any).data.branchName;
        } else {
          gitFileInfos.fileBranch = 'master';
        }
      }
      gitFileInfos.commitMessage = Utils.render(args.message, ruleResult);
      gitFileInfos.filePath = Utils.render(file, ruleResult);

      if (gitApiInfos.git === GitTypeEnum.Github) {
        await this.githubService.deleteFile(gitFileInfos);
      } else if (gitApiInfos.git === GitTypeEnum.Gitlab) {
        await this.gitlabService.deleteFile(gitFileInfos);
      }
    }
  }
}
