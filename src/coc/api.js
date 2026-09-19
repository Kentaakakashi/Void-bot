const config = require("../config/config");

const BASE_URL = "https://api.clashofclans.com/v1";
const REQUEST_TIMEOUT_MS = 10000;

function requireToken() {
  if (!config.coc.apiToken) {
    throw new Error("COC_API_TOKEN is not configured.");
  }
}

function encodeTag(tag) {
  const normalized = String(tag || "").trim().toUpperCase();

  if (!normalized.startsWith("#")) {
    throw new Error("A Clash of Clans tag must start with #.");
  }

  return encodeURIComponent(normalized);
}

async function request(endpoint) {
  requireToken();

  let response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.coc.apiToken}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    if (error?.name === "TimeoutError") {
      throw new Error("Clash of Clans API request timed out.");
    }

    throw new Error(
      error?.message || "Clash of Clans API request failed."
    );
  }

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Clash of Clans API returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(
      data?.message || `Clash of Clans API request failed (${response.status}).`
    );
  }

  return data;
}

async function getPlayer(playerTag) {
  return request(`/players/${encodeTag(playerTag)}`);
}

async function getClan(clanTag) {
  return request(`/clans/${encodeTag(clanTag)}`);
}

async function getClanMembers(clanTag, query = "limit=50") {
  const suffix = query ? "?" + query : "";

  return request(
    `/clans/${encodeTag(clanTag)}/members${suffix}`
  );
}

async function getCapitalRaidSeasons(clanTag, limit = 5) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);

  return request(
    `/clans/${encodeTag(clanTag)}/capitalraidseasons?limit=${safeLimit}`
  );
}

async function getCurrentWar(clanTag) {
  return request(`/clans/${encodeTag(clanTag)}/currentwar`);
}

async function getCurrentCwlGroup(clanTag) {
  return request(`/clans/${encodeTag(clanTag)}/currentwar/leaguegroup`);
}

async function getCwlWar(warTag) {
  const normalized = String(warTag || "").trim().toUpperCase();

  if (!normalized.startsWith("#")) {
    throw new Error("A CWL war tag must start with #.");
  }

  return request(
    `/clanwarleagues/wars/${encodeURIComponent(normalized)}`
  );
}

module.exports = {
  request,
  getPlayer,
  getClan,
  getClanMembers,
  getCapitalRaidSeasons,
  getCurrentWar,
  getCurrentCwlGroup,
  getCwlWar
};