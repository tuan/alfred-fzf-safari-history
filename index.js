import alfy from "alfy";
import { formatRelative } from "date-fns";
import { createFzfInstanceAsync } from "./fzfUtils.js";

const QUERY_LIMIT = 10000;
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

const domainKeywordRegex = /(?:^|\s)@(\b[^@\s]+)/gm;

function processInput(input) {
  const domainKeywords = [];
  let nextGroup = domainKeywordRegex.exec(input);
  while (nextGroup != null) {
    domainKeywords.push(nextGroup[1]);
    nextGroup = domainKeywordRegex.exec(input);
  }

  const query = input.replace(domainKeywordRegex, "");
  return { domainKeywords, query };
}

const input = (alfy.input ?? "").trim();
const { domainKeywords, query } = processInput(input);
const domainSqlLikeExpression = domainKeywords.join("%");
const fzfQuery = query.trim(); // trim spaces when query is in between domain keywords

const fzf = await createFzfInstanceAsync(
  domainSqlLikeExpression,
  fzfQuery.length,
  QUERY_LIMIT,
  FZF_LIMIT
);
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
    mods: {
      ctrl: {
        arg: item.url,
        subtitle: `Copy & Paste ${item.url} `,
      },
    },
  };
});

alfy.output(outputItems);
