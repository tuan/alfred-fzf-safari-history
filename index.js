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
    visits.title,
    items.url,
    items.visit_count_score
  FROM
    history_items items
  JOIN history_visits visits
    ON visits.history_item = items.id
  GROUP BY
    visits.title
  ORDER BY
    visits.visit_time DESC
  LIMIT 3
`);

console.log(rows);