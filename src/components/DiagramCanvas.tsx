import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  MarkerType,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '../store/diagramStore';
import { calculateLayout } from '../utils/layoutEngine';
import { PhaseNode } from './nodes/PhaseNode';
import { BlockNode } from './nodes/BlockNode';
import { ActionNode } from './nodes/ActionNode';
import { ResizableBlockNode } from './nodes/ResizableBlockNode';
import { ResizableActionNode } from './nodes/ResizableActionNode';

const nodeTypes: NodeTypes = {
  phase: PhaseNode,
  block: ResizableBlockNode,
  action: ResizableActionNode,
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
    nestActionInBlock,
    updateNode,
  } = useDiagramStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const layoutRef = useRef<any>(null);

  // Only trigger auto-layout if requested; by default, allow persistent dragging/resizing.
  useEffect(() => {
    if (!layoutRef.current) {
      const layout = calculateLayout(model);
      layoutRef.current = layout;
      setNodes(layout.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { ...node },
        style: {
          width: node.width,
          height: node.height,
        },
        selected: node.id === selectedNodeId,
      })));
      setEdges(layout.edges.map(edge => ({
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
      })));
    } else {
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          selected: n.id === selectedNodeId,
          style: {
            ...n.style,
            opacity: connectionState.isConnecting && connectionState.sourceNodeId !== n.id ? 0.6 : 1,
          },
        }))
      );
      setEdges(eds =>
        eds.map(e => ({
          ...e,
        }))
      );
    }
  }, [model.nodes, model.edges, selectedNodeId, setNodes, setEdges, connectionState.isConnecting, connectionState.sourceNodeId]);

  // Modern edit/connector mode (same as before except...)
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!connectionState.isConnecting) {
        setSelectedNode(node.id);
        // Enter connector/edit mode if node is an action
        if (node.type === 'action') {
          startConnection(node.id);
        }
        return;
      }
      // If in connector (edit) mode:
      const sourceId = connectionState.sourceNodeId!;
      if (sourceId === node.id) {
        // Clicking again cancels
        cancelConnection();
        return;
      }
      const sourceNode = model.nodes.find(n => n.id === sourceId);
      if (!sourceNode) return;
      // If click target is a block, re-parent the action to that block
      if (sourceNode.type === 'action' && node.type === 'block') {
        nestActionInBlock(sourceNode.id, node.id);
        cancelConnection();
        return;
      }
      // If both are actions/blocks, try to connect via edge
      if (canConnect(sourceId, node.id)) {
        completeConnection(node.id);
        return;
      }
      cancelConnection();
    },
    [connectionState, setSelectedNode, startConnection, canConnect, completeConnection, cancelConnection, nestActionInBlock, model.nodes]
  );

  // Only persist drag, not width/height, since width/height is not a DiagramNode property.
  const onNodesChangeWrapper = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          updateNode(change.id, { position: change.position });
        }
        // Removed any attempt to updateNode(..., { width, height }), as those are visual only.
      });
    },
    [onNodesChange, updateNode]
  );

  // No snapping—persistent positions.
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Dragging only updates position in store (handled by onNodesChange)
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  // Enable clicking empty space to clear edit/connector mode
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
            Click an action to link, or click a block to assign as parent
          </p>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWrapper}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
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
