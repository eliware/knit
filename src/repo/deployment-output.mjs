import { redactText } from "@eliware/common";
import { formatCommandOutput } from "../commandOutput.mjs";

export function createDeploymentOutput() {
  let output = "";
  return {
    appendResult(result) {
      output += formatCommandOutput({
        cmd: redactText(result.command),
        stdout: redactText(result.result),
        stderr: redactText(result.stderr),
        exitCode: result.code,
      });
    },
    appendError(command, error) {
      output += formatCommandOutput({
        cmd: redactText(command),
        exitCode: error.code || 1,
      });
    },
    toString() {
      return output;
    },
  };
}
