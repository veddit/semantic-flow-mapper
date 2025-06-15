
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Phase } from '../../types/diagram';

interface PhaseNodeProps {
  data: Phase;
  selected: boolean;
}

export const PhaseNode: React.FC<PhaseNodeProps> = ({ data, selected }) => {
  return (
    <div className={`
      border-2 rounded-lg p-4 bg-blue-50 min-w-[300px] min-h-[150px]
      ${selected ? 'border-blue-600 shadow-lg' : 'border-blue-300'}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
        <span className="font-semibold text-blue-800">Phase</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900">{data.label}</h3>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
