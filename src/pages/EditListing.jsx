import { useState, useEffect, useRef } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.config'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import Spinner from '../components/Spinner'

function EditListing() {
  // eslint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(false);
  const [formData, setFormData] = useState({
    type: "used",
    name: "",
    make: "",
    model: "",
    color: "",
    year: 2020,
    milage: 0,
    transmission: "automatic",
    fuelType: "",
    bodyStyle: "",
    description: "",
    address: "",
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0,
  });

  const {
    type,
    name,
    make,
    model,
    color,
    year,
    milage,
    transmission,
    fuelType,
    bodyStyle,
    description,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
  } = formData;

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const params = useParams();

   // Redirect if listing is not user's
   useEffect(() => {
    if (listing && listing.userRef !== auth.currentUser.uid) {
      toast.error('You can not edit that listing')
      navigate('/')
    }
  })

  // Fetch listing to edit
  useEffect(() => {
    setLoading(true)
    const fetchListing = async () => {
      const docRef = doc(db, 'listings', params.listingId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        // console.log(docSnap.data())
        setListing(docSnap.data())
        setFormData({ ...docSnap.data(), address: docSnap.data().location })
        // console.log(formData)
        setLoading(false)
      } else {
        navigate('/')
        toast.error('Listing does not exist')
      }
    }

    fetchListing()
  }, [params.listingId, navigate])



 // Sets userRef to logged in user
  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate("/sign-in");
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const onSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    if (discountedPrice >= regularPrice) {
      setLoading(false);
      toast.error("Discounted price must be less than regular price");
      return;
    }

    if (images.length > 6) {
      setLoading(false);
      toast.error("Max 6 images");
      return;
    }

    let geolocation = {};
    let location;

    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );

      const data = await response.json();

      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

      location =
        data.status === "ZERO_RESULTS"
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes("undefined")) {
        setLoading(false);
        toast.error("Please enter a correct address");
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // Store image in firebase
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

        const storageRef = ref(storage, "images/" + fileName);

        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
              default:
                break;
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false);
      toast.error("Images not uploaded");
      return;
    });

    const formDataCopy = {
      ...formData,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    formDataCopy.location = address;
    delete formDataCopy.images;
    delete formDataCopy.address;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    //Update listing
    const docRef = doc(db, "listings", params.listingId);
    await updateDoc(docRef, formDataCopy)
    setLoading(false);
    toast.success("Listing saved");
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  const onMutate = (e) => {
    let boolean = null;

    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }

    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }

    // Text/Booleans/Numbers
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>

      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Used / New</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "used" ? "formButtonActive" : "formButton"}
              id="type"
              value="used"
              onClick={onMutate}
            >
              Used
            </button>
            <button
              type="button"
              className={type === "new" ? "formButtonActive" : "formButton"}
              id="type"
              value="new"
              onClick={onMutate}
            >
              New
            </button>
          </div>

          <label className="formLabel">Name</label>
          <input
            className="formInputName"
            type="text"
            id="name"
            value={name}
            onChange={onMutate}
            maxLength="32"
            minLength="10"
            required
          />

          <div className="flex">
            
            <div>
              <label className="formLabel">Make</label>
              <select
                className="formInputSmall"
                name="make"
                id="make"
                onChange={onMutate}
                required
                value={make}
              >
              <option value="">Select...</option>
              <option value="ACURA">Acura</option>
              <option value="ALFA ROMEO">Alfa Romeo</option>
              <option value="AMC">AMC</option>
              <option value="AM_GENERAL">AM General</option>
              <option value="ASTON MARTIN">Aston Martin</option>
              <option value="AUDI">Audi</option>
              <option value="AUSTIN HEALEY">Austin Healey</option>
              <option value="BENTLEY">Bentley</option>
              <option value="BMW">BMW</option>
              <option value="BRICKLIN">Bricklin</option>
              <option value="BUGATTI">Bugatti</option>
              <option value="BUICK">Buick</option>
              <option value="CADILLAC">Cadillac</option>
              <option value="CHEVROLET">Chevrolet</option>
              <option value="CHRYSLER">Chrysler</option>
              <option value="DAEWOO">Daewoo</option>
              <option value="DAIHATSU">Daihatsu</option>
              <option value="DATSUN">Datsun</option>
              <option value="DODGE">Dodge</option>
              <option value="EAGLE">Eagle</option>
              <option value="FERRARI">Ferrari</option>
              <option value="FIAT">Fiat</option>
              <option value="FORD">Ford</option>
              <option value="GENESIS">Genesis</option>
              <option value="GEO">Geo</option>
              <option value="GMC">GMC</option>
              <option value="HONDA">Honda</option>
              <option value="HUMMER">Hummer</option>
              <option value="HYUNDAI">Hyundai</option>
              <option value="INFINITI">Infiniti</option>
              <option value="INTERNATIONAL HARVESTER">
                International Harvester
              </option>
              <option value="ISUZU">Isuzu</option>
              <option value="JAGUAR">Jaguar</option>
              <option value="JEEP">Jeep</option>
              <option value="KIA">Kia</option>
              <option value="LAMBORGHINI">Lamborghini</option>
              <option value="LAND ROVER">Land Rover</option>
              <option value="LEXUS">Lexus</option>
              <option value="LINCOLN">Lincoln</option>
              <option value="LOTUS">Lotus</option>
              <option value="MASERATI">Maserati</option>
              <option value="MAYBACH">Maybach</option>
              <option value="MAZDA">Mazda</option>
              <option value="MCLAREN">McLaren</option>
              <option value="MERCEDES-BENZ">Mercedes-Benz</option>
              <option value="MERCURY">Mercury</option>
              <option value="MG">MG</option>
              <option value="MINI">MINI</option>
              <option value="MITSUBISHI">Mitsubishi</option>
              <option value="NISSAN">Nissan</option>
              <option value="OLDSMOBILE">Oldsmobile</option>
              <option value="OPEL">Opel</option>
              <option value="OTHER">Other</option>
              <option value="PEUGEOT">Peugeot</option>
              <option value="PLYMOUTH">Plymouth</option>
              <option value="POLESTAR">Polestar</option>
              <option value="PONTIAC">Pontiac</option>
              <option value="PORSCHE">Porsche</option>
              <option value="RAM">RAM</option>
              <option value="RENAULT">Renault</option>
              <option value="ROLLS ROYCE">Rolls-Royce</option>
              <option value="SAAB">Saab</option>
              <option value="SATURN">Saturn</option>
              <option value="SCION">Scion</option>
              <option value="SHELBY">Shelby</option>
              <option value="SMART">Smart</option>
              <option value="SUBARU">Subaru</option>
              <option value="SUZUKI">Suzuki</option>
              <option value="TESLA">Tesla</option>
              <option value="TOYOTA">Toyota</option>
              <option value="TRIUMPH">Triumph</option>
              <option value="VW">Volkswagen</option>
              <option value="VOLVO">Volvo</option>
              </select>
            </div>
            <div>
              <label className="formLabel">Model</label>
              <input
                className="formInputSmall"
                type="text"
                id="model"
                value={model}
                onChange={onMutate}
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          <div>
            <label className="formLabel">Color</label>
            <input
              className="formInputSmall"
              type="text"
              id="color"
              value={color}
              onChange={onMutate}
              min="1"
              max="20"
              required
            />
          </div>
          <div className="flex">
            <div>
              <label className="formLabel">Year</label>
              <input
                className="formInputSmall"
                type="number"
                id="year"
                value={year}
                onChange={onMutate}
                min="1900"
                max="2023"
                required
              />
            </div>

            <div>
              {type === "used" && (
                <>
                  <label className="formLabel">Milage (km)</label>
                  <input
                    className="formInputSmall"
                    type="number"
                    id="milage"
                    value={milage}
                    onChange={onMutate}
                    min="10"
                    max="1000000"
                    required={type === "used"}
                  />
                </>
              )}
            </div>
          </div>

          <label className="formLabel">Transmission</label>
          <div className="formButtons">
            <button
              type="button"
              className={
                transmission === "Automatic" ? "formButtonActive" : "formButton"
              }
              id="transmission"
              value="Automatic"
              onClick={onMutate}
            >
              Automatic
            </button>
            <button
              type="button"
              className={
                transmission === "Manual" ? "formButtonActive" : "formButton"
              }
              id="transmission"
              value="Manual"
              onClick={onMutate}
            >
              Manual
            </button>
          </div>

          <label className="formLabel">Fuel Type</label>
          <select
            className="formInput"
            name="fuelType"
            id="fuelType"
            onChange={onMutate}
            required
            value={fuelType}
          >
            <option value="">Select...</option>
            <option value="Gas">Gas</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
          </select>

          <label className="formLabel">Body Style</label>
          <select
            className="formInput"
            name="bodyStyle"
            id="bodyStyle"
            onChange={onMutate}
            required
            value={bodyStyle}
          >
            <option value="">Select...</option>
            <option value="Sedan">Sedan</option>
            <option value="Suv">SUV</option>
            <option value="Hatchback">Hatchback</option>
            <option value="SportsCar">Sports car</option>
            <option value="Wagon">Wagon</option>
            <option value="Van">Van</option>
            <option value="Convertible">Convertible</option>
            <option value="Pickup">Pickup truck</option>
            <option value="OtherCar">Other</option>
          </select>

          <label className="formLabel">Description</label>
          <textarea
            className="formInputDes"
            type="text"
            id="description"
            value={description}
            onChange={onMutate}
            required
          />

          <label className="formLabel">Address</label>
          <textarea
            className="formInputAddress"
            type="text"
            id="address"
            value={address}
            onChange={onMutate}
            required
          />

          {!geolocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="latitude"
                  value={latitude}
                  onChange={onMutate}
                  required
                />
              </div>
              <div>
                <label className="formLabel">Longitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  id="longitude"
                  value={longitude}
                  onChange={onMutate}
                  required
                />
              </div>
            </div>
          )}

          <label className="formLabel">Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              type="button"
              id="offer"
              value={true}
              onClick={onMutate}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              type="button"
              id="offer"
              value={false}
              onClick={onMutate}
            >
              No
            </button>
          </div>

          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              className="formInputSmall"
              type="number"
              id="regularPrice"
              value={regularPrice}
              onChange={onMutate}
              min="100"
              max="750000000"
              required
            />
          </div>

          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <input
                className="formInputSmall"
                type="number"
                id="discountedPrice"
                value={discountedPrice}
                onChange={onMutate}
                min="100"
                max="750000000"
                required={offer}
              />
            </>
          )}

          <label className="formLabel">Images</label>
          <p className="imagesInfo">
            The first image will be the cover (max 6).
          </p>
          <input
            className="formInputFile"
            type="file"
            id="images"
            onChange={onMutate}
            max="6"
            accept=".jpg,.png,.jpeg"
            multiple
            required
          />
          <button type="submit" className="primaryButton createListingButton">
            Edit Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditListing;
