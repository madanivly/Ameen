const API_URL = '/api/api.php';

export const fetchData = async () => {
  const response = await fetch(`${API_URL}?endpoint=fetch-data`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API returned an error');
  }
  return result.data;
};

export const updateData = async (payload: any) => {
  const response = await fetch(`${API_URL}?endpoint=update-data`, {
    method: payload.action === 'delete' ? 'DELETE' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error Response:", errorText);
    throw new Error(`Failed to update data: ${errorText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'API returned an error');
  }
  return result.data;
};

export const batchUpdate = async (data: any[]) => {
  // This is a simple implementation. For a real batch update,
  // the mock server would need to support a batch endpoint.
  for (const item of data) {
    await updateData(item);
  }
};
