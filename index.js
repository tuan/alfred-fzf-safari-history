import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Fzf, byLengthAsc } from "fzf";
import alfy from "alfy";

// const SAFARI_HISTORY_DB_PATH = '~/Library/Safari/History.db';
const SAFARI_HISTORY_DB_PATH = "/tmp/safari-history.db"; // TODO: Need to bypass security during dev
const QUERY_LIMIT = 1000;
const DB_QUERY_RESULT_CACHE_KEY = "db_query_result";

const db = await open({
  filename: SAFARI_HISTORY_DB_PATH,
  driver: sqlite3.Database,
});

if (alfy.cache.get(DB_QUERY_RESULT_CACHE_KEY) == null) {
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

  alfy.cache.set(DB_QUERY_RESULT_CACHE_KEY, rows, { maxAge: 30000 });
}

const fzf = new Fzf(alfy.cache.get(DB_QUERY_RESULT_CACHE_KEY), {
  selector: (item) => item.title,
  tiebreakers: [byLengthAsc],
});

const results = fzf.find(alfy.input ?? "");

const outputItems = results.map(({ item }) => {
  return {
    quicklookurl: item.url,
    uid: item.url,
    title: item.title,
    subtitle: item.url,
  };
});

alfy.output(outputItems);
