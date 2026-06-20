const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const { ERROR_CODE } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
const { CREATOR_CARD_ERROR_CODE } = require('@app/services/creator-card/errors');
// `endpoints/` has no @app alias (only @app-core/* and the @app/* folders listed in
// package.json do), so this is reached with a relative path, same as app.js's own requires.
const createCreatorCardEndpoint = require('../../../endpoints/creator-card/create');
const expectAppError = require('../../helpers/expect-app-error');

// Mirrors the `helpers` object core/express/server.js passes to every handler at runtime.
const helpers = { http_statuses: HTTPStatusCode };

// Builds a minimal, fully valid create-card request body. Individual tests only override
// the field(s) they care about, so each test stays focused on one rule.
function buildBody(overrides = {}) {
  return {
    title: 'Ada Designs Things',
    creator_reference: 'abcdefghij1234567890', // exactly 20 characters, per spec
    status: 'published',
    ...overrides,
  };
}

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
    const rc = { body: buildBody() };

    const result = await createCreatorCardEndpoint.handler(rc, helpers);

    expect(result.status).to.equal(HTTPStatusCode.HTTP_200_OK);
    expect(result.message).to.equal(CreatorCardMessages.CREATOR_CARD_CREATED);
    expect(result.data.id).to.equal('fake-id');
  });

  it('returns HTTP 400 when a required field is missing (VSL field-level validation)', async () => {
    const rc = { body: { status: 'published' } }; // missing required title/creator_reference

    await expectAppError(() => createCreatorCardEndpoint.handler(rc, helpers), {
      httpStatus: HTTPStatusCode.HTTP_400_BAD_REQUEST,
    });
  });

  it('returns SL02 (HTTP 400) when the client-supplied slug is already taken', async () => {
    CreatorCard.findOne = async () => ({ slug: 'ada-designs-things' }); // simulate an existing card
    const rc = { body: buildBody({ slug: 'ada-designs-things' }) };

    await expectAppError(() => createCreatorCardEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.SLUG_TAKEN,
      message: CreatorCardMessages.SLUG_ALREADY_TAKEN,
      httpStatus: HTTPStatusCode.HTTP_400_BAD_REQUEST,
    });
  });

  it('returns AC01 (HTTP 400) when access_type is private and access_code is missing', async () => {
    const rc = { body: buildBody({ access_type: 'private' }) };

    await expectAppError(() => createCreatorCardEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED_FOR_PRIVATE,
      message: CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE,
      httpStatus: HTTPStatusCode.HTTP_400_BAD_REQUEST,
    });
  });

  it('returns AC05 (HTTP 400) when access_code is set on a public (or default) card', async () => {
    const rc = { body: buildBody({ access_code: 'ab12cd' }) };

    await expectAppError(() => createCreatorCardEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC,
      message: CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC,
      httpStatus: HTTPStatusCode.HTTP_400_BAD_REQUEST,
    });
  });

  it('returns HTTP 400 for field-level validation failures (e.g. an invalid slug format)', async () => {
    const rc = { body: buildBody({ slug: 'bad slug!' }) };

    await expectAppError(() => createCreatorCardEndpoint.handler(rc, helpers), {
      errorCode: ERROR_CODE.VALIDATIONERR,
      message: CreatorCardMessages.INVALID_SLUG_FORMAT,
      httpStatus: HTTPStatusCode.HTTP_400_BAD_REQUEST,
    });
  });
});
