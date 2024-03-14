export default async function CallAPI(data:object, endpoint: string) {
  const requestBody = JSON.stringify({data: data});
  try {
//    const ApiEndpoint = process.env.API_ENDPOINT
//    const response = await fetch(`https://stage.well-mill.com/api/${endpoint}`, {
    const response = await fetch(`https://shop.well-mill.com/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: requestBody,
    });

    if (!response.ok) {
      // Attempt to parse the error message from the response
      try {
          const errorDataJson = await response.json();
          console.log(errorDataJson);
          return { data: null, error: errorDataJson.error || `HTTP error. Status: ${response.status}` };
      } catch (jsonParseError) {
        try{
          // If didn't find Json error data, look for a text error message
          const errorDataText = await response.text();
          console.log(errorDataText);
          return { data: null, error: errorDataText };
        } catch (textParseError){
          // If parsing json AND text fails, return a generic error message
          console.log(response);
          return { data: null, error: `HTTP error! Status: ${response.status}` };
        }
      }
    }

    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return { data: data, error: null };
    }

    if (contentType?.includes('application/pdf')) {
      // Handle PDF (file download)
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = 'receipt.pdf'; // You can set a default name for the download
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
      return { data: null, error: null };
    }

    return { data: null, error: "Unknown returned content type" };

  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
