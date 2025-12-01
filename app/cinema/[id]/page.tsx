import CinemaPage from "@/components/CinemaPage/CinemaPage";

export default async function Cinema(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <div>
      <CinemaPage />
    </div>
  );
}
