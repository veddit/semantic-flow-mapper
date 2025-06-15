
import dagre from 'dagre';
import { DiagramModel, DiagramNode } from '../types/diagram';

export interface LayoutNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  [key: string]: any; // This allows additional properties from DiagramNode
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
const BLOCK_WIDTH = 250;
const BLOCK_HEIGHT = 100;

export const calculateLayout = (model: DiagramModel): { nodes: LayoutNode[]; edges: LayoutEdge[] } => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB', 
    ranksep: 60, 
    nodesep: 40,
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
      width = BLOCK_WIDTH;
      height = BLOCK_HEIGHT;
    }

    g.setNode(node.id, { width, height });

    return {
      ...node,
      position: { x: 0, y: 0 },
      width,
      height
    };
  });

  // Add edges to layout
  model.edges.forEach(edge => {
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

  const layoutEdges: LayoutEdge[] = model.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: edge.type
  }));

  return { nodes: layoutNodes, edges: layoutEdges };
};
