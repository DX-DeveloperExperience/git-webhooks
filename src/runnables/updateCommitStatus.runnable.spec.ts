import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { GitTypeEnum } from '../webhook/utils.enum';
import { CallbackType } from './runnables.service';
import { RuleResult } from '../rules/ruleResult';
import { MockGitlabService, MockGithubService } from '../__mocks__/mocks';
import { UpdateCommitStatusRunnable } from './updateCommitStatus.runnable';
import { EnvVarAccessor } from '../env-var/env-var.accessor';
import { Webhook } from '../webhook/webhook';
import { Logger } from '@nestjs/common';

jest.mock('../analytics/analytics.decorator');

describe('UpdateCommitStatusRunnable', () => {
  let app: TestingModule;

  let githubService: GithubService;
  let gitlabService: GitlabService;

  let updateCommitStatus: UpdateCommitStatusRunnable;

  let args: any;
  let ruleResultCommitMessage: RuleResult;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        UpdateCommitStatusRunnable,
        { provide: GitlabService, useClass: MockGitlabService },
        { provide: GithubService, useClass: MockGithubService },
        EnvVarAccessor,
      ],
    }).compile();

    githubService = app.get(GithubService);
    gitlabService = app.get(GitlabService);
    updateCommitStatus = app.get(UpdateCommitStatusRunnable);

    const webhook = new Webhook(gitlabService, githubService);
    webhook.branchName = 'test_webhook';

    ruleResultCommitMessage = new RuleResult(webhook);
    ruleResultCommitMessage.validated = true;
    ruleResultCommitMessage.data.commits = [
      {
        status: 'Success',
        success: true,
        sha: '1',
        message: 'fix: readme (#12)',
        matches: ['fix: readme (#12)', 'fix', null, '(#12)'],
      },
      {
        status: 'Success',
        success: true,
        sha: '2',
        message: 'feat(test): tdd (#34)',
        matches: ['feat(test): tdd (#34)', 'feat', '(test)', '(#34)'],
      },
      {
        status: 'Success',
        success: true,
        sha: '3',
        message: 'docs: gh-pages',
        matches: ['docs: gh-pages', 'docs', null, null],
      },
    ];
    args = {
      successTargetUrl: 'http://www.google.com',
      failTargetUrl: 'http://moogle.com/',
      successDescriptionMessage: 'good commit status!',
      failDescriptionMessage: 'NOOOT good...',
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCommitMessage Runnable', () => {
    it('should not call the updateCommitStatus Github nor Gitlab service', () => {
      updateCommitStatus
        .run(CallbackType.Both, ruleResultCommitMessage, args)
        .catch(err => Logger.error(err));
      expect(githubService.updateCommitStatus).not.toBeCalled();
      expect(gitlabService.updateCommitStatus).not.toBeCalled();
    });
  });
  describe('updateCommitMessage Runnable', () => {
    it('should call the updateCommitStatus Github service 3 times', () => {
      ruleResultCommitMessage.gitApiInfos.git = GitTypeEnum.Github;
      updateCommitStatus
        .run(CallbackType.Both, ruleResultCommitMessage, args)
        .catch(err => Logger.error(err));

      expect(githubService.updateCommitStatus).toBeCalledTimes(3);
      expect(gitlabService.updateCommitStatus).not.toBeCalled();
    });
  });
  describe('updateCommitMessage Runnable', () => {
    it('should call the updateCommitStatus Gitlab service 3 times', () => {
      ruleResultCommitMessage.gitApiInfos.git = GitTypeEnum.Gitlab;
      updateCommitStatus
        .run(CallbackType.Both, ruleResultCommitMessage, args)
        .catch(err => Logger.error(err));

      expect(githubService.updateCommitStatus).not.toBeCalled();
      expect(gitlabService.updateCommitStatus).toBeCalledTimes(3);
    });
  });
});
