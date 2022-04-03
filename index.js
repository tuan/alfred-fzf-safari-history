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

const input = (alfy.input ?? "").trim();

const keywords = input.split(" ").filter((kw) => kw.trim().length > 0);
const hasDomain = keywords.length > 0 && keywords[0].startsWith("@");
let domain = hasDomain ? keywords[0].substring(1) : "";

// Scope search directive is `@domain<space>`, so +2
const fzfQueryStart = hasDomain ? domain.length + 2 : 0;
const fzfQuery = input.substring(fzfQueryStart);

const fzf = await createFzfInstanceAsync(domain, QUERY_LIMIT, FZF_LIMIT);
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
