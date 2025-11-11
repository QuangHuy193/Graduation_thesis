import { MovieItemITF } from "@/lib/interface/movieInterface";
import MovieItem from "../MovieItem/MovieItem";

function MovieList({ data, title }: { data: MovieItemITF[]; title: string }) {
  console.log(title);
  return (
    <div>
      <div className="w-full flex justify-center py-7 text-4xl font-bold">
        {title}
      </div>
      <div className="grid grid-cols-4 gap-6">
        {data.map((movie: MovieItemITF) => (
          <div key={movie.id}>
            <MovieItem data={movie} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieList;
