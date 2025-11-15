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
  genres: string[];
  actors: string[];
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
