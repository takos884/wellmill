import React, { useState } from "react";
import useApiData from "./useApiData";

function Profile() {
    const [shouldFetch, setShouldFetch] = useState(false);
    const requestParams: [string, string] = shouldFetch ? ['W2023022001000', 'NV001'] : ['', '']
    const [data, loading, error] = useApiData(...requestParams);

    //const [data, loading, error] = useApiData('W2023022001002', '555555');
    return (
        <div>
            <span>{window.location.pathname} - Profile - {loading ? "Loading..." : null}{error ? `Error: ${error}` : null}{data ? JSON.stringify(data) : "No data"}</span>
            <button onClick={() => {setShouldFetch(true);}}>Fetch Data</button>    
        </div>
    )
}

export default Profile