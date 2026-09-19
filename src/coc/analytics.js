const { buildProgressReport } = require("./progression");

const CATEGORY_KEYS = ["heroes", "troops", "spells", "equipment"];

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(number(value) * factor) / factor;
}

function sortByTime(entries = [], fields = ["capturedAt", "savedAt"]) {
  return [...entries]
    .sort((a, b) => {
      const aTime = Date.parse(String(fields.map((field) => a?.[field]).find(Boolean) || ""));
      const bTime = Date.parse(String(fields.map((field) => b?.[field]).find(Boolean) || ""));
      return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
    });
}

function daysBetween(start, end) {
  const a = Date.parse(String(start || ""));
  const b = Date.parse(String(end || ""));

  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return round((b - a) / 86400000, 1);
}

function usableItems(items = []) {
  return (Array.isArray(items) ? items : []).filter(
    (item) =>
      Number.isFinite(number(item?.level, NaN)) &&
      Number.isFinite(number(item?.maxLevel, NaN)) &&
      number(item?.maxLevel) > 0
  );
}

function categoryCompletion(items = []) {
  const usable = usableItems(items);
  if (!usable.length) return null;

  const levelTotal = usable.reduce(
    (sum, item) => sum + Math.min(number(item.level), number(item.maxLevel)),
    0
  );
  const maxTotal = usable.reduce(
    (sum, item) => sum + number(item.maxLevel),
    0
  );

  return maxTotal ? round((levelTotal / maxTotal) * 100, 1) : null;
}

function overallCompletion(snapshot) {
  const values = CATEGORY_KEYS
    .map((key) => categoryCompletion(snapshot?.[key]))
    .filter((value) => value !== null);

  if (!values.length) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 1);
}

function itemStats(snapshot) {
  const values = CATEGORY_KEYS.flatMap((key) => usableItems(snapshot?.[key]));
  return {
    tracked: values.length,
    maxed: values.filter((item) => number(item.level) >= number(item.maxLevel)).length,
    incomplete: values.filter((item) => number(item.level) < number(item.maxLevel)).length
  };
}

function compareItemLevels(previous = {}, current = {}) {
  let events = 0;
  let levelsGained = 0;
  const categories = {};

  for (const category of CATEGORY_KEYS) {
    const oldItems = new Map(
      usableItems(previous?.[category]).map((item) => [item.name, item])
    );

    let categoryEvents = 0;
    let categoryLevels = 0;

    for (const item of usableItems(current?.[category])) {
      const old = oldItems.get(item.name);
      if (!old) continue;

      const delta = Math.max(number(item.level) - number(old.level), 0);
      if (!delta) continue;

      categoryEvents += 1;
      categoryLevels += delta;
    }

    categories[category] = {
      events: categoryEvents,
      levelsGained: categoryLevels
    };

    events += categoryEvents;
    levelsGained += categoryLevels;
  }

  return { events, levelsGained, categories };
}

function goalAnalytics(goals = []) {
  const list = Array.isArray(goals) ? goals : [];
  const completed = list.filter((goal) => goal?.status === "completed").length;
  const active = list.filter((goal) => goal?.status === "active").length;

  return {
    total: list.length,
    active,
    completed,
    completionRate: list.length ? round((completed / list.length) * 100, 1) : 0,
    latestCompletedAt:
      sortByTime(
        list.filter((goal) => goal?.status === "completed"),
        ["completedAt", "updatedAt", "createdAt"]
      ).at(-1)?.completedAt ||
      sortByTime(
        list.filter((goal) => goal?.status === "completed"),
        ["updatedAt", "createdAt"]
      ).at(-1)?.updatedAt ||
      null
  };
}

