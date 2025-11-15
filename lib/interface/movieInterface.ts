export interface MovieFullITF {
  id: number;
  name: string;
  image?: string | null;
  description: string;
  age: number;
  contruy: string;
  subtitle: string;
  duration: number;
  genre: Array<string>;
}

export interface MovieItemITF {
  id: number;
  name: string;
  image?: string | null;
  age: number;
  contruy: string;
  subtitle: string;
  duration: number;
  genre: Array<string>;
}
