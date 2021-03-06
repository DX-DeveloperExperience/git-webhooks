import { Injectable, HttpService, HttpStatus } from '@nestjs/common';
import { NestSchedule } from '@dxdeveloperexperience/nest-schedule';
import { Schedule } from './schedule';
import {
  CronStandardClass,
  convertCronType,
  CronType,
  CronInterface,
} from './cron.interface';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import { RulesService } from '../rules/rules.service';
import { SchedulerException } from '../exceptions/scheduler.exception';
import {
  checkCronExpression,
  getMatchingFiles,
  getCronFileName,
} from './utils';
import { CronExpressionException } from '../exceptions/cronExpression.exception';
import { DataAccessService } from '../data_access/dataAccess.service';
import { HttpResponse } from '../utils/httpResponse';
import { Utils } from '../utils/utils';
import { RemoteConfigUtils } from '../remote-config/utils';
import { Constants } from '../utils/constants';
import { Webhook, WebhookCommit } from '../webhook/webhook';
import { GitEventEnum } from '../webhook/utils.enum';
import { LoggerService } from '~common/providers/logger/logger.service';

@Injectable()
export class ScheduleService {
  schedules: NestSchedule[] = new Array<NestSchedule>();
  readonly MAX_SCHEDULES: number = 1000;

  constructor(
    private readonly githubService: GithubService,
    private readonly gitlabService: GitlabService,
    private readonly rulesService: RulesService,
    private readonly httpService: HttpService,
    private readonly dataAccessService: DataAccessService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Create a new Schedule and add it to the list if `MAX_SCHEDULES` is not reached
   */
  async createSchedule(cron: CronStandardClass): Promise<Schedule> {
    if (this.schedules.length < this.MAX_SCHEDULES) {
      // Download file
      try {
        await RemoteConfigUtils.downloadRulesFile(
          this.dataAccessService,
          this.httpService,
          this.githubService,
          this.gitlabService,
          cron.projectURL,
          cron.filename,
        ).catch(e => {
          throw e;
        });
      } catch (e) {
        this.loggerService.error(e, {
          project: cron.projectURL,
          location: 'ScheduleService',
        });
        throw e;
      }

      // Get CRON Expression if defined in the cron-*.rulesrc file
      const remoteRepository =
        'remote-rules/' +
        Utils.getRepositoryFullName(cron.projectURL) +
        '/.hygie';
      const conf = await Utils.parseYAMLFile(
        await this.dataAccessService.readRule(
          `${remoteRepository}/${cron.filename}`,
        ),
      );
      const options = conf.options;

      if (
        typeof options !== 'undefined' &&
        typeof options.cron !== 'undefined'
      ) {
        cron.expression = options.cron;
      } else {
        cron.expression = Constants.cronExpression;
      }

      if (!checkCronExpression(cron.expression)) {
        throw new CronExpressionException(
          'Incorrect Cron Expression! You can not generate more than 1 cron job per hour.',
        );
      }

      const newSchedule = new Schedule(
        this.githubService,
        this.gitlabService,
        this.rulesService,
        this.httpService,
        this.dataAccessService,
        this.loggerService,
        cron,
      );

      this.addSchedule(newSchedule);
      return newSchedule;
    } else {
      throw new SchedulerException('MAX_SCHEDULES reached!');
    }
  }

  /**
   * Add Schedule to the list
   */
  addSchedule(schedule: NestSchedule): void {
    this.schedules.push(schedule);
  }

  async createCronJobs(cronType: CronType): Promise<HttpResponse> {
    let responseString: string = '';
    let schedule: Schedule;
    let cronStandardArray: CronStandardClass[];

    try {
      cronStandardArray = convertCronType(cronType);
    } catch (e) {
      throw new HttpResponse(HttpStatus.PRECONDITION_FAILED, e.message);
    }

    for (let index = 0; index < cronStandardArray.length; index++) {
      // Need a for loop because Async/Wait does not work in ForEach

      const cron = cronStandardArray[index];

      try {
        schedule = await this.createSchedule(cron);
        responseString += `Schedule ${schedule.id} successfully created\n`;
      } catch (e) {
        throw new HttpResponse(
          HttpStatus.UNAUTHORIZED,
          `${responseString}\n${e.message}`,
        );
      }
    }
    return new HttpResponse(HttpStatus.OK, responseString);
  }

  /**
   * Check all created/updated/deleted cron files to update the Scheduler
   */
  processCronFiles(webhook: Webhook) {
    if (webhook.gitEvent !== GitEventEnum.Push) {
      return;
    }
    const commits: WebhookCommit[] = webhook.getAllCommits();
    const projectURL: string = webhook.getCloneURL();
    const allAddedCronFiles: string[] = getMatchingFiles(commits, 'added');
    const allUpdatedCronFiles: string[] = getMatchingFiles(commits, 'modified');
    const allRemovedCronFiles: string[] = getMatchingFiles(commits, 'removed');

    const addOrUpdate: string[] = allAddedCronFiles.concat(allUpdatedCronFiles);

    if (addOrUpdate.length > 0) {
      const addOrUpdateCrons: CronInterface[] = addOrUpdate.map(a => {
        return {
          filename: getCronFileName(a),
          projectURL,
        };
      });
      this.createCronJobs(addOrUpdateCrons).catch(err =>
        this.loggerService.error(err, {
          location: 'processCronFiles',
          project: webhook.getCloneURL(),
        }),
      );
    }

    if (allRemovedCronFiles.length > 0) {
      allRemovedCronFiles.map(r => {
        const filename: string = getCronFileName(r);
        const cron: string = `remote-crons/${Utils.getRepositoryFullName(
          webhook.getCloneURL(),
        )}/${filename}`;
        this.dataAccessService.deleteCron(cron).catch(err =>
          this.loggerService.error(err, {
            location: 'processCronFiles',
            project: webhook.getCloneURL(),
          }),
        );
      });
    }
  }
}
