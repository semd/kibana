/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';

import { EuiSideNav } from '@elastic/eui';

export const SecuritySolutionSideNav = () => {
  const [isSideNavOpenOnMobile, setisSideNavOpenOnMobile] = useState(false);

  const toggleOpenOnMobile = () => {
    setisSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  const sideNav = [
    {
      name: 'Security',
      id: 0,
      items: [
        {
          name: 'Overview Page Here',
          id: 1,
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <EuiSideNav
      aria-label="Some example here"
      mobileTitle="Navigate within security"
      toggleOpenOnMobile={() => toggleOpenOnMobile()}
      isOpenOnMobile={isSideNavOpenOnMobile}
      style={{ width: 192 }}
      items={sideNav}
    />
  );
};
