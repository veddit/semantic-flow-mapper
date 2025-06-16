
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
  const { model, connectionState, startConnection, completeConnection, cancelConnection } = useDiagramStore();
  
  // Get child actions that belong to this block
  const childActions = model.nodes.filter(
    n =>
      n.type === 'action' &&
      'parentBlock' in n &&
      n.parentBlock === data.id &&
      data.childActions.includes(n.id)
  );

  // Calculate action layout - arrange in tree structure
  const getActionLayout = () => {
    if (childActions.length === 0) return [];
    
    // Find root actions (no incoming edges from other actions in same block)
    const rootActions = childActions.filter(action => {
      const hasIncomingFromSameBlock = model.edges.some(edge => 
        edge.to === action.id && 
        childActions.some(childAction => childAction.id === edge.from)
      );
      return !hasIncomingFromSameBlock;
    });

    // Group actions by their level in the tree
    const levels: string[][] = [];
    const processed = new Set<string>();
    
    // Start with root actions
    if (rootActions.length > 0) {
      levels.push(rootActions.map(a => a.id));
      rootActions.forEach(a => processed.add(a.id));
    }

    // Build subsequent levels
    let currentLevel = 0;
    while (processed.size < childActions.length && currentLevel < levels.length) {
      const nextLevel: string[] = [];
      
      levels[currentLevel].forEach(actionId => {
        const outgoingEdges = model.edges.filter(edge => 
          edge.from === actionId && 
          childActions.some(child => child.id === edge.to) &&
          !processed.has(edge.to)
        );
        
        outgoingEdges.forEach(edge => {
          if (!processed.has(edge.to)) {
            nextLevel.push(edge.to);
            processed.add(edge.to);
          }
        });
      });
      
      if (nextLevel.length > 0) {
        levels.push(nextLevel);
      }
      currentLevel++;
    }

    // Add any remaining unprocessed actions
    const remaining = childActions.filter(a => !processed.has(a.id));
    if (remaining.length > 0) {
      levels.push(remaining.map(a => a.id));
    }

    return levels;
  };

  const actionLevels = getActionLayout();
  const minWidth = 350;
  const minHeight = data.expanded && childActions.length > 0 ? Math.max(200, actionLevels.length * 80 + 100) : 100;
  const contentWidth = data.expanded && childActions.length > 0 
    ? Math.max(minWidth, Math.max(...actionLevels.map(level => level.length)) * 200 + 40) 
    : minWidth;

  const handleActionHeaderClick = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (connectionState.isConnecting) {
      if (connectionState.sourceNodeId === actionId) {
        cancelConnection();
        return;
      }
      
      // Complete connection
      completeConnection(actionId);
    } else {
      // Start connection
      startConnection(actionId);
    }
  };

  const handleActionContentClick = (actionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Open edit modal for action content
    console.log('Edit action:', actionId);
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

        {/* Child Actions - Tree Layout */}
        {data.expanded && actionLevels.length > 0 && (
          <div className="space-y-4">
            <div className="text-xs text-gray-600 font-medium mb-2">Actions:</div>
            {actionLevels.map((level, levelIndex) => (
              <div 
                key={levelIndex}
                className="flex justify-center gap-4"
                style={{ marginTop: levelIndex > 0 ? '20px' : '0' }}
              >
                {level.map((actionId) => {
                  const action = childActions.find(a => a.id === actionId);
                  if (!action) return null;
                  
                  const isConnecting = connectionState.isConnecting;
                  const isSource = connectionState.sourceNodeId === actionId;
                  const canBeTarget = isConnecting && connectionState.sourceNodeId !== actionId;

                  return (
                    <div
                      key={actionId}
                      className={`
                        bg-yellow-50 border-2 rounded-lg overflow-hidden min-w-[160px] max-w-[180px]
                        ${isSource ? 'border-blue-500 shadow-blue-200 shadow-lg' : 'border-yellow-300'}
                        ${canBeTarget ? 'border-green-500 shadow-green-200 shadow-lg' : ''}
                        transition-colors
                      `}
                    >
                      {/* Action Header - Click to connect */}
                      <div 
                        className={`
                          bg-yellow-100 border-b border-yellow-200 px-3 py-2 cursor-pointer
                          hover:bg-yellow-200 transition-colors
                          ${isSource ? 'bg-blue-100 border-blue-200' : ''}
                        `}
                        onClick={(e) => handleActionHeaderClick(actionId, e)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-sm ${isSource ? 'bg-blue-600' : 'bg-yellow-600'}`}></div>
                          <span className={`font-medium text-xs ${isSource ? 'text-blue-800' : 'text-yellow-800'}`}>
                            {isSource ? 'Connecting...' : 'Action'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Content - Click to edit */}
                      <div 
                        className="p-3 cursor-pointer hover:bg-yellow-100 transition-colors"
                        onClick={(e) => handleActionContentClick(actionId, e)}
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">{action.label}</div>
                        {'performedBy' in action && action.performedBy.length > 0 && (
                          <div className="text-xs text-gray-600">
                            By: {action.performedBy.join(', ')}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 opacity-70">
                          Tap to edit
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {actionLevels.map((level, levelIndex) => {
                if (levelIndex === actionLevels.length - 1) return null;
                
                return level.map(sourceActionId => {
                  const outgoingEdges = model.edges.filter(edge => 
                    edge.from === sourceActionId && 
                    actionLevels[levelIndex + 1]?.includes(edge.to)
                  );
                  
                  return outgoingEdges.map(edge => (
                    <g key={`${edge.from}-${edge.to}`}>
                      <path
                        d={`M ${100 + level.indexOf(sourceActionId) * 200} ${80 + levelIndex * 80} 
                           L ${100 + actionLevels[levelIndex + 1].indexOf(edge.to) * 200} ${80 + (levelIndex + 1) * 80}`}
                        stroke={edge.type === 'choice' ? '#ef4444' : '#6b7280'}
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  ));
                });
              })}
              
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
              </defs>
            </svg>
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
            {childActions.length} action{childActions.length !== 1 ? 's' : ''} (tap to expand)
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};
