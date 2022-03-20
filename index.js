import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { AsyncFzf, byLengthAsc } from "fzf";
import alfy from "alfy";

// const SAFARI_HISTORY_DB_PATH = '~/Library/Safari/History.db';
const SAFARI_HISTORY_DB_PATH = "/tmp/safari-history.db"; // TODO: Need to bypass security during dev
const QUERY_LIMIT = 1000;
const DB_QUERY_RESULT_CACHE_KEY = "db_query_result";
const FZF_LIMIT = 15;

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

const fzf = new AsyncFzf(alfy.cache.get(DB_QUERY_RESULT_CACHE_KEY), {
  selector: (item) => item.title,
  tiebreakers: [byLengthAsc],
  limit: FZF_LIMIT,
});

const results = await fzf.find(alfy.input ?? "").catch(() => {});

const outputItems = results.map(({ item }) => {
  return {
    quicklookurl: item.url,
    uid: item.url,
    title: item.title,
    subtitle: item.url,
    arg: item.url,
  };
});

alfy.output(outputItems);
