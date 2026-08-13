const axios = require('axios');

async function testCreateExam() {
  try {
    const payload = { username: 'testinstructor', password: 'testpassword123' };
    const loginRes = await axios.post('http://127.0.0.1:8000/api/users/login/', payload, { headers: { 'Content-Type': 'application/json' } });
    const token = loginRes.data.access;
    
    console.log("Logged in, token:", token.substring(0, 15) + "...");
    
    const examPayload = {
        title: "Test Exam",
        description: "Test Description",
        duration_minutes: 60,
        course: 14
    };
    
    console.log("Creating exam with payload:", examPayload);
    const res = await axios.post('http://127.0.0.1:8000/api/exams/', examPayload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (error) {
    console.error("Error creating exam:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}
testCreateExam();
