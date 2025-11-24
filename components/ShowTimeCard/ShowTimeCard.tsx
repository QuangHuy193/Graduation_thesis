import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../Button/Button";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

function ShowTimeCard({
  data,
  setTimesSelect,
  timeSelected,
}: {
  setTimesSelect: (obj: {
    showtime_id: string;
    room_id: string;
    cinema_name: string;
    cinema_address: string;
    room_name: string;
    time: string;
  }) => void;
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
                    cinema_name: data.cinema_name + " (" + data.province + ") ",
                    cinema_address:
                      data.specific_address +
                      ", " +
                      data.ward +
                      ", " +
                      data.province,
                    room_id: s.room.room_id,
                    room_name: s.room.room_name,
                    time: t,
                  })
                }
              >
                <Button
                  text={t}
                  bg_color="transparent"
                  hover_bg_color="transparent"
                  border={
                    timeSelected.showtime_id === s.showtime_id
                      ? "1px var(--color-yellow) solid"
                      : "1px white solid"
                  }
                  text_color={
                    timeSelected.showtime_id === s.showtime_id
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
