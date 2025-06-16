import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDiagramStore } from '../../store/diagramStore';
import { NodeData } from '../../types/reactflow';
import { Block, Action } from '../../types/diagram';
import './BlockNode.css';

export const BlockNode: React.FC<NodeData<Block>> = ({ data }) => {
  const { 
    model, 
    connectionState, 
    startConnection, 
    completeConnection, 
    cancelConnection,
    canConnect 
  } = useDiagramStore();

  const trace = (msg: string) => {
    console.log(`[BLOCK-${data.id}] ${msg}`);
  };

  const getChildActions = useCallback(() => {
    return model.nodes.filter(node => node.type === 'action' && node.parentBlock === data.id) as Action[];
  }, [model.nodes, data.id]);

  const handleActionHeaderClick = (actionId: string) => {
    trace(`Action header clicked: ${actionId}`);
    
    if (connectionState.isConnecting) {
      if (connectionState.sourceNodeId === actionId) {
        trace(`Same action clicked - cancelling connection`);
        cancelConnection();
        return;
      }
      
      trace(`Attempting to complete connection: ${connectionState.sourceNodeId} → ${actionId}`);
      if (canConnect(connectionState.sourceNodeId, actionId)) {
        completeConnection(actionId);
      } else {
        trace(`Connection not allowed`);
        cancelConnection();
      }
    } else {
      trace(`Starting new connection from ${actionId}`);
      startConnection(actionId);
    }
  };

  const handleActionContentClick = (actionId: string) => {
    trace(`Action content clicked: ${actionId} - opening edit modal`);
    // TODO: Implement edit modal
  };

  const childActions = getChildActions();

  const renderActionNode = (action: Action, level = 0) => {
    const edges = model.edges.filter(edge => edge.from === action.id);
    const hasChildren = edges.length > 0;
    
    return (
      <div key={action.id} className="action-item">
        <div 
          className={`action-card ${connectionState.sourceNodeId === action.id ? 'connecting' : ''}`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div 
            className="action-header"
            onClick={() => handleActionHeaderClick(action.id)}
          >
            <span className="action-title">{action.label}</span>
            {connectionState.isConnecting && connectionState.sourceNodeId !== action.id && (
              <span className="connection-hint">Tap to connect</span>
            )}
          </div>
          <div 
            className="action-content"
            onClick={() => handleActionContentClick(action.id)}
          >
            <div className="performed-by">
              {action.performedBy.length > 0 ? (
                action.performedBy.map(actor => (
                  <span key={actor} className="actor-badge">{actor}</span>
                ))
              ) : (
                <span className="no-actors">No actors</span>
              )}
            </div>
          </div>
        </div>
        
        {hasChildren && (
          <div className="children-container">
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
    <Card className="block-node">
      <CardHeader>
        <CardTitle>{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="actions-container">
          {childActions.map(action => renderActionNode(action))}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </Card>
  );
};
