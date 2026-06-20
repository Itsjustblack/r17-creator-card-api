const { expect } = require('chai');
const CreatorCard = require('@app/repository/creator-card');
const {
  isSlugTaken,
  generateUniqueSlug,
  serializeCreatorCard,
  SLUG_INVALID_CHARS_REGEX,
  URL_PROTOCOL_REGEX,
  ACCESS_CODE_FORMAT_REGEX,
} = require('@app/services/creator-card/utils');

describe('services/creator-card/utils', () => {
  // isSlugTaken/generateUniqueSlug hit the repository, so we stub CreatorCard.findOne
  // per test and restore it afterwards to avoid leaking stubs into other test files.
  let originalFindOne;

  beforeEach(() => {
    originalFindOne = CreatorCard.findOne;
  });

  afterEach(() => {
    CreatorCard.findOne = originalFindOne;
  });

  describe('SLUG_INVALID_CHARS_REGEX', () => {
    it('accepts slugs containing only letters, numbers, hyphens and underscores', () => {
      // This regex has the "g" flag (it's also used with .replace in slugify), so calling
      // .test() repeatedly carries state via lastIndex - reset it before each check.
      SLUG_INVALID_CHARS_REGEX.lastIndex = 0;
      expect(SLUG_INVALID_CHARS_REGEX.test('valid-slug_123')).to.equal(false);
    });

    it('rejects slugs containing any other character', () => {
      SLUG_INVALID_CHARS_REGEX.lastIndex = 0;
      expect(SLUG_INVALID_CHARS_REGEX.test('invalid slug!')).to.equal(true);
    });
  });

  describe('URL_PROTOCOL_REGEX', () => {
    it('accepts URLs starting with http:// or https://', () => {
      expect(URL_PROTOCOL_REGEX.test('https://example.com')).to.equal(true);
      expect(URL_PROTOCOL_REGEX.test('http://example.com')).to.equal(true);
    });

    it('rejects URLs using any other protocol', () => {
      expect(URL_PROTOCOL_REGEX.test('ftp://example.com')).to.equal(false);
    });
  });

  describe('ACCESS_CODE_FORMAT_REGEX', () => {
    it('accepts alphanumeric-only access codes', () => {
      expect(ACCESS_CODE_FORMAT_REGEX.test('ab12cd')).to.equal(true);
    });

    it('rejects access codes containing non-alphanumeric characters', () => {
      expect(ACCESS_CODE_FORMAT_REGEX.test('A1-2C3')).to.equal(false);
    });
  });

  describe('isSlugTaken', () => {
    it('returns true when a card with that slug exists', async () => {
      CreatorCard.findOne = async () => ({ slug: 'ada-designs-things' });
      expect(await isSlugTaken('ada-designs-things')).to.equal(true);
    });

    it('returns false when no card with that slug exists', async () => {
      CreatorCard.findOne = async () => null;
      expect(await isSlugTaken('unused-slug')).to.equal(false);
    });
  });

  describe('generateUniqueSlug', () => {
    it('slugifies the title (lowercase, spaces to hyphens) when it is long enough and unused', async () => {
      CreatorCard.findOne = async () => null;
      const slug = await generateUniqueSlug('Ada Designs Things');
      expect(slug).to.equal('ada-designs-things');
    });

    it('appends a random 6-character suffix when the slugified title is shorter than 5 characters', async () => {
      CreatorCard.findOne = async () => null;
      const slug = await generateUniqueSlug('AI'); // slugifies down to "ai" (2 chars)
      expect(slug).to.match(/^ai-[a-f0-9]{6}$/);
    });

    it('appends a random suffix when the slugified title is already taken by another card', async () => {
      CreatorCard.findOne = async () => ({ slug: 'ada-designs-things' }); // simulate a collision
      const slug = await generateUniqueSlug('Ada Designs Things');
      expect(slug).to.match(/^ada-designs-things-[a-f0-9]{6}$/);
    });
  });

  describe('serializeCreatorCard', () => {
    const rawCard = {
      _id: '01JG8XYZA2B3C4D5E6F7G8H9J0',
      __v: 0,
      title: 'Ada Designs Things',
      access_code: 'ab12cd',
      deleted: null,
    };

    it('maps _id to id and drops Mongo-internal fields', () => {
      const serialized = serializeCreatorCard(rawCard);
      expect(serialized).to.not.have.property('_id');
      expect(serialized).to.not.have.property('__v');
      expect(serialized.id).to.equal(rawCard._id);
    });

    it('includes access_code by default (the create endpoint needs to return it)', () => {
      const serialized = serializeCreatorCard(rawCard);
      expect(serialized.access_code).to.equal('ab12cd');
    });

    it('omits access_code entirely when includeAccessCode is false (used by public retrieval)', () => {
      const serialized = serializeCreatorCard(rawCard, { includeAccessCode: false });
      expect(serialized).to.not.have.property('access_code');
    });

    it('normalizes a falsy deleted value to null', () => {
      const serialized = serializeCreatorCard({ ...rawCard, deleted: undefined });
      expect(serialized.deleted).to.equal(null);
    });
  });
});
