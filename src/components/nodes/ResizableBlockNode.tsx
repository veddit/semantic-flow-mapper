
import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { BlockNode } from './BlockNode';

export const ResizableBlockNode = (props: any) => {
  const { selected } = props;
  // Only show resizer if Block is selected
  return (
    <div className="relative w-full h-full">
      {selected && <NodeResizer minWidth={180} minHeight={80} />}
      <BlockNode {...props} />
    </div>
  );
};
