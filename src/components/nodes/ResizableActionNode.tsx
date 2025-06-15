
import React from 'react';
import { ActionNode } from './ActionNode';
import { NodeResizer } from '@xyflow/react';

export const ResizableActionNode = (props: any) => (
  <div>
    <NodeResizer minWidth={120} minHeight={60} />
    <ActionNode {...props} />
  </div>
);
