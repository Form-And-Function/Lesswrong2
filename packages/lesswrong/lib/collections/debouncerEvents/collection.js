import schema from './schema.js';
import { createCollection, getDefaultResolvers } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionUtils';

export const DebouncerEvents = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  schema,
  resolvers: getDefaultResolvers('DebouncerEvents'),
});

addUniversalFields({collection: DebouncerEvents})

ensureIndex(DebouncerEvents, { dispatched:1, releaseTime:1 });
ensureIndex(DebouncerEvents, { dispatched:1, eventName:1, key:1});

export default DebouncerEvents;
