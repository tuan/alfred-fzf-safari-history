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

const input = alfy.input ?? "";
const keywords = input.split(" ").filter((kw) => kw.trim().length > 0);
const hasDomain = keywords[0].startsWith("@");
let domain = hasDomain ? keywords[0].substring(1) : "";

const dbCacheKey = `${DB_QUERY_RESULT_CACHE_KEY}-${domain}`;
if (alfy.cache.get(dbCacheKey) == null) {
  const sqlQuery = `
    SELECT
      visits.title,
      items.url,
      visits.visit_time
    FROM
      history_items items
    JOIN history_visits visits
      ON visits.history_item = items.id
    WHERE
      SUBSTR(SUBSTR(items.url, INSTR(items.url, '//') + 2), 0, INSTR(SUBSTR(items.url, INSTR(items.url, '//') + 2), '/')) LIKE '%${domain}%' AND
      visits.title IS NOT NULL
    GROUP BY
      visits.title
    ORDER BY
      visits.visit_time DESC
    LIMIT ${QUERY_LIMIT}
  `;
  const rows = await db.all(sqlQuery);

  alfy.cache.set(dbCacheKey, rows, { maxAge: 30000 });
}

// Scope search directive is `@domain<space>`, so +2
const fzfQueryStart = hasDomain ? domain.length + 2 : 0;
const fzfQuery = input.substring(fzfQueryStart);
const cached = alfy.cache.get(dbCacheKey);

const fzf = new AsyncFzf(cached, {
  selector: (item) => item.title,
  tiebreakers: [byStartAsc],
  limit: FZF_LIMIT,
});

const results = await fzf.find(fzfQuery).catch(() => {});

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
