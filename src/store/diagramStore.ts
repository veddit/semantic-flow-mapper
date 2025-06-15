
import { create } from 'zustand';
import { DiagramModel, DiagramNode, DiagramEdge, ValidationError, Block, Phase, Action } from '../types/diagram';
import { sampleDiagram } from './sampleDiagram';

interface ConnectionState {
  isConnecting: boolean;
  sourceNodeId: string | null;
  hoveredNodeId: string | null;
}

interface DiagramStore {
  model: DiagramModel;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  validationErrors: ValidationError[];
  connectionState: ConnectionState;
  addNode: (node: DiagramNode) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: DiagramEdge) => void;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;
  nestActionInBlock: (actionId: string, blockId: string) => void;
  removeActionFromBlock: (actionId: string) => void;
  startConnection: (nodeId: string) => void;
  completeConnection: (targetNodeId: string, edgeType?: 'choice' | 'any' | 'parallel', descriptor?: string) => void;
  cancelConnection: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  canConnect: (sourceId: string, targetId: string) => boolean;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  validateModel: () => ValidationError[];
  exportJSON: () => string;
  generateId: (type: string) => string;
  getNodesByType: (type: string) => DiagramNode[];
  getChildNodes: (parentId: string) => DiagramNode[];
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  // 1. Init default sample diagram here:
  model: sampleDiagram,
  selectedNodeId: null,
  selectedEdgeId: null,
  validationErrors: [],
  connectionState: {
    isConnecting: false,
    sourceNodeId: null,
    hoveredNodeId: null,
  },

  generateId: (type: string) => {
    const prefix = type.charAt(0);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    return `${prefix}${timestamp}${random}`;
  },

  nestActionInBlock: (actionId, blockId) => {
    set((state) => {
      const newNodes: DiagramNode[] = state.model.nodes.map(node => {
        // If action node, update its parentBlock only
        if (node.id === actionId && node.type === 'action') {
          const action = node as Action;
          return { ...action, parentBlock: blockId } as Action;
        }
        // If block node, ensure type is Block and update childActions
        if (node.id === blockId && node.type === 'block') {
          const block = node as Block;
          const updatedChildActions = block.childActions.includes(actionId)
            ? block.childActions
            : [...block.childActions, actionId];
          return {
            id: block.id,
            label: block.label,
            type: 'block',
            parentPhase: block.parentPhase,
            childActions: updatedChildActions,
            expanded: true,
          } as Block;
        }
        return node;
      });
      return {
        model: {
          ...state.model,
          nodes: newNodes,
        }
      };
    });
    get().validateModel();
  },

  removeActionFromBlock: (actionId) => {
    set((state) => ({
      model: {
        ...state.model,
        nodes: state.model.nodes.map(node => {
          if (node.id === actionId && node.type === 'action') {
            const action = node as Action;
            return { ...action, parentBlock: null } as Action;
          }
          if (node.type === 'block') {
            const block = node as Block;
            return {
              ...block,
              childActions: block.childActions.filter(id => id !== actionId)
            } as Block;
          }
          return node;
        })
      }
    }));
    get().validateModel();
  },

  startConnection: (nodeId) => {
    set({
      connectionState: {
        isConnecting: true,
        sourceNodeId: nodeId,
        hoveredNodeId: null,
      }
    });
  },

  completeConnection: (targetNodeId, edgeType = 'any', descriptor) => {
    const { connectionState, addEdge, generateId, canConnect } = get();
    if (!connectionState.sourceNodeId || !canConnect(connectionState.sourceNodeId, targetNodeId)) {
      get().cancelConnection();
      return;
    }
    const newEdge: DiagramEdge = {
      id: generateId('edge'),
      from: connectionState.sourceNodeId,
      to: targetNodeId,
      type: edgeType,
      descriptor,
    };
    addEdge(newEdge);
    get().cancelConnection();
  },

  cancelConnection: () => {
    set({
      connectionState: {
        isConnecting: false,
        sourceNodeId: null,
        hoveredNodeId: null,
      }
    });
  },

  setHoveredNode: (nodeId) => {
    set((state) => ({
      connectionState: {
        ...state.connectionState,
        hoveredNodeId: nodeId,
      }
    }));
  },

  canConnect: (sourceId, targetId) => {
    const { model } = get();
    const sourceNode = model.nodes.find(n => n.id === sourceId);
    const targetNode = model.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode || sourceId === targetId) return false;
    // Actions and blocks can connect to other actions and blocks
    return (sourceNode.type === 'action' || sourceNode.type === 'block') && 
           (targetNode.type === 'action' || targetNode.type === 'block');
  },

  addNode: (node) => {
    set((state) => ({
      model: {
        ...state.model,
        nodes: [...state.model.nodes, node]
      }
    }));
    get().validateModel();
  },

  updateNode: (id, updates) => {
    set((state) => ({
      model: {
        ...state.model,
        nodes: state.model.nodes.map(node => {
          if (node.id !== id) return node;
          // Only spread allowed fields per type
          if (node.type === 'phase') {
            return { ...node, ...updates } as Phase;
          }
          if (node.type === 'block') {
            return { ...node, ...updates } as Block;
          }
          if (node.type === 'action') {
            return { ...node, ...updates } as Action;
          }
          return node;
        }),
      },
    }));
    get().validateModel();
  },

  deleteNode: (id) => {
    set((state) => ({
      model: {
        nodes: state.model.nodes.filter(node => node.id !== id),
        edges: state.model.edges.filter(edge => edge.from !== id && edge.to !== id)
      }
    }));
    get().validateModel();
  },

  addEdge: (edge) => {
    set((state) => ({
      model: {
        ...state.model,
        edges: [...state.model.edges, edge]
      }
    }));
    get().validateModel();
  },

  updateEdge: (id, updates) => {
    set((state) => ({
      model: {
        ...state.model,
        edges: state.model.edges.map(edge => 
          edge.id === id ? { ...edge, ...updates } : edge
        )
      }
    }));
    get().validateModel();
  },

  deleteEdge: (id) => {
    set((state) => ({
      model: {
        ...state.model,
        edges: state.model.edges.filter(edge => edge.id !== id)
      }
    }));
    get().validateModel();
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id }),

  getNodesByType: (type) => {
    return get().model.nodes.filter(node => node.type === type);
  },

  getChildNodes: (parentId) => {
    return get().model.nodes.filter(node => 
      ('parentPhase' in node && node.parentPhase === parentId) ||
      ('parentBlock' in node && node.parentBlock === parentId)
    );
  },

  validateModel: () => {
    const { model } = get();
    const errors: ValidationError[] = [];
    // Check each phase has at least one block
    const phases = model.nodes.filter(n => n.type === 'phase');
    phases.forEach(phase => {
      const blocks = model.nodes.filter(n => n.type === 'block' && 'parentPhase' in n && n.parentPhase === phase.id);
      if (blocks.length === 0) {
        errors.push({
          type: 'missing_blocks',
          message: `Phase "${phase.label}" must have at least one block`,
          nodeId: phase.id
        });
      }
    });
    // Check each block has at least one action
    const blocks = model.nodes.filter(n => n.type === 'block');
    blocks.forEach(block => {
      const actions = model.nodes.filter(n => 
        n.type === 'action' && 'parentBlock' in n && n.parentBlock === block.id
      );
      if (actions.length === 0) {
        errors.push({
          type: 'missing_actions',
          message: `Block "${block.label}" must have at least one action`,
          nodeId: block.id
        });
      }
    });
    // Check for orphaned actions
    const orphanedActions = model.nodes.filter(n => 
      n.type === 'action' && 'parentBlock' in n && !n.parentBlock
    );
    orphanedActions.forEach(action => {
      errors.push({
        type: 'orphaned_action',
        message: `Action "${action.label}" needs to be placed in a block`,
        nodeId: action.id
      });
    });
    set({ validationErrors: errors });
    return errors;
  },

  exportJSON: () => {
    return JSON.stringify(get().model, null, 2);
  }
}));
