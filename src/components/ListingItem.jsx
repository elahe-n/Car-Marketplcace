import { Link } from "react-router-dom";
import { ReactComponent as DeleteIcon } from "../assets/svg/deleteIcon.svg";
import { ReactComponent as EditIcon } from "../assets/svg/editIcon.svg";
import transmissionIcon from "../assets/png/transmission.png";
import fuelIcon from "../assets/png/fuel1.png";
import milageIcon from "../assets/png/gage.png";

function ListingItem({ listing, id, onEdit, onDelete }) {
  return (
    <li className="categoryListing">
      <Link
        to={`/category/${listing.type}/${id}`}
        className="categoryListingLink"
      >
        <img
          src={listing.imgUrls[0]}
          alt={listing.name}
          className="categoryListingImg"
        />
        <div className="categoryListingDetails">
          <p className="categoryListingLocation">
            {listing.make} {listing.model} {listing.year}
          </p>
          <p className="categoryListingName">{listing.name}</p>

          <p className="categoryListingPrice">
            $
            {listing.offer
              ? listing.discountedPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              : listing.regularPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </p>
          <br />
          <div className="categoryListingInfoDiv">
            {listing.type === "used" && (
              <>
                <img src={milageIcon} alt="milage" height="30px" width="30px" />
                <p className="categoryListingInfoText">&nbsp; {listing.milage}km</p>
              </>
            )}
            </div> 

            <div className="categoryListingInfoDiv">
            <img src={transmissionIcon} alt="transmission" height="30px" width="30px" />
            <p className="categoryListingInfoText"> &nbsp;{listing.transmission}</p>
            </div> 

            <div className="categoryListingInfoDiv">
            <img src={fuelIcon} alt="fuel" height="30px" width="30px" />
            <p className="categoryListingInfoText"> &nbsp;{listing.fuelType}</p>
            </div> 

        </div>
      </Link>

      {onDelete && (
        <DeleteIcon
          className="removeIcon"
          fill="rgb(231, 76,60)"
          onClick={() => onDelete(listing.id, listing.name)}
        />
      )}

      {onEdit && <EditIcon className="editIcon" onClick={() => onEdit(id)} />}
    </li>
  );
}

export default ListingItem;
