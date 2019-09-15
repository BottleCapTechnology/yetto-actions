const { loadPayload } = require("./index.test");
const nock = require("nock");

describe("Basic tests", () => {
  let main;

  it("assures me that it only runs on relevant actions", async () => {
    loadPayload("other");
    main = require("../main");

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(jest.fn());

    await main.run();

    expect(warnSpy).toHaveBeenCalledWith(
      'Wanted a "labeled" or "closed" event, but got "opened"'
    );

    warnSpy.mockRestore();
  });

  it.skip("reports on missing config", async () => {
    loadPayload("labeled");
    main = require("../main");

    const errorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());

    nock("https://api.github.com")
      .persist()
      .get(
        "/repos/user/test/contents/.github/yetto-actions.config.yml?ref=cafebabe"
      )
      .reply(404, {});

    await main.run();

    expect(errorSpy).toHaveBeenCalledWith(
      "404: .github/yetto-actions.config.yml not found"
    );

    errorSpy.mockRestore();
  });
});
