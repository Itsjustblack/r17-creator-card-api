const validator = require('@app-core/validator');
const CreatorCard = require('@app/repository/creator-card');
const {
  throwCreatorCardError,
  CREATOR_CARD_ERROR_CODE,
} = require('@app/services/creator-card/errors');
const { serializeCreatorCard } = require('./utils');
const { STATUS_TYPE, ACCESS_TYPE } = require('./constants');

const spec = `root {
  slug string<trim|lowercase|minLength:1>
  access_code? string<trim>
}`;

const parsedSpec = validator.parse(spec);

async function getCreatorCardBySlug(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  const creatorCard = await CreatorCard.findOne({ query: { slug: data.slug } });

  if (!creatorCard) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.NOT_FOUND);
  }

  if (creatorCard.status === STATUS_TYPE.DRAFT) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.DRAFT_NOT_FOUND);
  }

  const isPrivate = creatorCard.access_type === ACCESS_TYPE.PRIVATE;

  if (isPrivate && !data.access_code) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED);
  }

  if (isPrivate && data.access_code !== creatorCard.access_code) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.ACCESS_CODE_INVALID);
  }

  return serializeCreatorCard(creatorCard, { includeAccessCode: false });
}

module.exports = getCreatorCardBySlug;
