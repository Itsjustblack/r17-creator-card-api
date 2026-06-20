const validator = require('@app-core/validator');
const CreatorCard = require('@app/repository/creator-card');
const {
  throwCreatorCardError,
  CREATOR_CARD_ERROR_CODE,
} = require('@app/services/creator-card/errors');
const { serializeCreatorCard } = require('./utils');

const spec = `root {
  slug string<trim|lowercase|minLength:1>
  creator_reference string<trim|length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);

  const creatorCard = await CreatorCard.findOne({ query: { slug: data.slug } });

  if (!creatorCard) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.NOT_FOUND);
  }

  await CreatorCard.deleteOne({ query: { slug: data.slug } });

  return serializeCreatorCard({ ...creatorCard, deleted: Date.now() });
}

module.exports = deleteCreatorCard;
