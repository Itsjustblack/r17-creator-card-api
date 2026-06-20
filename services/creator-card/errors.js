const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');

/**
 * @readonly
 * @enum
 * Codes are namespaced by category (SL = slug, AC = access, NF = not found) and numbered
 * in the order they were added, not by validation order - gaps (e.g. no AC02) are expected.
 */
const CREATOR_CARD_ERROR_CODE = {
  SLUG_TAKEN: 'SL02',
  ACCESS_CODE_REQUIRED_FOR_PRIVATE: 'AC01',
  ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC: 'AC05',
  NOT_FOUND: 'NF01',
  DRAFT_NOT_FOUND: 'NF02',
  ACCESS_CODE_REQUIRED: 'AC03',
  ACCESS_CODE_INVALID: 'AC04',
};

const CREATOR_CARD_ERRORS = {
  [CREATOR_CARD_ERROR_CODE.SLUG_TAKEN]: {
    errorCode: ERROR_CODE.VALIDATIONERR,
    message: CreatorCardMessages.SLUG_ALREADY_TAKEN,
  },
  [CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED_FOR_PRIVATE]: {
    errorCode: ERROR_CODE.VALIDATIONERR,
    message: CreatorCardMessages.ACCESS_CODE_REQUIRED_FOR_PRIVATE,
  },
  [CREATOR_CARD_ERROR_CODE.ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC]: {
    errorCode: ERROR_CODE.VALIDATIONERR,
    message: CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_FOR_PUBLIC,
  },
  [CREATOR_CARD_ERROR_CODE.NOT_FOUND]: {
    errorCode: ERROR_CODE.NOTFOUND,
    message: CreatorCardMessages.CREATOR_CARD_NOT_FOUND,
  },
  [CREATOR_CARD_ERROR_CODE.DRAFT_NOT_FOUND]: {
    errorCode: ERROR_CODE.NOTFOUND,
    message: CreatorCardMessages.DRAFT_NOT_FOUND,
  },
  [CREATOR_CARD_ERROR_CODE.ACCESS_CODE_REQUIRED]: {
    errorCode: ERROR_CODE.INVLDREQ,
    message: CreatorCardMessages.ACCESS_CODE_REQUIRED,
  },
  [CREATOR_CARD_ERROR_CODE.ACCESS_CODE_INVALID]: {
    errorCode: ERROR_CODE.INVLDREQ,
    message: CreatorCardMessages.ACCESS_CODE_INVALID,
  },
};

function throwCreatorCardError(code) {
  const { errorCode, message } = CREATOR_CARD_ERRORS[code];
  throwAppError(message, errorCode, { context: { code } });
}

module.exports = { CREATOR_CARD_ERROR_CODE, CREATOR_CARD_ERRORS, throwCreatorCardError };
