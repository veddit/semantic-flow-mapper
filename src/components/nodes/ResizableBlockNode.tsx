
import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { BlockNode } from './BlockNode';

export const ResizableBlockNode = (props: any) => (
  <div className="relative w-full h-full">
    <NodeResizer minWidth={180} minHeight={80} />
    {/* Only BlockNode, avoid extra containers */}
    <BlockNode {...props} />
  </div>
);
