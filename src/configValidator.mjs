import { log as logger } from '@eliware/common';
import fs from 'fs';

/**
 * Validates a JSON configuration file.
 * @param {Object} params
 * @param {string} params.path - The path to the JSON file.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {Object} The parsed JSON object.
 * @throws {Error} If the file does not exist or is invalid JSON.
 */
export function validateJsonFile({ path, log = logger }) {
  if (!fs.existsSync(path)) {
    log.error(`Config file not found: ${path}`);
    throw new Error(`Config file not found: ${path}`);
  }
  const content = fs.readFileSync(path, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    log.error(`Invalid JSON in ${path}: ${e.message}`);
    throw new Error(`Invalid JSON in ${path}: ${e.message}`);
  }
  return data;
}

/**
 * Validates a configuration object.
 * @param {Object} params
 * @param {Object} params.config - The configuration object.
 * @param {Object} [params.log] - Logger instance to use.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ config, log = logger }) {
  if (!config || typeof config !== 'object' || !config.pwd) {
    log.error('ConfigValidator::validate failed: config invalid');
    return false;
  }
  // Add more validations if required (check dirs, array types, user/group validity)
  return true;
}
