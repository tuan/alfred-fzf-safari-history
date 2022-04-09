import alfy from "alfy";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { AsyncFzf, byStartAsc } from "fzf";

// Script filter copies Safari History DB file to this location,
// to get around permission issue
const SAFARI_HISTORY_DB_PATH = "/tmp/safari-history.db";
const DB_CACHE_KEY_PREFIX = "CACHED_FZF_INSTANCE";

const db = await open({
  filename: SAFARI_HISTORY_DB_PATH,
  driver: sqlite3.cached.Database,
});

/**
 * Returns a cached Fzf instance for the given domain
 *
 * @export
 * @param {*} domainSqlLikeExpression
 * @param {*} historyResultLimit max number of items in history to search
 * @param {*} fzfResultLimit max number of fuzzy results to return
 * @return {*} fzf instance
 */
export async function createFzfInstanceAsync(
  domainSqlLikeExpression,
  queryLength,
  historyResultLimit,
  fzfResultLimit
) {
  const rows = await queryHistoryAsync(
    domainSqlLikeExpression,
    historyResultLimit
  );
  return new AsyncFzf(rows, {
    selector: (item) => item.title,
    tiebreakers: [byStartAsc],
    limit: fzfResultLimit,
    fuzzy: getFuzzyOption(queryLength),
  });
}

function getFuzzyOption(queryLength) {
  if (queryLength === 0) {
    return false;
  }

  if (queryLength <= 3) {
    return "v1";
  }

  return "v2";
}

async function queryHistoryAsync(domainSqlLikeExpression, historyResultLimit) {
  const dbCacheKey = `${DB_CACHE_KEY_PREFIX}-${domainSqlLikeExpression}-${historyResultLimit}`;
  const cachedData = alfy.cache.get(dbCacheKey);
  if (cachedData != null) {
    return cachedData;
  }

  const sqlQuery = `
    SELECT
      visits.title,
      items.url,
      (visits.visit_time+978307200)*1000 AS visit_time
    FROM
      history_items items
    JOIN history_visits visits
      ON visits.history_item = items.id
    WHERE
      CASE WHEN INSTR(url, "?") > 0 THEN SUBSTR(url, 0, INSTR(url, "?") - 1) ELSE url END LIKE '%${domainSqlLikeExpression}%' AND
      visits.title IS NOT NULL
    GROUP BY
      visits.title
    ORDER BY
      visits.visit_time DESC
    LIMIT ${historyResultLimit}
  `;

  const data = await db.all(sqlQuery);
  alfy.cache.set(dbCacheKey, data, { maxAge: 60000 });

  return data;
}
