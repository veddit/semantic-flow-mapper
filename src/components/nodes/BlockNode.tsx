
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block } from '../../types/diagram';

interface BlockNodeProps {
  data: Block;
  selected: boolean;
}

export const BlockNode: React.FC<BlockNodeProps> = ({ data, selected }) => {
  return (
    <div className={`
      border-2 rounded-lg p-3 bg-green-50 min-w-[250px] min-h-[100px]
      ${selected ? 'border-green-600 shadow-lg' : 'border-green-300'}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-green-600 rounded"></div>
        <span className="font-semibold text-green-800">Block</span>
      </div>
      <h4 className="text-md font-medium text-gray-900">{data.label}</h4>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
