const axios = require('axios');

async function testLogin() {
  try {
    const payload = { username: 'teststudent', password: 'testpassword123' };
    console.log("Sending payload:", payload);
    const response = await axios.post('http://127.0.0.1:8000/api/users/login/', payload, {
        headers: { 'Content-Type': 'application/json' }
    });
    console.log("Response 200 OK. Tokens:");
    console.log(response.data);
    
    // Now test /users/me/
    const token = response.data.access;
    console.log("\nFetching /users/me/ with token...");
    const meResponse = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile data:");
    console.log(meResponse.data);
    
    console.log("\nFetching /exams/ with token...");
    const examsResponse = await axios.get('http://127.0.0.1:8000/api/exams/', {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Exams data (status " + examsResponse.status + "):");
    console.log(examsResponse.data);
    
  } catch (error) {
    console.error("Error occurred!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testLogin();
