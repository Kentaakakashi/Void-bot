function normalizeClanTag(value) {
  const tag = String(value || "").trim().toUpperCase();
  if (!tag.startsWith("#")) {
    throw new Error("A clan tag must start with #.");
  }
  return tag;
}

function memberList(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.memberList)) return data.memberList;
  return [];
}

function donationRatio(donations, received) {
  if (!Number(received)) return Number(donations || 0);
  return Number((Number(donations || 0) / Number(received)).toFixed(2));
}

function analyzeDonations(clan, membersData) {
  const members = memberList(membersData || clan);
  const normalized = members.map((member) => {
    const donations = Number(member?.donations || 0);
    const received = Number(member?.donationsReceived || 0);
    return {
      tag: member?.tag || null,
      name: member?.name || "Unknown",
      role: member?.role || "MEMBER",
      townHallLevel: Number(member?.townHallLevel || 0),
      donations,
      donationsReceived: received,
      ratio: donationRatio(donations, received)
    };
  });

  const totalDonations = normalized.reduce((sum, member) => sum + member.donations, 0);
  const totalReceived = normalized.reduce((sum, member) => sum + member.donationsReceived, 0);

  return {
    clanTag: clan?.tag || null,
    clanName: clan?.name || "Unknown Clan",
    memberCount: normalized.length,
    totals: {
      donations: totalDonations,
      donationsReceived: totalReceived,
      ratio: donationRatio(totalDonations, totalReceived)
    },
    topDonors: [...normalized].sort((a, b) => b.donations - a.donations),
    lowestDonors: [...normalized].sort((a, b) => a.donations - b.donations),
    members: normalized
  };
}

function firstNumber(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function summarizeCapitalSeason(season) {
  return {
    state: season?.state || null,
    startTime: season?.startTime || null,
    endTime: season?.endTime || null,
    season: season?.season || null,
    attacks: firstNumber(season, ["totalAttacks", "attacks", "attackCount"]),
    loot: firstNumber(season, ["totalLoot", "capitalTotalLoot", "offensiveLoot"]),
    raidMedals: firstNumber(season, ["raidMedals", "medalsEarned"]),
    districtsDestroyed: firstNumber(season, ["districtsDestroyed"]),
    attackLimit: firstNumber(season, ["attackLimit"]),
    raw: season || {}
  };
}

function analyzeCapital(clan, seasonsData) {
  const seasons = Array.isArray(seasonsData?.items) ? seasonsData.items : [];
  return {
    clanTag: clan?.tag || null,
    clanName: clan?.name || "Unknown Clan",
    capitalHallLevel: Number(clan?.clanCapital?.capitalHallLevel || 0),
    capitalLeague: clan?.capitalLeague || null,
    clanCapitalPoints: Number(clan?.clanCapitalPoints || 0),
    latestSeason: seasons.length ? summarizeCapitalSeason(seasons[0]) : null,
    seasons: seasons.map(summarizeCapitalSeason)
  };
}

module.exports = {
  normalizeClanTag,
  analyzeDonations,
  summarizeCapitalSeason,
  analyzeCapital
}