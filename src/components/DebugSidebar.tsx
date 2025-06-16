
import React, { useState } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarTrigger 
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDiagramStore } from '../store/diagramStore';
import { useTraceLogger } from '../hooks/useTraceLogger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export const DebugSidebar: React.FC = () => {
  const { model, updateModelFromJSON } = useDiagramStore();
  const { logs, clearLogs } = useTraceLogger();
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('trace');

  const handleApplyJSON = () => {
    try {
      const parsedModel = JSON.parse(jsonInput);
      updateModelFromJSON(parsedModel);
      console.log('✅ Model updated from JSON');
    } catch (error) {
      console.error('❌ Invalid JSON:', error);
    }
  };

  const formatModelJSON = () => {
    return JSON.stringify(model, null, 2);
  };

  React.useEffect(() => {
    if (activeTab === 'model') {
      setJsonInput(formatModelJSON());
    }
  }, [model, activeTab]);

  return (
    <Sidebar side="right" className="w-96">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Debug Panel</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 m-2">
            <TabsTrigger value="trace">Trace</TabsTrigger>
            <TabsTrigger value="model">Data Model</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trace" className="flex flex-col h-full p-2 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Console Logs</h3>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-2 space-y-1">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No logs yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-xs">
                      <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'} className="mr-2">
                        {log.timestamp}
                      </Badge>
                      <span className={log.level === 'error' ? 'text-red-600' : 'text-gray-700'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="model" className="flex flex-col h-full p-2 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Live Data Model</h3>
              <Button onClick={handleApplyJSON} size="sm">
                Apply Changes
              </Button>
            </div>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="flex-1 font-mono text-xs"
              placeholder="Edit the diagram model JSON..."
            />
            <div className="text-xs text-muted-foreground">
              Nodes: {model.nodes.length} | Edges: {model.edges.length}
            </div>
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
};
