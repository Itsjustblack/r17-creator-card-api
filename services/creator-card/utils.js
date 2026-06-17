const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');

const MIN_SLUG_LENGTH = 5;
const SLUG_INVALID_CHARS_REGEX = /[^a-z0-9-_]/g;
const URL_PROTOCOL_REGEX = /^https?:\/\//;
const ACCESS_CODE_FORMAT_REGEX = /^[a-zA-Z0-9]{6}$/;

function slugify(title) {
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(SLUG_INVALID_CHARS_REGEX, '');
}

async function isSlugTaken(slug) {
  const existingCard = await CreatorCard.findOne({ query: { slug } });
  return Boolean(existingCard);
}

async function generateUniqueSlug(title) {
  const baseSlug = slugify(title);

  if (baseSlug.length < MIN_SLUG_LENGTH || (await isSlugTaken(baseSlug))) {
    return `${baseSlug}-${randomBytes(6)}`;
  }

  return baseSlug;
}

function serializeCreatorCard(creatorCard) {
  const { _id, deleted, access_code: accessCode, ...rest } = creatorCard;

  return {
    id: _id,
    ...rest,
    access_code: accessCode || null,
    deleted: deleted || null,
  };
}

module.exports = {
  isSlugTaken,
  generateUniqueSlug,
  serializeCreatorCard,
  SLUG_INVALID_CHARS_REGEX,
  URL_PROTOCOL_REGEX,
  ACCESS_CODE_FORMAT_REGEX,
};
