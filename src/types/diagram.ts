
export type NodeType = 'phase' | 'block' | 'action';

export type EdgeType = 'choice' | 'any' | 'parallel';

export interface Phase {
  id: string;
  label: string;
  type: 'phase';
}

export interface Block {
  id: string;
  label: string;
  type: 'block';
  parentPhase: string;
  childActions: string[];
  expanded: boolean;
}

export interface Action {
  id: string;
  label: string;
  type: 'action';
  parentBlock: string | null;
  performedBy: string[];
  position?: { x: number; y: number };
}

export type DiagramNode = Phase | Block | Action;

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  descriptor?: string;
}

export interface DiagramModel {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ValidationError {
  type: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}
