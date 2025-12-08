import PriceCard from "../PriceCard/PriceCard";

function FoodDrinkList({
  title,
  data,
  setFoodSelected,
  foodSelected,
}: {
  data: string;
  setTicketSelected: (name: string, price: number, inc: boolean) => void;
  ticketSelected: object;
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`flex justify-center uppercase text-2xl pb-3 text-(--color-yellow) 
        font-semibold`}
      >
        {title}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {data?.map((d, i) => (
          <div key={i}>
            <PriceCard
              data={d}
              setTicketSelected={setFoodSelected}
              ticketSelected={foodSelected}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default FoodDrinkList;
