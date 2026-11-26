function configureErrorHandler(app, log) {
  app.use((error, request, response, next) => {
    if (error?.type === "entity.parse.failed") {
      log.warn?.("[App] Invalid JSON request body");
      return response.status(400).send("Webhook processing failed.");
    }
    return next(error);
  });
}

export default configureErrorHandler;
Object.assign(configureErrorHandler, { configureErrorHandler });
