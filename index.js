import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { Fzf, byLengthAsc } from 'fzf'

// const SAFARI_HISTORY_DB_PATH = '~/Library/Safari/History.db';
const SAFARI_HISTORY_DB_PATH = '/tmp/safari-history.db'; // TODO: Need to bypass security during dev
const SEARCH_QUERY = 'node'; // TODO: will be replaced by alfred query input
const QUERY_LIMIT = 1000;

const db = await open({
  filename: SAFARI_HISTORY_DB_PATH,
  driver: sqlite3.Database
});

const rows = await db.all(`
  SELECT
    visits.title,
    items.url
  FROM
    history_items items
  JOIN history_visits visits
    ON visits.history_item = items.id
  GROUP BY
    visits.title
  ORDER BY
    visits.visit_time DESC
  LIMIT ${QUERY_LIMIT}
`);

const fzf = new Fzf(rows, {
  selector: (item) => item.title,
  tiebreakers: [byLengthAsc]
});

const results = fzf.find(SEARCH_QUERY);
console.log(results);