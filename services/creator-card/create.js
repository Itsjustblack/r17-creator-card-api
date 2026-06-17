const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const {
  throwCreatorCardError,
  CREATOR_CARD_ERROR_CODE,
} = require('@app/services/creator-card/errors');
const { ACCESS_TYPE } = require('@app/services/creator-card/constants');
const { CreatorCardMessages } = require('@app/messages');
const {
  isSlugTaken,
  generateUniqueSlug,
  serializeCreatorCard,
  SLUG_INVALID_CHARS_REGEX,
  URL_PROTOCOL_REGEX,
  ACCESS_CODE_FORMAT_REGEX,
} = require('@app/services/creator-card/utils');

const spec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|lowercase|minLength:5|maxLength:50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedSpec = validator.parse(spec);

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);
  const accessType = data.access_type || ACCESS_TYPE.PUBLIC;

  if (data.slug && SLUG_INVALID_CHARS_REGEX.test(data.slug)) {
    throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
  }

  (data.links || []).forEach(({ url }) => {
    if (!URL_PROTOCOL_REGEX.test(url)) {
      throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
    }
  });

  if (data.access_code && !ACCESS_CODE_FORMAT_REGEX.test(data.access_code)) {
    throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
  }

  let { slug } = data;

  if (slug) {
    if (await isSlugTaken(slug)) {
      throwCreatorCardError(CREATOR_CARD_ERROR_CODE.SLUG_TAKEN);
    }
  } else {
    slug = await generateUniqueSlug(data.title);
  }

  if (accessType === ACCESS_TYPE.PRIVATE && !data.access_code) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED_FOR_PRIVATE);
  }

  if (accessType !== ACCESS_TYPE.PRIVATE && data.access_code) {
    throwCreatorCardError(CREATOR_CARD_ERROR_CODE.ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC);
  }

  const creatorCard = await CreatorCard.create({
    ...data,
    slug,
    access_type: accessType,
  });

  const response = serializeCreatorCard(creatorCard);

  return response;
}

module.exports = createCreatorCard;
