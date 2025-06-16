
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
  const { model, startConnection } = useDiagramStore();
  
  // Get child actions that belong to this block
  const childActions = model.nodes.filter(
    n =>
      n.type === 'action' &&
      'parentBlock' in n &&
      n.parentBlock === data.id &&
      data.childActions.includes(n.id)
  );

  const minWidth = 350;
  const minHeight = data.expanded && childActions.length > 0 ? 200 : 100;
  
  // Calculate dynamic width based on content
  const contentWidth = data.expanded && childActions.length > 0 
    ? Math.max(minWidth, childActions.length * 200 + 40) 
    : minWidth;

  const handleActionClick = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    startConnection(actionId);
  };

  return (
    <div
      className={`
        border-2 rounded-lg bg-white overflow-hidden relative
        ${selected ? 'border-green-600 shadow-lg' : 'border-green-300'}
        ${data.isValidTarget ? 'border-green-500 shadow-green-200 shadow-lg' : ''}
      `}
      style={{
        width: contentWidth,
        minHeight: minHeight,
      }}
    >
      {/* Title Band */}
      <div className="bg-green-100 border-b border-green-200 px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-600 rounded"></div>
        <span className="font-semibold text-green-800 text-sm">Block</span>
        {childActions.length > 0 && (
          <span className="text-xs text-green-600 ml-auto">
            {childActions.length} action{childActions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 bg-green-50 min-h-[60px]">
        <h4 className="text-md font-medium text-gray-900 mb-3">{data.label}</h4>

        {/* Child Actions - Only show when expanded */}
        {data.expanded && childActions.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 font-medium mb-2">Actions:</div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {childActions.map((action) => (
                <div
                  key={action.id}
                  className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 cursor-pointer hover:border-yellow-400 transition-colors"
                  onClick={(e) => handleActionClick(action.id, e)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-sm"></div>
                    <span className="font-medium text-yellow-800 text-xs">Action</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{action.label}</div>
                  {'performedBy' in action && action.performedBy.length > 0 && (
                    <div className="text-xs text-gray-600">
                      By: {action.performedBy.join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-blue-600 mt-1 opacity-70">
                    Click to connect
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.expanded && childActions.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No actions assigned to this block
          </div>
        )}

        {/* Collapsed state */}
        {!data.expanded && childActions.length > 0 && (
          <div className="text-sm text-gray-600">
            {childActions.length} action{childActions.length !== 1 ? 's' : ''} (click to expand)
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
