const { Toolkit } = require("actions-toolkit");
const { Octokit } = require("@octokit/rest");

const process = require("process");
const { forEach, map } = require("p-iteration");
const safeLoad = require("js-yaml").safeLoad;

const tools = new Toolkit();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const configFilePath = ".github/yetto-actions.config.yml";

async function run() {
  const payload = tools.context.payload;
  const event = tools.context.event;
  const action = payload.action;
  const issue = payload.issue;
  const repository = payload.repository;

  if (event !== "issues" && event !== "issue_comment") {
    console.warn(
      `Expected an \`issues\` or \`issue_comment\` event, but got \`${event}\``
    );
    return;
  }

  if (event == "issues") {
    if (action == "labeled") {
      const config = await fetchConfig(repository.owner.login, repository.name);

      if (config != null) {
        labelName = payload.label.name;

        await forEach(config.auto_response, async function(setting) {
          await applyAutoresponse(labelName, setting, repository, issue);
        });
      }
    } else if (action == "closed") {
      const config = await fetchConfig(repository.owner.login, repository.name);

      if (config != null) {
        labels = await map(issue.labels, label => label.name);

        await forEach(config.close_child_issues, async function(setting) {
          await closeChildIssues(labels, setting, repository);
        });
      }
    } else {
      console.warn(`Received \`${action}\` on \`${event}\`, skipping...`);
    }
  } else if (event == "issue_comment") {
    if (action == "created") {
      const config = await fetchConfig(repository.owner.login, repository.name);

      if (config != null) {
        let body = payload.comment.body;

        await forEach(config.custom_command, async function(setting) {
          await applyCommand(body, setting, repository, issue);
        });
      }
    } else {
      console.warn(`Received \`${action}\` on \`${event}\`, skipping...`);
    }
  }
}

// Fetches the Yetto Actions configuration file from the .github directory
async function fetchConfig(owner, repo) {
  try {
    const response = await octokit.repos.getContents({
      owner: owner,
      repo: repo,
      path: configFilePath,
      ref: tools.context.sha
    });

    config_contents = Buffer.from(response.data.content, "base64").toString();

    return safeLoad(config_contents);
  } catch (err) {
    if (err.status == 404) {
      console.error(`${err.status}: ${configFilePath} not found`);
    } else {
      console.error(`${err.status}: ${err.message}`);
    }
    return null;
  }
}

// Given an incoming labelName, this identifies if
// there is an autoresponse setting for it. If there
// is, an issue comment is created on the freshly
// labeled issue.
async function applyAutoresponse(labelName, setting, repository, issue) {
  console.log(`Using ${setting.on_label}`);
  if (setting.on_label == labelName) {
    console.log(`Matched ${labelName} label`);
    return await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: setting.create_comment
    });
  }
}

async function closeChildIssues(labels, setting, repository) {
  console.log(`Using ${setting.on_label_parent}`);
  if (hasLabel(labels, setting.on_label_parent)) {
    try {
      let list_issues_response = await octokit.issues.listForRepo({
        owner: repository.owner.login,
        repo: repository.name,
        labels: setting.for_label_child
      });
      let child_issues = list_issues_response.data;
      let child_issues_length = child_issues.length;
      let qualifier = child_issues_length == 1 ? "issue" : "issues";

      console.log(`Found ${child_issues_length} matching child ${qualifier}`);

      if (child_issues.length > 0) {
        await forEach(child_issues, async function(child_issue) {
          await Promise.all([
            octokit.issues.createComment({
              owner: repository.owner.login,
              repo: repository.name,
              issue_number: child_issue.number,
              body: setting.create_comment
            }),

            octokit.issues.update({
              owner: repository.owner.login,
              repo: repository.name,
              issue_number: child_issue.number,
              state: "closed"
            })
          ]);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}

function hasLabel(labels, label) {
  return labels.indexOf(label) > -1;
}

async function applyCommand(body, setting, repository, issue) {
  let command = setting.on_phrase;
  let lastCharacters = body.slice(-command.length);

  if (lastCharacters == command) {
    console.log(`Matched ${command} command`);
    return await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: setting.create_comment
    });
  }
}

exports.run = run;

if (process.env.NODE_ENV != "test") {
  run();
}
