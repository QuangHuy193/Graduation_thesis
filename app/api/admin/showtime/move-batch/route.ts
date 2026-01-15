// app/api/showtimes/move-batch/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
type MoveItemInput = {
    showtime_id: number;
    date?: string | null; // allow null to indicate deletion
    to_room?: number | null;
    to_movie_screen_id?: number | null;
    movie_id?: number | null;
    status?: 0 | 1 | null;
    user_id?: number | null;
};

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        if (!body || !Array.isArray(body.moves)) {
            return NextResponse.json(
                { ok: false, message: "Invalid payload; expected { moves: [...] }" },
                { status: 400 }
            );
        }

        const moves: MoveItemInput[] = body.moves;

        if (moves.length === 0) {
            return NextResponse.json({ ok: false, message: "No moves provided" }, { status: 400 });
        }

        // Pre-validation
        const validationErrors: any[] = [];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        for (let i = 0; i < moves.length; i++) {
            const raw = moves[i] as any;
            if (!("showtime_id" in raw) || typeof raw.showtime_id !== "number" || !Number.isFinite(raw.showtime_id)) {
                validationErrors.push({ index: i, reason: "showtime_id is required and must be a number", input: raw });
                continue;
            }
            if ("date" in raw && raw.date != null && typeof raw.date !== "string") {
                validationErrors.push({ index: i, reason: "date must be a string YYYY-MM-DD if provided", input: raw });
            } else if ("date" in raw && raw.date != null && !dateRegex.test(raw.date)) {
                validationErrors.push({ index: i, reason: "date must be YYYY-MM-DD", input: raw });
            }
            // other fields are optional; no extra validation here
        }

        if (validationErrors.length) {
            return NextResponse.json({ ok: false, message: "Validation failed", errors: validationErrors }, { status: 400 });
        }

        // console.log("move-batch payload validated, count:", moves.length);
        const mailQueue: {
            to: string;
            subject: string;
            html: string;
        }[] = [];
        const conn = await db.getConnection();
        try {

            await conn.beginTransaction();

            const results: any[] = [];

            for (const raw of moves) {
                const m = raw as MoveItemInput;

                // Lock the target showtime row
                const [selRows] = await conn.query(`SELECT date,movie_id,room_id,movie_screen_id FROM showtime WHERE showtime_id = ? FOR UPDATE`, [m.showtime_id]);
                const existing = (selRows as any[])[0] ?? null;

                if (!existing) {
                    results.push({ ok: false, reason: "not_found", input: m });
                    continue;
                }
                const {
                    date: oldDate,
                    movie_id: MovieId,
                    room_id: oldRoomId,
                    movie_screen_id: oldMovieScreenId,
                } = existing;
                const [emails]: any[] = await conn.query(`select email from booking where showtime_id=? and status=1`, [m.showtime_id]);
                // If payload includes key "date" and it's explicitly null -> DELETE the showtime
                if (Object.prototype.hasOwnProperty.call(m, "date") && m.date === null) {

                    await conn.query(`DELETE FROM price_reality WHERE showtime_id=?`, [m.showtime_id]);

                    // await conn.query(`INSERT INTO refund (percent, amount, time, reason, booking_id) VALUES (?, ?,?,'Hủy từ hệ thống',? )`, [refundPercent, totalRefund, currentTime, id]);
                    const [bookingRows]: any[] = await conn.query(`SELECT booking_id from booking WHERE showtime_id=?`, [m.showtime_id]);
                    for (const br of bookingRows as any[]) {
                        const bookingId = br.booking_id;

                        const [existRefund]: any[] = await conn.query(
                            `SELECT 1 FROM refund WHERE booking_id=? LIMIT 1`,
                            [bookingId]
                        );

                        if (existRefund.length) continue; // đã hoàn rồi → bỏ qua

                        const [paymentRows]: any = await conn.query(
                            `SELECT amount FROM payment WHERE booking_id=?`,
                            [bookingId]
                        );

                        const amount = paymentRows[0]?.amount ?? 0;
                        const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");

                        await conn.query(
                            `INSERT INTO refund (percent, amount, time, reason, booking_id)
     VALUES (?, ?, ?, 'Hoàn tiền do hủy suất chiếu', ?)`,
                            [100, amount, currentTime, bookingId]
                        );
                    }
                    await conn.query(`UPDATE booking set status =4 WHERE showtime_id=?`, [m.showtime_id]);
                    if (bookingRows.length > 0) {
                        await conn.query(`Update showtime set status =0 WHERE showtime_id=?`, [m.showtime_id]);
                    } else {
                        await conn.query(`DELETE FROM showtime WHERE showtime_id = ?`, [m.showtime_id]);
                    }
                    // await conn.query(`UPDATE booking SET showtime_id = NULL WHERE showtime_id=?`, [m.showtime_id]);


                    results.push({ ok: true, action: "deleted", input: m });
                    if (emails.length > 0) {


                        const [movieRows]: any[] = await conn.query(`select name from movies where movie_id=?`, [MovieId]);
                        const movieName = movieRows[0].name ?? "Không xác định";

                        const transporter = nodemailer.createTransport({
                            service: "gmail",
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            },
                        });

                        for (const { email } of emails) {
                            if (!email) continue;
                            mailQueue.push({
                                to: email,
                                subject: "Thông báo hủy suất chiếu | CineGO",
                                html: `<p>Kính gửi Quý khách,</p>
                              <p>
                                Chúng tôi rất tiếc phải thông báo rằng suất chiếu phim
                                <strong>${movieName}</strong> mà Quý khách đã đặt
                                vào ngày <strong>${oldDate}</strong>
                                đã <strong>bị hủy</strong> do điều chỉnh lịch chiếu từ hệ thống.
                              </p>

                              <p>
                                Đối với vé đã thanh toán, hệ thống <strong>CineGO</strong> đã
                                <strong>tự động hoàn tiền</strong> về tài khoản mà Quý khách đã sử dụng
                                khi thanh toán.
                              </p>

                              <p>
                                Thời gian tiền được ghi nhận vào tài khoản có thể dao động từ
                                <strong>1–3 ngày làm việc</strong>, tùy theo ngân hàng.
                              </p>

                              <p>
                                Quý khách vui lòng đăng nhập hệ thống <strong>CineGO</strong>
                                để kiểm tra lại thông tin hoàn tiền và lựa chọn suất chiếu khác phù hợp.
                              </p>

                              <p>
                                Chúng tôi chân thành xin lỗi vì sự bất tiện này và rất mong nhận được
                                sự thông cảm từ Quý khách.
                              </p>

                              <br/>

                              <p>
                                Trân trọng,<br/>
                                <strong>CineGO</strong>
                              </p>`
                            });
                        }


                    }
                    continue;
                }

                // Build updates dynamically. Use 'in' checks to allow explicit nulls.
                const updates: string[] = [];
                const params: any[] = [];

                if (Object.prototype.hasOwnProperty.call(m, "to_room")) {
                    updates.push("room_id = ?");
                    params.push(m.to_room);
                }
                if (Object.prototype.hasOwnProperty.call(m, "to_movie_screen_id")) {
                    updates.push("movie_screen_id = ?");
                    params.push(m.to_movie_screen_id);
                }
                if (Object.prototype.hasOwnProperty.call(m, "movie_id")) {
                    updates.push("movie_id = ?");
                    params.push(m.movie_id);
                }
                if (Object.prototype.hasOwnProperty.call(m, "status")) {
                    updates.push("status = ?");
                    params.push(m.status);
                }
                if (Object.prototype.hasOwnProperty.call(m, "date")) {
                    updates.push("date = ?");
                    params.push(m.date);
                }
                if (Object.prototype.hasOwnProperty.call(m, "user_id")) {
                    updates.push("user_id = ?");
                    params.push(m.user_id);
                }
                if (updates.length) {
                    // push where param
                    params.push(m.showtime_id);
                    const sql = `UPDATE showtime SET ${updates.join(", ")} WHERE showtime_id = ?`;
                    await conn.query(sql, params);
                    // fetch fresh row
                    const [rows]: any[] = await conn.query(
                        `SELECT date, movie_id, room_id, movie_screen_id
   FROM showtime
   WHERE showtime_id = ?`,
                        [m.showtime_id]
                    );
                    if (!rows.length) {
                        throw new Error(`Showtime ${m.showtime_id} không tồn tại`);
                    }
                    const {
                        room_id: newRoomId,
                        movie_screen_id: newMovieScreenId,
                    } = rows[0];

                    if (emails.length > 0) {
                        // tạo transporter 1 lần (KHÔNG để trong loop)
                        const [movieRows]: any[] = await conn.query(`select name from movies where movie_id=?`, [MovieId]);
                        const movieName = movieRows[0].name ?? "Không xác định";
                        const [roomRows]: any[] = await conn.query(`SELECT name from rooms WHERE room_id=?`, [newRoomId]);
                        const roomName = roomRows[0].name ?? "Không xác định";
                        const [movieSceenRows]: any[] = await conn.query(`SELECT start_time,end_time from movie_screenings WHERE movie_screen_id=?`, [newMovieScreenId]);
                        const start = movieSceenRows[0].start_time ?? "Không xác định";
                        const end = movieSceenRows[0].end_time ?? "Không xác định";
                        const transporter = nodemailer.createTransport({
                            service: "gmail",
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS,
                            },
                        });

                        for (const { email } of emails) {
                            if (!email) continue;

                            await transporter.sendMail({
                                from: `"CineGO" <${process.env.EMAIL_USER}>`,
                                to: email,
                                subject: "Thông báo thay đổi suất chiếu | CineGO",
                                html: `
        <h3>Xin chào,</h3>

        <p>
          Suất chiếu phim <strong>${movieName}</strong> mà bạn đã đặt
          vào ngày <strong>${oldDate}</strong>
          vừa có sự thay đổi từ hệ thống.
        </p>

        <h4>📌 Thông tin suất chiếu mới</h4>
        <ul>
          <li><strong>Phòng chiếu:</strong> ${roomName}</li>
          <li><strong>Thời gian:</strong> ${start} – ${end}</li>
        </ul>

        <p>
          Vui lòng đăng nhập <strong>CineGO</strong> để kiểm tra lại thông tin
          suất chiếu và ghế ngồi của bạn.
        </p>

        <br/>

        <p>
          Trân trọng,<br/>
          <strong>CineGO</strong>
        </p>
      `,
                            });
                        }
                    }

                    results.push({ ok: true, action: "updated", row: rows[0] });
                } else {
                    // nothing to update
                    results.push({ ok: true, action: "noop", row: existing });
                }
            } // end for

            await conn.commit();
            if (mailQueue.length) {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                for (const mail of mailQueue) {
                    try {
                        await transporter.sendMail({
                            from: `"CineGO" <${process.env.EMAIL_USER}>`,
                            to: mail.to,
                            subject: mail.subject,
                            html: mail.html,
                        });
                    } catch (mailErr) {
                        console.error("Send mail failed:", mailErr, mail.to);
                    }
                }
            }
            return NextResponse.json({ ok: true, results }, { status: 200 });
        } catch (err) {
            try {
                await conn.rollback();
            } catch (rbErr) {
                console.error("rollback failed:", rbErr);
            }
            console.error("move-batch error (during transaction):", err);
            return NextResponse.json({ ok: false, message: "Internal server error", error: `${err}` }, { status: 500 });
        } finally {
            try {
                conn.release();
            } catch (relErr) {
                console.error("connection release error:", relErr);
            }
        }
    } catch (err) {
        console.error("move-batch outer error:", err);
        return NextResponse.json({ ok: false, message: "Bad request or server error" }, { status: 400 });
    }
}
