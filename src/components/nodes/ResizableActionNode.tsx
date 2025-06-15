
import React from 'react';
import { NodeResizer } from '@xyflow/react';
import { ActionNode } from './ActionNode';

export const ResizableActionNode = (props: any) => {
  const { selected } = props;
  // Only show resizer if the Action is selected
  return (
    <div className="relative w-full h-full">
      {selected && <NodeResizer minWidth={120} minHeight={60} />}
      <ActionNode {...props} />
    </div>
  );
};
