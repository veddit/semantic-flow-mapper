
import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
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
import { DecisionNode } from './nodes/DecisionNode';

const nodeTypes: NodeTypes = {
  phase: PhaseNode,
  block: BlockNode,
  action: ActionNode,
  decision: DecisionNode,
};

export const DiagramCanvas: React.FC = () => {
  const { model, addEdge: addDiagramEdge, generateId, selectedNodeId, setSelectedNode } = useDiagramStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update React Flow nodes and edges when model changes
  useEffect(() => {
    const layout = calculateLayout(model);
    
    const flowNodes: Node[] = layout.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node,
      selected: node.id === selectedNodeId,
      style: {
        width: node.width,
        height: node.height,
      },
    }));

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
      label: edge.type,
      labelStyle: { fontSize: 12, fontWeight: 'bold' },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [model, selectedNodeId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge = {
          id: generateId('edge'),
          from: params.source,
          to: params.target,
          type: 'any' as const, // Default edge type
        };
        addDiagramEdge(newEdge);
      }
    },
    [addDiagramEdge, generateId]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
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
              case 'decision': return '#8b5cf6';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
