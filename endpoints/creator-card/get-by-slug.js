const { createHandler } = require('@app-core/server');
const getCreatorCardBySlugService = require('@app/services/creator-card/get-by-slug');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = rc.params;

    const response = await getCreatorCardBySlugService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: response,
    };
  },
});
