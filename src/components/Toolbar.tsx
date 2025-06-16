
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDiagramStore } from '../store/diagramStore';
import { DiagramNode, Phase, Block, Action } from '../types/diagram';

export const Toolbar: React.FC = () => {
  const { 
    addNode, 
    generateId, 
    model, 
    exportJSON, 
    connectionState
  } = useDiagramStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [nodeType, setNodeType] = useState<'phase' | 'block' | 'action'>('phase');
  const [label, setLabel] = useState('');
  const [parentId, setParentId] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  const phases = model.nodes.filter(n => n.type === 'phase') as Phase[];
  const blocks = model.nodes.filter(n => n.type === 'block') as Block[];

  const handleAddNode = () => {
    if (!label.trim()) return;

    let newNode: DiagramNode;
    const id = generateId(nodeType);

    switch (nodeType) {
      case 'phase':
        newNode = {
          id,
          label: label.trim(),
          type: 'phase',
        };
        break;
      case 'block':
        if (!parentId) return;
        newNode = {
          id,
          label: label.trim(),
          type: 'block',
          parentPhase: parentId,
          childActions: [],
          expanded: false,
        };
        break;
      case 'action':
        newNode = {
          id,
          label: label.trim(),
          type: 'action',
          parentBlock: parentId || null,
          performedBy: performedBy.split(',').map(s => s.trim()).filter(Boolean),
        };
        break;
    }

    addNode(newNode);
    setLabel('');
    setParentId('');
    setPerformedBy('');
    setIsAddDialogOpen(false);
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getParentOptions = () => {
    if (nodeType === 'block') {
      return phases.map(phase => ({ value: phase.id, label: phase.label }));
    }
    if (nodeType === 'action') {
      return [
        { value: 'no-parent', label: 'No parent (orphaned)' },
        ...blocks.map(block => ({ value: block.id, label: block.label }))
      ];
    }
    return [];
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-b border-gray-200">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>Add Node</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nodeType">Node Type</Label>
              <Select value={nodeType} onValueChange={(value: any) => setNodeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase">Phase</SelectItem>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter node label"
              />
            </div>

            {(nodeType === 'block' || nodeType === 'action') && (
              <div>
                <Label htmlFor="parent">Parent {nodeType === 'block' ? 'Phase' : 'Block'}</Label>
                <Select value={parentId} onValueChange={(value) => setParentId(value === 'no-parent' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select parent ${nodeType === 'block' ? 'phase' : 'block (optional)'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {nodeType === 'action' && (
              <div>
                <Label htmlFor="performedBy">Performed By (comma-separated)</Label>
                <Input
                  id="performedBy"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="user, system, admin"
                />
              </div>
            )}

            <Button onClick={handleAddNode} disabled={!label.trim() || (nodeType === 'block' && !parentId)}>
              Add {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={handleExport} variant="outline">
        Export JSON
      </Button>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Nodes: {model.nodes.length}</span>
        <span>•</span>
        <span>Edges: {model.edges.length}</span>
        {connectionState.isConnecting && (
          <>
            <span>•</span>
            <span className="text-blue-600 font-medium">Connecting...</span>
          </>
        )}
      </div>
    </div>
  );
};
