import { create } from 'zustand';
import { DiagramModel, DiagramNode, DiagramEdge, ValidationError } from '../types/diagram';

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
  
  // Node operations
  addNode: (node: DiagramNode) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  deleteNode: (id: string) => void;
  
  // Edge operations
  addEdge: (edge: DiagramEdge) => void;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // Connection operations
  startConnection: (nodeId: string) => void;
  completeConnection: (targetNodeId: string, edgeType?: 'choice' | 'any' | 'parallel') => void;
  cancelConnection: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  canConnect: (sourceId: string, targetId: string) => boolean;
  
  // Selection
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  
  // Validation
  validateModel: () => ValidationError[];
  
  // Export
  exportJSON: () => string;
  
  // Utilities
  generateId: (type: string) => string;
  getNodesByType: (type: string) => DiagramNode[];
  getChildNodes: (parentId: string) => DiagramNode[];
}

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  model: { nodes: [], edges: [] },
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

  startConnection: (nodeId) => {
    set({
      connectionState: {
        isConnecting: true,
        sourceNodeId: nodeId,
        hoveredNodeId: null,
      }
    });
  },

  completeConnection: (targetNodeId, edgeType = 'any') => {
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

    // Same level connections (action -> action, block -> block)
    if (sourceNode.type === targetNode.type) return true;

    // Cross-block connections (action in one block -> action in another block)
    if (sourceNode.type === 'action' && targetNode.type === 'action') {
      const sourceParent = 'parentBlock' in sourceNode ? sourceNode.parentBlock : null;
      const targetParent = 'parentBlock' in targetNode ? targetNode.parentBlock : null;
      return sourceParent !== targetParent;
    }

    // Block to block connections
    if (sourceNode.type === 'block' && targetNode.type === 'block') return true;

    return false;
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
        nodes: state.model.nodes.map(node => 
          node.id === id ? { ...node, ...updates } as DiagramNode : node
        )
      }
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
        (n.type === 'action' || n.type === 'decision') && 
        'parentBlock' in n && n.parentBlock === block.id
      );
      if (actions.length === 0) {
        errors.push({
          type: 'missing_actions',
          message: `Block "${block.label}" must have at least one action`,
          nodeId: block.id
        });
      }
    });

    // Check orphaned nodes
    model.nodes.forEach(node => {
      if (node.type === 'block' && 'parentPhase' in node) {
        const parentExists = model.nodes.some(n => n.id === node.parentPhase);
        if (!parentExists) {
          errors.push({
            type: 'orphaned_node',
            message: `Block "${node.label}" has missing parent phase`,
            nodeId: node.id
          });
        }
      }
      if ((node.type === 'action' || node.type === 'decision') && 'parentBlock' in node) {
        const parentExists = model.nodes.some(n => n.id === node.parentBlock);
        if (!parentExists) {
          errors.push({
            type: 'orphaned_node',
            message: `${node.type} "${node.label}" has missing parent block`,
            nodeId: node.id
          });
        }
      }
    });

    set({ validationErrors: errors });
    return errors;
  },

  exportJSON: () => {
    return JSON.stringify(get().model, null, 2);
  }
}));
