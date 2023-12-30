export default async function CallAPI(data:object, endpoint: string) {
  const requestBody = JSON.stringify({data: data});
  try {
    const response = await fetch(`https://cdehaan.ca/wellmill/api/${endpoint}`, {
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

    const data = await response.json();
    return { data: data, error: null };

  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
