const { createHandler } = require('@app-core/server');
const deleteCreatorCardService = require('@app/services/creator-card/delete');
const messages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = { ...rc.params, ...rc.body };

    const response = await deleteCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: messages.CREATOR_CARD_DELETED,
      data: response,
    };
  },
});
