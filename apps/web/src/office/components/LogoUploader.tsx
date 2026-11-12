"use client";

import { setLogo } from "../actions";
import Uploader from "./Uploader";

export default function LogoUploader() {
  return (
    <Uploader
      folder="settings"
      accept="image/png,image/jpeg,image/webp,image/svg+xml"
      label="Upload a logo"
      onUploaded={(f) => setLogo(f.path)}
    />
  );
}
