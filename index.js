import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// const SAFARI_HISTORY_DB_PATH = '~/Library/Safari/History.db';
const SAFARI_HISTORY_DB_PATH = '/tmp/safari-history.db'; // TODO: Need to bypass security during dev

const db = await open({
  filename: SAFARI_HISTORY_DB_PATH,
  driver: sqlite3.Database
});

const rows = await db.all(`
  SELECT
    v.title,
    i.url,
    i.visit_count_score
  FROM
    history_items i
  JOIN history_visits v
    ON v.history_item = i.id
  GROUP BY
    v.title
  ORDER BY
    v.visit_time DESC
  LIMIT 3
`);

console.log(rows);