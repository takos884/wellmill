import { useState } from 'react';

const localEndpoint = 'https://cdehaan.ca/wellmill/api/storeBackupData';

export const useBackupDB = <T extends unknown>() => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);


  const postBackupData = async (body: string) => {
    const requestContent = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    };

    //console.log("requestContent:");
    //console.log(requestContent);

    try {
      const response = await fetch(localEndpoint, requestContent);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result: T = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  const backupSampleData = (kentai_id: string, kaiin_code: string, kentai_saishubi: string) => {
    const endpoint = "kentai_id_check_api";
    const body = JSON.stringify({endpoint, inputData: {kentai_id, kaiin_code, kentai_saishubi }});
    postBackupData(body);
  };

  // Placeholder for future functions
  // const backupCustomerData = (...) => { ... };
  // const backupOrderData = (...) => { ... };

  return { backupSampleData, data, error };
};
