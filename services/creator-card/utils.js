const { randomBytes } = require('@app-core/randomness');
const CreatorCard = require('@app/repository/creator-card');

const MIN_SLUG_LENGTH = 5;
// No "g" flag: this is reused across requests via .test(), and a global regex's
// lastIndex would carry over between calls, causing intermittent false negatives.
const SLUG_INVALID_CHARS_REGEX = /[^a-z0-9-_]/;
const URL_PROTOCOL_REGEX = /^https?:\/\//;
const ACCESS_CODE_FORMAT_REGEX = /^[a-zA-Z0-9]+$/;

function slugify(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

async function isSlugTaken(slug) {
  const existingCard = await CreatorCard.findOne({ query: { slug } });
  return Boolean(existingCard);
}

async function generateUniqueSlug(title) {
  const baseSlug = slugify(title);

  // Too-short slugs get a random suffix too, not just collisions - a bare 3-4 char
  // slug is more likely to collide with someone else's auto-generated slug later.
  if (baseSlug.length < MIN_SLUG_LENGTH || (await isSlugTaken(baseSlug))) {
    return `${baseSlug}-${randomBytes(6)}`;
  }

  return baseSlug;
}

function serializeCreatorCard(creatorCard, { includeAccessCode = true } = {}) {
  const { _id, deleted, access_code: accessCode, __v, ...rest } = creatorCard;

  const serialized = {
    id: _id,
    ...rest,
    deleted: deleted || null,
  };

  if (includeAccessCode) {
    serialized.access_code = accessCode || null;
  }

  return serialized;
}

module.exports = {
  isSlugTaken,
  generateUniqueSlug,
  serializeCreatorCard,
  SLUG_INVALID_CHARS_REGEX,
  URL_PROTOCOL_REGEX,
  ACCESS_CODE_FORMAT_REGEX,
};
