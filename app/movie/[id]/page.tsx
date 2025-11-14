import MovieDetail from "@/components/MovieDetail/MovieDetail";

const dataF = {
  id: 1,
  image: "/trai-tim-que-quat-poster.webp",
  name: "Trái tim què quặt Phần 22222",
  description:
    "Trong bối cảnh xã hội tương lai gần, Trốn Chạy Tử Thần là chương trình truyền hình ăn khách nhất, một cuộc thi sinh tồn khốc liệt nơi các thí sinh, được gọi là “Runners”, phải trốn chạy suốt 30 ngày khỏi sự truy đuổi của các sát thủ chuyên nghiệp. Mọi bước đi của họ đều được phát sóng công khai cho khán giả theo dõi và phần thưởng tiền mặt sẽ tăng lên sau mỗi ngày sống sót. Vì cần tiền cứu chữa cho cô con gái bệnh nặng, Ben Richards (do Glen Powell thủ vai), một người lao động nghèo, chấp nhận lời mời từ Dan Killian (do Josh Brolin thủ vai), nhà sản xuất chương trình bảnh bao nhưng tàn nhẫn, để tham gia cuộc chơi như một lựa chọn cuối cùng. Tuy nhiên, sự gan lì, nhạy bén và ý chí sinh tồn mãnh liệt của Ben lại khiến anh bất ngờ trở thành nhân vật được khán giả yêu thích nhất và là mối đe dọa với cả hệ thống. Khi lượng người xem tăng vọt, hiểm nguy cũng ngày càng bủa vây. Giờ đây, Ben không chỉ phải đối mặt với toán sát thủ mà còn cả một đất nước đang nghiện cảm giác chứng kiến anh gục ngã.",
  age: 16,
  contruy: "Việt Nam",
  subtitle: "Tiếng Việt",
  duration: 120,
  genre: ["Hồi hộp", "Tâm lý"],
  actor: ["Quang Tuấn", "Ma Ran Đô", "Hoàng Tóc Dài", "Nguyên Thảo"],
};

export default async function Movie(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div>
      <MovieDetail data={dataF} />
    </div>
  );
}
