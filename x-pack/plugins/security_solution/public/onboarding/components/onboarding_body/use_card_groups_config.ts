/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useObservable } from 'react-use';
import { useMemo } from 'react';
import { hasCapabilities } from '../../../common/lib/capabilities';
import { useKibana } from '../../../common/lib/kibana/kibana_react';
import { cardGroupsConfig } from './card_groups_config';

/**
 * Hook that filters the card groups config based on the user's capabilities and license
 */
export const useCardGroupsConfig = () => {
  const { application, licensing } = useKibana().services;
  const license = useObservable(licensing.license$);

  const filteredCardGroupsConfig = useMemo(() => {
    // Return empty array when the license is not defined. It should always become defined at some point.
    // This exit case prevents code dependant on the cards config from running multiple times.
    if (!license) {
      return [];
    }
    return cardGroupsConfig.filter((group) => {
      const filteredCards = group.cards.filter((card) => {
        if (card.capabilities) {
          const cardHasCapabilities = hasCapabilities(application.capabilities, card.capabilities);
          if (!cardHasCapabilities) {
            return false;
          }
        }

        if (card.licenseType) {
          const cardHasLicense = license.hasAtLeast(card.licenseType);
          if (!cardHasLicense) {
            return false;
          }
        }

        return true;
      });

      if (filteredCards.length === 0) {
        return false;
      }
      return true;
    });
  }, [license, application.capabilities]);

  return filteredCardGroupsConfig;
};
