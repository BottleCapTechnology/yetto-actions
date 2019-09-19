# Yetto Actions (for GitHub Actions)

We've created our own [GitHub Actions](https://github.com/features/actions) to help you get the most out of your Yetto installation.

For detailed help, why not check out [our documentation](https://docs.yettoapp.com/incorporating-our-github-actions/)?

## Usage

To get started, you'll need to:

1. Define a workflow file that uses `BottleCapTechnology/yetto-actions`.
2. Provide a configuration file with your own custom content for the text you'd like to use for the automation.

### Samples

We've provided a sample workflow .yml and config .yml in the _samples_ directory.

## Development

* Run `npm install` to fetch dependencies
* Run `npm run test` to run the test suite

### New releases

Run `npm version {patch,minor,major}` to release a new version of the action onto GitHub.
