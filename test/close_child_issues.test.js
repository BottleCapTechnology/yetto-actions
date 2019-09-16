const { loadConfig, loadPayload, loadResponse } = require("./index.test");
const nock = require("nock");
const safeLoad = require("js-yaml").safeLoad;

describe("Close child issues", () => {
  let main;

  afterEach(() => {
    nock.cleanAll();
  });

  it("applies the comment when a command is matched", async () => {
    let config = loadConfig("custom_command.match");
    main = loadPayload("issue_comment", "created.match");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    config = safeLoad(Buffer.from(config, "base64").toString("utf8"));

    comment = config.custom_command[0].create_comment;

    const postComment = nock("https://api.github.com")
      .persist()
      .post("/repos/user/test/issues/12/comments", {
        body: comment
      })
      .reply(200);

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect(postComment.isDone()).toBe(true);
    expect.assertions(2);
  });

  it("does nothing when a comment is not matched", async () => {
    let config = loadConfig("custom_command.match");
    main = loadPayload("issue_comment", "created.no_match");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    config = safeLoad(Buffer.from(config, "base64").toString("utf8"));

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect.assertions(1);
  });
});
