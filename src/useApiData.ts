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

function useApiData(kentai_id: string, kaiin_code: string): [ApiResponse | null, boolean, any] {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  useEffect(() => {
    const testing = true

    //const action = "check"   as "edit" | "check" | "order" | "history"; // Check returns data
    const action = "edit"    as "edit" | "check" | "order" | "history";
    //const action = "order"   as "edit" | "check" | "order" | "history";
    //const action = "history" as "edit" | "check" | "order" | "history"; // Not used
  
    let BASE_URL = '';
    if (action === "check")   BASE_URL = '/api/kentai_id_check_api'; // Check returns data
    if (action === "edit")    BASE_URL = '/api/kaiin_renkei_api';
    if (action === "order")   BASE_URL = '/api/chumon_renkei_api';
    if (action === "history") BASE_URL = '/api/kensa_irai_renkei_api'; // Not used

    let body = ''
  
    // Check returns data
    if (action === "check") {
      body = JSON.stringify({
        kentai_id: kentai_id,
        kaiin_code: kaiin_code,
      })
    }
  
    if (action === "edit") {
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
        address1: "Chuoku",
        address2: "Building 1",
        renrakusaki: "Building 1",
        mail_address: "Building 1",
        seibetsu: 1,
        seinengappi: "2023/10/24",
      })
    }
  
    if (action === "order") {
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
  
    if (action === "history") {
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
  }, [kentai_id, kaiin_code]); 

  if (kentai_id === '' && kaiin_code === '') return [data, false, null];

  return [data, loading, error];
}

export default useApiData;