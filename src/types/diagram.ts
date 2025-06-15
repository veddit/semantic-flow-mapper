
export type NodeType = 'phase' | 'block' | 'action' | 'decision';

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
}

export interface Action {
  id: string;
  label: string;
  type: 'action';
  parentBlock: string;
  performedBy: string[];
}

export interface Decision {
  id: string;
  label: string;
  type: 'decision';
  parentBlock: string;
}

export type DiagramNode = Phase | Block | Action | Decision;

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
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
