import alfy from "alfy";
import { formatRelative } from "date-fns";
import { createFzfInstanceAsync } from "./fzfUtils.js";

const ICON_PATH = "./icon.png";
const QUERY_LIMIT = 10000;
const FZF_LIMIT = 15;

const domainKeywordRegex = /(?:^|\s)@(\b[^@\s]+)(?:$|\s)/gm;

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

const now = Date.now();

const outputItems = results.map(({ item }) => {
  const relativeVisitTime = formatRelative(new Date(item.visit_time), now);

  return {
    quicklookurl: item.url,
    uid: item.url,
    title: item.title,
    subtitle: `${relativeVisitTime} - ${item.url}`,
    arg: item.url,
    icon: { path: ICON_PATH },
    mods: {
      ctrl: {
        arg: item.url,
        subtitle: `Copy & Paste ${item.url} `,
      },
    },
  };
});

alfy.output(outputItems);
