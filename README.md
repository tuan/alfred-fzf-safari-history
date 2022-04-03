# alfred-fzf-safari-history

Fuzzy search your safari history.

This workflow uses:

- [Fzf](https://github.com/junegunn/fzf) for fuzzy searching.
- [Sqlite](https://www.npmjs.com/package/sqlite) for reading Safari History's database.

## Installation

```sh
npm i -g alfred-fzf-safari-history
```

## Usage

## Prefix

Default prefix to trigger the workflow is: `sh`

### Global search

`sh <fuzzy search keywords>`

### Scope search

You can limit the search scope to a particular domain by specifying the domain keywords with @ prefix.

Example:

1. `sh @git <fuzzy search keywords>` will perform the search for all pages whose domain includes the word `git`.
2. `sh <fuzzy search keywords> @git` does the same thing as above.
3. `sh @git <fuzzy search keywords> @lab` will perform the search for all pages whose domain is `git.*lab`, for example: `gitlab.com` instead of `github.com`

<img src='media/screenshot.png'/>
