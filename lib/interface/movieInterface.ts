export interface MovieFullITF {
  movie_id: number;
  name: string;
  image: string;
  trailer_url: string;
  description: string;
  release_date: Date;
  age_require: number;
  country: string;
  subtitle: string;
  duration: number;
  status: number;
  genres?: string[] | [];
  actors?: string[] | [];
}

export interface MovieItemITF {
  movie_id: number;
  name: string;
  image: string;
  age_require: number;
  country: string;
  subtitle: string;
  duration: number;
  genres: string[];
}
export interface MoviePayload {
  name: string;
  description?: string | null;
  trailer_url?: string | null;
  release_date?: string | null;

  status?: number | null;
  age_require?: number | null;
  country_id?: number | null;
  subtitle_id?: number | null;
  duration?: number | null;
}