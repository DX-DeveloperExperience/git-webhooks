import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { Webhook } from '../webhook/webhook';
import { RuleResult } from '../rules/ruleResult';
import { HttpService } from '@nestjs/common';
import {
  MockHttpService,
  MockGitlabService,
  MockGithubService,
} from '../__mocks__/mocks';
import { PullRequestTitleRule } from './pullRequestTitle.rule';

jest.mock('../analytics/analytics.decorator');

describe('RulesService', () => {
  let app: TestingModule;
  let githubService: GithubService;
  let gitlabService: GitlabService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        { provide: HttpService, useClass: MockHttpService },
        { provide: GitlabService, useClass: MockGitlabService },
        { provide: GithubService, useClass: MockGithubService },
      ],
    }).compile();

    githubService = app.get(GithubService);
    gitlabService = app.get(GitlabService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // PullRequestTitle Rule
  describe('pullRequestTitle Rule', () => {
    it('should return false', async () => {
      const webhook = new Webhook(gitlabService, githubService);
      webhook.branchName = 'test_webhook';
      webhook.pullRequest = {
        title: 'my PR for webhook',
        description: 'my desc',
        number: 22,
        user: {
          login: 'someone',
        },
      };

      const pullRequestTitle = new PullRequestTitleRule();
      pullRequestTitle.options = {
        regexp: '(WIP|FIX):\\s.*',
      };
      jest.spyOn(pullRequestTitle, 'validate');

      const result: RuleResult = await pullRequestTitle.validate(
        webhook,
        pullRequestTitle,
      );
      expect(result.validated).toBe(false);
      expect(result.data.pullRequest.matches).toEqual(null);
    });
  });
  describe('pullRequestTitle Rule', () => {
    it('should return true', async () => {
      const webhook = new Webhook(gitlabService, githubService);
      webhook.branchName = 'test_webhook';
      webhook.pullRequest = {
        title: 'WIP: webhook',
        description: 'my desc',
        number: 22,
        user: {
          login: 'someone',
        },
      };

      const pullRequestTitle = new PullRequestTitleRule();
      pullRequestTitle.options = {
        regexp: '(WIP|FIX):\\s.*',
      };
      jest.spyOn(pullRequestTitle, 'validate');

      const result: RuleResult = await pullRequestTitle.validate(
        webhook,
        pullRequestTitle,
      );
      expect(result.validated).toBe(true);
      expect(
        JSON.parse(JSON.stringify(result.data.pullRequest.matches)),
      ).toEqual(['WIP: webhook', 'WIP']);
    });
  });
});
