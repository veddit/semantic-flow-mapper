
import React from 'react';
import { DiagramCanvas } from '../components/DiagramCanvas';
import { Toolbar } from '../components/Toolbar';
import { DebugSidebar } from '../components/DebugSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const Index = () => {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full">
        <div className="flex flex-col flex-1">
          <header className="bg-white border-b border-gray-200 p-4">
            <h1 className="text-2xl font-bold text-gray-900">Semantic Service Diagrammer</h1>
            <p className="text-gray-600">Visual-first, semantically strict service journey modeling</p>
          </header>
          
          <Toolbar />
          
          <main className="flex-1">
            <DiagramCanvas />
          </main>
        </div>
        
        <DebugSidebar />
      </div>
    </SidebarProvider>
  );
};

export default Index;
