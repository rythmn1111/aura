// components/Canvas/AdvancedFlowCanvas.tsx
import React, { useCallback, useRef, useState, memo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
  Panel,
  NodeProps,
  NodeToolbar,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings, Home, ZoomIn, ZoomOut, PlusCircle, FilePlus, X } from 'lucide-react';

// Custom node types definition
const DEFAULT_NODE_STYLES = {
  background: 'white',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '10px 15px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
};

// Custom Basic Node
const BasicNode = memo(({ data, id, selected }: NodeProps) => {
  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-md shadow-md">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => data.onDelete(id)}
            className="text-red-500 h-8 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => data.onSettings(id)}
            className="text-gray-500 h-8 px-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </NodeToolbar>
      <div className="py-2 px-1">
        <div className="font-medium">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500 mt-1">{data.description}</div>
        )}
      </div>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-blue-500" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-500" 
      />
    </>
  );
});

BasicNode.displayName = 'BasicNode';

// Custom Process Node
const ProcessNode = memo(({ data, id, selected }: NodeProps) => {
  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex items-center space-x-2 bg-white p-1 rounded-md shadow-md">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => data.onDelete(id)}
            className="text-red-500 h-8 px-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => data.onSettings(id)}
            className="text-gray-500 h-8 px-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </NodeToolbar>
      <div className="py-3 px-2">
        <div className="font-medium">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500 mt-1">{data.description}</div>
        )}
        {data.status && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Status: </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                data.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : data.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
          </div>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
      />
    </>
  );
});

ProcessNode.displayName = 'ProcessNode';

// Node type registry
const nodeTypes: NodeTypes = {
  basic: BasicNode,
  process: ProcessNode,
};

// Function to create initial nodes with callbacks
const createInitialNodes = (onDeleteCallback: (id: string) => void, onSettingsCallback: (id: string) => void): Node<{ label: string; description: string; onDelete: (id: string) => void; onSettings: (id: string) => void; status?: string | undefined; }>[] => [
  {
    id: '1',
    type: 'basic',
    data: { 
      label: 'Start Node', 
      description: 'This is where the process begins',
      onDelete: onDeleteCallback,
      onSettings: onSettingsCallback
    },
    position: { x: 250, y: 5 },
    style: {
      ...DEFAULT_NODE_STYLES,
      borderColor: '#10b981', // Green border for start
    }
  },
  {
    id: '2',
    type: 'process',
    data: { 
      label: 'Process Node', 
      description: 'Processing step with custom logic',
      status: 'active',
      onDelete: onDeleteCallback,
      onSettings: onSettingsCallback
    },
    position: { x: 250, y: 150 },
    style: DEFAULT_NODE_STYLES
  },
  {
    id: '3',
    type: 'basic',
    data: { 
      label: 'End Node', 
      description: 'Process completion',
      onDelete: onDeleteCallback,
      onSettings: onSettingsCallback
    },
    position: { x: 250, y: 300 },
    style: {
      ...DEFAULT_NODE_STYLES,
      borderColor: '#f43f5e', // Red border for end
    }
  },
];

// Initial edge connections
const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true, 
    style: { strokeWidth: 2 },
    type: 'smoothstep' 
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true, 
    style: { strokeWidth: 2 },
    type: 'smoothstep' 
  },
];

