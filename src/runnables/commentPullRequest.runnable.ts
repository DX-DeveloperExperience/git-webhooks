import { Runnable } from './runnable.class';
import { RuleResult } from '../rules/ruleResult';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitTypeEnum } from '../webhook/utils.enum';
import { GitCommentPRInfos } from '../git/gitPRInfos';
import { CallbackType } from './runnables.service';
import { GitApiInfos } from '../git/gitApiInfos';
import { RunnableDecorator } from './runnable.decorator';
import { EnvVarAccessor } from '../env-var/env-var.accessor';
import { Utils } from '../utils/utils';
import { AnalyticsDecorator } from '../analytics/analytics.decorator';
import { HYGIE_TYPE } from '../utils/enum';

interface CommentPRArgs {
  comment: string;
}

/**
 * `CommentPullRequestRunnable` comments the PR or MR processed by the previous rule.
 *  @warn Be sure that the rule returned the `pullRequest.number` property in the `RuleResult` object.
 */
@RunnableDecorator('CommentPullRequestRunnable')
export class CommentPullRequestRunnable extends Runnable {
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
    args: CommentPRArgs,
  ): Promise<void> {
    const data = ruleResult.data as any;
    ruleResult.env = this.envVarAccessor.getAllEnvVar();

    const gitPRInfos: GitCommentPRInfos = new GitCommentPRInfos();
    gitPRInfos.number = data.pullRequest.number;
    gitPRInfos.comment = Utils.render(args.comment, ruleResult);
    const gitApiInfos: GitApiInfos = ruleResult.gitApiInfos;

    if (gitApiInfos.git === GitTypeEnum.Github) {
      this.githubService.addPRComment(gitPRInfos);
    } else if (gitApiInfos.git === GitTypeEnum.Gitlab) {
      this.gitlabService.addPRComment(gitPRInfos);
    }
  }
}
