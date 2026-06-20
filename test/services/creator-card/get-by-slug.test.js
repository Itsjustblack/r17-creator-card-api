const { expect } = require('chai');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const getCreatorCardBySlug = require('@app/services/creator-card/get-by-slug');
const { CREATOR_CARD_ERROR_CODE } = require('@app/services/creator-card/errors');
const expectAppError = require('../../helpers/expect-app-error');

describe('services/creator-card/get-by-slug', () => {
  let originalFindOne;

  beforeEach(() => {
    originalFindOne = CreatorCard.findOne; // stubbed per test, no real database needed
  });

  afterEach(() => {
    CreatorCard.findOne = originalFindOne;
  });

  it('throws NF01 when no card with that slug exists', async () => {
    CreatorCard.findOne = async () => null;

    await expectAppError(() => getCreatorCardBySlug({ slug: 'missing' }), {
      code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
      message: CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
    });
  });

  it('throws NF02 when the card is a draft (drafts are never publicly retrievable)', async () => {
    CreatorCard.findOne = async () => ({
      slug: 'draft-card',
      status: 'draft',
      access_type: 'public',
    });

    await expectAppError(() => getCreatorCardBySlug({ slug: 'draft-card' }), {
      code: CREATOR_CARD_ERROR_CODE.DRAFT_NOT_FOUND,
      message: CreatorCardMessages.DRAFT_NOT_FOUND,
    });
  });

  it('throws AC03 when the card is private and no access_code is supplied', async () => {
    CreatorCard.findOne = async () => ({
      slug: 'private-card',
      status: 'published',
      access_type: 'private',
      access_code: 'ab12cd',
    });

    await expectAppError(() => getCreatorCardBySlug({ slug: 'private-card' }), {
      code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED,
      message: CreatorCardMessages.ACCESS_CODE_REQUIRED,
    });
  });

  it('throws AC04 when the card is private and the supplied access_code does not match', async () => {
    CreatorCard.findOne = async () => ({
      slug: 'private-card',
      status: 'published',
      access_type: 'private',
      access_code: 'ab12cd',
    });

    await expectAppError(
      () => getCreatorCardBySlug({ slug: 'private-card', access_code: 'wrong1' }),
      {
        code: CREATOR_CARD_ERROR_CODE.ACCESS_CODE_INVALID,
        message: CreatorCardMessages.ACCESS_CODE_INVALID,
      }
    );
  });

  it('returns a private card when the correct access_code is supplied, without leaking it', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'private-card',
      status: 'published',
      access_type: 'private',
      access_code: 'ab12cd',
    });

    const card = await getCreatorCardBySlug({ slug: 'private-card', access_code: 'ab12cd' });

    expect(card.id).to.equal('card-1');
    expect(card).to.not.have.property('access_code');
  });

  it('returns a public card with no access_code required, without leaking it', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-2',
      slug: 'public-card',
      status: 'published',
      access_type: 'public',
      access_code: null,
    });

    const card = await getCreatorCardBySlug({ slug: 'public-card' });

    expect(card.id).to.equal('card-2');
    expect(card).to.not.have.property('access_code');
  });
});
