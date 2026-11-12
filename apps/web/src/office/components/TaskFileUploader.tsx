"use client";

import { recordFile } from "../actions";
import Uploader from "./Uploader";

export default function TaskFileUploader({ taskId }: { taskId: string }) {
  return (
    <Uploader
      folder={`tasks/${taskId}`}
      label="Attach a file"
      onUploaded={(f) => recordFile({ taskId, path: f.path, name: f.name, size: f.size, mime: f.mime })}
    />
  );
}
