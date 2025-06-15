
import React from 'react';
import { BlockNode } from './BlockNode';
import { NodeResizer } from '@xyflow/react';

export const ResizableBlockNode = (props: any) => (
  <div>
    <NodeResizer minWidth={180} minHeight={80} />
    <BlockNode {...props} />
  </div>
);
