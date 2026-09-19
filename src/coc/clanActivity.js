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
  const members = Array.isArray(season?.members)
    ? season.members
    : [];

  const totalAttacks = Number(season?.totalAttacks || 0);
  const totalLoot = Number(season?.capitalTotalLoot || 0);
  const raidMedals = Number(season?.offensiveReward || 0) +
    Number(season?.defensiveReward || 0);

  return {
    state: season?.state || null,
    startTime: season?.startTime || null,
    endTime: season?.endTime || null,
    capitalTotalLoot: totalLoot,
    raidsCompleted: Number(season?.raidsCompleted || 0),
    totalAttacks,
    enemyDistrictsDestroyed: Number(season?.enemyDistrictsDestroyed || 0),
    offensiveReward: Number(season?.offensiveReward || 0),
    defensiveReward: Number(season?.defensiveReward || 0),
    raidMedals,
    attacksUsed: totalAttacks,
    memberCount: members.length,
    members: members.map((member) => ({
      tag: member?.tag || null,
      name: member?.name || "Unknown",
      attacks: Number(member?.attacks || 0),
      attackLimit: Number(member?.attackLimit || 0),
      bonusAttackLimit: Number(member?.bonusAttackLimit || 0),
      capitalResourcesLooted: Number(member?.capitalResourcesLooted || 0)
    }))
  };
}

function analyzeCapital(clan, seasonsData) {
  const seasons = Array.isArray(seasonsData?.items)
    ? seasonsData.items
    : [];

  const memberList = Array.isArray(clan?.memberList)
    ? clan.memberList
    : [];

  const capital = clan?.clanCapital || {};
  const districts = Array.isArray(capital?.districts)
    ? capital.districts
    : [];

  const contributors = memberList
    .map((member) => ({
      tag: member?.tag || null,
      name: member?.name || "Unknown",
      townHallLevel: Number(member?.townHallLevel || 0),
      capitalContributions: Number(member?.clanCapitalContributions || 0)
    }))
    .sort((a, b) => b.capitalContributions - a.capitalContributions);

  return {
    clanTag: clan?.tag || null,
    clanName: clan?.name || "Unknown Clan",
    capitalHallLevel: Number(capital?.capitalHallLevel || 0),
    capitalLeague: clan?.capitalLeague || null,
    clanCapitalPoints: Number(clan?.clanCapitalPoints || 0),
    clanGoldSinkTotal: Number(capital?.clanGoldSinkTotal || 0),
    districts: districts.map((district) => ({
      id: Number(district?.id || 0),
      name: district?.name || "Unknown",
      districtHallLevel: Number(district?.districtHallLevel || 0)
    })),
    topContributors: contributors.slice(0, 15),
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