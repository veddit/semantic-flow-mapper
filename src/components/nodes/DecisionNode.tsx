
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Decision } from '../../types/diagram';

interface DecisionNodeProps {
  data: Decision;
  selected: boolean;
}

export const DecisionNode: React.FC<DecisionNodeProps> = ({ data, selected }) => {
  return (
    <div className={`
      border-2 rounded-lg p-3 bg-purple-50 min-w-[200px] min-h-[80px]
      ${selected ? 'border-purple-600 shadow-lg' : 'border-purple-300'}
      transform rotate-45
    `}>
      <div className="transform -rotate-45">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-purple-600" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          <span className="font-semibold text-purple-800">Decision</span>
        </div>
        <h5 className="text-sm font-medium text-gray-900">{data.label}</h5>
      </div>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};
