
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

  // Filter out actions that are nested in blocks from the main canvas
  const getVisibleNodes = useCallback(() => {
    return model.nodes.filter(node => {
      // Show all phases and blocks
      if (node.type === 'phase' || node.type === 'block') {
        return true;
      }
      // Only show actions that are NOT nested in any block (orphaned actions)
      if (node.type === 'action') {
        return !node.parentBlock;
      }
      return true;
    });
  }, [model.nodes]);

  React.useEffect(() => {
    const visibleNodes = getVisibleNodes();
    
    if (!layoutRef.current) {
      const layout = calculateLayout({ ...model, nodes: visibleNodes });
      layoutRef.current = layout;
      setNodes(
        layout.nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: { ...node },
          style: {
            width: node.width,
            height: node.height,
          },
          selected: node.id === selectedNodeId,
        }))
      );
      setEdges(
        layout.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: edge.type === 'parallel',
          style: {
            stroke:
              edge.type === 'choice'
                ? '#ef4444'
                : edge.type === 'parallel'
                ? '#8b5cf6'
                : '#6b7280',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color:
              edge.type === 'choice'
                ? '#ef4444'
                : edge.type === 'parallel'
                ? '#8b5cf6'
                : '#6b7280',
          },
          label: edge.descriptor || edge.type,
          labelStyle: { fontSize: 12, fontWeight: 'bold' },
        }))
      );
    } else {
      setNodes(nds =>
        nds.map(n => {
          // Find the corresponding node in visible nodes
          const modelNode = visibleNodes.find(mn => mn.id === n.id);
          if (!modelNode) {
            // This node should be hidden (it's a nested action)
            return { ...n, hidden: true };
          }
          
          return {
            ...n,
            hidden: false,
            selected: n.id === selectedNodeId,
            data: { ...modelNode },
            style: {
              ...n.style,
              opacity:
                connectionState.isConnecting &&
                connectionState.sourceNodeId !== n.id
                  ? 0.6
                  : 1,
            },
          };
        }).filter(n => !n.hidden)
      );
      setEdges(eds => eds.map(e => ({ ...e })));
    }
  }, [
    model.nodes,
    model.edges,
    selectedNodeId,
    setNodes,
    setEdges,
    connectionState.isConnecting,
    connectionState.sourceNodeId,
    getVisibleNodes,
  ]);

  const onNodeClick = React.useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!connectionState.isConnecting) {
        setSelectedNode(node.id);
        // Toggle block expansion on click
        if (node.type === 'block') {
          const blockData = node.data;
          updateNode(node.id, { expanded: !blockData.expanded });
        }
        return;
      }
      
      const sourceId = connectionState.sourceNodeId!;
      if (sourceId === node.id) {
        cancelConnection();
        return;
      }
      
      const sourceNode = model.nodes.find(n => n.id === sourceId);
      if (!sourceNode) return;
      
      // Handle action to block nesting
      if (sourceNode.type === 'action' && node.type === 'block') {
        nestActionInBlock(sourceNode.id, node.id);
        cancelConnection();
        return;
      }
      
      // Handle regular connections
      const isAllowed =
        (sourceNode.type === 'action' || sourceNode.type === 'block') &&
        (node.type === 'action' || node.type === 'block') &&
        canConnect(sourceId, node.id);

      if (isAllowed) {
        completeConnection(node.id);
        return;
      }
      cancelConnection();
    },
    [
      connectionState,
      setSelectedNode,
      updateNode,
      canConnect,
      completeConnection,
      cancelConnection,
      nestActionInBlock,
      model.nodes,
    ]
  );

  // Only persist drag, not width/height, since width/height is not a DiagramNode property.
  const onNodesChangeWrapper = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          updateNode(change.id, { position: change.position });
        }
      });
    },
    [onNodesChange, updateNode]
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
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
            Click an action to connect, click a block to nest action, or click empty space to cancel
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
