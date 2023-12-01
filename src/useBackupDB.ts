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

  const backupCustomerData = (
    kaiin_code: string,
    kaiin_last_name: string,
    kaiin_first_name: string,
    kaiin_last_name_kana: string,
    kaiin_first_name_kana: string,
    post_code: string,
    pref_code: string,
    pref: string,
    city: string,
    address1: string,
    address2: string,
    renrakusaki: string,
    mail_address: string,
    touroku_kbn: number,
    seibetsu: number,
    seinengappi: string,
  ) => {
    const endpoint = "kaiin_renkei_api";
    const body = JSON.stringify({endpoint, inputData: {kaiin_code, kaiin_last_name, kaiin_first_name, kaiin_last_name_kana, kaiin_first_name_kana, post_code, pref_code, pref, city, address1, address2, renrakusaki, mail_address, touroku_kbn, seibetsu, seinengappi}});
    postBackupData(body);
  }

  // Placeholder for future function
  // const backupOrderData = (...) => { ... };

  return { backupSampleData, backupCustomerData, data, error };
};
