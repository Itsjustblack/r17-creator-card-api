const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
// `endpoints/` has no @app alias (only @app-core/* and the @app/* folders listed in
// package.json do), so this is reached with a relative path, same as app.js's own requires.
const createCreatorCardEndpoint = require('../../../endpoints/creator-card/create');

// Mirrors the `helpers` object core/express/server.js passes to every handler at runtime.
const helpers = { http_statuses: HTTPStatusCode };

describe('endpoints/creator-card/create', () => {
  let originalFindOne;
  let originalCreate;

  beforeEach(() => {
    originalFindOne = CreatorCard.findOne;
    originalCreate = CreatorCard.create;
    CreatorCard.findOne = async () => null; // no slug collisions
    CreatorCard.create = async (data) => ({
      _id: 'fake-id',
      created: Date.now(),
      updated: Date.now(),
      ...data,
    });
  });

  afterEach(() => {
    CreatorCard.findOne = originalFindOne;
    CreatorCard.create = originalCreate;
  });

  it('returns HTTP 200 with the created card on success', async () => {
    const rc = {
      body: {
        title: 'Ada Designs Things',
        creator_reference: 'abcdefghij1234567890',
        status: 'published',
      },
    };

    const result = await createCreatorCardEndpoint.handler(rc, helpers);

    expect(result.status).to.equal(HTTPStatusCode.HTTP_200_OK);
    expect(result.message).to.equal(CreatorCardMessages.CREATOR_CARD_CREATED);
    expect(result.data.id).to.equal('fake-id');
  });

  it('lets validation errors from the service propagate (the framework formats the HTTP response, not the handler)', async () => {
    const rc = { body: { status: 'published' } }; // missing required title/creator_reference

    try {
      await createCreatorCardEndpoint.handler(rc, helpers);
      expect.fail('Expected the handler to throw');
    } catch (error) {
      expect(error.isApplicationError).to.equal(true);
    }
  });
});
