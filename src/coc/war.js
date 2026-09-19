function getMembers(side) {
  return Array.isArray(side?.members) ? side.members : [];
}

function getAttacks(member) {
  return Array.isArray(member?.attacks) ? member.attacks : [];
}

function attackScore(attack) {
  return Number(attack?.stars || 0) * 1000 +
    Number(attack?.destructionPercentage || 0);
}

function bestAttack(attacks) {
  return [...attacks].sort((a, b) => attackScore(b) - attackScore(a))[0] || null;
}

function getWarIdentity(war, clanTag) {
  if (!war || war.state === "notInWar") return null;

  const ownTag = war.clan?.tag || clanTag || "unknown";
  const opponentTag = war.opponent?.tag || "unknown";
  const start = war.startTime || war.preparationStartTime || "unknown";

  return [ownTag, opponentTag, start].join("|");
}

function analyzeMember(member, attacksPerMember) {
  const attacks = getAttacks(member);
  const used = attacks.length;
  const allowed = Number(attacksPerMember || 1);
  const remaining = Math.max(allowed - used, 0);
  const stars = attacks.reduce(
    (sum, attack) => sum + Number(attack?.stars || 0),
    0
  );
  const destruction = attacks.reduce(
    (sum, attack) => sum + Number(attack?.destructionPercentage || 0),
    0
  );

  return {
    tag: member?.tag || null,
    name: member?.name || "Unknown",
    mapPosition: Number(member?.mapPosition || 0),
    townHallLevel: Number(member?.townhallLevel || member?.townHallLevel || 0),
    attacksUsed: used,
    attacksAllowed: allowed,
    attacksRemaining: remaining,
    stars,
    destruction: Number(destruction.toFixed(2)),
    averageDestruction: used
      ? Number((destruction / used).toFixed(2))
      : 0,
    bestAttack: bestAttack(attacks)
  };
}

function analyzeOpponentMember(member, ourAttacksByDefender) {
  const received = ourAttacksByDefender.get(member?.tag) || [];
  const bestReceived = bestAttack(received);

  return {
    tag: member?.tag || null,
    name: member?.name || "Unknown",
    mapPosition: Number(member?.mapPosition || 0),
    townHallLevel: Number(member?.townhallLevel || member?.townHallLevel || 0),
    attacksReceived: received.length,
    bestReceived,
    threeStarred: Number(bestReceived?.stars || 0) >= 3,
    highestStars: Number(bestReceived?.stars || 0),
    highestDestruction: Number(bestReceived?.destructionPercentage || 0)
  };
}

