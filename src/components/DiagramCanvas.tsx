
import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  NodeDragHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '../store/diagramStore';
import { calculateLayout } from '../utils/layoutEngine';
import { PhaseNode } from './nodes/PhaseNode';
import { BlockNode } from './nodes/BlockNode';
import { ActionNode } from './nodes/ActionNode';

const nodeTypes: NodeTypes = {
  phase: PhaseNode,
  block: BlockNode,
  action: ActionNode,
};

export const DiagramCanvas: React.FC = () => {
  const { 
    model, 
    selectedNodeId, 
    setSelectedNode, 
    connectionState, 
    startConnection, 
    completeConnection, 
    cancelConnection, 
    setHoveredNode, 
    canConnect,
    nestActionInBlock
  } = useDiagramStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update React Flow nodes and edges when model changes
  useEffect(() => {
    const layout = calculateLayout(model);
    
    const flowNodes: Node[] = layout.nodes.map(node => {
      const isSource = connectionState.sourceNodeId === node.id;
      const isHovered = connectionState.hoveredNodeId === node.id;
      const isValidTarget = connectionState.isConnecting && 
        connectionState.sourceNodeId && 
        canConnect(connectionState.sourceNodeId, node.id);
      
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node,
          isConnecting: connectionState.isConnecting,
          isSource,
          isHovered,
          isValidTarget,
        },
        selected: node.id === selectedNodeId,
        style: {
          width: node.width,
          height: node.height,
          opacity: connectionState.isConnecting && !isSource && !isValidTarget ? 0.3 : 1,
          border: isValidTarget ? '3px solid #10b981' : isSource ? '3px solid #3b82f6' : undefined,
          boxShadow: isHovered && isValidTarget ? '0 0 20px rgba(16, 185, 129, 0.6)' : undefined,
        },
      };
    });

    const flowEdges: Edge[] = layout.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.type === 'parallel',
      style: {
        stroke: edge.type === 'choice' ? '#ef4444' : edge.type === 'parallel' ? '#8b5cf6' : '#6b7280',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.type === 'choice' ? '#ef4444' : edge.type === 'parallel' ? '#8b5cf6' : '#6b7280',
      },
      label: edge.descriptor || edge.type,
      labelStyle: { fontSize: 12, fontWeight: 'bold' },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [model, selectedNodeId, connectionState, setNodes, setEdges, canConnect]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (connectionState.isConnecting) {
        if (connectionState.sourceNodeId === node.id) {
          // Clicking source node again cancels connection
          cancelConnection();
        } else if (canConnect(connectionState.sourceNodeId!, node.id)) {
          // Complete connection to valid target
          completeConnection(node.id);
        }
      } else {
        // Normal selection or start connection
        if (event.detail === 2) { // Double-click to start connection
          startConnection(node.id);
        } else {
          setSelectedNode(node.id);
        }
      }
    },
    [connectionState, startConnection, completeConnection, cancelConnection, setSelectedNode, canConnect]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (event, node, nodes) => {
      // Check if an action was dropped on a block
      if (node.type === 'action') {
        const actionNode = model.nodes.find(n => n.id === node.id);
        if (!actionNode || actionNode.type !== 'action') return;

        // Find overlapping blocks
        const blockNodes = nodes.filter(n => n.type === 'block' && n.id !== node.id);
        
        for (const blockNode of blockNodes) {
          const actionBounds = {
            left: node.position.x,
            right: node.position.x + (node.width || 200),
            top: node.position.y,
            bottom: node.position.y + (node.height || 80),
          };
          
          const blockBounds = {
            left: blockNode.position.x,
            right: blockNode.position.x + (blockNode.width || 300),
            top: blockNode.position.y,
            bottom: blockNode.position.y + (blockNode.height || 120),
          };

          // Check for overlap
          const isOverlapping = !(
            actionBounds.right < blockBounds.left ||
            actionBounds.left > blockBounds.right ||
            actionBounds.bottom < blockBounds.top ||
            actionBounds.top > blockBounds.bottom
          );

          if (isOverlapping) {
            nestActionInBlock(node.id, blockNode.id);
            break;
          }
        }
      }
    },
    [model.nodes, nestActionInBlock]
  );

  const onNodeMouseEnter = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (connectionState.isConnecting) {
        setHoveredNode(node.id);
      }
    },
    [connectionState.isConnecting, setHoveredNode]
  );

  const onNodeMouseLeave = useCallback(
    () => {
      if (connectionState.isConnecting) {
        setHoveredNode(null);
      }
    },
    [connectionState.isConnecting, setHoveredNode]
  );

  const onPaneClick = useCallback(
    () => {
      if (connectionState.isConnecting) {
        cancelConnection();
      } else {
        setSelectedNode(null);
      }
    },
    [connectionState.isConnecting, cancelConnection, setSelectedNode]
  );

  return (
    <div className="w-full h-full">
      {connectionState.isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Click a highlighted node to connect, or click anywhere to cancel
          </p>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        nodesDraggable={!connectionState.isConnecting}
        nodesConnectable={false} // Disable default connection behavior
        elementsSelectable={!connectionState.isConnecting}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case 'phase': return '#3b82f6';
              case 'block': return '#10b981';
              case 'action': return '#f59e0b';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
