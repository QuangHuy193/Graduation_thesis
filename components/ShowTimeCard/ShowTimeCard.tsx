import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

function ShowTimeCard({
  data,
  setTimesSelect,
  timeSelected,
}: {
  setTimesSelect: (obj: { showtime_id: string; room_id: string }) => void;
  timeSelected: object;
}) {
  const handleSelectTimes = (data) => {
    setTimesSelect(data);
  };
  return (
    <div className="bg-(--color-purple) rounded-sm p-6">
      <div className="flex justify-between mb-5">
        <div className="font-semibold text-(--color-yellow) text-2xl">
          {data.cinema_name} ({data.province})
        </div>
        <div className="cursor-pointer p-1">
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>
      <div className="mb-5">
        {data.specific_address}, {data.ward}, {data.province}
      </div>
      <div className="mb-3">Suất chiếu</div>
      <div className="flex gap-2">
        {data.showtimes.map((s, i) => (
          <div key={i}>
            {s.start_times.map((t, ind) => (
              <div
                key={ind}
                onClick={() =>
                  handleSelectTimes({
                    showtime_id: s.showtime_id,
                    room_id: s.room.room_id,
                  })
                }
              >
                <Button
                  text={t}
                  bg_color="transparent"
                  hover_bg_color="transparent"
                  border={
                    timeSelected.timesSelected.showtime_id === s.showtime_id
                      ? "1px var(--color-yellow) solid"
                      : "1px white solid"
                  }
                  text_color={
                    timeSelected.timesSelected.showtime_id === s.showtime_id
                      ? "var(--color-yellow)"
                      : "white"
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShowTimeCard;
