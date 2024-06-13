import { useEffect, useState } from "react";
import { AdminDataType } from "../../types";
import CallAPI from "../../Utilities/CallAPI";

type ProductsProps = {
  adminData: AdminDataType | null;
  loadAdminData: () => void;
};

type ProductFields = {
  title: string;
  description: string;
  available: boolean;
  price: number;
  taxRate: number;
  type: number;
  discountRate: number | null;
  discountValue: number | null;
};

const emptyProduct: ProductFields = {
  title: "",
  description: "",
  available: true,
  price: 0,
  taxRate: 0,
  type: 0,
  discountRate: 0,
  discountValue: 0,
};

type ProductFieldKey = keyof ProductFields;

export default function Products({ adminData, loadAdminData }: ProductsProps) {
  const [token , setToken] = useState("");
  const [currentProductKey, setCurrentProductKey] = useState<number | null>(null);
  const [currentProductData, setCurrentProductData] = useState<any | null>(null);
  const [displayEdit, setDisplayEdit] = useState<boolean>(false);
  const [saveEndpoint, setSaveEndpoint] = useState<string>("adminProductUpdate");
  const [displayDelete, setDisplayDelete] = useState<boolean>(false);

  useEffect(() => {
    let queryStringToken = localStorage.getItem('token') || "";
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("token")) { queryStringToken = params.get('token') || ""; }
    }
    setToken(queryStringToken);
  }, []);

  useEffect(() => {
    const currentProduct = adminData?.products.find(prod => prod.productKey === currentProductKey);
    if(currentProduct) setCurrentProductData(currentProduct);
  }, [currentProductKey]);

  const products = adminData?.products;
  //console.log("adminData in Products.tsx");
  //console.log(adminData);
  if (!products) return <span>Loading...</span>;

  const addProductButton = (
    <button onClick={() => {
      setCurrentProductKey(null);
      setCurrentProductData(emptyProduct);
      setSaveEndpoint("adminProductCreate");
      setDisplayEdit(true);
    }}>Add Product</button>
  );

  const header = (
    <div style={{display:"flex", padding: "0.5rem", backgroundColor:"#9cf"}}>
      <span style={{width: "4rem"}}>Key</span>
      <span style={{width: "10rem"}}>ID</span>
      <span style={{width: "20rem"}}>Title</span>
      <span style={{width: "20rem"}}>Description</span>
      <span style={{width: "6rem"}}>Available</span>
      <span style={{width: "6rem"}}>Type</span>
      <span style={{width: "6rem"}}>Price</span>
      <span style={{width: "6rem"}}>Tax Rate</span>
      <span style={{width: "6rem"}}>Discount Rate</span>
    </div>
  );

  const productList = products.map((product, index) => {
    const backgroundColor = index % 2 === 0 ? "#bdf" : "#fff";

    return (
      <div key={index} style={{display:"flex", padding: "0.5rem", backgroundColor: backgroundColor}}>
        <span style={{width: "4rem"}}>{product.productKey}</span>
        <span style={{width: "10rem"}}>{product.id}</span>
        <span style={{width: "20rem"}}>{product.title}</span>
        <span style={{width: "20rem", maxHeight: "15rem", overflow: "hidden"}}>{product.description}</span>
        <span style={{width: "6rem"}}>{product.available ? "Yes" : "No"}</span>
        <span style={{width: "6rem"}}>{product.type}</span>
        <span style={{width: "6rem"}}>{product.price}</span>
        <span style={{width: "6rem"}}>{product.taxRate * 100}%</span>
        <span style={{width: "6rem"}}>{product.discountRate ? `${product.discountRate * 100}%` : "-"} </span>
        <span style={{width: "2rem"}} onClick={() => {
          setCurrentProductKey(product.productKey);
          setSaveEndpoint("adminProductUpdate");
          setDisplayEdit(true);
        }}>✏️</span>
        <span style={{width: "2rem"}} onClick={() => {
          setCurrentProductKey(product.productKey);
          setDisplayDelete(true);
        }}>🗑️</span>
      </div>
    );
  });

  const rowStyle = {display: "flex", alignItems: "center"};
  const spanStyle = {display: "flex", justifyContent: "flex-end", width: "10rem"};
  const textFieldStyle = {width: "40rem", height: "2rem", margin: "0.5rem"};
  const checkboxStyle = {height: "2rem", margin: "0.5rem"};
  const numberFieldStyle = {width: "10rem", height: "2rem", margin: "0.5rem"};

  const editModal = (
    <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"}}>
      <div style={{display: "flex", flexDirection: "column", backgroundColor: "#fff", padding: "2rem", width: "60rem", alignItems: "center"}}>
        <h2>Edit Product</h2>
        <div style={rowStyle}>
          <span style={spanStyle}>Title:</span>
          <input style={textFieldStyle} type="text" onChange={(event) => {handleFieldChange("title", event.target.value)}} value={currentProductData?.title} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Description:</span>
          <textarea style={{width: "40rem", height: "10rem"}} onChange={(event) => {handleFieldChange("description", event.target.value)}} value={currentProductData?.description} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Available:</span>
          <input style={checkboxStyle} type="checkbox" onChange={(event) => {handleFieldChange("available", event.target.value)}} checked={currentProductData?.available} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Price:</span>
          <input style={numberFieldStyle} type="number" onChange={(event) => {handleFieldChange("price", event.target.value)}} value={currentProductData?.price} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Tax Rate:</span>
          <input style={numberFieldStyle} type="number" onChange={(event) => {handleFieldChange("taxRate", event.target.value)}} value={currentProductData?.taxRate} />*
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Type:</span>
          <input style={numberFieldStyle} type="number" onChange={(event) => {handleFieldChange("type", event.target.value)}} value={currentProductData?.type} />
        </div>
        <div style={rowStyle}>
          <span style={spanStyle}>Discount Rate:</span>
          <input style={numberFieldStyle} type="number" onChange={(event) => {handleFieldChange("discountRate", event.target.value)}} value={currentProductData?.discountRate} />*
        </div>
        <span>* 0.05 = 5% | 0.1 = 10% | 0.35 = 35% </span>
        <button onClick={() => {
          handleProductUpdate();
        }}>Save</button>
        <button onClick={() => {
          setCurrentProductKey(null);
          setDisplayEdit(false);
        }}>Cancel</button>
      </div>
    </div>
  );

  const deleteModal = (
    <div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)"}}>
      <div style={{display: "flex", flexDirection: "column", backgroundColor: "#fff", padding: "2rem", width: "40rem", alignItems: "center"}}>
        <h2>Delete Product</h2>
        <span>Are you sure you want to delete this product?</span>
        <button onClick={() => {
          handleProductDelete();
        }}>Yes</button>
        <button onClick={() => {
          setCurrentProductKey(null);
          setDisplayDelete(false);
        }}>No</button>
      </div>
    </div>
  );

  function handleFieldChange(field: ProductFieldKey, value: any) {
    if (!currentProductData) return;
    if(field === "available") value = !currentProductData.available;
    const newProductData = {...currentProductData};
    newProductData[field] = value;
    setCurrentProductData(newProductData);
  };

  async function handleProductUpdate() {
    if (!currentProductData) return;
    const credentials = {
      token: token,
      product: currentProductData,
    };
    const APIResponse = await CallAPI(credentials, saveEndpoint);
    console.log("APIResponse in Product Update");
    console.log(APIResponse);
    if (!APIResponse) return;
    loadAdminData();
    setCurrentProductKey(null);
    setDisplayEdit(false);
  };

  function handleProductDelete() {
    if (!currentProductKey) return;
    const requestData = {
      token: token,
      productKey: currentProductKey,
    };
    CallAPI(requestData, "adminProductDelete");
    setTimeout(() => {
      setCurrentProductKey(null);
      setDisplayDelete(false);
      loadAdminData();
    }, 500);
  }

  return (
    <>
      {displayEdit ? editModal : null}
      {displayDelete ? deleteModal : null}
      <div>
        <h1>Products</h1>
        {addProductButton}
        {header}
        {productList}
      </div>
    </>
  );
}
