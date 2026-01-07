import axios from 'axios';
import FormData from 'form-data';

async function getPredictionFromFlask(FLASK_API_URL, imageBuffer, originalName) {
  const formData = new FormData();

  formData.append('image', imageBuffer, {
    filename: originalName,
    contentType: 'image/jpeg'
  });

  const response = await axios.post(`${FLASK_API_URL}/predict`, formData, {
    headers: formData.getHeaders(),
    timeout: 30000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  return response.data;
}

async function getPlants(FLASK_API_URL) {
  const response = await axios.get(`${FLASK_API_URL}/plants`);
  return response.data;
}

async function getPlantByName(FLASK_API_URL, name) {
  const response = await axios.get(`${FLASK_API_URL}/plant/${name}`);
  return response.data;
}

export {
  getPredictionFromFlask,
  getPlants,
  getPlantByName
};
