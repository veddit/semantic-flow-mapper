
import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
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

  const onNodeDragStop = useCallback(
    (event: any, draggedNode: Node) => {
      console.log('Node drag stopped:', draggedNode.id, draggedNode.type, draggedNode.position);
      
      // Only handle action nodes being dragged
      if (draggedNode.type !== 'action') return;

      const actionNode = model.nodes.find(n => n.id === draggedNode.id);
      if (!actionNode || actionNode.type !== 'action') return;

      // Find all block nodes
      const blockNodes = nodes.filter(n => n.type === 'block' && n.id !== draggedNode.id);
      
      console.log('Found block nodes:', blockNodes.length);
      
      for (const blockNode of blockNodes) {
        console.log('Checking overlap with block:', blockNode.id, blockNode.position);
        
        // Calculate bounds more accurately
        const actionLeft = draggedNode.position.x;
        const actionRight = draggedNode.position.x + (draggedNode.style?.width as number || 180);
        const actionTop = draggedNode.position.y;
        const actionBottom = draggedNode.position.y + (draggedNode.style?.height as number || 70);
        
        const blockLeft = blockNode.position.x;
        const blockRight = blockNode.position.x + (blockNode.style?.width as number || 300);
        const blockTop = blockNode.position.y;
        const blockBottom = blockNode.position.y + (blockNode.style?.height as number || 120);

        console.log('Action bounds:', { left: actionLeft, right: actionRight, top: actionTop, bottom: actionBottom });
        console.log('Block bounds:', { left: blockLeft, right: blockRight, top: blockTop, bottom: blockBottom });

        // Check for overlap - action must be significantly inside the block
        const overlapX = actionLeft > blockLeft + 20 && actionRight < blockRight - 20;
        const overlapY = actionTop > blockTop + 20 && actionBottom < blockBottom - 20;
        const isOverlapping = overlapX && overlapY;

        console.log('Overlap check:', { overlapX, overlapY, isOverlapping });

        if (isOverlapping) {
          console.log('Nesting action', draggedNode.id, 'in block', blockNode.id);
          nestActionInBlock(draggedNode.id, blockNode.id);
          break;
        }
      }
    },
    [model.nodes, nestActionInBlock, nodes]
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
        nodesConnectable={false}
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
