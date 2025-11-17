import { MovieFullITF } from "@/lib/interface/movieInterface";
type Props = {
    movies: MovieFullITF[];
    onEdit: (m: MovieFullITF) => void;
    onDelete: (id: number) => void;
};
function MovieTable({ movies, onEdit, onDelete }: Props) {
    return (
        <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full table-auto">
                <thead className="bg-slate-50">
                    <tr>
                        {/* <th className="text-left px-4 py-3">Poster</th> */}
                        <th className="text-left px-4 py-3">Tiêu đề</th>
                        <th className="text-left px-4 py-3">Thời lượng</th>

                        <th className="text-right px-4 py-3">Quốc gia</th>
                        <th className="text-right px-4 py-3">Tóm tắt</th>
                        <th className="text-right px-4 py-3">Ngày công chiếu</th>
                        <th className="text-right px-4 py-3">Tuổi quy định</th>
                    </tr>
                </thead>
                <tbody>
                    {movies.map((m) => (
                        <tr key={m.movie_id} className="border-t">
                            {/* <td className="px-4 py-3">
                                <div className="w-16 h-24 bg-slate-100 rounded overflow-hidden flex items-center justify-center">{m.poster ? <img src={m.poster} alt={m.title} /> : <span className="text-xs">No image</span>}</div>
                            </td> */}
                            <td className="px-4 py-3">{m.name}</td>
                            <td className="px-4 py-3">{m.duration} min</td>
                            <td className="px-4 py-3">{m.country}</td>
                            <td className="px-4 py-3">{m.description}</td>
                            <td className="px-4 py-3">{m.release_date.toString()}</td>
                            <td className="px-4 py-3">{m.age_require}</td>x
                            <td className="px-4 py-3 text-right">
                                <div className="inline-flex gap-2">
                                    <button onClick={() => onEdit(m)} className="px-3 py-1 rounded border">Sửa</button>
                                    <button onClick={() => onDelete(m.movie_id)} className="px-3 py-1 rounded border text-red-600">Xóa</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default MovieTable;