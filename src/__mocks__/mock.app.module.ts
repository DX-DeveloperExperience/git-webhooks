import { Module, HttpModule } from '@nestjs/common';
import { RulesModule } from '../rules/rules.module';
import { RunnableModule } from '../runnables/runnable.module';
import { GitModule } from '../git/git.module';
import { ScheduleService } from '../scheduler/scheduler.service';
import {
  MockDataAccess,
  MockAnalytics,
  MockCronController,
  MockLoggingInterceptor,
} from './mocks';
import { DocumentationController } from '../controllers/documentation.controller';
import { RegisterController } from '../controllers/register.controller';
import { WebhookController } from '../controllers/webhook.controller';
import { ApplicationController } from '../controllers/application.controller';
import { PrometheusService } from '../logger/prometheus.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    HttpModule,
    RulesModule.forRoot(MockAnalytics, MockDataAccess),
    RunnableModule.forRoot(MockAnalytics),
    GitModule,
  ],
  controllers: [
    ApplicationController,
    MockCronController,
    DocumentationController,
    RegisterController,
    WebhookController,
  ],
  providers: [
    PrometheusService,
    ScheduleService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MockLoggingInterceptor,
    },
  ],
})
export class MockAppModule {}
