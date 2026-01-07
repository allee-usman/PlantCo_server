import axios from 'axios'

async function checkFlaskAPI(url) {
  try {
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    return response.data.status === 'healthy';
  } catch {
    return false;
  }
}

export { checkFlaskAPI };
