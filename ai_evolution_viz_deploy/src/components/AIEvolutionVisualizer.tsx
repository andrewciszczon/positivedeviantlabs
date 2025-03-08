'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import UpdateScheduler from './UpdateScheduler';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

// Dynamically import ForceGraph2D with no SSR
const ForceGraph2D = dynamic(
  () => import('react-force-graph').then(mod => mod.ForceGraph2D),
  { ssr: false }
);

interface AIModel {
  id: number;
  name: string;
  company_id: number;
  category_id: number;
  description: string;
  is_specialized: boolean;
  initial_release_date: string;
}

interface ModelVersion {
  id: number;
  model_id: number;
  version_name: string;
  release_date?: string;
  is_upcoming: boolean;
  expected_release_date?: string;
  description: string;
  parameters?: number;
}

interface Company {
  id: number;
  name: string;
  website: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface AIData {
  companies: Company[];
  categories: Category[];
  models: AIModel[];
  model_versions: ModelVersion[];
}

interface TimelineItem {
  id: number;
  content: string;
  start: Date;
  group: number;
  className: string;
  title: string;
}

interface GraphNode {
  id: string;
  name: string;
  group: number;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const AIEvolutionVisualizer: React.FC = () => {
  const [data, setData] = useState<AIData | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineGroups, setTimelineGroups] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'timeline' | 'graph'>('timeline');
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [timelineInstance, setTimelineInstance] = useState<any | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    company: 'all',
    category: 'all',
    dateRange: 'all',
    searchTerm: ''
  });
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms between frames
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Failed to fetch AI model data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Error loading AI model data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      prepareTimelineData();
      prepareGraphData();
    }
  }, [data, filterOptions]);

  useEffect(() => {
    if (timelineItems.length > 0 && timelineGroups.length > 0) {
      initializeTimeline();
    }
  }, [timelineItems, timelineGroups]);

  const prepareTimelineData = () => {
    if (!data) return;

    // Create groups based on companies
    let groups = data.companies.map(company => ({
      id: company.id,
      content: company.name
    }));

    // Filter groups if company filter is applied
    if (filterOptions.company !== 'all') {
      groups = groups.filter(group => group.id === parseInt(filterOptions.company));
    }
    
    setTimelineGroups(groups);

    // Create timeline items from model versions
    let items = data.model_versions.map(version => {
      const model = data.models.find(m => m.id === version.model_id);
      const company = model ? data.companies.find(c => c.id === model.company_id) : null;
      const category = model ? data.categories.find(c => c.id === model.category_id) : null;
      
      const date = version.release_date 
        ? new Date(version.release_date) 
        : (version.expected_release_date ? new Date(version.expected_release_date) : new Date());
      
      const isUpcoming = version.is_upcoming;
      
      return {
        id: version.id,
        content: version.version_name,
        start: date,
        group: model?.company_id || 0,
        className: isUpcoming ? 'upcoming-model' : 'released-model',
        title: `
          <div class="tooltip-content">
            <h3>${version.version_name}</h3>
            <p><strong>Company:</strong> ${company?.name || 'Unknown'}</p>
            <p><strong>Category:</strong> ${category?.name || 'Unknown'}</p>
            <p><strong>Release Date:</strong> ${version.release_date || version.expected_release_date || 'Unknown'}</p>
            <p><strong>Description:</strong> ${version.description}</p>
            ${version.parameters ? `<p><strong>Parameters:</strong> ${version.parameters.toLocaleString()}</p>` : ''}
            ${isUpcoming ? '<p><strong>Status:</strong> Upcoming</p>' : ''}
          </div>
        `,
        model,
        company,
        category,
        version
      };
    });
    
    // Apply filters
    if (filterOptions.company !== 'all') {
      const companyId = parseInt(filterOptions.company);
      items = items.filter(item => item.group === companyId);
    }
    
    if (filterOptions.category !== 'all') {
      const categoryId = parseInt(filterOptions.category);
      items = items.filter(item => item.model?.category_id === categoryId);
    }
    
    if (filterOptions.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filterOptions.dateRange) {
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case '2y':
          startDate.setFullYear(now.getFullYear() - 2);
          break;
        case '5y':
          startDate.setFullYear(now.getFullYear() - 5);
          break;
        case 'future':
          items = items.filter(item => item.version?.is_upcoming);
          break;
      }
      
      if (filterOptions.dateRange !== 'future') {
        items = items.filter(item => item.start >= startDate);
      }
    }
    
    if (filterOptions.searchTerm) {
      const term = filterOptions.searchTerm.toLowerCase();
      items = items.filter(item => 
        item.content.toLowerCase().includes(term) || 
        item.model?.name.toLowerCase().includes(term) ||
        item.company?.name.toLowerCase().includes(term) ||
        item.category?.name.toLowerCase().includes(term) ||
        item.version?.description.toLowerCase().includes(term)
      );
    }
    
    setTimelineItems(items);
  };

  const prepareGraphData = () => {
    if (!data) return;

    // Create nodes for categories, companies, and models
    let categoryNodes = data.categories.map(category => ({
      id: `category-${category.id}`,
      name: category.name,
      group: 1, // Category group
      val: 15, // Size
      category
    }));

    let companyNodes = data.companies.map(company => ({
      id: `company-${company.id}`,
      name: company.name,
      group: 2, // Company group
      val: 10, // Size
      company
    }));

    let modelNodes = data.models.map(model => ({
      id: `model-${model.id}`,
      name: model.name,
      group: 3, // Model group
      val: 5, // Size
      model
    }));

    // Apply filters
    if (filterOptions.company !== 'all') {
      const companyId = parseInt(filterOptions.company);
      companyNodes = companyNodes.filter(node => node.company?.id === companyId);
      
      // Only keep models from this company
      const companyModelIds = data.models
        .filter(model => model.company_id === companyId)
        .map(model => model.id);
      
      modelNodes = modelNodes.filter(node => {
        const modelId = parseInt(node.id.split('-')[1]);
        return companyModelIds.includes(modelId);
      });
    }
    
    if (filterOptions.category !== 'all') {
      const categoryId = parseInt(filterOptions.category);
      categoryNodes = categoryNodes.filter(node => node.category?.id === categoryId);
      
      // Only keep models in this category
      const categoryModelIds = data.models
        .filter(model => model.category_id === categoryId)
        .map(model => model.id);
      
      modelNodes = modelNodes.filter(node => {
        const modelId = parseInt(node.id.split('-')[1]);
        return categoryModelIds.includes(modelId);
      });
    }
    
    if (filterOptions.searchTerm) {
      const term = filterOptions.searchTerm.toLowerCase();
      
      categoryNodes = categoryNodes.filter(node => 
        node.name.toLowerCase().includes(term) ||
        node.category?.description.toLowerCase().includes(term)
      );
      
      companyNodes = companyNodes.filter(node => 
        node.name.toLowerCase().includes(term) ||
        node.company?.description.toLowerCase().includes(term)
      );
      
      modelNodes = modelNodes.filter(node => 
        node.name.toLowerCase().includes(term) ||
        node.model?.description.toLowerCase().includes(term)
      );
    }

    // Create links between nodes
    const companyModelLinks: GraphLink[] = [];
    
    // Link models to companies
    modelNodes.forEach(modelNode => {
      const modelId = parseInt(modelNode.id.split('-')[1]);
      const model = data.models.find(m => m.id === modelId);
      
      if (model) {
        const companyNodeId = `company-${model.company_id}`;
        if (companyNodes.some(node => node.id === companyNodeId)) {
          companyModelLinks.push({
            source: companyNodeId,
            target: modelNode.id,
            value: 1
          });
        }
      }
    });

    // Link models to categories
    const modelCategoryLinks: GraphLink[] = [];
    
    modelNodes.forEach(modelNode => {
      const modelId = parseInt(modelNode.id.split('-')[1]);
      const model = data.models.find(m => m.id === modelId);
      
      if (model) {
        const categoryNodeId = `category-${model.category_id}`;
        if (categoryNodes.some(node => node.id === categoryNodeId)) {
          modelCategoryLinks.push({
            source: modelNode.id,
            target: categoryNodeId,
            value: 1
          });
        }
      }
    });

    // Combine all nodes and links
    const nodes = [...categoryNodes, ...companyNodes, ...modelNodes];
    const links = [...companyModelLinks, ...modelCategoryLinks];

    setGraphData({ nodes, links });
  };

  const initializeTimeline = () => {
    // Create timeline
    const container = document.getElementById('timeline-container');
    if (container && timelineItems.length > 0) {
      // Destroy previous instance if it exists
      if (timelineInstance) {
        timelineInstance.destroy();
      }

      // Create new timeline
      const options = {
        height: '500px',
        min: new Date(2018, 0, 1),
        max: new Date(2026, 0, 1),
        zoomable: true,
        horizontalScroll: true,
        zoomKey: 'ctrlKey',
        orientation: 'top',
        groupOrder: 'content',
        tooltip: {
          followMouse: true,
          overflowMethod: 'cap'
        }
      };

      const timeline = new Timeline(container, timelineItems, timelineGroups, options);
      setTimelineInstance(timeline);

      // Add click event
      timeline.on('click', (properties: any) => {
        if (properties.item) {
          const itemId = properties.item;
          const version = data?.model_versions.find(v => v.id === parseInt(itemId));
          if (version) {
            const model = data?.models.find(m => m.id === version.model_id);
            const company = model ? data?.companies.find(c => c.id === model.company_id) : null;
            const category = model ? data?.categories.find(c => c.id === model.category_id) : null;
            
            setSelectedModel({
              version,
              model,
              company,
              category
            });
          }
        }
      });
    }
  };

  const handleNodeClick = (node: any) => {
    const nodeType = node.id.split('-')[0];
    const nodeId = parseInt(node.id.split('-')[1]);

    if (nodeType === 'model') {
      const model = data?.models.find(m => m.id === nodeId);
      const latestVersion = data?.model_versions
        .filter(v => v.model_id === nodeId)
        .sort((a, b) => {
          const dateA = a.release_date || a.expected_release_date || '';
          const dateB = b.release_date || b.expected_release_date || '';
          return dateB.localeCompare(dateA);
        })[0];
      
      if (model && latestVersion) {
        const company = data?.companies.find(c => c.id === model.company_id);
        const category = data?.categories.find(c => c.id === model.category_id);
        
        setSelectedModel({
          version: latestVersion,
          model,
          company,
          category
        });
      }
    } else if (nodeType === 'company') {
      const company = data?.companies.find(c => c.id === nodeId);
      if (company) {
        setSelectedModel({
          company,
          isCompany: true
        });
      }
    } else if (nodeType === 'category') {
      const category = data?.categories.find(c => c.id === nodeId);
      if (category) {
        setSelectedModel({
          category,
          isCategory: true
        });
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataUpdate = () => {
    // Reload data after update
    setLoading(true);
    fetch('/api/models')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch updated AI model data');
        }
        return response.json();
      })
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError('Error loading updated AI model data. Please try again later.');
        console.error(err);
        setLoading(false);
      });
  };

  const startAnimation = () => {
    if (!data || !timelineInstance) return;
    
    setIsAnimating(true);
    
    // Sort model versions by date
    const sortedVersions = [...data.model_versions]
      .filter(v => v.release_date) // Only include versions with release dates
      .sort((a, b) => {
        const dateA = new Date(a.release_date || '');
        const dateB = new Date(b.release_date || '');
        return dateA.getTime() - dateB.getTime();
      });
    
    // Set timeline to start at the first model
    if (sortedVersions.length > 0) {
      const firstDate = new Date(sortedVersions[0].release_date || '');
      timelineInstance.moveTo(firstDate);
    }
    
    // Animate through each model version
    let currentIndex = 0;
    
    const animationInterval = setInterval(() => {
      if (currentIndex >= sortedVersions.length) {
        clearInterval(animationInterval);
        setIsAnimating(false);
        return;
      }
      
      const version = sortedVersions[currentIndex];
      const model = data.models.find(m => m.id === version.model_id);
      const company = model ? data.companies.find(c => c.id === model.company_id) : null;
      const category = model ? data.categories.find(c => c.id === model.category_id) : null;
      
      // Move timeline to this date
      const date = new Date(version.release_date || '');
      timelineInstance.moveTo(date);
      
      // Show model details
      setSelectedModel({
        version,
        model,
        company,
        category
      });
      
      currentIndex++;
    }, animationSpeed);
    
    // Store interval ID for cleanup
    return () => clearInterval(animationInterval);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading AI evolution data...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Evolution Visualization</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <div className="bg-white shadow-lg rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  name="company"
                  value={filterOptions.company}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Companies</option>
                  {data?.companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={filterOptions.category}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Categories</option>
                  {data?.categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  name="dateRange"
                  value={filterOptions.dateRange}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="1y">Last Year</option>
                  <option value="2y">Last 2 Years</option>
                  <option value="5y">Last 5 Years</option>
                  <option value="future">Upcoming Models</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filterOptions.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Search models, companies..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6 flex flex-wrap justify-between items-center">
            <div className="flex space-x-4 mb-2 sm:mb-0">
              <button 
                className={`px-4 py-2 rounded-md ${activeView === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveView('timeline')}
              >
                Timeline View
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${activeView === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveView('graph')}
              >
                Network Graph View
              </button>
            </div>
            
            {activeView === 'timeline' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={isAnimating ? stopAnimation : startAnimation}
                  className={`px-4 py-2 rounded-md ${isAnimating ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                >
                  {isAnimating ? 'Stop Animation' : 'Play Animation'}
                </button>
                
                <select
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
                  className="p-2 border border-gray-300 rounded-md"
                  disabled={isAnimating}
                >
                  <option value="500">Fast (0.5s)</option>
                  <option value="1000">Medium (1s)</option>
                  <option value="2000">Slow (2s)</option>
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <UpdateScheduler onUpdate={handleDataUpdate} />
        </div>
      </div>

      {selectedModel && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold mb-4">
              {selectedModel.isCompany 
                ? selectedModel.company?.name 
                : selectedModel.isCategory 
                  ? selectedModel.category?.name 
                  : `${selectedModel.model?.name} - ${selectedModel.version?.version_name}`}
            </h2>
            <button 
              onClick={() => setSelectedModel(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {selectedModel.isCompany ? (
            <div>
              <p className="mb-2"><strong>Website:</strong> <a href={selectedModel.company?.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedModel.company?.website}</a></p>
              <p className="mb-2"><strong>Description:</strong> {selectedModel.company?.description}</p>
              <h3 className="text-xl font-semibold mt-4 mb-2">Models by this company:</h3>
              <ul className="list-disc pl-5">
                {data?.models
                  .filter(m => m.company_id === selectedModel.company?.id)
                  .map(model => (
                    <li key={model.id} className="mb-1">{model.name}</li>
                  ))
                }
              </ul>
            </div>
          ) : selectedModel.isCategory ? (
            <div>
              <p className="mb-2"><strong>Description:</strong> {selectedModel.category?.description}</p>
              <h3 className="text-xl font-semibold mt-4 mb-2">Models in this category:</h3>
              <ul className="list-disc pl-5">
                {data?.models
                  .filter(m => m.category_id === selectedModel.category?.id)
                  .map(model => (
                    <li key={model.id} className="mb-1">{model.name}</li>
                  ))
                }
              </ul>
            </div>
          ) : (
            <div>
              <p className="mb-2"><strong>Company:</strong> {selectedModel.company?.name}</p>
              <p className="mb-2"><strong>Category:</strong> {selectedModel.category?.name}</p>
              <p className="mb-2"><strong>Release Date:</strong> {selectedModel.version?.release_date || selectedModel.version?.expected_release_date || 'Unknown'}</p>
              {selectedModel.version?.is_upcoming && <p className="mb-2 text-orange-500 font-semibold">Upcoming Release</p>}
              <p className="mb-2"><strong>Description:</strong> {selectedModel.version?.description}</p>
              {selectedModel.version?.parameters && (
                <p className="mb-2"><strong>Parameters:</strong> {selectedModel.version.parameters.toLocaleString()}</p>
              )}
              <p className="mb-2"><strong>Model Description:</strong> {selectedModel.model?.description}</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'timeline' ? (
        <div id="timeline-container" className="w-full h-[500px] border border-gray-300 rounded-lg"></div>
      ) : (
        <div className="w-full h-[600px] border border-gray-300 rounded-lg">
          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              graphData={graphData}
              nodeLabel="name"
              nodeColor={node => {
                const group = node.group;
                if (group === 1) return '#ff6b6b'; // Categories
                if (group === 2) return '#4ecdc4'; // Companies
                return '#ffd166'; // Models
              }}
              onNodeClick={handleNodeClick}
              linkWidth={1}
              linkColor={() => '#999'}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000';
                ctx.fillText(label, node.x, node.y);

                node.__bckgDimensions = bckgDimensions;
              }}
            />
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Legend</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 mr-2"></div>
            <span>Released Models</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 mr-2"></div>
            <span>Upcoming Models</span>
          </div>
          {activeView === 'graph' && (
            <>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#ff6b6b] mr-2"></div>
                <span>Categories</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#4ecdc4] mr-2"></div>
                <span>Companies</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-[#ffd166] mr-2"></div>
                <span>Models</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Instructions</h2>
        <ul className="list-disc pl-5">
          <li>Click on any model in the timeline or graph to see detailed information</li>
          <li>Use mouse wheel to zoom in/out on the timeline</li>
          <li>Hold Ctrl key while scrolling to zoom horizontally on the timeline</li>
          <li>Drag the timeline to pan left or right</li>
          <li>In graph view, drag nodes to rearrange the network</li>
          <li>Zoom in/out in graph view using mouse wheel</li>
          <li>Use filters to narrow down the visualization by company, category, date range, or search term</li>
          <li>Play the animation to see how AI models have evolved over time</li>
        </ul>
      </div>
    </div>
  );
};

export default AIEvolutionVisualizer;
