const { expect } = require('chai');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const deleteCreatorCard = require('@app/services/creator-card/delete');
const getCreatorCardBySlug = require('@app/services/creator-card/get-by-slug');
const { CREATOR_CARD_ERROR_CODE } = require('@app/services/creator-card/errors');
const expectAppError = require('../../helpers/expect-app-error');

const CREATOR_REFERENCE = 'abcdefghij1234567890'; // exactly 20 characters, per spec

describe('services/creator-card/delete', () => {
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

  it('throws NF01 when no card with that slug exists', async () => {
    CreatorCard.findOne = async () => null;

    await expectAppError(
      () => deleteCreatorCard({ slug: 'missing', creator_reference: CREATOR_REFERENCE }),
      {
        code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
        message: CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
      }
    );
  });

  it('deletes the card and returns it serialized, with a deleted timestamp set', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'public',
      access_code: null,
    });
    CreatorCard.deleteOne = async () => ({ acknowledged: true, modifiedCount: 1 });

    const before = Date.now();
    const card = await deleteCreatorCard({
      slug: 'ada-designs-things',
      creator_reference: CREATOR_REFERENCE,
    });

    expect(card.id).to.equal('card-1');
    expect(card.deleted).to.be.a('number');
    expect(card.deleted).to.be.at.least(before);
  });

  it('makes the card unretrievable via get-by-slug after deletion (soft-delete behavior)', async () => {
    CreatorCard.findOne = async () => ({
      _id: 'card-1',
      slug: 'ada-designs-things',
      status: 'published',
      access_type: 'public',
      access_code: null,
    });
    // Simulate the real soft-delete effect: once deleteOne runs, the repository should no
    // longer return this card for subsequent finds.
    CreatorCard.deleteOne = async () => {
      CreatorCard.findOne = async () => null;
      return { acknowledged: true };
    };

    await deleteCreatorCard({ slug: 'ada-designs-things', creator_reference: CREATOR_REFERENCE });

    await expectAppError(() => getCreatorCardBySlug({ slug: 'ada-designs-things' }), {
      code: CREATOR_CARD_ERROR_CODE.NOT_FOUND,
    });
  });
});
