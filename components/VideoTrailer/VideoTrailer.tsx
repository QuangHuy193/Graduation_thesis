"use client";

import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function VideoTrailer({ onClose, src }: { onClose: () => void; src: string }) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-99">
      {/* Khung video */}
      <div className="w-[90%] max-w-3xl">
        {/* Nút đóng */}
        <div className="flex justify-end ">
          <button
            onClick={onClose}
            className="px-2 py-1 cursor-pointer text-white text-2xl hover:text-red-400 transition"
          >
            <FontAwesomeIcon icon={faX} />
          </button>
        </div>
        <div className=" aspect-video rounded-lg overflow-hidden shadow-lg">
          <iframe
            src={src}
            title="Trailer"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default VideoTrailer;
