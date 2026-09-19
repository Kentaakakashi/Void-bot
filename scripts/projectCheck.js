const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(fullPath));
    else if (entry.isFile()) output.push(fullPath);
  }
  return output;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkSyntax(files) {
  for (const file of files.filter((file) => file.endsWith(".js"))) {
    const source = fs.readFileSync(file, "utf8");
    try {
      new Function(source);
    } catch (error) {
      throw new Error(`Syntax error in ${path.relative(ROOT, file)}: ${error.message}`);
    }
  }
}

function relativeRequiresExist(files) {
  const known = new Set(files.map((file) => path.resolve(file)));

  for (const file of files.filter((file) => file.endsWith(".js"))) {
    const source = fs.readFileSync(file, "utf8");
    const dir = path.dirname(file);
    const regex = /require\(["'](\.{1,2}\/[^"']+)["']\)/g;
    let match;

    while ((match = regex.exec(source))) {
      const base = path.resolve(dir, match[1]);
      const valid = known.has(base) || known.has(`${base}.js`) || known.has(path.join(base, "index.js"));
      assert(valid, `Broken relative require in ${path.relative(ROOT, file)}: ${match[1]}`);
    }
  }
}

function checkCommands() {
  process.env.DISCORD_TOKEN ||= "audit-placeholder";
  process.env.DISCORD_CLIENT_ID ||= "123456789012345678";
  process.env.DISCORD_GUILD_ID ||= "123456789012345678";
  process.env.OPENAI_API_KEY ||= "audit-placeholder";
  process.env.FIREBASE_PROJECT_ID ||= "audit-project";
  process.env.FIREBASE_CLIENT_EMAIL ||= "audit@example.com";
  process.env.FIREBASE_PRIVATE_KEY ||= "-----BEGIN PRIVATE KEY-----\\naudit\\n-----END PRIVATE KEY-----";

  const commandDir = path.join(ROOT, "src", "commands");
  const commandFiles = walk(commandDir).filter((file) => file.endsWith(".js"));
  const names = new Set();

  for (const file of commandFiles) {
    delete require.cache[require.resolve(file)];
    const command = require(file);
    assert(command?.data?.name, `Command has no name: ${path.relative(ROOT, file)}`);
    assert(typeof command.execute === "function", `Command has no execute(): ${path.relative(ROOT, file)}`);

    assert(!names.has(command.data.name), `Duplicate command name: ${command.data.name}`);
    names.add(command.data.name);

    const json = command.data.toJSON();
    assert(json.options.length <= 25, `${json.name} has ${json.options.length} top-level options; Discord allows at most 25.`);
    validateOptionNames(json.options, json.name);
  }
}

function validateOptionNames(options, location) {
  const names = new Set();
  for (const option of options || []) {
    assert(!names.has(option.name), `Duplicate option name '${option.name}' in ${location}.`);
    names.add(option.name);

    if (Array.isArray(option.options)) {
      validateOptionNames(option.options, `${location} ${option.name}`);
    }
  }
}

function checkAiTools() {
  const registry = require(path.join(ROOT, "src", "ai", "tools.js"));
  const tools = registry.getAvailableTools();
  const names = new Set();

  for (const tool of tools) {
    assert(tool.type === "function", "AI registry contains a non-function tool entry.");
    assert(tool.name, "AI tool is missing a name.");
    assert(!names.has(tool.name), `Duplicate AI tool: ${tool.name}`);
    names.add(tool.name);
  }

  const handlerSource = fs.readFileSync(path.join(ROOT, "src", "ai", "toolHandlers.js"), "utf8");
  for (const name of names) {
    assert(handlerSource.includes(`name === "${name}"`), `No handler branch found for AI tool: ${name}`);
  }
}

function checkPureLogic() {
  const planner = require(path.join(ROOT, "src", "coc", "planner.js"));
  const war = require(path.join(ROOT, "src", "coc", "war.js"));
  const cwl = require(path.join(ROOT, "src", "coc", "cwl.js"));
  const activity = require(path.join(ROOT, "src", "coc", "clanActivity.js"));

  const emptyReadiness = planner.buildReadiness({
    heroes: [],
    troops: [],
    spells: [],
    heroEquipment: []
  });
  assert(emptyReadiness.ready === false, "Readiness incorrectly reports empty data as ready.");
  assert(emptyReadiness.reliableMaxLevelData === false, "Empty progression data must not be marked reliable.");

  const prepWar = war.analyzeWar({
    state: "preparation",
    attacksPerMember: 2,
    clan: { tag: "#A", members: [{ tag: "#P", name: "Player" }] },
    opponent: { tag: "#B", name: "Opponent", members: [] }
  }, "#A");
  assert(prepWar.totals.attacksRemaining === 0, "Preparation war incorrectly exposes attack time as remaining attacks.");

  const inProgressCwl = cwl.analyzeCwlWar({
    warTag: "#WAR",
    war: {
      state: "inWar",
      teamSize: 1,
      clan: { tag: "#A", name: "A", members: [] },
      opponent: { tag: "#B", name: "B", stars: 0, destructionPercentage: 0 }
    }
  }, "#A");
  assert(inProgressCwl.totals.attacksRemaining === 0, "Empty in-progress CWL war should have zero remaining attacks in fixture.");
  assert(cwl.realWarTags({ rounds: [{ warTags: ["#0", "#REAL", "#REAL"] }] }).length === 1, "CWL placeholder/deduplication logic failed.");

  const donations = activity.analyzeDonations(
    { tag: "#CLAN", name: "Clan" },
    { items: [{ tag: "#P", name: "Player", donations: 10, donationsReceived: 5 }] }
  );
  assert(donations.totals.donations === 10 && donations.totals.donationsReceived === 5, "Donation aggregate logic failed.");

  const capital = activity.analyzeCapital(
    {
      tag: "#CLAN",
      name: "Clan",
      clanCapital: { capitalHallLevel: 8, clanGoldSinkTotal: 12345, districts: [] },
      clanCapitalPoints: 999,
      memberList: [{ tag: "#P", name: "Player", townHallLevel: 15, clanCapitalContributions: 500 }]
    },
    { items: [{ season: "2026-09", capitalTotalLoot: 1000, totalAttacks: 20, enemyDistrictsDestroyed: 3, offensiveReward: 100, defensiveReward: 50, members: [] }] }
  );
  assert(capital.latestSeason.capitalTotalLoot === 1000, "Capital season field mapping failed.");
  assert(capital.topContributors[0].capitalContributions === 500, "Capital contribution tracking failed.");
}

try {
  const files = walk(ROOT);
  checkSyntax(files);
  relativeRequiresExist(files);
  checkCommands();
  checkAiTools();
  checkPureLogic();
  console.log(`VØID PROJECT CHECK PASSED • ${files.length} files inspected.`);
} catch (error) {
  console.error(`VØID PROJECT CHECK FAILED: ${error.message}`);
  process.exitCode = 1;
}