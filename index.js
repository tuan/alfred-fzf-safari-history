import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { AsyncFzf, byStartAsc } from "fzf";
import alfy from "alfy";
import { formatRelative } from "date-fns";

// Script filter copies Safari History DB file to this location,
// to get around permission issue
const SAFARI_HISTORY_DB_PATH = "/tmp/safari-history.db";
const QUERY_LIMIT = 10000;
const DB_QUERY_RESULT_CACHE_KEY = "db_query_result";
const FZF_LIMIT = 15;

/**
 * A Core Data timestamp is the number of seconds since midnight, January 1, 2001, GMT.
 * The difference between a Core Data timestamp and a Unix timestamp (seconds since 1/1/1970)
 * is 978307200 seconds.
 */
function convertAppleTimeToJsTime(appleTime) {
  const jsTimestamp = (appleTime + 978307200) * 1000;
  return new Date(jsTimestamp);
}

const db = await open({
  filename: SAFARI_HISTORY_DB_PATH,
  driver: sqlite3.Database,
});

if (alfy.cache.get(DB_QUERY_RESULT_CACHE_KEY) == null) {
  const rows = await db.all(`
    SELECT
      visits.title,
      items.url,
      visits.visit_time
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
  tiebreakers: [byStartAsc],
  limit: FZF_LIMIT,
});

const results = await fzf.find(alfy.input ?? "").catch(() => {});

const iconPath = alfy.icon.get("GenericURLIcon");
const now = Date.now();
const outputItems = results.map(({ item }) => {
  const visitTime = convertAppleTimeToJsTime(item.visit_time);
  const relativeVisitTime = formatRelative(visitTime, now);

  return {
    quicklookurl: item.url,
    uid: item.url,
    title: item.title,
    subtitle: `${relativeVisitTime} - ${item.url}`,
    arg: item.url,
    icon: { path: iconPath },
  };
});

alfy.output(outputItems);
