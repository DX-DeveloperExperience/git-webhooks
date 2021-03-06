# Customisable Post-Actions

A Post-Action, is a callback that will be executed after a rule `validate()` method.
This allow you to customise your process, according to the result of a rule.

You can:

- log informations,
- send webhook with data priviously processed,
- comment an issue or a PR,
- and much more!

## How does it work?

In your `.rulesrc` config file, you can add `callback` functions that will be called if the rule succeeds or not.

These `callback`s are `Runnable` classes, that implementing the `Runnable` abstract class.
The `Runnable` class will have a `run()` method with `callbackType`, `RuleResult` and `args` as arguments.

`callbackType` precise if the Runnable is called because the rule failed, succeed or if it always called.
[`RuleResult`](../rules/customisableRules.html#validate-method) is an object containing the result of the rule, and `args` is a custom object, with as many properties as you want.

## Create your own Runnable class

If you don't find a suitable Post-Action for your needs, you can easily create yours by extending the `Runnable` class.

Your Runnable class must have a name and implement the `run()` method as said in the previous section.

### CLI

Same as Rules creation, the easiest way to create it is to use our CLI: [hygie-cli](https://github.com/DX-DeveloperExperience/hygie-cli).

Simply run : `npm run generate:runnable RUNNABLENAME`.

::: warning
You need to have [`@nestjs/cli`](https://github.com/nestjs/nest-cli) install globally. Therefore, run `npm install -g @nestjs/cli`.
:::

This CLI will create your runnable file and add everything necessary in the project. You just have to focus on your business logic.

### Use of services

It you need particular Services, you have to declare them in your constructor.

For example:

```typescript
constructor(private readonly myService: MyService)
```

NestJs dependency injection will handle everything.

### _handlebars_ templating

If you want to allow templating (you want to!), you need to use the `render()` method provide by our _Utils_ class.

Just have a look at the `LoggerRunnable` implementation:

```typescript
run(ruleResult: RuleResult, args: LoggerArgs): void {
    switch (args.type) {
        case 'info':
            this.loggerService.log(render(args.message, ruleResult));
        break;
        case 'warn':
            this.loggerService.warn(render(args.message, ruleResult));
        break;
    }
}
```

The `render()` method need the string containing the template (in the `args` object), and the data provider: `RuleResult` which is the return by the [`validate()` rule method](../rules/customisableRules.md#validate-method).
