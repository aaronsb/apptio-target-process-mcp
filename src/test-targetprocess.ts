import { Targetprocess } from "targetprocess-rest-api";
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface TPUserStory {
  Id: number;
  Name: string;
  Description?: string;
}

interface TPResponse {
  Items: TPUserStory[];
  Next?: string;
  Prev?: string;
}

interface TPConfig {
  domain: string;
  credentials: {
    username: string;
    password: string;
  };
}

function loadConfig(): TPConfig {
  // Try environment variables first
  if (process.env.TP_DOMAIN && process.env.TP_USERNAME && process.env.TP_PASSWORD) {
    return {
      domain: process.env.TP_DOMAIN,
      credentials: {
        username: process.env.TP_USERNAME,
        password: process.env.TP_PASSWORD
      }
    };
  }

  // Fall back to config file
  const configPath = path.join(process.cwd(), 'config', 'targetprocess.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('No configuration found. Please set environment variables (TP_DOMAIN, TP_USERNAME, TP_PASSWORD) or create config/targetprocess.json');
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

async function testTargetProcess() {
  try {
    // Load configuration
    console.log('Loading configuration...');
    const config = loadConfig();
    const { domain, credentials: { username, password } } = config;

    // Initialize the API
    console.log('Initializing TargetProcess API...');
    const api = new Targetprocess(domain, username, password);

    // First, let's try to get some data using the raw API to find valid IDs
    console.log('\nFetching data using raw API...');
    try {
      const response = await fetch(`https://${domain}/api/v1/UserStories?format=json`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as TPResponse;
      const simplifiedStories = data.Items.map(story => ({
        id: story.Id,
        name: story.Name
      }));
      console.log('Available User Stories:', JSON.stringify({
        count: data.Items.length,
        stories: simplifiedStories.slice(0, 5) // Show only first 5 stories
      }, null, 2));
      
      if (data.Items && data.Items.length > 0) {
        const storyId = data.Items[0].Id;
        console.log(`\nTesting with found Story ID: ${storyId}`);
        
        // Test getting a user story
        console.log('\nTesting User Story retrieval...');
        try {
          const userStory = await api.getStory(storyId);
          const simplifiedUserStory = {
            id: userStory.Id,
            name: userStory.Name,
            state: userStory.EntityState?.Name,
            project: userStory.Project?.Name
          };
          console.log('User Story:', JSON.stringify(simplifiedUserStory, null, 2));
        } catch (error: unknown) {
          console.log('User Story error:', error instanceof Error ? error.message : String(error));
        }

        // Test adding time
        console.log('\nTesting Time Entry...');
        try {
          const timeEntry = await api.addTime(
            storyId,
            1.5, // spent
            2.0, // remain
            new Date(), // date
            "Testing NewOrbit TP API implementation" // description
          );
          const simplifiedTimeEntry = {
            spent: timeEntry.Spent,
            remain: timeEntry.Remain,
            date: timeEntry.Date,
            description: timeEntry.Description
          };
          console.log('Time Entry:', JSON.stringify(simplifiedTimeEntry, null, 2));
        } catch (error: unknown) {
          console.log('Time Entry error:', error instanceof Error ? error.message : String(error));
        }
      } else {
        console.log('No User Stories found in the system');
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error instanceof Error ? error.message : String(error));
    }

  } catch (error: unknown) {
    console.error('General error:', error instanceof Error ? error.message : String(error));
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.error('Status Code:', error.statusCode);
    }
  }
}

// Run tests
testTargetProcess().catch(console.error);
