const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
const getCreatorCardBySlugEndpoint = require('../../../endpoints/creator-card/get-by-slug');

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

  it('throws NF01 (the framework maps this to HTTP 404) when the slug does not exist', async () => {
    CreatorCard.findOne = async () => null;

    const rc = { params: { slug: 'missing' }, query: {} };

    try {
      await getCreatorCardBySlugEndpoint.handler(rc, helpers);
      expect.fail('Expected the handler to throw');
    } catch (error) {
      expect(error.context && error.context.code).to.equal('NF01');
    }
  });
});
