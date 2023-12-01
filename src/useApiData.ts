import { useState, useEffect } from 'react';

type ApiResponse = {
  Status: number;
  Messages: string[];
  Result: {
    KenSakomokuNum: string;
    ListKensakomoku: any[];
    ShohinCode: string | null;
  };
};

function backupSpecimenData(kentai_id: string, kaiin_code: string, kentai_saishubi: string) {
  
}

function useApiData(kentai_id: string, kaiin_code: string, kentai_saishubi: string): [ApiResponse | null, boolean, any] {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const testing = true

  //const action = "orders"     as "orders" | "customer" | "specimen" | "results"; // orders returns data
    const action = "customer"   as "orders" | "customer" | "specimen" | "results";
  //const action = "specimen"   as "orders" | "customer" | "specimen" | "results";
  //const action = "results"    as "orders" | "customer" | "specimen" | "results"; // Not used

  let BASE_URL = '';
  if (action === "orders")   BASE_URL = '/api/chumon_renkei_api';     // order alignment // orders returns data
  if (action === "customer") BASE_URL = '/api/kaiin_renkei_api';      // member alignment
  if (action === "specimen") BASE_URL = '/api/kentai_id_check_api';   // specimen info
  if (action === "results")  BASE_URL = '/api/kensa_irai_renkei_api'; // Inspection request alignment (Not used)

  let body = ''

  // orders returns data
  if (action === "orders") {
    body = JSON.stringify({
      chumon_no: "T00001-00001",
      chumon_date: "02/14/2023",
      konyu_name: "購入者A",
      touroku_kbn: 1,
      chumon_meisai: {
        chumon_meisai_no: 1
      },
      haiso: {
        haiso_name: "購入者Aう",
      }
    })
  }

  if (action === "customer") {
    body = JSON.stringify({
      kaiin_code: 'NV001',
      kaiin_last_name: "デハーン",
      kaiin_first_name: "クリス",
      touroku_kbn: 0,
      kaiin_last_name_kana: "デハーン",
      kaiin_first_name_kana: "クリス",
      post_code: "1234567",
      pref_code: "JPHYG",
      pref: "Hyogo",
      city: "Kobe",
      ward: "Chuoku",
      address2: "Building 1",
      renrakusaki: "Building 1",
      mail_address: "Building 1",
      seibetsu: 1,
      seinengappi: "2023/10/24",
    })
  }

  if (action === "specimen") {
    body = JSON.stringify({
      kentai_id: kentai_id,
      kaiin_code: kaiin_code,
      kentai_saishubi: kentai_saishubi,
    })
  }

  if (action === "results") {
    body = JSON.stringify({
      chumon_no: "T00001-00001",
      chumon_date: "02/14/2023",
      konyu_name: "購入者A",
      touroku_kbn: 1,
      hojin_code: "T00001"
    })
  }

  const fetchData = async () => {
    if (kentai_id === '' && kaiin_code === '') return;
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': testing ? process.env.REACT_APP_TEST_API_KEY! : process.env.REACT_APP_API_KEY!,
        },
        body: body,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
          setError(err.message);
      } else {
          setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchData();

  if (kentai_id === '' && kaiin_code === '') return [data, false, null];

  return [data, loading, error];
}

export default useApiData;