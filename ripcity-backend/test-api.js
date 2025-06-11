// Quick test of your Ticketmaster API key
const API_KEY = 'KrJ30dNjFgddGx1vUTMB7fa5GDKU0TnT';

async function testAPI() {
  try {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&city=Portland&size=10`);
    const data = await response.json();
    
    if (data._embedded && data._embedded.events) {
      console.log('✅ API KEY WORKS!');
      console.log(`Found ${data._embedded.events.length} Portland events:`);
      
      data._embedded.events.slice(0, 3).forEach(event => {
        console.log(`- ${event.name} (${event.dates?.start?.localDate})`);
      });
    } else {
      console.log('No events found, but API responded');
      console.log(data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAPI();
