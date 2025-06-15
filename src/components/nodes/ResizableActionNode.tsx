
import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { ActionNode } from './ActionNode';

export const ResizableActionNode = (props: any) => (
  <div className="relative w-full h-full">
    <NodeResizer minWidth={120} minHeight={60} />
    <ActionNode {...props} />
  </div>
);
