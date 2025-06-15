
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Action } from '../../types/diagram';

interface ActionNodeProps {
  data: Action;
  selected: boolean;
}

export const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  return (
    <div className={`
      border-2 rounded-lg p-3 bg-yellow-50 min-w-[200px] min-h-[80px]
      ${selected ? 'border-yellow-600 shadow-lg' : 'border-yellow-300'}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-yellow-600 rounded-sm"></div>
        <span className="font-semibold text-yellow-800">Action</span>
      </div>
      <h5 className="text-sm font-medium text-gray-900 mb-1">{data.label}</h5>
      {data.performedBy.length > 0 && (
        <div className="text-xs text-gray-600">
          By: {data.performedBy.join(', ')}
        </div>
      )}
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
