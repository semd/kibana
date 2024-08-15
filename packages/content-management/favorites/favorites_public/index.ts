/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export { type FavoritesClientPublic, FavoritesClient } from './src/favorites_client';
export { FavoritesContextProvider } from './src/favorites_context';
export { useFavorites } from './src/favorites_query';

export {
  FavoriteButton,
  type FavoriteButtonProps,
  cssFavoriteHoverWithinEuiTableRow,
} from './src/components/favorite_button';

export { FavoritesEmptyState } from './src/components/favorites_empty_state';
