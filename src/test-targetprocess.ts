import { Targetprocess } from "targetprocess-rest-api";
import fetch from 'node-fetch';

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

const domain = 'cprimedgonzalesdemo';
const username = 'System';
const password = '***REMOVED***';

async function testTargetProcess() {
  try {
    // Initialize the API
    console.log('Initializing TargetProcess API...');
    const api = new Targetprocess(domain, username, password);

    // First, let's try to get some data using the raw API to find valid IDs
    console.log('\nFetching data using raw API...');
    try {
      const response = await fetch(`https://${domain}.tpondemand.com/api/v1/UserStories?format=json`, {
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
        } catch (error: any) {
          console.log('User Story error:', error.message);
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
        } catch (error: any) {
          console.log('Time Entry error:', error.message);
        }
      } else {
        console.log('No User Stories found in the system');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
    }

  } catch (error: any) {
    console.error('General error:', error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
  }
}

// Run tests
testTargetProcess().catch(console.error);
