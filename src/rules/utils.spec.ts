import { Utils } from './utils';
import { Webhook } from '../webhook/webhook';
import { GitlabService } from '../gitlab/gitlab.service';
import { GithubService } from '../github/github.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MockGitlabService, MockGithubService } from '../__mocks__/mocks';

describe('Rules Utils', () => {
  let app: TestingModule;
  let githubService: GithubService;
  let gitlabService: GitlabService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        { provide: GitlabService, useClass: MockGitlabService },
        { provide: GithubService, useClass: MockGithubService },
      ],
    }).compile();

    githubService = app.get(GithubService);
    gitlabService = app.get(GitlabService);
  });

  describe('checkTime', () => {
    it('should return true', () => {
      const nowBack5 = new Date();
      nowBack5.setDate(nowBack5.getDate() - 5);

      expect(Utils.checkTime(nowBack5, 7)).toBe(true);
    });

    it('should return false', () => {
      const nowBack5 = new Date();
      nowBack5.setDate(nowBack5.getDate() - 5);

      expect(Utils.checkTime(nowBack5, 3)).toBe(false);
    });
  });

  describe('getLastItem', () => {
    it('should return 3', () => {
      expect(Utils.getLastItem([1, 2, 3])).toBe(3);
    });
    it('should return {key: 3}', () => {
      expect(Utils.getLastItem([{ key: 1 }, { key: 2 }, { key: 3 }])).toEqual({
        key: 3,
      });
    });
  });

  describe('checkUser', () => {
    const webhook = new Webhook(gitlabService, githubService);
    webhook.user.login = 'bastienterrier';
    it('should return true', () => {
      expect(
        Utils.checkUser(webhook, {
          ignore: ['ig1na'],
        }),
      ).toBe(true);
    });
    it('should return false', () => {
      expect(
        Utils.checkUser(webhook, {
          only: ['ig1na'],
        }),
      ).toBe(false);
    });
    it('should return true', () => {
      expect(Utils.checkUser(webhook, {})).toBe(true);
    });
    it('should return true', () => {
      expect(
        Utils.checkUser(webhook, {
          only: ['bastienterrier'],
        }),
      ).toBe(true);
    });
  });
  describe('checkBranch', () => {
    const webhook = new Webhook(gitlabService, githubService);
    webhook.branchName = 'master';
    webhook.repository.defaultBranchName = 'master';
    it('should return true', () => {
      expect(
        Utils.checkBranch(webhook, {
          ignore: ['gh-pages'],
        }),
      ).toBe(true);
    });
    it('should return false', () => {
      expect(
        Utils.checkBranch(webhook, {
          only: ['gh-pages'],
        }),
      ).toBe(false);
    });
    it('should return true', () => {
      expect(Utils.checkBranch(webhook, {})).toBe(true);
    });
    it('should return true', () => {
      expect(
        Utils.checkBranch(webhook, {
          only: ['$default'],
        }),
      ).toBe(true);
    });
  });

  describe('replaceDefaultBranch', () => {
    it('should return ["develop", "master", "gh-pages"]', () => {
      expect(
        Utils.replaceDefaultBranch('master', [
          'develop',
          '$default',
          'gh-pages',
        ]),
      ).toEqual(['develop', 'master', 'gh-pages']);
    });
    it('should return ["master"]', () => {
      expect(Utils.replaceDefaultBranch('master', ['$default'])).toEqual([
        'master',
      ]);
    });
    it('should return []', () => {
      expect(Utils.replaceDefaultBranch('master', [])).toEqual([]);
    });
  });
});