function analyzePlayerHistory(snapshots = [], goals = []) {
  const series = sortByTime(snapshots);
  const latest = series.at(-1) || null;
  const first = series[0] || null;

  if (!series.length) {
    return {
      snapshotCount: 0,
      firstCapturedAt: null,
      lastCapturedAt: null,
      spanDays: 0,
      empty: true,
      goals: goalAnalytics(goals),
      series: []
    };
  }

  let upgradeEvents = 0;
  let levelsGained = 0;
  const categoryUpgradeTotals = Object.fromEntries(
    CATEGORY_KEYS.map((key) => [key, { events: 0, levelsGained: 0 }])
  );

  for (let index = 1; index < series.length; index += 1) {
    const diff = compareItemLevels(series[index - 1], series[index]);
    upgradeEvents += diff.events;
    levelsGained += diff.levelsGained;

    for (const category of CATEGORY_KEYS) {
      categoryUpgradeTotals[category].events += diff.categories[category].events;
      categoryUpgradeTotals[category].levelsGained += diff.categories[category].levelsGained;
    }
  }

  const firstCompletion = overallCompletion(first);
  const latestCompletion = overallCompletion(latest);

  const completion = {
    first: firstCompletion,
    latest: latestCompletion,
    delta:
      firstCompletion !== null && latestCompletion !== null
        ? round(latestCompletion - firstCompletion, 1)
        : null,
    categories: Object.fromEntries(
      CATEGORY_KEYS.map((category) => {
        const oldValue = categoryCompletion(first?.[category]);
        const newValue = categoryCompletion(latest?.[category]);

        return [
          category,
          {
            first: oldValue,
            latest: newValue,
            delta:
              oldValue !== null && newValue !== null
                ? round(newValue - oldValue, 1)
                : null
          }
        ];
      })
    )
  };

  return {
    empty: false,
    snapshotCount: series.length,
    firstCapturedAt: first.capturedAt || null,
    lastCapturedAt: latest.capturedAt || null,
    spanDays: daysBetween(first.capturedAt, latest.capturedAt),
    townHall: {
      first: number(first.townHallLevel),
      latest: number(latest.townHallLevel),
      delta: number(latest.townHallLevel) - number(first.townHallLevel)
    },
    trophies: {
      first: number(first.trophies),
      latest: number(latest.trophies),
      delta: number(latest.trophies) - number(first.trophies)
    },
    bestTrophies: {
      first: number(first.bestTrophies),
      latest: number(latest.bestTrophies),
      delta: number(latest.bestTrophies) - number(first.bestTrophies)
    },
    warStars: {
      first: number(first.warStars),
      latest: number(latest.warStars),
      delta: number(latest.warStars) - number(first.warStars)
    },
    attackWins: {
      first: number(first.attackWins),
      latest: number(latest.attackWins),
      delta: number(latest.attackWins) - number(first.attackWins)
    },
    defenseWins: {
      first: number(first.defenseWins),
      latest: number(latest.defenseWins),
      delta: number(latest.defenseWins) - number(first.defenseWins)
    },
    donations: {
      first: number(first.donations),
      latest: number(latest.donations),
      delta: number(latest.donations) - number(first.donations)
    },
    donationsReceived: {
      first: number(first.donationsReceived),
      latest: number(latest.donationsReceived),
      delta: number(latest.donationsReceived) - number(first.donationsReceived)
    },
    completion,
    upgrades: {
      events: upgradeEvents,
      levelsGained,
      categories: categoryUpgradeTotals
    },
    itemCounts: itemStats(latest),
    goals: goalAnalytics(goals),
    series: series.slice(-12).map((snapshot) => ({
      capturedAt: snapshot.capturedAt || null,
      townHallLevel: number(snapshot.townHallLevel),
      trophies: number(snapshot.trophies),
      bestTrophies: number(snapshot.bestTrophies),
      completion: overallCompletion(snapshot)
    }))
  };
}

function classifyClassicWar(entry) {
  if (entry?.result === "win" || entry?.result === "loss" || entry?.result === "tie") {
    return entry.result;
  }

  if (entry?.state && entry.state !== "warEnded") return "inProgress";

  const clanStars = number(entry?.totals?.clanStars ?? entry?.totals?.stars);
  const opponentStars = number(entry?.totals?.opponentStars);
  const clanDestruction = number(
    entry?.totals?.clanDestruction ?? entry?.totals?.destruction
  );
  const opponentDestruction = number(entry?.totals?.opponentDestruction);

  if (clanStars > opponentStars) return "win";
  if (clanStars < opponentStars) return "loss";
  if (clanDestruction > opponentDestruction) return "win";
  if (clanDestruction < opponentDestruction) return "loss";
  return "tie";
}

function aggregateMemberPerformance(entries, sourceKey = "memberPerformance") {
  const memberMap = new Map();

  for (const entry of entries) {
    for (const member of entry?.[sourceKey] || []) {
      if (!member?.tag) continue;

      const current = memberMap.get(member.tag) || {
        tag: member.tag,
        name: member.name || "Unknown",
        wars: 0,
        attacks: 0,
        stars: 0,
        destruction: 0
      };

      current.name = member.name || current.name;
      current.wars += 1;
      current.attacks += number(member.attacksUsed);
      current.stars += number(member.stars);
      current.destruction += number(member.destruction);

      memberMap.set(member.tag, current);
    }
  }

  return [...memberMap.values()]
    .map((member) => ({
      ...member,
      averageStars: member.attacks
        ? round(member.stars / member.attacks, 2)
        : 0,
      averageDestruction: member.attacks
        ? round(member.destruction / member.attacks, 2)
        : 0
    }))
    .sort((a, b) =>
      b.averageStars !== a.averageStars
        ? b.averageStars - a.averageStars
        : b.averageDestruction - a.averageDestruction
    );
}

