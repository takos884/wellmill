import { useContext, useState } from 'react';
import { UserContext } from '../Contexts/UserContext';

const localEndpoint = 'https://shop.well-mill.com/api/storeBackupData';

export const useBackupDB = <T extends unknown>() => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(UserContext);


  async function postBackupData(body: string) {
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
      return result;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  async function backupSampleData(kentai_id: string, kaiin_code: string, kentai_saishubi: string) {
    const endpoint = "kentai_id_check_api";
    //const body = JSON.stringify({endpoint, inputData: {kentai_id, kaiin_code, kentai_saishubi }});
    const body = JSON.stringify({data: {endpoint, inputData: {kentai_id, kaiin_code, kentai_saishubi }, customerKey: user?.customerKey, token: user?.token}});
    const sampleBackupResult = await postBackupData(body);
    //console.log("Result from sample data backup:")
    //console.log(sampleBackupResult);
  };

  async function backupCustomerData(
    customerKey: number,
    token: string,
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
  ) {
    const endpoint = "kaiin_renkei_api";
    const body = JSON.stringify({data: {customerKey: user?.customerKey, token: user?.token, endpoint: endpoint, inputData: {kaiin_code, kaiin_last_name, kaiin_first_name, kaiin_last_name_kana, kaiin_first_name_kana, post_code, pref_code, pref, city, address1, address2, renrakusaki, mail_address, touroku_kbn, seibetsu, seinengappi}}});
    console.log("body in backupCustomerData in useBackupDB");
    console.log(JSON.parse(body));
    const postCustomerDataReply = await postBackupData(body);
    console.log("postCustomerDataReply");
    console.log(postCustomerDataReply);
    return postCustomerDataReply;
  }

  // Placeholder for future function
  // const backupOrderData = (...) => { ... };

  return { backupSampleData, backupCustomerData, data, error };
};
