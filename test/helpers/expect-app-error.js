const { expect } = require('chai');

// Runs an async function that is expected to throw an app error (thrown via `throwAppError`),
// then asserts on its shape. This centralizes the "call it, catch it, assert on it" pattern
// used repeatedly across the creator-card service/endpoint tests.
//
// expected.errorCode - the @app-core/errors ERROR_CODE (e.g. ERROR_CODE.VALIDATIONERR)
// expected.code       - the custom business-rule code (e.g. 'NF01'), stored in error.context.code
// expected.message    - the exact error message that should have been thrown
async function expectAppError(asyncFn, expected = {}) {
  try {
    await asyncFn();
    throw new Error('Expected the function to throw an application error, but it did not.');
  } catch (error) {
    expect(error.isApplicationError).to.equal(true);

    if (expected.errorCode) expect(error.errorCode).to.equal(expected.errorCode);
    if (expected.code) expect(error.context && error.context.code).to.equal(expected.code);
    if (expected.message) expect(error.message).to.equal(expected.message);
  }
}

module.exports = expectAppError;
