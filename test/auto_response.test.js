const { loadConfig, loadPayload } = require("./index.test");
const nock = require("nock");
const safeLoad = require("js-yaml").safeLoad;

describe("Autoresponse", () => {
  let main;

  afterEach(() => {
    nock.cleanAll();
  });

  it("replies when a matching label is given", async () => {
    let config = loadConfig("auto_response.match");
    main = loadPayload("issues", "labeled");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    config = safeLoad(Buffer.from(config, "base64").toString("utf8"));

    comment = config.auto_response[0].create_comment;

    const postComment = nock("https://api.github.com")
      .persist()
      .post("/repos/user/test/issues/1/comments", {
        body: comment
      })
      .reply(200);

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect(postComment.isDone()).toBe(true);
    expect.assertions(2);
  });

  it("does nothing when no matching label is given", async () => {
    let config = loadConfig("auto_response.no_match");
    main = loadPayload("issues", "labeled");

    const getConfig = nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(200, { content: config });

    config = safeLoad(Buffer.from(config, "base64").toString("utf8"));

    comment = config.auto_response[0].create_comment;

    const postComment = nock("https://api.github.com")
      .persist()
      .post("/repos/user/test/issues/1/comments", {
        body: comment
      })
      .reply(200);

    await main.run();

    expect(getConfig.isDone()).toBe(true);
    expect(postComment.isDone()).toBe(false);
    expect.assertions(2);
  });
});
