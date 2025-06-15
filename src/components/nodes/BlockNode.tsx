import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

interface BlockNodeProps {
  data: Block & {
    isConnecting?: boolean;
    isSource?: boolean;
    isHovered?: boolean;
    isValidTarget?: boolean;
  };
  selected: boolean;
}

export const BlockNode: React.FC<BlockNodeProps> = ({ data, selected }) => {
  const { model } = useDiagramStore();
  // Only show childActions whose parentBlock matches this block (this prevents stale/ghost children)
  const childActions = model.nodes.filter(
    n =>
      n.type === 'action' &&
      'parentBlock' in n &&
      n.parentBlock === data.id &&
      data.childActions.includes(n.id)
  );

  const minWidth = 300;
  const actionWidth = 150;
  const expandedWidth = Math.max(
    minWidth,
    childActions.length * (actionWidth + 20) + 40
  );

  return (
    <div
      className={`
        border-2 rounded-lg p-4 bg-green-50 relative
        ${selected ? 'border-green-600 shadow-lg' : 'border-green-300'}
        ${data.isValidTarget ? 'border-green-500 shadow-green-200 shadow-lg' : ''}
      `}
      style={{
        width: expandedWidth,
        minHeight: data.expanded ? 120 : 80,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 bg-green-600 rounded"></div>
        <span className="font-semibold text-green-800">Block</span>
      </div>
      <h4 className="text-md font-medium text-gray-900 mb-2">{data.label}</h4>

      {data.expanded && childActions.length > 0 && (
        <div className="flex gap-3 mt-3 min-h-[60px] items-center">
          {childActions.map((action, index) => (
            <div
              key={action.id}
              className="bg-yellow-100 border border-yellow-300 rounded p-2 text-xs flex-shrink-0"
              style={{ width: actionWidth }}
            >
              <div className="font-medium text-yellow-800">{action.label}</div>
              {'performedBy' in action && action.performedBy.length > 0 && (
                <div className="text-yellow-600 mt-1">
                  By: {action.performedBy.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Allow connections: left is target, right is source */}
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
