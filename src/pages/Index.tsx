
import React from 'react';
import { DiagramCanvas } from '../components/DiagramCanvas';
import { Toolbar } from '../components/Toolbar';

const Index = () => {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Semantic Service Diagrammer</h1>
        <p className="text-gray-600">Visual-first, semantically strict service journey modeling</p>
      </header>
      
      <Toolbar />
      
      <main className="flex-1">
        <DiagramCanvas />
      </main>
    </div>
  );
};

export default Index;
