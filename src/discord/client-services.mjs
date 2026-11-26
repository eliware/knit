import __knitModule0 from "../discordServices.mjs";
const { registerDiscordServices, unregisterDiscordServices } = __knitModule0;

function createDiscordClientServices({
  register = registerDiscordServices,
  unregister = unregisterDiscordServices,
} = {}) {
  return {
    register(options) {
      return register(options);
    },
    unregister(options) {
      return unregister(options);
    },
  };
}

export default createDiscordClientServices;
Object.assign(createDiscordClientServices, { createDiscordClientServices });
