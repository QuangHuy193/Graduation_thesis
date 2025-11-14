import { MovieFullITF } from "@/lib/interface/movieInterface";
import Image from "next/image";
import WatchTrailer from "../Button/WatchTrailer";

function MovieDetail({ data }: { data: MovieFullITF }) {
  return (
    <div className="flex">
      <div className="flex-4">
        <Image src={data.image} width={120} height={50} alt="poster" />
      </div>
      <div className="flex-6">
        <div>
          {data.name} (T{data.age})
        </div>
        <div>
          <div></div>
          <div></div>
        </div>
        <div>
          <div></div>
          <div>{data.duration} phút</div>
        </div>
        <div>
          <div></div>
          <div>{data.contruy}</div>
        </div>
        <div>
          <div></div>
          <div>{data.subtitle}</div>
        </div>
        <div>
          <div></div>
          <div>
            T{data.age}: Phim dành cho khán giả từ đủ {data.age} tuổi trở lên (
            {data.age}+)
          </div>
        </div>
        <div>MÔ TẢ</div>
        <div>
          <div>diễn viên</div>
          <div>ngày chiếu</div>
        </div>
        <div>NỘI DUNG</div>
        <div>{data.description}</div>
        <div>
          <WatchTrailer size="m" />
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;
