import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

function ShowTimeCard({ data }) {
  return (
    <div className="bg-(--color-purple) rounded-sm p-6">
      <div className="flex justify-between mb-5">
        <div className="font-semibold text-(--color-yellow) text-2xl">
          {data.cinemas.name} ({data.cinemas.province})
        </div>
        <div className="cursor-pointer p-1">
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>
      <div className="mb-5">
        {data.cinemas.specific_address}, {data.cinemas.ward},{" "}
        {data.cinemas.province}
      </div>
      <div className="mb-3">Suất chiếu</div>
      <div className="flex gap-2">
        {data.cinemas.time.map((t, i) => (
          <div key={i}>
            <Button
              text={t.start_time}
              bg_color="transparent"
              hover_bg_color="transparent"
              border="1px white solid"
              text_color="white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShowTimeCard;
