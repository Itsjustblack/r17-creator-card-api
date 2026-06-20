const SUCCESS_MESSAGES = {
  CREATOR_CARD_CREATED: 'Creator Card Created Successfully.',
  CREATOR_CARD_RETRIEVED: 'Creator Card Retrieved Successfully.',
  CREATOR_CARD_DELETED: 'Creator Card Deleted Successfully.',
};

const ERROR_MESSAGES = {
  CREATOR_CARD_NOT_FOUND: 'Creator card not found',
  DRAFT_NOT_FOUND: 'Drafts are not publicly retrievable',
  SLUG_ALREADY_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED_FOR_PRIVATE: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC: 'access_code can only be set on private cards',
  ACCESS_CODE_REQUIRED: 'Access code required',
  ACCESS_CODE_INVALID: 'Invalid access code',
  INVALID_SLUG_FORMAT: 'slug may only contain letters, numbers, hyphens and underscores',
  INVALID_LINK_URL: 'links must start with http:// or https://',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters',
};

module.exports = {
  ...SUCCESS_MESSAGES,
  ...ERROR_MESSAGES,
};
