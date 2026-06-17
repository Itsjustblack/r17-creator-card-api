const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { serializeCreatorCard } = require('./utils');

const spec = `root {
  slug string<trim|lowercase|minLength:1>
}`;

const parsedSpec = validator.parse(spec);

async function getCreatorCardBySlug(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  const creatorCard = await CreatorCard.findOne({ query: { slug: data.slug } });

  if (!creatorCard) {
    throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.NOTFOUND);
  }

  return serializeCreatorCard(creatorCard);
}

module.exports = getCreatorCardBySlug;
