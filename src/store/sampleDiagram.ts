
import { DiagramModel } from '../types/diagram';

export const sampleDiagram: DiagramModel = {
  nodes: [
    {
      id: 'phaseA',
      type: 'phase',
      label: 'Phase A'
    },
    {
      id: 'phaseB',
      type: 'phase',
      label: 'Phase B'
    },
    {
      id: 'block1',
      type: 'block',
      label: 'User Block',
      parentPhase: 'phaseA',
      childActions: ['action1', 'action2'],
      expanded: true
    },
    {
      id: 'block2',
      type: 'block',
      label: 'System Block',
      parentPhase: 'phaseB',
      childActions: ['action3'],
      expanded: true
    },
    {
      id: 'action1',
      type: 'action',
      label: 'User initiates request',
      parentBlock: 'block1',
      performedBy: ['user'],
      position: { x: 0, y: 0 }
    },
    {
      id: 'action2',
      type: 'action',
      label: 'Info validated',
      parentBlock: 'block1',
      performedBy: ['admin'],
      position: { x: 0, y: 0 }
    },
    {
      id: 'action3',
      type: 'action',
      label: 'System processes',
      parentBlock: 'block2',
      performedBy: ['system'],
      position: { x: 0, y: 0 }
    },
    {
      id: 'actionOrphan',
      type: 'action',
      label: 'Unassigned action',
      parentBlock: null,
      performedBy: ['user'],
      position: { x: 0, y: 0 }
    }
  ],
  edges: [
    {
      id: 'e1',
      from: 'action1',
      to: 'action2',
      type: 'any'
    },
    {
      id: 'e2',
      from: 'action2',
      to: 'action3',
      type: 'any'
    },
    {
      id: 'e3',
      from: 'block1',
      to: 'block2',
      type: 'parallel',
      descriptor: 'Runs in parallel'
    }
  ]
};
