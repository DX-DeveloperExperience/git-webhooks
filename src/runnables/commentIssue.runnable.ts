import { Runnable } from './runnable.class';
import { RuleResult } from '../rules/ruleResult';
import { GitIssueInfos } from '../git/gitIssueInfos';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitTypeEnum } from '../webhook/utils.enum';
import { CallbackType } from './runnables.service';
import { GitApiInfos } from '../git/gitApiInfos';
import { RunnableDecorator } from './runnable.decorator';

interface CommentIssueArgs {
  comment: string;
}

@RunnableDecorator('CommentIssueRunnable')
export class CommentIssueRunnable extends Runnable {
  constructor(
    private readonly githubService: GithubService,
    private readonly gitlabService: GitlabService,
  ) {
    super();
  }
  run(
    callbackType: CallbackType,
    ruleResult: RuleResult,
    args: CommentIssueArgs,
  ): void {
    const data = ruleResult.data as any;
    const gitIssueInfos: GitIssueInfos = new GitIssueInfos();
    gitIssueInfos.number = data.issueNumber;
    gitIssueInfos.comment = args.comment;
    const gitApiInfos: GitApiInfos = ruleResult.gitApiInfos;

    if (gitApiInfos.git === GitTypeEnum.Github) {
      this.githubService.addIssueComment(gitApiInfos, gitIssueInfos);
    } else if (gitApiInfos.git === GitTypeEnum.Gitlab) {
      this.gitlabService.addIssueComment(gitApiInfos, gitIssueInfos);
    }
  }
}
