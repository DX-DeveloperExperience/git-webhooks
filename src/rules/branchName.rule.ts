import { Rule } from './rule.class';
import { RuleResult } from './ruleResult';
import { GitEventEnum } from '../webhook/utils.enum';
import { Webhook } from '../webhook/webhook';

interface BranchNameOptions {
  regexp: string;
}

export class BranchNameRule extends Rule {
  name = 'branchName';
  options: BranchNameOptions;
  events = [GitEventEnum.NewBranch];

  validate(webhook, ruleConfig): RuleResult {
    const ruleResult: RuleResult = new RuleResult(webhook.getGitApiInfos());
    const branchName = webhook.getBranchName();
    const branchRegExp = RegExp(ruleConfig.options.regexp);
    ruleResult.validated = branchRegExp.test(branchName);
    ruleResult.data = {
      branch: branchName,
      branchSplit: branchName.split('/'),
    };

    return ruleResult;
  }
}
