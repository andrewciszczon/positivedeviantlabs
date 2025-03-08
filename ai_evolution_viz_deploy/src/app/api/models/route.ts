import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the expanded data JSON file
    const dataPath = path.join(process.cwd(), '../../expanded_data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading AI model data:', error);
    return NextResponse.json(
      { error: 'Failed to load AI model data' },
      { status: 500 }
    );
  }
}
