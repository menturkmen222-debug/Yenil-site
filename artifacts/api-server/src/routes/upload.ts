import { Router, type Request, type Response } from "express";
import { IncomingMessage } from "http";
import Busboy from "busboy";

const router = Router();

const CLOUDINARY_CLOUD_NAME = process.env["CLOUDINARY_CLOUD_NAME"] || "yenil";
const CLOUDINARY_UPLOAD_PRESET = process.env["CLOUDINARY_UPLOAD_PRESET"] || "yenil_upload";
const CLOUDINARY_API_KEY = process.env["CLOUDINARY_API_KEY"] || "";
const CLOUDINARY_API_SECRET = process.env["CLOUDINARY_API_SECRET"] || "";

router.post("/upload-screenshot", (req: Request, res: Response) => {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    res.status(400).json({ error: "multipart/form-data required" });
    return;
  }

  const chunks: Buffer[] = [];
  let filename = "screenshot.jpg";
  let mimetype = "image/jpeg";
  let found = false;

  const bb = Busboy({ headers: req.headers });

  bb.on("file", (_fieldname: string, file: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
    found = true;
    filename = info.filename || "screenshot.jpg";
    mimetype = info.mimeType || "image/jpeg";
    file.on("data", (chunk: Buffer) => chunks.push(chunk));
  });

  bb.on("finish", async () => {
    if (!found || chunks.length === 0) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const buffer = Buffer.concat(chunks);

    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 5MB)" });
      return;
    }

    try {
      const { createHash } = await import("crypto");
      const timestamp = Math.round(Date.now() / 1000);

      if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        const paramString = `timestamp=${timestamp}&upload_preset=${CLOUDINARY_UPLOAD_PRESET}${CLOUDINARY_API_SECRET}`;
        const signature = createHash("sha1").update(paramString).digest("hex");

        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimetype });
        formData.append("file", blob, filename);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("timestamp", String(timestamp));
        formData.append("api_key", CLOUDINARY_API_KEY);
        formData.append("signature", signature);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!cloudRes.ok) {
          const errText = await cloudRes.text();
          throw new Error(`Cloudinary error: ${errText.substring(0, 200)}`);
        }

        const data = await cloudRes.json() as { secure_url: string };
        res.status(200).json({ secure_url: data.secure_url });
        return;
      }

      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mimetype};base64,${base64}`;
      res.status(200).json({
        secure_url: dataUrl,
        note: "Stored as base64 (no Cloudinary config)",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });

  bb.on("error", (err: Error) => {
    res.status(500).json({ error: "Upload parse error: " + err.message });
  });

  req.pipe(bb);
});

export default router;
