const path = require("path");
const fs = require("fs");

const nock = require("nock");

const OLD_ENV = process.env;

const FIXTURES_DIR = path.join(__dirname, "fixtures");
exports.loadPayload = function loadPayload(fixture) {
  delete process.env.GITHUB_EVENT_PATH;
  process.env.GITHUB_EVENT_PATH = path.join(
    FIXTURES_DIR,
    "payloads",
    `${fixture}.json`
  );

  return require("../main");
};

exports.loadConfig = function loadConfig(fixture) {
  let yaml = fs.readFileSync(
    path.join(FIXTURES_DIR, "configs", `${fixture}.yml`)
  );

  return Buffer.from(yaml).toString("base64");
};

exports.loadResponse = function loadResponse(fixture) {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURES_DIR, "responses", `${fixture}.json`))
  );
};

beforeAll(() => {
  process.env = { ...OLD_ENV };

  process.env.GITHUB_SHA = "cafebabe";

  process.env.GITHUB_TOKEN = "token";
  process.env.GITHUB_REPOSITORY = "user/test";

  nock.disableNetConnect();
});

afterEach(() => {
  jest.resetModules();
});

afterAll(() => {
  process.env = OLD_ENV;
});

require("./basic.test");
require("./auto_response.test");
require("./close_child_issues.test");

require("./lint.test");
