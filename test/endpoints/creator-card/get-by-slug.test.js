const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
const { CREATOR_CARD_ERROR_CODE } = require('@app/services/creator-card/errors');
const getCreatorCardBySlugEndpoint = require('../../../endpoints/creator-card/get-by-slug');
const expectAppError = require('../../helpers/expect-app-error');

const helpers = { http_statuses: HTTPStatusCode };

describe('endpoints/creator-card/get-by-slug', () => {
  let originalFindOne;

  beforeEach(() => {
    originalFindOne = CreatorCard.findOne;
  });

  afterEach(() => {
    CreatorCard.findOne = originalFindOne;
  });

  it('returns HTTP 200 with the card when it exists and is publicly accessible', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'public',
      access_code: null,
    });

    // The real handler merges params and query into one payload (rc.params + rc.query).
    const rc = { params: { slug: 'ada-designs-things' }, query: {} };
    const result = await getCreatorCardBySlugEndpoint.handler(rc, helpers);

    expect(result.status).to.equal(HTTPStatusCode.HTTP_200_OK);
    expect(result.message).to.equal(CreatorCardMessages.CREATOR_CARD_RETRIEVED);
    expect(result.data.id).to.equal('card-1');
    expect(result.data).to.not.have.property('access_code');
  });

  it('returns HTTP 200 with a private card when the correct access_code is supplied, without leaking it', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    const rc = { params: { slug: 'ada-designs-things' }, query: { access_code: 'A1B2C3' } };
    const result = await getCreatorCardBySlugEndpoint.handler(rc, helpers);

    expect(result.status).to.equal(HTTPStatusCode.HTTP_200_OK);
    expect(result.data.id).to.equal('card-1');
    expect(result.data).to.not.have.property('access_code');
  });

  it('returns NF01 (HTTP 404) when the slug does not exist', async () => {
    CreatorCard.findOne = async () => null;
    const rc = { params: { slug: 'missing' }, query: {} };

    await expectAppError(() => getCreatorCardBySlugEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
      message: CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
      httpStatus: 404,
    });
  });

  it('returns NF02 (HTTP 404) when the card is a draft (drafts are never publicly retrievable)', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'draft',
      access_type: 'public',
    });
    const rc = { params: { slug: 'ada-designs-things' }, query: {} };

    await expectAppError(() => getCreatorCardBySlugEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.DRAFT_NOT_FOUND,
      message: CreatorCardMessages.DRAFT_NOT_FOUND,
      httpStatus: 404,
    });
  });

  it('returns AC03 (HTTP 403) when the card is private and no access_code is supplied', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
    });
    const rc = { params: { slug: 'ada-designs-things' }, query: {} };

    await expectAppError(() => getCreatorCardBySlugEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED,
      message: CreatorCardMessages.ACCESS_CODE_REQUIRED,
      httpStatus: HTTPStatusCode.HTTP_403_FORBIDDEN,
    });
  });

  it('returns AC04 (HTTP 403) when the card is private and the supplied access_code does not match', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
    });
    const rc = { params: { slug: 'ada-designs-things' }, query: { access_code: 'WRONG1' } };

    await expectAppError(() => getCreatorCardBySlugEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_INVALID,
      message: CreatorCardMessages.ACCESS_CODE_INVALID,
      httpStatus: HTTPStatusCode.HTTP_403_FORBIDDEN,
    });
  });
});
