export interface MovieFullITF {
  id: number;
  name: string;
  image: string;
  description: string;
  age: number;
  contruy: string;
  subtitle: string;
  duration: number;
  genre: string[];
  actor: string[];
}

export interface MovieItemITF {
  id: number;
  name: string;
  image: string;
  age: number;
  contruy: string;
  subtitle: string;
  duration: number;
  genre: string[];
}
