import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { NextResponse } from 'next/server';

// Define types for our data structures
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

interface Update {
  id: number;
  model_id: number;
  model_version_id: number;
  company_id: number;
  update_date: string;
  title: string;
  description: string;
  source_url: string;
}

interface AIData {
  companies: Company[];
  categories: Category[];
  models: AIModel[];
  model_versions: ModelVersion[];
  updates: Update[];
}

interface ModelUpdate {
  type: string;
  date: string;
  model: string;
  company: string;
  details: string;
  source: string;
}

// Function to fetch latest AI model information
async function fetchLatestAIModelInfo(): Promise<ModelUpdate | null> {
  try {
    // This would be replaced with actual API calls to sources like:
    // - Company blogs
    // - Tech news sites
    // - Research papers
    // - Channels like Rundown AI and AI Secret
    
    // For demonstration, we'll simulate finding a new model update
    const currentDate = new Date().toISOString().split('T')[0];
    
    return {
      type: 'model_update',
      date: currentDate,
      model: 'GPT-4.5 (Orion)',
      company: 'OpenAI',
      details: 'New capabilities announced including improved reasoning and multimodal understanding.',
      source: 'https://openai.com/blog/updates'
    };
  } catch (error) {
    console.error('Error fetching latest AI model info:', error);
    return null;
  }
}

// Function to update the AI models data with new information
function updateAIModelsData(data: AIData, update: ModelUpdate): AIData {
  // Clone the data to avoid modifying the original
  const updatedData = JSON.parse(JSON.stringify(data)) as AIData;
  
  // Add the update to the updates array
  if (update.type === 'model_update') {
    // Find the model and company IDs
    const company = updatedData.companies.find(c => c.name === update.company);
    if (!company) return data; // Company not found
    
    const model = updatedData.models.find(m => m.name.includes(update.model.split(' ')[0]));
    if (!model) return data; // Model not found
    
    // Find the specific model version
    const modelVersion = updatedData.model_versions.find(
      mv => mv.model_id === model.id && mv.version_name === update.model
    );
    if (!modelVersion) return data; // Model version not found
    
    // Add the update
    const newUpdateId = Math.max(...updatedData.updates.map(u => u.id), 0) + 1;
    updatedData.updates.push({
      id: newUpdateId,
      model_id: model.id,
      model_version_id: modelVersion.id,
      company_id: company.id,
      update_date: update.date,
      title: `${update.company} Updates ${update.model}`,
      description: update.details,
      source_url: update.source
    });
  }
  
  return updatedData;
}

// Function to save updated data to file
function saveUpdatedData(data: AIData): boolean {
  const dataPath = path.join(process.cwd(), '../../expanded_data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  return true;
}

// Main update function
export async function GET() {
  try {
    // Read the current data
    const dataPath = path.join(process.cwd(), '../../expanded_data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(jsonData) as AIData;
    
    // Fetch latest updates
    const update = await fetchLatestAIModelInfo();
    if (!update) {
      return NextResponse.json({ message: 'No new updates found' });
    }
    
    // Update the data
    const updatedData = updateAIModelsData(data, update);
    
    // Save the updated data
    saveUpdatedData(updatedData);
    
    return NextResponse.json({ 
      message: 'AI model data updated successfully',
      update
    });
  } catch (error) {
    console.error('Error updating AI model data:', error);
    return NextResponse.json(
      { error: 'Failed to update AI model data' },
      { status: 500 }
    );
  }
}
