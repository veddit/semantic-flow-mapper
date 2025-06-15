
import dagre from 'dagre';
import { DiagramModel, DiagramNode } from '../types/diagram';

export interface LayoutNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  [key: string]: any;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const PHASE_WIDTH = 300;
const PHASE_HEIGHT = 150;
const BLOCK_MIN_WIDTH = 300;
const BLOCK_HEIGHT = 120;
const ACTION_WIDTH = 180;
const ACTION_HEIGHT = 70;

export const calculateLayout = (model: DiagramModel): { nodes: LayoutNode[]; edges: LayoutEdge[] } => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'LR', // Left to right for better horizontal connector flow
    ranksep: 80, 
    nodesep: 60,
    marginx: 20,
    marginy: 20
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Create layout nodes with proper dimensions
  const layoutNodes: LayoutNode[] = model.nodes.map(node => {
    let width = NODE_WIDTH;
    let height = NODE_HEIGHT;
    
    if (node.type === 'phase') {
      width = PHASE_WIDTH;
      height = PHASE_HEIGHT;
    } else if (node.type === 'block') {
      // Calculate block width based on child actions
      const childActions = model.nodes.filter(n => 
        n.type === 'action' && 'parentBlock' in n && n.parentBlock === node.id
      );
      const actionWidth = ACTION_WIDTH;
      width = Math.max(BLOCK_MIN_WIDTH, childActions.length * (actionWidth + 20) + 40);
      height = 'expanded' in node && node.expanded ? BLOCK_HEIGHT + 60 : BLOCK_HEIGHT;
    } else if (node.type === 'action') {
      width = ACTION_WIDTH;
      height = ACTION_HEIGHT;
    }

    g.setNode(node.id, { width, height });

    return {
      ...node,
      position: { x: 0, y: 0 },
      width,
      height
    };
  });

  // Add edges to layout - only for nodes that should participate in layout
  // Actions nested in blocks shouldn't create layout edges, only the blocks themselves
  const layoutEdges = model.edges.filter(edge => {
    const sourceNode = model.nodes.find(n => n.id === edge.from);
    const targetNode = model.nodes.find(n => n.id === edge.to);
    
    // Only include edges between blocks and phases, or between orphaned actions
    return sourceNode && targetNode && (
      (sourceNode.type === 'block' || sourceNode.type === 'phase') ||
      (sourceNode.type === 'action' && 'parentBlock' in sourceNode && !sourceNode.parentBlock)
    );
  });

  layoutEdges.forEach(edge => {
    g.setEdge(edge.from, edge.to);
  });

  // Calculate layout
  dagre.layout(g);

  // Apply calculated positions
  layoutNodes.forEach(node => {
    const graphNode = g.node(node.id);
    if (graphNode) {
      node.position.x = graphNode.x - graphNode.width / 2;
      node.position.y = graphNode.y - graphNode.height / 2;
    }
  });

  const finalEdges: LayoutEdge[] = model.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: edge.type
  }));

  return { nodes: layoutNodes, edges: finalEdges };
};
