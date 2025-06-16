
import { DiagramModel } from '../types/diagram';

export const sampleDiagramWithBranching: DiagramModel = {
  nodes: [
    {
      id: 'phase1',
      type: 'phase',
      label: 'User Authentication Phase'
    },
    {
      id: 'block1',
      type: 'block',
      label: 'Login Process',
      parentPhase: 'phase1',
      childActions: ['action1', 'action2', 'action3'],
      expanded: true
    },
    {
      id: 'action1',
      type: 'action',
      label: 'User enters credentials',
      parentBlock: 'block1',
      performedBy: ['user'],
      position: { x: 0, y: 0 }
    },
    {
      id: 'action2',
      type: 'action',
      label: 'Validate credentials',
      parentBlock: 'block1',
      performedBy: ['system'],
      position: { x: 200, y: 0 }
    },
    {
      id: 'action3',
      type: 'action',
      label: 'Show error message',
      parentBlock: 'block1',
      performedBy: ['system'],
      position: { x: 400, y: 0 }
    },
    {
      id: 'block2',
      type: 'block',
      label: 'Success Flow',
      parentPhase: 'phase1',
      childActions: ['action4'],
      expanded: true
    },
    {
      id: 'action4',
      type: 'action',
      label: 'Redirect to dashboard',
      parentBlock: 'block2',
      performedBy: ['system'],
      position: { x: 0, y: 0 }
    },
    {
      id: 'orphan1',
      type: 'action',
      label: 'Orphaned Action',
      parentBlock: null,
      performedBy: ['user'],
      position: { x: 100, y: 300 }
    }
  ],
  edges: [
    {
      id: 'edge1',
      from: 'action1',
      to: 'action2',
      type: 'any'
    },
    {
      id: 'edge2',
      from: 'action2',
      to: 'action4',
      type: 'choice',
      descriptor: 'valid'
    },
    {
      id: 'edge3',
      from: 'action2',
      to: 'action3',
      type: 'choice',
      descriptor: 'invalid'
    },
    {
      id: 'edge4',
      from: 'block1',
      to: 'block2',
      type: 'any'
    }
  ]
};