function analyzeWar(war, clanTag) {
  if (!war || war.state === "notInWar") {
    return {
      state: "notInWar",
      warId: null,
      clanTag: clanTag || null,
      summary: "The clan is not currently in a war."
    };
  }

  const attacksPerMember = Number(war.attacksPerMember || 1);
  const ownMembers = getMembers(war.clan);
  const opponentMembers = getMembers(war.opponent);

  const memberPerformance = ownMembers.map((member) =>
    analyzeMember(member, attacksPerMember)
  );

  const ownAttacks = ownMembers.flatMap(getAttacks);
  const ourAttacksByDefender = new Map();

  for (const attack of ownAttacks) {
    const defenderTag = attack?.defenderTag;
    if (!defenderTag) continue;

    const list = ourAttacksByDefender.get(defenderTag) || [];
    list.push(attack);
    ourAttacksByDefender.set(defenderTag, list);
  }

  const opponentReports = opponentMembers.map((member) =>
    analyzeOpponentMember(member, ourAttacksByDefender)
  );

  const totalStars = ownAttacks.reduce(
    (sum, attack) => sum + Number(attack?.stars || 0),
    0
  );

  const totalDestruction = ownAttacks.reduce(
    (sum, attack) => sum + Number(attack?.destructionPercentage || 0),
    0
  );

  const threeStars = ownAttacks.filter(
    (attack) => Number(attack?.stars || 0) >= 3
  ).length;

  const missedAttacks = memberPerformance.filter(
    (member) => member.attacksRemaining > 0
  );

  const cleanups = opponentReports
    .filter((member) => member.attacksReceived > 0 && !member.threeStarred)
    .sort((a, b) =>
      a.highestStars !== b.highestStars
        ? a.highestStars - b.highestStars
        : a.highestDestruction - b.highestDestruction
    );

  const untouchedOpponentBases = opponentReports
    .filter((member) => member.attacksReceived === 0)
    .sort((a, b) => a.mapPosition - b.mapPosition);

  const rankedMemberPerformance = [...memberPerformance].sort((a, b) =>
    b.stars !== a.stars
      ? b.stars - a.stars
      : b.destruction - a.destruction
  );

  const attacksRemaining = memberPerformance.reduce(
    (sum, member) => sum + member.attacksRemaining,
    0
  );

  const possibleAttacks = ownMembers.length * attacksPerMember;

  return {
    state: war.state,
    warId: getWarIdentity(war, clanTag),
    clanTag: war.clan?.tag || clanTag || null,
    clanName: war.clan?.name || "Your Clan",
    opponentTag: war.opponent?.tag || null,
    opponentName: war.opponent?.name || "Opponent",
    teamSize: Number(war.teamSize || ownMembers.length || 0),
    attacksPerMember,
    preparationStartTime: war.preparationStartTime || null,
    startTime: war.startTime || null,
    endTime: war.endTime || null,
    battleModifier: war.battleModifier || null,
    totals: {
      attacksUsed: ownAttacks.length,
      attacksRemaining,
      possibleAttacks,
      stars: totalStars,
      threeStars,
      totalDestruction: Number(totalDestruction.toFixed(2)),
      averageDestruction: ownAttacks.length
        ? Number((totalDestruction / ownAttacks.length).toFixed(2))
        : 0,
      clanStars: Number(war.clan?.stars || 0),
      opponentStars: Number(war.opponent?.stars || 0),
      clanDestruction: Number(war.clan?.destructionPercentage || 0),
      opponentDestruction: Number(war.opponent?.destructionPercentage || 0)
    },
    missedAttacks,
    cleanupTargets: cleanups,
    untouchedOpponentBases,
    memberPerformance: rankedMemberPerformance,
    opponentMembers: opponentReports
  };
}

function buildWarRecommendations(analysis) {
  if (!analysis || analysis.state === "notInWar") return [];

  const recommendations = [];

  if (analysis.totals.attacksRemaining > 0) {
    recommendations.push(
      "There are " +
        analysis.totals.attacksRemaining +
        " unused attack(s) remaining."
    );
  }

  if (analysis.cleanupTargets.length) {
    recommendations.push(
      analysis.cleanupTargets.length +
        " opponent base(s) have been attacked but are not yet at 3 stars."
    );
  }

  if (analysis.untouchedOpponentBases.length) {
    recommendations.push(
      analysis.untouchedOpponentBases.length +
        " opponent base(s) have not been attacked yet."
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      "All currently available attacks are accounted for. Focus on star and destruction efficiency."
    );
  }

  return recommendations;
}

function buildWarSummary(analysis) {
  if (!analysis || analysis.state === "notInWar") {
    return analysis?.summary || "No active war.";
  }

  return (
    analysis.clanName +
    " has " +
    analysis.totals.clanStars +
    " stars and " +
    analysis.totals.clanDestruction +
    "% destruction. " +
    analysis.opponentName +
    " has " +
    analysis.totals.opponentStars +
    " stars and " +
    analysis.totals.opponentDestruction +
    "% destruction. " +
    analysis.totals.attacksUsed +
    "/" +
    analysis.totals.possibleAttacks +
    " available attacks have been used."
  );
}

module.exports = {
  getWarIdentity,
  analyzeWar,
  buildWarRecommendations,
  buildWarSummary
};
