
import React, { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDiagramStore } from '../../store/diagramStore';
import { useTraceLogger } from '../../hooks/useTraceLogger';
import { Block, Action } from '../../types/diagram';

interface BlockNodeProps {
  data: Block;
}

export const BlockNode: React.FC<BlockNodeProps> = ({ data }) => {
  const { 
    model, 
    connectionState, 
    startConnection, 
    completeConnection, 
    cancelConnection,
    canConnect 
  } = useDiagramStore();

  const { trace } = useTraceLogger();

  const logTrace = (msg: string) => {
    trace(`[BLOCK-${data.id}] ${msg}`);
  };

  const getChildActions = useCallback(() => {
    return model.nodes.filter(node => node.type === 'action' && node.parentBlock === data.id) as Action[];
  }, [model.nodes, data.id]);

  const handleActionHeaderClick = (actionId: string) => {
    logTrace(`Action header clicked: ${actionId}`);
    
    if (connectionState.isConnecting) {
      if (connectionState.sourceNodeId === actionId) {
        logTrace(`Same action clicked - cancelling connection`);
        cancelConnection();
        return;
      }
      
      logTrace(`Attempting to complete connection: ${connectionState.sourceNodeId} → ${actionId}`);
      if (canConnect(connectionState.sourceNodeId, actionId)) {
        completeConnection(actionId);
      } else {
        logTrace(`Connection not allowed`);
        cancelConnection();
      }
    } else {
      logTrace(`Starting new connection from ${actionId}`);
      startConnection(actionId);
    }
  };

  const handleActionContentClick = (actionId: string) => {
    logTrace(`Action content clicked: ${actionId} - opening edit modal`);
    // TODO: Implement edit modal
  };

  const childActions = getChildActions();

  const renderActionNode = (action: Action, level = 0) => {
    const edges = model.edges.filter(edge => edge.from === action.id);
    const hasChildren = edges.length > 0;
    
    return (
      <div key={action.id} className="mb-2">
        <div 
          className={`
            border rounded-lg p-2 bg-white shadow-sm
            ${connectionState.sourceNodeId === action.id ? 'ring-2 ring-blue-500' : ''}
          `}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => handleActionHeaderClick(action.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{action.label}</span>
              {connectionState.isConnecting && connectionState.sourceNodeId !== action.id && (
                <span className="text-xs text-blue-600">Tap to connect</span>
              )}
            </div>
          </div>
          <div 
            className="cursor-pointer hover:bg-gray-50 p-1 rounded mt-1"
            onClick={() => handleActionContentClick(action.id)}
          >
            <div className="text-xs text-gray-600">
              {action.performedBy.length > 0 ? (
                action.performedBy.map(actor => (
                  <span key={actor} className="inline-block bg-gray-200 rounded px-1 mr-1">{actor}</span>
                ))
              ) : (
                <span className="text-gray-400">No actors</span>
              )}
            </div>
          </div>
        </div>
        
        {hasChildren && (
          <div className="ml-4 mt-1">
            {edges.map(edge => {
              const targetAction = childActions.find(a => a.id === edge.to);
              if (targetAction) {
                return renderActionNode(targetAction, level + 1);
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="min-w-[250px] bg-white border border-gray-300">
      <CardHeader className="bg-blue-50 border-b border-blue-200 py-3">
        <CardTitle className="text-sm font-semibold text-blue-800">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 bg-gray-50">
        <div className="space-y-2">
          {childActions.length > 0 ? (
            childActions.map(action => renderActionNode(action))
          ) : (
            <div className="text-xs text-gray-500 italic">No actions in this block</div>
          )}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </Card>
  );
};
