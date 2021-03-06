import { Rule } from './rule.class';
import { RuleResult } from './ruleResult';
import { GitEventEnum } from '../webhook/utils.enum';
import { Webhook } from '../webhook/webhook';
import { RuleDecorator } from './rule.decorator';
import { UsersOptions } from './common.interface';
import { Utils } from './utils';
import { AnalyticsDecorator } from '../analytics/analytics.decorator';
import { HYGIE_TYPE } from '../utils/enum';

interface IssueCommentOptions {
  regexp: string;
  users?: UsersOptions;
}

/**
 * `IssueCommentRule` checks the new issue's comment according to a regular expression.
 * @return return a `RuleResult` object
 */
@RuleDecorator('issueComment')
export class IssueCommentRule extends Rule {
  options: IssueCommentOptions;
  events = [GitEventEnum.NewIssueComment];

  @AnalyticsDecorator(HYGIE_TYPE.RULE)
  async validate(
    webhook: Webhook,
    ruleConfig: IssueCommentRule,
    ruleResults?: RuleResult[],
  ): Promise<RuleResult> {
    const ruleResult: RuleResult = new RuleResult(webhook);
    const commentDescription = webhook.getCommentDescription();
    const commentRegExp = RegExp(ruleConfig.options.regexp);

    // First, check if rule need to be processed
    if (!Utils.checkUser(webhook, ruleConfig.options.users)) {
      return null;
    }

    ruleResult.validated = commentRegExp.test(commentDescription);
    ruleResult.data.comment.matches = commentDescription.match(commentRegExp);

    return ruleResult;
  }
}
