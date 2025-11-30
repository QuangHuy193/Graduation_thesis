export default async function CinemaPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <div>{id}</div>;
}
