const { createHandler } = require('@app-core/server');
const getCreatorCardBySlugService = require('@app/services/creator-card/get-by-slug');
const messages = require('@app/messages/creator-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = { ...rc.params, ...rc.query };

    const response = await getCreatorCardBySlugService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: messages.CREATOR_CARD_RETRIEVED,
      data: response,
    };
  },
});
