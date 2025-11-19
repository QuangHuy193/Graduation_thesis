import MovieDetail from "@/components/MovieDetail/MovieDetail";
import { getMovieWithIdAPI } from "@/lib/axios/movieAPI";

export default async function Movie(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const dataMovie = await getMovieWithIdAPI(Number(id));

  return (
    <div>
      <MovieDetail data={dataMovie} movie_id={id} />
    </div>
  );
}
