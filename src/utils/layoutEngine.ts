
import dagre from 'dagre';
import { DiagramModel, DiagramNode } from '../types/diagram';

export interface LayoutNode {
  id: string;
  label: string;
  type: 'phase' | 'block' | 'action';
  position: { x: number; y: number };
  width: number;
  height: number;
  // Include all other DiagramNode properties
  parentPhase?: string;
  parentBlock?: string | null;
  childActions?: string[];
  expanded?: boolean;
  performedBy?: string[];
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: 'choice' | 'any' | 'parallel';
  descriptor?: string;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export const calculateLayout = (model: DiagramModel): LayoutResult => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre
  model.nodes.forEach(node => {
    let width = 200;
    let height = 80;
    
    if (node.type === 'phase') {
      width = 250;
      height = 100;
    } else if (node.type === 'block') {
      const block = node as any;
      const childActions = model.nodes.filter(n => 
        n.type === 'action' && 'parentBlock' in n && n.parentBlock === block.id
      );
      
      if (childActions.length > 0) {
        const actionWidth = 150;
        width = Math.max(300, childActions.length * (actionWidth + 20) + 40);
        height = block.expanded ? 120 : 80;
      } else {
        width = 300;
        height = 80;
      }
    }
    
    g.setNode(node.id, { width, height });
  });

  // Add edges to dagre
  model.edges.forEach(edge => {
    g.setEdge(edge.from, edge.to);
  });

  // Calculate layout
  dagre.layout(g);

  // Extract positioned nodes
  const layoutNodes: LayoutNode[] = model.nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
      width: nodeWithPosition.width,
      height: nodeWithPosition.height,
    } as LayoutNode;
  });

  // Map edges with descriptors
  const layoutEdges: LayoutEdge[] = model.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: edge.type,
    descriptor: edge.descriptor,
  }));

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
  };
};
