import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { log as logger } from "@eliware/common";
import { validateTargets } from "./targetValidator.mjs";

const defaultPath =
  process.env.KNIT_TARGETS_PATH ||
  path.join(process.env.KNIT_CONFIG_PATH || path.resolve("repos"), "targets.yaml");

export function createTargetLoader({
  targetsPath = defaultPath,
  fsModule = fs,
  log = logger,
} = {}) {
  let cache;
  const load = () => {
    if (cache) return cache;
    const document = yaml.load(fsModule.readFileSync(targetsPath, "utf8"));
    cache = document;
    return cache;
  };
  function validateAll() {
    const config = load();
    if (!validateTargets({ config, log })) return false;
    const files = Object.values(config.targets).flatMap((target) => [
      target.identity,
      target.knownHosts,
      target.hostCa,
    ]);
    const validFiles = files.every((file) => {
      try {
        fsModule.accessSync(file, fs.constants.R_OK);
        return fsModule.statSync(file).isFile();
      } catch {
        return false;
      }
    });
    if (!validFiles) log.error("ConfigValidator::validateTargets failed: invalid SSH file path");
    return validFiles;
  }

  return { load, validateAll };
}

export const defaultTargetLoader = createTargetLoader();
