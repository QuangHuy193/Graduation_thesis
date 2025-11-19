interface propSpiner {
  color?: string;
  text?: string;
}

function Spinner({ color = "blue", text = "" }: propSpiner) {
  return (
    <div className="flex items-center justify-center w-full h-full flex-col">
      <div
        className="w-10 h-10 border-4 border-t-transparent
       rounded-full animate-spin"
        style={{
          color: color,
          borderTopColor: "transparent",
        }}
      ></div>
      <div>{text}</div>
    </div>
  );
}

export default Spinner;
