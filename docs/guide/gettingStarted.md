# Getting Started

## Directory structure

If you want to use the `Hygie` API, you need to create a `.hygie` folder in your root directory.

This folder will be fetched everytime you interact with our API.

```
.
├── .hygie
│  ├── .rulesrc
│  └── cron-*.rulesrc
└── package.json
```

It contains the following files:

- `.hygie/rulesrc`: all the rules and post-actions you configured (see the [config generator](configGenerator.md)),
- `.hygie/cron-*.rulesrc`: all rules that will be evaluated in a cron job. Same as the `rulesrc` file, check out our [config generator](configGenerator.md). `*` is a wildcard; eg: `cron-vulnerabilities.rulesrc` or `cron-1.rulesrc`.
  ::: tip
  You can create as many Cron files as you want.
  :::

## Repository registration

You also need to [register your repository](registerToken.md) in our server.

::: warning
If you don't register your credentials, you will not be able to interact with your git repository (ie. create comment, update commit status, etc.).
:::

## Running the project

If you want to run this project, you have different choices :

- [turnkey solutions](#turnkey-solutions)
  - [directly use our public API](#from-our-public-api)
  - [running directly one of ours docker images](#run-our-docker-image-from-dockerhub)
- [clone and extend it](#clone-and-extend-it)
  - [launch it via CLI](#from-our-github-repository)
  - [create your own docker container](#build-your-own-docker-image)

## Turnkey solutions

::: warning
With these turnkey solutions, you can't create your custom rules, to do that, check the next section.
:::

### From our public API

The easiest solution is to use directly our public API to getting started and discover our solution.

Our API is currently running at : [--OUR_URL--](--OUR_URL--).

### Run our Docker image from DockerHub

If you just want to test our project, without cloning it, you can run a container with one of the existing versions in [DockerHub](https://hub.docker.com/r/dxdeveloperexperience/hygie).

You can simply run a container:

```
docker run --name=webhook-container -v webhook-vol:/app -p 3000:3000 dxdeveloperexperience/hygie:--DOCKER_TAG--
```

## Clone and extend it

Cloning this project allows you to extend it and create custom rules and runnables.

::: tip
If you create rules or post-actions that can be usefull for others, please ask for a PR!
:::

### From our Github repository

First, clone our project and go to the root directory:

```
git clone https://github.com/zenika-open-source/hygie
cd hygie
```

Then, simply run :

```
npm install
npm run start
```

The application is now running at [localhost:3000](localhost:3000)

To check if everything's alright, you should get a welcome message.

### Build your own Docker image

You can create a docker image of our **_Hygie_** API.

First, clone our project and go to the root directory :

```
git clone https://github.com/zenika-open-source/hygie
cd hygie
```

Then, build it:

```
docker build -t my-webhook .
```

::: tip
This will execute the `Dockerfile` config file.
:::

Finally, you can run the Docker image:

```
docker run --name webhook-container -d -p 3000:3000 my-webhook
```

## Github/Gitlab webhook configuration

Once the API is running, you can add a webhook to your git repository with the url : `--OUR_URL--/webhook`. You can also select the events you want to receive, or select all of them.

::: tip
You can use [ngrok](https://ngrok.com/) to convert localhost url to public url.
:::

### Github

You can add as many webhooks as you want. Just go to your repository settings: `https://github.com/:owner/:repo/settings/hooks`, add click the `Add webhook` button.

Now you can :

- configure the `Payload URL`,
- check if `Content type` is set to `application/json`,
- select the `send me everything` option,
- save this configuration.

### Gitlab

Go to your repository integrations settings: `https://gitlab.com/:owner/:repo/settings/integrations`, configure the webhook URL and select all the events you want to intercept. Finally, save it via the `Add webhook` button.
