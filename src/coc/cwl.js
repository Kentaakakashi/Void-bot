const CWL_ATTACKS_PER_MEMBER = 1;

function normalizeTag(value) {
  const tag = String(value || "").trim().toUpperCase();

  if (!tag.startsWith("#")) {
    throw new Error("A Clash of Clans tag must start with #.");
  }

  return tag;
}

function realWarTags(group) {
  const seen = new Set();

  for (const round of group?.rounds || []) {
    for (const warTag of round?.warTags || []) {
      const normalized = String(warTag || "").trim().toUpperCase();

      if (!normalized || normalized === "#0" || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
    }
  }

  return [...seen];
}

async function fetchCwlWars(group, clanTag) {
  const tags = realWarTags(group);
  const wars = [];

  for (let index = 0; index < tags.length; index += 4) {
    const batch = tags.slice(index, index + 4);

    const results = await Promise.all(
      batch.map(async (warTag) => {
        try {
          return {
            warTag,
            war: await require("../coc/api").getCwlWar(warTag)
          };
        } catch (error) {
          return {
            warTag,
            error: error?.message || String(error)
          };
        }
      })
    );

    wars.push(...results);
  }

  return wars.filter(
    (entry) =>
      entry.war &&
      [entry.war.clan?.tag, entry.war.opponent?.tag]
        .filter(Boolean)
        .map((tag) => tag.toUpperCase())
        .includes(clanTag)
  );
}

function findRoundForWar(group, warTag) {
  const normalized = String(warTag || "").toUpperCase();

  for (let index = 0; index < (group?.rounds || []).length; index += 1) {
    if (
      (group.rounds[index]?.warTags || [])
        .map((tag) => String(tag || "").toUpperCase())
        .includes(normalized)
    ) {
      return index + 1;
    }
  }

  return null;
}

function orientWar(war, clanTag) {
  const normalized = normalizeTag(clanTag);

  if (war?.clan?.tag?.toUpperCase() === normalized) {
    return {
      ...war,
      orientedFor: normalized
    };
  }

  if (war?.opponent?.tag?.toUpperCase() === normalized) {
    return {
      ...war,
      clan: war.opponent,
      opponent: war.clan,
      orientedFor: normalized
    };
  }

  return war;
}

function analyzeCwlWar(entry, clanTag) {
  const war = orientWar(entry.war, clanTag);
  const members = Array.isArray(war?.clan?.members)
    ? war.clan.members
    : [];
  const attacks = members.flatMap((member) =>
    Array.isArray(member?.attacks) ? member.attacks : []
  );

  const stars = attacks.reduce(
    (sum, attack) => sum + Number(attack?.stars || 0),
    0
  );

  const destruction = attacks.reduce(
    (sum, attack) =>
      sum + Number(attack?.destructionPercentage || 0),
    0
  );

  const threeStars = attacks.filter(
    (attack) => Number(attack?.stars || 0) >= 3
  ).length;

  const attacksUsed = attacks.length;
  const battleDay = war?.state === "inWar";
  const possibleAttacks = members.length * CWL_ATTACKS_PER_MEMBER;
  const attacksRemaining = battleDay
    ? Math.max(possibleAttacks - attacksUsed, 0)
    : 0;

  const memberPerformance = members
    .map((member) => {
      const memberAttacks = Array.isArray(member?.attacks)
        ? member.attacks
        : [];

      const memberStars = memberAttacks.reduce(
        (sum, attack) => sum + Number(attack?.stars || 0),
        0
      );

      const memberDestruction = memberAttacks.reduce(
        (sum, attack) =>
          sum + Number(attack?.destructionPercentage || 0),
        0
      );

      return {
        tag: member?.tag || null,
        name: member?.name || "Unknown",
        mapPosition: Number(member?.mapPosition || 0),
        townHallLevel: Number(member?.townhallLevel || 0),
        attacksUsed: memberAttacks.length,
        attacksRemaining: battleDay
          ? Math.max(
              CWL_ATTACKS_PER_MEMBER - memberAttacks.length,
              0
            )
          : 0,
        stars: memberStars,
        destruction: Number(memberDestruction.toFixed(2)),
        averageStars: memberAttacks.length
          ? Number((memberStars / memberAttacks.length).toFixed(2))
          : 0,
        averageDestruction: memberAttacks.length
          ? Number(
              (memberDestruction / memberAttacks.length).toFixed(2)
            )
          : 0
      };
    })
    .sort((a, b) =>
      b.stars !== a.stars
        ? b.stars - a.stars
        : b.destruction - a.destruction
    );

  return {
    warTag: entry.warTag,
    state: war?.state || "unknown",
    round: null,
    clanTag: war?.clan?.tag || clanTag,
    clanName: war?.clan?.name || "Your Clan",
    opponentTag: war?.opponent?.tag || null,
    opponentName: war?.opponent?.name || "Opponent",
    teamSize: Number(war?.teamSize || members.length || 0),
    startTime: war?.startTime || null,
    preparationStartTime: war?.preparationStartTime || null,
    endTime: war?.endTime || null,
    totals: {
      stars: Number(war?.clan?.stars || 0),
      attackStars: stars,
      destruction: Number(war?.clan?.destructionPercentage || 0),
      attackDestructionSum: Number(destruction.toFixed(2)),
      threeStars,
      attacksUsed,
      possibleAttacks,
      attacksRemaining,
      opponentStars: Number(war?.opponent?.stars || 0),
      opponentDestruction: Number(
        war?.opponent?.destructionPercentage || 0
      ),
      clanStars: Number(war?.clan?.stars || 0),
      clanDestruction: Number(
        war?.clan?.destructionPercentage || 0
      ),
      attackEfficiency: attacksUsed
        ? Number((stars / attacksUsed).toFixed(2))
        : 0,
      threeStarRate: attacksUsed
        ? Number(((threeStars / attacksUsed) * 100).toFixed(1))
        : 0
    },
    memberPerformance
  };
}

function classifyResult(war) {
  if (war.state !== "warEnded") {
    return "inProgress";
  }

  if (
    war.totals.clanStars > war.totals.opponentStars ||
    (
      war.totals.clanStars === war.totals.opponentStars &&
      war.totals.clanDestruction > war.totals.opponentDestruction
    )
  ) {
    return "win";
  }

  if (
    war.totals.clanStars === war.totals.opponentStars &&
    war.totals.clanDestruction === war.totals.opponentDestruction
  ) {
    return "tie";
  }

  return "loss";
}

function analyzeCwlGroup(group, wars, clanTag) {
  const normalized = normalizeTag(clanTag);

  const analyzedWars = wars.map((entry) => {
    const result = analyzeCwlWar(entry, normalized);
    result.round = findRoundForWar(group, entry.warTag);
    result.result = classifyResult(result);
    return result;
  }).sort((a, b) => (a.round || 99) - (b.round || 99));

  const memberMap = new Map();

  for (const war of analyzedWars) {
    for (const member of war.memberPerformance) {
      if (!member.tag) continue;

      const current = memberMap.get(member.tag) || {
        tag: member.tag,
        name: member.name,
        townHallLevel: member.townHallLevel,
        warsParticipated: 0,
        attacksUsed: 0,
        attacksRemaining: 0,
        stars: 0,
        destruction: 0,
      };

      current.warsParticipated += 1;
      current.attacksUsed += member.attacksUsed;
      current.attacksRemaining += member.attacksRemaining;
      current.stars += member.stars;
      current.destruction += member.destruction;

      memberMap.set(member.tag, current);
    }
  }

  const memberPerformance = [...memberMap.values()]
    .map((member) => ({
      ...member,
      averageStars: member.attacksUsed
        ? Number((member.stars / member.attacksUsed).toFixed(2))
        : 0,
      averageDestruction: member.attacksUsed
        ? Number(
            (member.destruction / member.attacksUsed).toFixed(2)
          )
        : 0
    }))
    .sort((a, b) =>
      b.stars !== a.stars
        ? b.stars - a.stars
        : b.destruction - a.destruction
    );

  const wins = analyzedWars.filter((war) => war.result === "win").length;
  const ties = analyzedWars.filter((war) => war.result === "tie").length;
  const losses = analyzedWars.filter((war) => war.result === "loss").length;
  const inProgress = analyzedWars.filter(
    (war) => war.result === "inProgress"
  ).length;

  const roster = (group?.clans || []).find(
    (clan) => clan?.tag?.toUpperCase() === normalized
  );

  const registeredRoster = (roster?.members || []).map((member) => ({
    tag: member?.tag || null,
    name: member?.name || "Unknown",
    townHallLevel: Number(member?.townHallLevel || 0)
  }));

  const registeredTags = new Set(
    registeredRoster.map((member) => member.tag).filter(Boolean)
  );

  const warParticipantTags = new Set(
    analyzedWars.flatMap((war) =>
      war.memberPerformance.map((member) => member.tag).filter(Boolean)
    )
  );

  return {
    state: group?.state || "unknown",
    season: group?.season || null,
    clanTag: normalized,
    clanName: roster?.name || analyzedWars[0]?.clanName || "Your Clan",
    clanLevel: Number(roster?.clanLevel || 0),
    participatingClans: (group?.clans || []).map((clan) => ({
      tag: clan?.tag || null,
      name: clan?.name || "Unknown",
      level: Number(clan?.clanLevel || 0),
      rosterSize: Array.isArray(clan?.members) ? clan.members.length : 0
    })),
    rounds: analyzedWars,
    summary: {
      roundsFetched: analyzedWars.length,
      roundsCompleted: analyzedWars.filter(
        (war) => war.result !== "inProgress"
      ).length,
      inProgress,
      wins,
      ties,
      losses,
      stars: analyzedWars.reduce(
        (sum, war) => sum + war.totals.clanStars,
        0
      ),
      destruction: Number(
        analyzedWars
          .reduce((sum, war) => sum + war.totals.clanDestruction, 0)
          .toFixed(2)
      ),
      attacksUsed: analyzedWars.reduce(
        (sum, war) => sum + war.totals.attacksUsed,
        0
      ),
      attacksRemaining: analyzedWars.reduce(
        (sum, war) => sum + war.totals.attacksRemaining,
        0
      ),
      threeStars: analyzedWars.reduce(
        (sum, war) => sum + war.totals.threeStars,
        0
      )
    },
    roster: {
      registered: registeredRoster,
      registeredCount: registeredRoster.length,
      warParticipantCount: warParticipantTags.size,
      registeredNotSeenInFetchedWars: registeredRoster.filter(
        (member) => !warParticipantTags.has(member.tag)
      )
    },
    memberPerformance,
    sourceNote:
      "CWL data is derived from the Clash of Clans API group and war endpoints. Future rounds can contain #0 placeholders and are ignored until a real war tag exists."
  };
}

async function getCwlAnalysis(clanTag, getCurrentCwlGroup, getCwlWar) {
  const normalized = normalizeTag(clanTag);
  const group = await getCurrentCwlGroup(normalized);

  if (
    !group ||
    group.state === "notInWar" ||
    group.state === "groupNotFound"
  ) {
    return {
      state: "notInWar",
      season: group?.season || null,
      clanTag: normalized,
      rounds: [],
      summary: {
        roundsPlayed: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        stars: 0,
        destruction: 0,
        attacksUsed: 0,
        attacksRemaining: 0,
        threeStars: 0
      },
      roster: {
        registered: [],
        registeredCount: 0,
        warParticipantCount: 0,
        registeredNotSeenInFetchedWars: []
      },
      memberPerformance: [],
      participatingClans: []
    };
  }

  const tags = realWarTags(group);
  const fetched = [];

  for (let index = 0; index < tags.length; index += 4) {
    const batch = tags.slice(index, index + 4);

    const results = await Promise.all(
      batch.map(async (warTag) => {
        try {
          return { warTag, war: await getCwlWar(warTag) };
        } catch (error) {
          return { warTag, error: error?.message || String(error) };
        }
      })
    );

    fetched.push(...results);
  }

  const relevantWars = fetched.filter((entry) => {
    const tagsInWar = [
      entry.war?.clan?.tag,
      entry.war?.opponent?.tag
    ]
      .filter(Boolean)
      .map((tag) => tag.toUpperCase());

    return entry.war && tagsInWar.includes(normalized);
  });

  return analyzeCwlGroup(group, relevantWars, normalized);
}

module.exports = {
  CWL_ATTACKS_PER_MEMBER,
  realWarTags,
  fetchCwlWars,
  analyzeCwlWar,
  analyzeCwlGroup,
  getCwlAnalysis
};
