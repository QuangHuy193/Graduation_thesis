import { faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function WatchTrailer({ size }: { size: string }) {
  let sizeNumber = 0;
  if (size === "s") {
    sizeNumber = 25;
  } else if (size === "m") {
    sizeNumber = 35;
  }
  return (
    <div className=" flex gap-2 items-center p-1 cursor-pointer">
      <div>
        <div
          className={`border border-white rounded-4xl relative box-border`}
          style={{
            width: sizeNumber,
            height: sizeNumber,
          }}
        >
          <div
            className={`bg-white absolute rounded-4xl top-1/2 left-1/2 
                -translate-x-1/2 -translate-y-1/2`}
            style={{
              width: sizeNumber - 6,
              height: sizeNumber - 6,
            }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          text-red-500"
            style={{ fontSize: `${sizeNumber - 10}px` }}
          >
            <FontAwesomeIcon icon={faCaretRight} />
          </div>
        </div>
      </div>
      <div>
        <div
          className={`underline`}
          style={{ fontSize: `${sizeNumber - 10}px` }}
        >
          Xem Trailer
        </div>
      </div>
    </div>
  );
}

export default WatchTrailer;
