
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

  // Build a tree structure of actions to avoid infinite recursion
  const buildActionTree = useCallback(() => {
    const actionMap = new Map(childActions.map(action => [action.id, action]));
    const visited = new Set<string>();
    const roots: Action[] = [];

    // Find root actions (actions with no incoming edges from other actions in this block)
    childActions.forEach(action => {
      const hasIncomingEdge = model.edges.some(edge => 
        edge.to === action.id && 
        childActions.some(child => child.id === edge.from)
      );
      
      if (!hasIncomingEdge) {
        roots.push(action);
      }
    });

    // If no roots found, all actions are roots to prevent infinite loops
    if (roots.length === 0) {
      return childActions.map(action => ({ action, children: [] }));
    }

    const buildChildren = (action: Action, depth = 0): { action: Action; children: any[] } => {
      // Prevent infinite recursion with depth limit and visited check
      if (depth > 10 || visited.has(action.id)) {
        return { action, children: [] };
      }
      
      visited.add(action.id);
      
      const childEdges = model.edges.filter(edge => edge.from === action.id);
      const children = childEdges
        .map(edge => actionMap.get(edge.to))
        .filter(Boolean)
        .map(childAction => buildChildren(childAction!, depth + 1));
      
      return { action, children };
    };

    return roots.map(root => buildChildren(root));
  }, [childActions, model.edges]);

  const renderActionNode = (actionData: { action: Action; children: any[] }, level = 0) => {
    const { action, children } = actionData;
    
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
        
        {children.length > 0 && (
          <div className="ml-4 mt-1">
            {children.map(child => renderActionNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const actionTree = buildActionTree();

  return (
    <Card className="min-w-[250px] bg-white border border-gray-300">
      <CardHeader className="bg-blue-50 border-b border-blue-200 py-3">
        <CardTitle className="text-sm font-semibold text-blue-800">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 bg-gray-50">
        <div className="space-y-2">
          {actionTree.length > 0 ? (
            actionTree.map(actionData => renderActionNode(actionData))
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