export default function AdvancedFlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // For node settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeStatus, setNodeStatus] = useState('');
  
  // Handle node deletion - define this before nodes state
  const onDeleteNode = useCallback((nodeId: string) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setEdges((edges) => edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, []);
  
  // Handle node settings - define this before nodes state
  const onNodeSettings = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((node) => node.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setNodeName(node.data.label);
        setNodeDescription(node.data.description || '');
        setNodeStatus(node.data.status || '');
        setIsSettingsOpen(true);
      }
      return currentNodes; // Return unchanged nodes
    });
  }, []);
  
  // Initialize nodes with callbacks already attached
  const [nodes, setNodes, onNodesChange] = useNodesState(
    createInitialNodes(onDeleteNode, onNodeSettings)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Handle connect nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(
      { ...params, type: 'smoothstep', animated: true, style: { strokeWidth: 2 } }, 
      eds
    )),
    [setEdges],
  );
  
  // Save node settings
  const saveNodeSettings = useCallback(() => {
    if (selectedNode) {
      setNodes((nodes) => 
        nodes.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: nodeName,
                description: nodeDescription,
                status: nodeStatus || node.data.status,
              },
            };
          }
          return node;
        })
      );
      setIsSettingsOpen(false);
      setSelectedNode(null);
    }
  }, [selectedNode, nodeName, nodeDescription, nodeStatus, setNodes]);
  
  // Close settings modal
  const closeSettings = () => {
    setIsSettingsOpen(false);
    setSelectedNode(null);
  };
  
  // Add node of specific type
  const addNode = useCallback((type: 'basic' | 'process'): void => {
    const newNodeId = `node_${Date.now()}`;
    const centerX = reactFlowInstance ? reactFlowInstance.getViewport().x + window.innerWidth / 2 : 100;
    const centerY = reactFlowInstance ? reactFlowInstance.getViewport().y + window.innerHeight / 2 : 100;
    
    const newNode: Node = {
      id: newNodeId,
      type,
      position: {
        x: centerX,
        y: centerY,
      },
      data: { 
        label: type === 'basic' ? 'Basic Node' : 'Process Node',
        description: 'New node description',
        onDelete: onDeleteNode,
        onSettings: onNodeSettings,
        status: type === 'process' ? 'pending' : undefined as string | undefined,
      },
      style: DEFAULT_NODE_STYLES,
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, onDeleteNode, onNodeSettings, setNodes]);
  
  // Reset view to center and default zoom
  const resetView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
    }
  }, [reactFlowInstance]);
  
  return (
    <>
      <div className="w-screen h-screen bg-white">
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.1}
            maxZoom={4}
            attributionPosition="bottom-left"
            fitView
          >
            {/* Background grid */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            
            {/* Built-in controls */}
            <Controls 
              showInteractive={false}
              className="bg-white shadow-md rounded-md border border-gray-200"
            />
            
            {/* Top toolbar panel */}
            <Panel position="top-center" className="bg-white p-2 rounded-md shadow-md flex items-center space-x-2 z-10 m-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('basic')}
                title="Add Basic Node"
              >
                <PlusCircle className="h-4 w-4 mr-1" /> Basic Node
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('process')}
                title="Add Process Node"
              >
                <FilePlus className="h-4 w-4 mr-1" /> Process Node
              </Button>
              
              <div className="h-8 border-l border-gray-300 mx-2" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.zoomOut();
                  }
                }}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.zoomIn();
                  }
                }}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <div className="h-8 border-l border-gray-300 mx-2" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                title="Reset View"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Panel>
            
            {/* Mini map */}
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="bg-white border border-gray-200 rounded-md shadow-md"
            />
          </ReactFlow>
        </div>
        
        {/* Node settings modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Node Settings</h3>
                <Button variant="ghost" size="sm" onClick={closeSettings}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="node-name">
                    Name
                  </label>
                  <Input
                    id="node-name"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Node name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="node-description">
                    Description
                  </label>
                  <Input
                    id="node-description"
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    placeholder="Node description"
                  />
                </div>
                
                {selectedNode?.type === 'process' && (
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="node-status">
                      Status
                    </label>
                    <Select 
                      value={nodeStatus} 
                      onValueChange={setNodeStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6 space-x-2">
                <Button variant="outline" onClick={closeSettings}>
                  Cancel
                </Button>
                <Button onClick={saveNodeSettings}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-md shadow-md text-sm text-gray-600">
          {/* <div>Drag nodes to reposition</div>
          <div>Connect nodes by dragging from handle to handle</div>
          <div>Select a node to see its toolbar</div>
          <div>Use the mouse wheel to zoom in/out</div> */}
        </div>
      </div>
    </>
  );
}