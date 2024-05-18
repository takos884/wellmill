import { useEffect, useState } from "react";
import { AdminDataType } from "../../types";
import CallAPI from "../../Utilities/CallAPI";

type CustomersProps = {
  adminData: AdminDataType | null;
  loadAdminData: () => void;
};

type CustomerFields = {
  customerKey: number;
  firstName: string;
  lastName: string;
  firstNameKana: string;
  lastNameKana: string;
  gender: string;
  birthday: string;
  email: string;
};

type CustomerFieldKey = keyof CustomerFields;

export default function Customers({ adminData, loadAdminData }: CustomersProps) {
  const [token , setToken] = useState<string>("");
  const [currentCustomerKey, setCurrentCustomerKey] = useState<number | null>(null);
  const [currentCustomerData, setCurrentCustomerData] = useState<any | null>(null);
  const [displayEdit, setDisplayEdit] = useState<boolean>(false);
  const [displayDelete, setDisplayDelete] = useState<boolean>(false);
  const [refreshToggle, setRefreshToggle] = useState<boolean>(false);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryStringToken = params.get('token');
      setToken(queryStringToken || "");
    }
  }, []);

  useEffect(() => {
    if (!currentCustomerKey) setCurrentCustomerData(null);
    const currentCustomer = adminData?.customers.find(c => c.customerKey === currentCustomerKey);
    if(currentCustomer?.birthday) currentCustomer.birthday = currentCustomer?.birthday?.substring(0,10);
    setCurrentCustomerData(currentCustomer);
  }, [currentCustomerKey]);

  const customers = adminData?.customers;
  if (!customers) return <span>Loading...</span>;

  const header = (
    <div style={{display:"flex", padding: "0.5rem", backgroundColor:"#9cf"}}>
      <span style={{width: "4rem"}}>Key</span>
      <span style={{width: "10rem"}}>firstName</span>
      <span style={{width: "10rem"}}>lastName</span>
      <span style={{width: "10rem"}}>firstNameKana</span>
      <span style={{width: "10rem"}}>lastNameKana</span>
      <span style={{width: "6rem"}}>gender</span>
      <span style={{width: "10rem"}}>birthday</span>
      <span style={{width: "20rem"}}>email</span>
    </div>
  )

  let colourToggle = 0;
  const customerList = customers.map((customer, index) => {
    if (!customer.customerKey) return null;
    if (customer.firstName === null && customer.lastName === null && customer.email === null) return null;
    colourToggle++;
    const backgroundColor = (colourToggle%2 === 1) ? "#def" : "#fff";
    return (
      <div key={customer.customerKey} style={{display:"flex", backgroundColor: backgroundColor, padding: "0.5rem"}}>
        <span style={{width: "4rem"}}>{customer.customerKey}</span>
        <span style={{width: "10rem"}}>{customer.firstName}</span>
        <span style={{width: "10rem"}}>{customer.lastName}</span>
        <span style={{width: "10rem"}}>{customer.firstNameKana}</span>
        <span style={{width: "10rem"}}>{customer.lastNameKana}</span>
        <span style={{width: "6rem"}}>{customer.gender}</span>
        <span style={{width: "10rem"}}>{customer.birthday?.substring(0,10)}</span>
        <span style={{width: "20rem", flexGrow: 1}}>{customer.email}</span>
        <span onClick={() => {setCurrentCustomerKey(customer.customerKey || null); setDisplayEdit(true)}} style={{width: "2rem"}}>✏️</span>
        <span onClick={() => {setCurrentCustomerKey(customer.customerKey || null); setDisplayDelete(true)}} style={{width: "2rem"}}>🗑️</span>
      </div>
    )
  });

  const rowStyle = {display: "flex", alignItems: "center"};
  const spanStyle = {display: "flex", justifyContent: "flex-end", width: "10rem"};
  const fieldStyle = {width: "40rem", height: "2rem", margin: "0.5rem"};

  const editModal = (
    <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"}}>
      <div style={{display: "flex", flexDirection: "column", backgroundColor: "#fff", padding: "2rem", width: "60rem", alignItems: "center"}}>
        <span>Editing customer {currentCustomerKey}</span>
        <div style={rowStyle}>
          <span style={spanStyle}>First Name:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("firstName", event.target.value)}} value={currentCustomerData?.firstName || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Last Name:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("lastName", event.target.value)}} value={currentCustomerData?.lastName || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>First Name Kana:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("firstNameKana", event.target.value)}} value={currentCustomerData?.firstNameKana || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Last Name Kana:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("lastNameKana", event.target.value)}} value={currentCustomerData?.lastNameKana || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Gender</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("gender", event.target.value)}} value={currentCustomerData?.gender || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Birthday:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("birthday", event.target.value)}} value={currentCustomerData?.birthday?.substring(0,10) || ""} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Email:</span>
          <input type="text" style={fieldStyle} onChange={(event) => {handleFieldChange("email", event.target.value)}} value={currentCustomerData?.email || ""} />
        </div>
        <button onClick={() => {setDisplayEdit(false)}}>Cancel</button>
        <button onClick={() => {handleCustomerUpdate()}}>Save</button>
      </div>
    </div>
  )

  function handleFieldChange(fieldName: CustomerFieldKey, fieldValue: string) {
    if (!currentCustomerKey) return;
    const newCustomers = customers?.map(cust => {
      if (cust.customerKey === currentCustomerKey) {
        return { ...cust, [fieldName]: fieldValue };
      }
      return cust;
    });
    setCurrentCustomerData(newCustomers?.find(c => c.customerKey === currentCustomerKey) || null);
    console.log(newCustomers);
  }

  async function handleCustomerUpdate() {
    console.log("Updating customer", currentCustomerKey);
    if(!currentCustomerData) return;

    const requestData = {...currentCustomerData, token: token}
    const responseData = await CallAPI(requestData, "adminCustomerUpdate");
    console.log(responseData);
    setTimeout(() => {
      setDisplayEdit(false);
      loadAdminData();
    }, 500);
  }

  const deleteModal = (
    <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"}}>
      <div style={{display: "flex", flexDirection: "column", backgroundColor: "#fff", padding: "2rem"}}>
        <span>Are you sure you want to delete this customer?</span>
        <button onClick={() => {setDisplayDelete(false)}}>Cancel</button>
        <button onClick={() => {handleCustomerDelete()}}>Delete</button>
      </div>
    </div>
  )

  function handleCustomerDelete() {
    console.log("Deleting customer", currentCustomerKey);
    if(!currentCustomerKey) return;

    const requestData = {customerKey: currentCustomerKey, token: token}
    CallAPI(requestData, "adminCustomerDelete");
    setTimeout(() => {
      setDisplayDelete(false);
      loadAdminData();
    }, 500);
  }

  return (
    <div>
      <div style={{display:"flex", flexDirection:"column", margin: "2rem"}}>
        {header}
        {customerList}
        {displayEdit ? editModal : null}
        {displayDelete ? deleteModal : null}
      </div>
    </div>
  )
}