import { jest } from "@jest/globals";
import { log } from "@eliware/common";

for (const transport of log.transports) transport.silent = true;

for (const method of ["log", "info", "warn", "error"]) {
  jest.spyOn(console, method).mockImplementation(() => {});
}
