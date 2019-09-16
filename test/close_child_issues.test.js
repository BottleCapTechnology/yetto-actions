const { loadConfig, loadPayload, loadResponse } = require("./index.test");
const nock = require("nock");
const safeLoad = require("js-yaml").safeLoad;

describe("Close child issues", () => {
  let main;

  afterEach(() => {
    nock.cleanAll();
  });

  it("replies when a parent issue with children is closed", async () => {
    let config = loadConfig("child_issue.match");
    main = loadPayload("issues", "closed.match");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    config = safeLoad(Buffer.from(config, "base64").toString("utf8"));

    comment = config.close_child_issues[0].create_comment;

    const listIssues = nock("https://api.github.com")
      .persist()
      .get("/repos/user/test/issues?labels=child_of_big-bad-boom")
      .reply(200, loadResponse("matched_child_issue"));

    const postComment = nock("https://api.github.com")
      .persist()
      .post("/repos/user/test/issues/1347/comments", {
        body: comment
      })
      .reply(200);

    const editIssue = nock("https://api.github.com")
      .persist()
      .patch("/repos/user/test/issues/1347", {
        state: "closed"
      })
      .reply(200);

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect(listIssues.isDone()).toBe(true);
    expect(postComment.isDone()).toBe(true);
    expect(editIssue.isDone()).toBe(true);
    expect.assertions(4);
  });

  it("does nothing when a parent issue with no children is closed", async () => {
    let config = loadConfig("child_issue.missing");
    main = loadPayload("issues", "closed.match");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    const listIssues = nock("https://api.github.com")
      .persist()
      .get("/repos/user/test/issues?labels=missing-label")
      .reply(200, []);

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect(listIssues.isDone()).toBe(true);
    expect.assertions(2);
  });

  it("does nothing when a regular issue is closed", async () => {
    let config = loadConfig("child_issue.match");
    main = loadPayload("issues", "closed.no_match");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect.assertions(1);
  });
});
