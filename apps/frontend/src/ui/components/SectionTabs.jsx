import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SubTabsList({ tabs, ariaLabel }) {
  return (
    <TabsList className="tabs-list sub-tabs-list" aria-label={ariaLabel}>
      {tabs.map(({ label, value }) => (
        <TabsTrigger value={value} key={value}>
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
