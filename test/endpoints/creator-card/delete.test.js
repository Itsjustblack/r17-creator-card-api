const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
const deleteCreatorCardEndpoint = require('../../../endpoints/creator-card/delete');

const helpers = { http_statuses: HTTPStatusCode };
const CREATOR_REFERENCE = 'abcdefghij1234567890'; // exactly 20 characters, per spec

describe('endpoints/creator-card/delete', () => {
  let originalFindOne;
  let originalDeleteOne;

  beforeEach(() => {
    originalFindOne = CreatorCard.findOne;
    originalDeleteOne = CreatorCard.deleteOne;
  });

  afterEach(() => {
    CreatorCard.findOne = originalFindOne;
    CreatorCard.deleteOne = originalDeleteOne;
  });

  it('returns HTTP 200 with the deleted card on success', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'public',
      access_code: null,
    });
    CreatorCard.deleteOne = async () => ({ acknowledged: true });

    // The real handler merges params and body into one payload (rc.params + rc.body).
    const rc = {
      params: { slug: 'ada-designs-things' },
      body: { creator_reference: CREATOR_REFERENCE },
    };
    const result = await deleteCreatorCardEndpoint.handler(rc, helpers);

    expect(result.status).to.equal(HTTPStatusCode.HTTP_200_OK);
    expect(result.message).to.equal(CreatorCardMessages.CREATOR_CARD_DELETED);
    expect(result.data.id).to.equal('card-1');
    expect(result.data.deleted).to.be.a('number');
  });

  it('throws NF01 (the framework maps this to HTTP 404) when the slug does not exist', async () => {
    CreatorCard.findOne = async () => null;

    const rc = { params: { slug: 'missing' }, body: { creator_reference: CREATOR_REFERENCE } };

    try {
      await deleteCreatorCardEndpoint.handler(rc, helpers);
      expect.fail('Expected the handler to throw');
    } catch (error) {
      expect(error.context && error.context.code).to.equal('NF01');
    }
  });
});
