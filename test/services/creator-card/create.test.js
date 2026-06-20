const { expect } = require('chai');
const { ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');
const CreatorCard = require('@app/repository/creator-card');
const createCreatorCard = require('@app/services/creator-card/create');
const expectAppError = require('../../helpers/expect-app-error');

// Builds a minimal, fully valid create-card payload. Individual tests only override
// the field(s) they care about, so each test stays focused on one rule.
function buildPayload(overrides = {}) {
  return {
    title: 'Ada Designs Things',
    creator_reference: 'abcdefghij1234567890', // exactly 20 characters, per spec
    status: 'published',
    ...overrides,
  };
}

describe('services/creator-card/create', () => {
  let originalFindOne;
  let originalCreate;

  beforeEach(() => {
    // Stub the repository layer so this is a pure unit test - no real database involved.
    originalFindOne = CreatorCard.findOne;
    originalCreate = CreatorCard.create;
    CreatorCard.findOne = async () => null; // default: no slug collisions
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

  it('rejects a link url that does not start with http:// or https://', async () => {
    const payload = buildPayload({ links: [{ title: 'YouTube', url: 'ftp://example.com' }] });
    await expectAppError(() => createCreatorCard(payload), {
      errorCode: ERROR_CODE.VALIDATIONERR,
      message: CreatorCardMessages.INVALID_LINK_URL,
    });
  });

  it('rejects a service rate amount that is not a positive integer (e.g. has decimals)', async () => {
    const payload = buildPayload({
      service_rates: {
        currency: 'NGN',
        rates: [{ name: 'IG Story Post', amount: 100.5 }],
      },
    });
    await expectAppError(() => createCreatorCard(payload), {
      errorCode: ERROR_CODE.VALIDATIONERR,
      message: CreatorCardMessages.INVALID_RATE_AMOUNT,
    });
  });

  it('rejects an access_code containing non-alphanumeric characters', async () => {
    const payload = buildPayload({ access_type: 'private', access_code: 'A1-2C3' });
    await expectAppError(() => createCreatorCard(payload), {
      errorCode: ERROR_CODE.VALIDATIONERR,
      message: CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT,
    });
  });

  it('auto-generates a slug from the title when none is supplied', async () => {
    const card = await createCreatorCard(buildPayload());
    expect(card.slug).to.equal('ada-designs-things');
  });

  it('appends a random suffix to the auto-generated slug when it would be shorter than 5 characters', async () => {
    const card = await createCreatorCard(buildPayload({ title: 'ABC' })); // slugifies to "abc" (3 chars), still >= title's own 3-char minimum
    expect(card.slug).to.match(/^abc-[a-f0-9]{6}$/);
  });

  it('creates a card and serializes the response (id mapped from _id, access_code included)', async () => {
    const payload = buildPayload({ access_type: 'private', access_code: 'ab12cd' });
    const card = await createCreatorCard(payload);

    expect(card.id).to.equal('fake-id');
    expect(card).to.not.have.property('_id');
    expect(card.access_code).to.equal('ab12cd');
    expect(card.deleted).to.equal(null);
  });

  it('returns the full response shape for a default (public, no access_code) card, per spec', async () => {
    const card = await createCreatorCard(buildPayload());

    expect(card.id).to.equal('fake-id');
    expect(card).to.not.have.property('_id');
    expect(card.access_type).to.equal('public');
    expect(card.access_code).to.equal(null);
    expect(card.created).to.be.a('number');
    expect(card.updated).to.be.a('number');
    expect(card.deleted).to.equal(null);
  });
});
