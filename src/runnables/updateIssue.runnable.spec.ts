import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitTypeEnum } from '../webhook/utils.enum';
import { CallbackType } from './runnables.service';
import { RuleResult } from '../rules/ruleResult';
import { MockGitlabService, MockGithubService } from '../__mocks__/mocks';
import { UpdateIssueRunnable } from './updateIssue.runnable';
import { EnvVarAccessor } from '../env-var/env-var.accessor';
import { Webhook } from '../webhook/webhook';
import { Logger } from '@nestjs/common';

jest.mock('../analytics/analytics.decorator');

describe('UpdateIssueRunnable', () => {
  let app: TestingModule;

  let githubService: GithubService;
  let gitlabService: GitlabService;

  let updateIssueRunnable: UpdateIssueRunnable;

  let args: any;
  let ruleResultIssueTitle: RuleResult;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        UpdateIssueRunnable,
        { provide: GitlabService, useClass: MockGitlabService },
        { provide: GithubService, useClass: MockGithubService },
        EnvVarAccessor,
      ],
    }).compile();

    githubService = app.get(GithubService);
    gitlabService = app.get(GitlabService);
    updateIssueRunnable = app.get(UpdateIssueRunnable);

    const webhook = new Webhook(gitlabService, githubService);
    webhook.issue.number = 22;

    args = { state: 'close' };

    // ruleResultIssueTitle initialisation
    ruleResultIssueTitle = new RuleResult(webhook);
    ruleResultIssueTitle.validated = false;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateIssue Runnable', () => {
    it('should not call the updateIssue Github nor Gitlab service', () => {
      updateIssueRunnable
        .run(CallbackType.Both, ruleResultIssueTitle, args)
        .catch(err => Logger.error(err));
      expect(githubService.updateIssue).not.toBeCalled();
      expect(gitlabService.updateIssue).not.toBeCalled();
    });
  });
  describe('updateIssue Runnable', () => {
    it('should call the updateIssue Github service', () => {
      ruleResultIssueTitle.gitApiInfos.git = GitTypeEnum.Github;
      updateIssueRunnable
        .run(CallbackType.Both, ruleResultIssueTitle, args)
        .catch(err => Logger.error(err));

      expect(githubService.updateIssue).toBeCalledWith({
        number: '22',
        state: 'Close',
      });
      expect(gitlabService.updateIssue).not.toBeCalled();
    });
  });
  describe('updateIssue Runnable', () => {
    it('should call the updateIssue Gitlab service', () => {
      ruleResultIssueTitle.gitApiInfos.git = GitTypeEnum.Gitlab;
      updateIssueRunnable
        .run(CallbackType.Both, ruleResultIssueTitle, args)
        .catch(err => Logger.error(err));

      expect(githubService.updateIssue).not.toBeCalled();
      expect(gitlabService.updateIssue).toBeCalledWith({
        number: '22',
        state: 'Close',
      });
    });
  });
});
