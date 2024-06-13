import { useState } from "react";
import { AdminDataType, Product } from "../../types";
import CallAPI from "../../Utilities/CallAPI";

type ImagesProps = {
  adminData: AdminDataType | null;
  loadAdminData: () => void;
};

type ImageFields = {
  imageKey: number;
  productKey: number;
  url: string;
  displayOrder: number;
  altText: string;
}

const host = window.location.hostname;
const subdomain = host.split('.')[0];
const token = window.location.search ? new URLSearchParams(window.location.search).get('token') || "" : localStorage.getItem('token') || "";

export default function Images({ adminData, loadAdminData }: ImagesProps) {
  const [showAddImage, setShowAddImage] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState<string>("");

  const images = adminData?.images;
  if (!images) return <span>Loading images...</span>;
  const products = adminData?.products;
  if (!products) return <span>Loading products...</span>;

  const productKeys = new Set(products.map((product: Product) => product.productKey));
  const unassociatedImages = images.filter((image: ImageFields) => (!image.productKey || !productKeys.has(image.productKey)));

  //#region Add image
  const addImageButton = (
    <button onClick={() => setShowAddImage(true)}>Add Image</button>
  )

  const addImageModal = (
    <div style={{position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100}}>
      <div style={{display:"flex", flexDirection:"column", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "#fff", padding: "1rem", borderRadius: "0.5rem"}}>
        <h3>Add Image</h3>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <input type="text" onChange={handleAltTextChange} value={altText} placeholder="Alt text" />
        <button onClick={uploadImage}>Upload</button>
        <button onClick={() => setShowAddImage(false)}>Close</button>
      </div>
    </div>
  )

  function handleFileChange (event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  function handleAltTextChange (event: React.ChangeEvent<HTMLInputElement>) {
    setAltText(event.target.value);
  };

  async function uploadImage() {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) { // 25MB limit
      alert("File size exceeds the 25MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('altText', altText);
    formData.append('token', token);

    const fetchResponse = await fetch(`https://${subdomain}.well-mill.com/api/adminImageUpload`, {
      method: 'POST',
      body: formData,
    })
    
    console.log(fetchResponse);
    try {
      const responseJson = await fetchResponse.json()
      console.log('Success:', responseJson);
      setShowAddImage(false);
      loadAdminData();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  //#endregion Add image



  //#region unassociatedImages
  const unassociatedImageRows = unassociatedImages.map((image: ImageFields) => {
    const productSelect = (
      <select onChange={(event) => handleProductSelectChange(event, image.imageKey)}>
        <option value="0">Select product</option>
        {products.map((product: Product) => {
          return (
            <option key={product.productKey} value={product.productKey}>{product.title}</option>
          )
        })}
      </select>
    )

    return (
      <div key={image.imageKey} style={{display:"flex", padding: "0.5rem", gap:"0.5rem", alignItems:"center"}}>
        <img src={`https://${subdomain}.well-mill.com/${image.url}`} alt={image.altText} style={{width: "6rem", maxHeight:"6rem", border:"1px solid #888"}} />
        {productSelect}
        <span onClick={() => {handleImageDelete(image.imageKey)}} style={{display: "flex", justifyContent:"center", alignItems:"center", backgroundColor:"#fff", width:"2rem", height:"2rem", color: "#800", borderRadius: "0.5rem"}}>X</span>
      </div>
    )
  });

  function handleProductSelectChange(event: React.ChangeEvent<HTMLSelectElement>, imageKey: number) {
    const productKey = parseInt(event.target.value);
    if (!productKey) return;
    const product = products.find((product: Product) => product.productKey === productKey);
    if(!product) return;

    if (!window.confirm(`Assign image to product ${product.title}?`)) return;

    const requestData = {imageKey: imageKey, productKey: productKey, token: token};
    CallAPI(requestData, "adminImageUpdate");
    setTimeout(() => {
      loadAdminData();
    }, 500);
  }
  //#endregion unassociatedImages




  const productRows = products.map((product) => {
    const productAvailable: boolean = product.available;
    const productRowColor = productAvailable ? "#bdf" : "#bbb";

    const productImages = images.filter((image: ImageFields) => image.productKey === product.productKey).sort((a: ImageFields, b: ImageFields) => a.displayOrder - b.displayOrder);

    const imageRows = productImages.map((image: ImageFields, index: number) => {
  
      return (
        <div key={image.imageKey} style={{display:"flex", padding: "0.5rem", gap:"0.5rem", alignItems:"center"}}>
          {/*<span style={{width: "1rem"}}>{image.displayOrder}</span>*/}
          <img src={`https://${subdomain}.well-mill.com/${image.url}`} alt={image.altText} style={{width: "6rem", maxHeight:"6rem", border:"1px solid #888"}} />
          <span onClick={() => {handleImageDelete(image.imageKey)}} style={{display: "flex", justifyContent:"center", alignItems:"center", backgroundColor:"#fff", width:"2rem", height:"2rem", color: "#800", borderRadius: "0.5rem"}}>X</span>
          {/*<span style={{width: "10rem"}}>{image.altText}</span>*/}
        </div>
      )
    });
  
    return (
      <div key={product.productKey} style={{display:"flex", flexDirection:"column", padding: "0.5rem", backgroundColor: productRowColor, borderRadius: "0.5rem", margin:"1rem"}}>
        <span>{product.title} ({product.productKey})</span>
        <span>Images</span>
        {imageRows}
      </div>
    )
  });

  async function handleImageDelete(imageKey: number) {
    console.log("Deleting image: ", imageKey);
    if(!imageKey) return;

    const requestData = {imageKey: imageKey, token: token}
    const responseData = await CallAPI(requestData, "adminImageDelete");
    console.log(responseData);
    setTimeout(() => {
      loadAdminData();
    }, 500);
  }


  return (
    <>
      <h2>
        Images
      </h2>
      {showAddImage ? addImageModal : null}
      {addImageButton}
      {unassociatedImageRows}
      {productRows}
    </>
  )
}