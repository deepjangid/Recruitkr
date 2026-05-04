import { getSession } from "@/lib/auth";
import { apiGet } from "@/lib/api";

export type UploadFolder = "resumes" | "profiles" | "team" | "blogs";

export type UploadedFileAsset = {
  fileId: string;
  url: string;
};

const IMAGE_MAX_BYTES = 500 * 1024;
const RESUME_MAX_BYTES = 2 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedResumeTypes = new Set(["application/pdf"]);

const folderRules: Record<
  UploadFolder,
  {
    maxBytes: number;
    acceptedTypes: Set<string>;
    label: string;
  }
> = {
  resumes: {
    maxBytes: RESUME_MAX_BYTES,
    acceptedTypes: allowedResumeTypes,
    label: "resume PDF",
  },
  profiles: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "profile image",
  },
  team: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "team image",
  },
  blogs: {
    maxBytes: IMAGE_MAX_BYTES,
    acceptedTypes: allowedImageTypes,
    label: "blog image",
  },
};

const sanitizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureImageKitConfig = () => {
  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new Error("ImageKit is not configured. Add VITE_IMAGEKIT_PUBLIC_KEY.");
  }

  return { publicKey };
};

const getFileExtension = (file: File) => {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();
  if (fromName) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return file.type.replace("image/", "");
  return "bin";
};

export const validateUploadFile = (file: File, folder: UploadFolder) => {
  const rule = folderRules[folder];
  if (!rule.acceptedTypes.has(file.type)) {
    throw new Error(`Please upload a valid ${rule.label}.`);
  }

  if (file.size > rule.maxBytes) {
    const sizeText = folder === "resumes" ? "2MB" : "500KB";
    throw new Error(
      `${rule.label[0].toUpperCase()}${rule.label.slice(1)} must be ${sizeText} or smaller.`,
    );
  }
};

const getUploadAuth = async () => {
  const response = await apiGet<{
    success?: boolean;
    data?: {
      token?: string;
      expire?: number;
      signature?: string;
    };
  }>("/upload-auth");

  const token = response.data?.token?.trim();
  const signature = response.data?.signature?.trim();
  const expire = response.data?.expire;

  if (!response.success || !token || !signature || typeof expire !== "number") {
    throw new Error("Unable to prepare secure upload.");
  }

  return { token, signature, expire };
};

export const uploadFile = async (
  file: File,
  folder: UploadFolder,
): Promise<UploadedFileAsset> => {
  validateUploadFile(file, folder);

  const { publicKey } = ensureImageKitConfig();
  const { token, signature, expire } = await getUploadAuth();
  const session = getSession();
  const userId = sanitizeName(session?.user?.id || "guest-user");
  const timestamp = Date.now();

  const extension = getFileExtension(file);
  const baseName = sanitizeName(file.name.replace(/\.[^.]+$/, "")) || folder;
  const fileName = `${userId}_${timestamp}_${baseName}.${extension}`;
  const folderPath = `/${folder}/${userId}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("publicKey", publicKey);
  formData.append("token", token);
  formData.append("signature", signature);
  formData.append("expire", String(expire));
  formData.append("folder", folderPath);

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        url?: string;
        fileId?: string;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.url || !payload.fileId) {
    console.error("[uploadFile] secure ImageKit upload failed", {
      status: response.status,
      payload,
    });
    throw new Error(payload?.message || "Failed to upload file");
  }

  return {
    url: payload.url,
    fileId: payload.fileId,
  };
};

export const uploadRules = {
  imageMaxBytes: IMAGE_MAX_BYTES,
  resumeMaxBytes: RESUME_MAX_BYTES,
};
