export function remove(collection, selector) {
  if (Meteor.isFibersDisabled) {
    return collection.removeAsync(selector);
  }

  return collection.remove(selector);
}

export function insert(collection, doc) {
  if (Meteor.isFibersDisabled) {
    return collection.insertAsync(doc);
  }

  return collection.insert(doc);
}

export function update(collection, selector, updates) {
  if (Meteor.isFibersDisabled) {
    return collection.updateAsync(selector, updates);
  }

  return collection.update(selector, updates);
}
