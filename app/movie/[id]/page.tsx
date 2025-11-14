export default async function Movie(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return <div className="bg">id phim: {id}</div>;
}