function analyzeWarHistory(history = []) {
  const series = sortByTime(history);
  const completed = series.filter((entry) => classifyClassicWar(entry) !== "inProgress");
  const wins = completed.filter((entry) => classifyClassicWar(entry) === "win").length;
  const ties = completed.filter((entry) => classifyClassicWar(entry) === "tie").length;
  const losses = completed.filter((entry) => classifyClassicWar(entry) === "loss").length;

  const attacksUsed = completed.reduce(
    (sum, war) => sum + number(war?.totals?.attacksUsed),
    0
  );
  const possibleAttacks = completed.reduce(
    (sum, war) => sum + number(war?.totals?.possibleAttacks),
    0
  );
  const threeStars = completed.reduce(
    (sum, war) => sum + number(war?.totals?.threeStars),
    0
  );
  const attackDestruction = completed.reduce(
    (sum, war) =>
      sum +
      number(war?.totals?.attackDestructionSum ?? war?.totals?.destruction),
    0
  );

  return {
    empty: completed.length === 0,
    warsAnalyzed: completed.length,
    inProgress: series.length - completed.length,
    wins,
    ties,
    losses,
    totalStars: completed.reduce(
      (sum, war) => sum + number(war?.totals?.clanStars ?? war?.totals?.stars),
      0
    ),
    averageStars: completed.length
      ? round(
          completed.reduce(
            (sum, war) => sum + number(war?.totals?.clanStars ?? war?.totals?.stars),
            0
          ) / completed.length,
          2
        )
      : 0,
    averageDestruction: completed.length
      ? round(
          completed.reduce(
            (sum, war) => sum + number(
              war?.totals?.clanDestruction ?? war?.totals?.destruction
            ),
            0
          ) / completed.length,
          2
        )
      : 0,
    attacksUsed,
    possibleAttacks,
    attackUsageRate: possibleAttacks
      ? round((attacksUsed / possibleAttacks) * 100, 1)
      : null,
    threeStars,
    threeStarRate: attacksUsed
      ? round((threeStars / attacksUsed) * 100, 1)
      : null,
    averageAttackDestruction: attacksUsed
      ? round(attackDestruction / attacksUsed, 2)
      : 0,
    memberPerformance: aggregateMemberPerformance(completed),
    recent: series
      .slice(-8)
      .reverse()
      .map((war) => ({
        date: war.savedAt || war.endTime || war.startTime || null,
        opponentName: war.opponentName || "Opponent",
        result: classifyClassicWar(war),
        stars: number(war?.totals?.clanStars ?? war?.totals?.stars),
        opponentStars: number(war?.totals?.opponentStars),
        destruction: number(
          war?.totals?.clanDestruction ?? war?.totals?.destruction
        )
      }))
  };
}

function analyzeCwlHistory(history = []) {
  const series = sortByTime(history);
  const completed = series.filter(
    (entry) => number(entry?.summary?.roundsCompleted) > 0 || number(entry?.summary?.wins) + number(entry?.summary?.losses) + number(entry?.summary?.ties) > 0
  );

  const wins = completed.reduce((sum, entry) => sum + number(entry?.summary?.wins), 0);
  const ties = completed.reduce((sum, entry) => sum + number(entry?.summary?.ties), 0);
  const losses = completed.reduce((sum, entry) => sum + number(entry?.summary?.losses), 0);
  const rounds = completed.reduce(
    (sum, entry) => sum + number(entry?.summary?.roundsFetched || entry?.summary?.roundsPlayed),
    0
  );
  const attacks = completed.reduce(
    (sum, entry) => sum + number(entry?.summary?.attacksUsed),
    0
  );
  const threeStars = completed.reduce(
    (sum, entry) => sum + number(entry?.summary?.threeStars),
    0
  );

  return {
    empty: completed.length === 0,
    seasonsAnalyzed: completed.length,
    roundsAnalyzed: rounds,
    wins,
    ties,
    losses,
    totalStars: completed.reduce(
      (sum, entry) => sum + number(entry?.summary?.stars),
      0
    ),
    totalDestruction: round(
      completed.reduce(
        (sum, entry) => sum + number(entry?.summary?.destruction),
        0
      ),
      2
    ),
    averageStarsPerSeason: completed.length
      ? round(
          completed.reduce(
            (sum, entry) => sum + number(entry?.summary?.stars),
            0
          ) / completed.length,
          2
        )
      : 0,
    averageDestructionPerSeason: completed.length
      ? round(
          completed.reduce(
            (sum, entry) => sum + number(entry?.summary?.destruction),
            0
          ) / completed.length,
          2
        )
      : 0,
    attacksUsed: attacks,
    threeStars,
    threeStarRate: attacks
      ? round((threeStars / attacks) * 100, 1)
      : null,
    memberPerformance: completed.flatMap((entry) => entry?.memberPerformance || []).length
      ? aggregateMemberPerformance(
          completed.flatMap((entry) => [
            {
              memberPerformance: entry.memberPerformance || []
            }
          ])
        )
      : [],
    recent: series
      .slice(-8)
      .reverse()
      .map((entry) => ({
        season: entry.season || "unknown",
        date: entry.savedAt || null,
        record:
          number(entry?.summary?.wins) +
          "W / " +
          number(entry?.summary?.ties) +
          "T / " +
          number(entry?.summary?.losses) +
          "L",
        stars: number(entry?.summary?.stars),
        threeStars: number(entry?.summary?.threeStars)
      }))
  };
}

