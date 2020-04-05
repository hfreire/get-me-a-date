# Contributing
This GitHub repo follows the [GitHub Flow](https://guides.github.com/introduction/flow/) git workflow. In essence, you contribute by making changes in your fork and then generating a pull request of those changes to be merged with the upstream.

### How to fork this repo
You can read more about forking a GitHub repo [here](https://help.github.com/articles/fork-a-repo). Once you've forked this repo, you're now ready to clone the repo in your computer and start hacking and tinkering with its code.

Clone the GitHub repo
```
git clone https://github.com/my-github-username/get-me-a-date
```

Change current directory
```
cd get-me-a-date
```

Install NPM dependencies
```
npm install
```

### How to keep your fork synced
It's generally a good idea to pull upstream changes and merge them with your fork regularly. [Greenkeeper app](https://github.com/marketplace/greenkeeper) is installed in this GitHub project, it will automatically update dependencies and merge them with upstream if possible.

Add remote upstream
```
git remote add upstream https://github.com/hfreire/get-me-a-date
```

Fetch from remote upstream master branch
```
git fetch upstream master
```

Merge upstream with your local master branch
```
git merge upstream/master
```

Install, update and prune removed NPM dependencies
```
npm install && npm prune
```

### How to know what to contribute
The list of outstanding feature requests and bugs can be found in the [GitHub issue tracker](https://github.com/hfreire/get-me-a-date/issues) of this repo. Please, feel free to propose features or report bugs that are not there.

### How to style the code
With the exception rules from [eslint-config-hfreire](https://github.com/hfreire/eslint-config-hfreire), this repo follows the [JavaScript Standard Style](https://standardjs.com/) rules.

Run the NPM script that will verify the code for style guide violations
```
npm run lint
```

### How to test the code locally
You are encouraged to write automated test cases of your changes. This repo uses [Mocha](https://mochajs.org/) test framework with [testdouble.js](https://github.com/testdouble/testdouble.js) for faking, mocking and stubbing and [Chai](http://chaijs.com) for assertion.

Run the NPM script that will verify failing test cases and report automated test coverage
```
npm run coverage
```

### How to commit changes
This repo follows the [AngularJS git commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits).

Run the NPM script that will commit changes through an interactive menu
```
npm run commit
```

### How to generate a pull request
You can read more about creating a GitHub pull request from a fork [here](https://help.github.com/articles/creating-a-pull-request-from-a-fork).

### How to get your pull request accepted
Every pull request is welcomed, but it's important, as well, to have maintainable code and avoid regression bugs while adding features or fixing other bugs.

Once you generate a pull request, GitHub and third-party apps will verify if the changes are suitable to be merged with upstream. [GitHub Actions CI workflow](https://github.com/hfreire/get-me-a-date/actions?workflow=ci) will verify your changes for style guide violations and failing test cases, while, [Coveralls](https://coveralls.io/github/hfreire/get-me-a-date) will verify the coverage of the automated test cases against the code.

You are encouraged to verify your changes by testing the code locally.

Run the NPM script that will verify the code for style guide violations, failing test cases and report automated test coverage
```
npm test
```
