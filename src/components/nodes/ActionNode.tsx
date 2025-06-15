
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Action } from '../../types/diagram';

interface ActionNodeProps {
  data: Action & {
    isConnecting?: boolean;
    isSource?: boolean;
    isHovered?: boolean;
    isValidTarget?: boolean;
  };
  selected: boolean;
}

export const ActionNode: React.FC<ActionNodeProps> = ({ data, selected }) => {
  const isOrphaned = !data.parentBlock;
  
  return (
    <div className={`
      border-2 rounded-lg p-3 min-w-[180px] min-h-[70px]
      ${isOrphaned 
        ? 'bg-red-50 border-red-300' 
        : 'bg-yellow-50 border-yellow-300'
      }
      ${selected ? (isOrphaned ? 'border-red-600 shadow-lg' : 'border-yellow-600 shadow-lg') : ''}
      ${data.isValidTarget ? 'border-blue-500 shadow-blue-200 shadow-lg' : ''}
    `}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-sm ${isOrphaned ? 'bg-red-600' : 'bg-yellow-600'}`}></div>
        <span className={`font-semibold ${isOrphaned ? 'text-red-800' : 'text-yellow-800'}`}>
          Action {isOrphaned && '(Orphaned)'}
        </span>
      </div>
      <h5 className="text-sm font-medium text-gray-900 mb-1">{data.label}</h5>
      {data.performedBy.length > 0 && (
        <div className="text-xs text-gray-600">
          By: {data.performedBy.join(', ')}
        </div>
      )}
      
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