function analyzeActivityHistory({
  donations = [],
  capital = [],
  clanGames = []
} = {}) {
  const donationSeries = sortByTime(donations);
  const donationFirst = donationSeries[0] || null;
  const donationLatest = donationSeries.at(-1) || null;

  const capitalSeries = sortByTime(capital)
    .map((entry) => ({
      ...entry,
      seasonData: entry?.latestSeason || null
    }))
    .filter((entry) => entry.seasonData);

  const uniqueCapital = [];
  const capitalSeen = new Set();

  for (const entry of capitalSeries) {
    const key =
      entry.seasonData.season ||
      entry.seasonData.startTime ||
      entry.savedAt ||
      uniqueCapital.length;

    if (capitalSeen.has(key)) continue;
    capitalSeen.add(key);
    uniqueCapital.push(entry);
  }

  const gamesSeries = sortByTime(clanGames, ["season", "savedAt"]);

  return {
    donations: {
      snapshotCount: donationSeries.length,
      firstAt: donationFirst?.capturedAt || donationFirst?.savedAt || null,
      latestAt: donationLatest?.capturedAt || donationLatest?.savedAt || null,
      firstTotal: number(donationFirst?.totals?.donations),
      latestTotal: number(donationLatest?.totals?.donations),
      delta: donationLatest && donationFirst
        ? number(donationLatest?.totals?.donations) - number(donationFirst?.totals?.donations)
        : 0,
      firstReceived: number(donationFirst?.totals?.donationsReceived),
      latestReceived: number(donationLatest?.totals?.donationsReceived),
      receivedDelta: donationLatest && donationFirst
        ? number(donationLatest?.totals?.donationsReceived) - number(donationFirst?.totals?.donationsReceived)
        : 0,
      latestRatio: number(donationLatest?.totals?.ratio),
      latestTopDonor:
        donationLatest?.topDonors?.[0]?.name ||
        null
    },
    capital: {
      seasons: uniqueCapital.length,
      firstLoot: number(uniqueCapital[0]?.seasonData?.capitalTotalLoot),
      latestLoot: number(uniqueCapital.at(-1)?.seasonData?.capitalTotalLoot),
      lootDelta:
        uniqueCapital.length >= 2
          ? number(uniqueCapital.at(-1)?.seasonData?.capitalTotalLoot) -
            number(uniqueCapital[0]?.seasonData?.capitalTotalLoot)
          : 0,
      averageLoot: uniqueCapital.length
        ? round(
            uniqueCapital.reduce(
              (sum, entry) => sum + number(entry.seasonData?.capitalTotalLoot),
              0
            ) / uniqueCapital.length,
            1
          )
        : 0,
      totalAttacks: uniqueCapital.reduce(
        (sum, entry) => sum + number(entry.seasonData?.totalAttacks),
        0
      ),
      latestSeason: uniqueCapital.at(-1)?.seasonData?.season || null
    },
    clanGames: {
      seasons: gamesSeries.length,
      latest: gamesSeries.at(-1) || null,
      totalTrackedPoints: gamesSeries.reduce(
        (sum, season) => sum + number(season.totalPoints),
        0
      )
    }
  };
}

module.exports = {
  analyzePlayerHistory,
  analyzeWarHistory,
  analyzeCwlHistory,
  analyzeActivityHistory,
  goalAnalytics,
  overallCompletion,
  categoryCompletion,
  classifyClassicWar
};
