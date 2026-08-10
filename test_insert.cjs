// Node 18+ has built-in fetch

async function run() {
  try {
    const res = await fetch('http://localhost:5001/api/planner/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Task via Script",
        category: "Executive",
        priority: "High",
        status: "Pending",
        time: "09:00 AM",
        date: "Mon Aug 10 2026",
        targetDay: "Monday"
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}

run();
