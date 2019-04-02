# `rules.yml` example

```yaml
--- # Rules config file
options:
  executeAllRules: false
  enableGroups: false
  enableRules: true
  allRuleResultInOne: true
rules:
  - name: commitMessage
    options:
      regexp: '(feat|fix|docs)(\([a-z]+\))?:\s[^(]*(\(#[1-9][0-9]*(?:, #[1-9][0-9]*)*\))?$'
      maxLength: 100
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: 'pattern match: branch: {{data.branch}}
            {{#data.commits}}{{sha}} =
            Object: {{matches.1}} | Scope: {{matches.2}} | Issue: {{matches.3}}
            {{/data.commits}}'
      - callback : WebhookRunnable
        args:
          url: 'https://webhook.site/0de43177-4119-448b-bcfe-e2f6a2845ce8'
          data: {
            user: 'bastien terrier',
            content: '{{#data.commits}}{{sha}} =
            Object: {{matches.1}} | Scope: {{matches.2}} | Issue: {{matches.3}}
            {{/data.commits}}'
          }
    onError:
      - callback: LoggerRunnable
        args:
          message: 'pattern does not match, commit name must begin with : "feat|fix|docs" and contains less than 100 numerals! Check your commit message:
            {{#data.commits}}
              > {{message.commits}} (#{{sha}})
            {{/data.commits}}
          '
    onBoth:
      - callback: UpdateCommitStatusRunnable
        args:
          successTargetUrl: 'http://www.google.com'
          failTargetUrl: 'http://moogle.com/'
          successDescriptionMessage: 'good commit status!'
          failDescriptionMessage: 'NOOOT good...'
  - name: branchName
    options:
      regexp: (feature|fix)\/.*
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: '{{data.branch}} is a good name!'
      - callback: CreatePullRequestRunnable
        args:
          title: 'WIP: {{data.branchSplit.1}}'
          description: 'this is the description'
    onError:
      - callback: LoggerRunnable
        args:
          message: 'pattern does not match, branch name must begin with : "feature|fix"!'
  - name: oneCommitPerPR
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: 'there is only on commit in this PR/MR/Push, ok'
    onError:
      - callback: LoggerRunnable
        args:
          message: 'more than one commit! A notification will be sent to the maintainer.'
      - callback : WebhookRunnable
        args:
          url: 'https://webhook.site/0de43177-4119-448b-bcfe-e2f6a2845ce8'
          data: {
            user: 'bastien terrier',
            content: 'More than one commmit !',
            commits: '{{#data.commits}}
              {{message}} (#{{id}})
            {{/data.commits}}
            ',
          }
          config: {
            headers: {
              Authorization: 'token 1234567890abcdef'
            }
          }
  - name: issueTitle
    options:
      regexp: (add|fix)\s.*
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: '{{data.issueTitle}} is a correct issue title'
      - callback: SendEmailRunnable
        args:
          to: bastien.terrier@gmail.com
          subject: 'New issue (#{{data.issueNumber}}) '
          message: '<b>{{data.issueTitle}}</b> has been created!'
    onError:
      - callback: LoggerRunnable
        args:
          message: '{{data.issueTitle}} is not a correct issue title'
      - callback: CommentIssueRunnable
        args:
          comment: 'ping @bastienterrier'
  - name: pullRequestTitle
    options:
      regexp: (WIP|FIX):\s.*
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: '{{data.pullRequestTitle}} is a correct pull request title : {{data.pullRequestDescription}} (#{{data.pullRequestNumber}})'
    onError:
      - callback: LoggerRunnable
        args:
          message: '{{data.pullRequestTitle}} is not a correct pull request title : {{data.pullRequestDescription}} (#{{data.pullRequestNumber}})'
      - callback: CommentPullRequestRunnable
        args:
          comment: 'ping @bastienterrier'


groups:
  - groupName: "check pattern 1"
    rules:
      - name: commitMessage
        options:
          regexp: '(feat|fix):\s.*'
      - name: oneCommitPerPR
      - name: branchName
        options:
          regex: "feature/.*"
    onBoth:
      - callback: LoggerRunnable
        args:
          message: "blablabla..."
      - callback: WebhookRunnable
        args:
          url: "https://webhook.site/0de43177-4119-448b-bcfe-e2f6a2845ce8"
          data: { message: "data : {{#data}}- {{name}} -{{/data}}" }

  - groupName: "check pattern 2"
    rules:
      - name: issueTitle
        options:
          regexp: '(add|fix):\s.*'
      - name: pullRequestTitle
        options:
          regex: 'WIP:\s.*'
    onSuccess:
      - callback: LoggerRunnable
        args:
          message: "Pattern match! 22"
      - callback: WebhookRunnable
        args:
          url: "https://webhook.site/0de43177-4119-448b-bcfe-e2f6a2845ce8"
          data: { message: "Pattern match! 22" }
    onError:
      - callback: LoggerRunnable
        args:
          message: "Pattern do not match... 22"
      - callback: WebhookRunnable
        args:
          url: "https://webhook.site/0de43177-4119-448b-bcfe-e2f6a2845ce8"
          data: { message: "Pattern do not match... 22" }
```