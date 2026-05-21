const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const { blockList } = config.resolver;
const blockListArr = Array.isArray(blockList)
  ? blockList
  : blockList
  ? [blockList]
  : [];

config.resolver.blockList = [
  ...blockListArr,
  new RegExp(`${escapeRegExp(path.resolve(monorepoRoot, ".local"))}.*`),
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = config;
