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

You can limit the search scope to a particular domain by specifying the domain name in the first keyword.

Example: `sh @git <fuzzy search keywors>` will perform the search for all pages whose domain includes the word `git`.

<img src='media/screenshot.png'/>
