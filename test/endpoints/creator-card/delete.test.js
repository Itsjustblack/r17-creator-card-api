const { expect } = require('chai');
const { HTTPStatusCode } = require('@app-core/server/enums');
const CreatorCardMessages = require('@app/messages/creator-card');
const CreatorCard = require('@app/repository/creator-card');
const { CREATOR_CARD_ERROR_CODE } = require('@app/services/creator-card/errors');
const deleteCreatorCardEndpoint = require('../../../endpoints/creator-card/delete');
const getCreatorCardBySlugEndpoint = require('../../../endpoints/creator-card/get-by-slug');
const expectAppError = require('../../helpers/expect-app-error');

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

  it('returns HTTP 200 with the deleted card, in the same response format as the creation endpoint', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
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
    expect(result.data).to.not.have.property('_id');
    expect(result.data.access_code).to.equal('A1B2C3'); // create's response format includes it
    expect(result.data.deleted).to.be.a('number');
  });

  it('returns NF01 (HTTP 404) when the slug does not exist', async () => {
    CreatorCard.findOne = async () => null;
    const rc = { params: { slug: 'missing' }, body: { creator_reference: CREATOR_REFERENCE } };

    await expectAppError(() => deleteCreatorCardEndpoint.handler(rc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
      message: CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
      httpStatus: 404,
    });
  });

  it('makes the card unretrievable via get-by-slug after deletion', async () => {
    let deleted = false;
    CreatorCard.findOne = async () => (deleted ? null : { _id: 'card-1', status: 'published' });
    CreatorCard.deleteOne = async () => {
      deleted = true;
      return { acknowledged: true };
    };

    const deleteRc = {
      params: { slug: 'ada-designs-things' },
      body: { creator_reference: CREATOR_REFERENCE },
    };
    await deleteCreatorCardEndpoint.handler(deleteRc, helpers);

    const getRc = { params: { slug: 'ada-designs-things' }, query: {} };

    await expectAppError(() => getCreatorCardBySlugEndpoint.handler(getRc, helpers), {
      code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
      httpStatus: 404,
    });
  });
});
