const exec = require("child_process").exec;

describe("Yetto Actions Lint Test Suite", () => {
  const command = `npm run lint:test`;

  it("should report lint errors", done => {
    exec(command, (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.error(stderr);
        console.error(`
          '***You should run \`npm run lint:fix\` to fix all the code.
          Alternatively, install the Prettier plugin in your editor to lint on save! ***
          `);
        expect(error).toBeNull();
      }
      return done();
    });
  });
});
