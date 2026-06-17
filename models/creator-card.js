const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * @typedef {Object} ModelSchema
 * @property {String} _id
 * @property {String} title
 * @property {String} description
 * @property {String} slug
 * @property {String} creator_reference
 * @property {Array<{title: String, url: String}>} links
 * @property {Object} service_rates
 * @property {String} status
 * @property {String} access_type
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number} deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String },
  links: {
    type: [
      {
        _id: false,
        title: { type: SchemaTypes.String },
        url: { type: SchemaTypes.String },
      },
    ],
    default: [],
  },
  service_rates: {
    type: {
      currency: { type: SchemaTypes.String },
      rates: {
        type: [
          {
            _id: false,
            name: { type: SchemaTypes.String },
            description: { type: SchemaTypes.String },
            amount: { type: SchemaTypes.Number },
          },
        ],
        default: [],
      },
    },
  },
  status: { type: SchemaTypes.String },
  access_type: { type: SchemaTypes.String, default: 'public' },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {ModelSchema} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
