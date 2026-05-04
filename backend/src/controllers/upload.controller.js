import { getImageKitAuthParams } from "../services/imagekit.js";

export const getUploadAuth = (_req, res) => {
  try {
    const auth = getImageKitAuthParams();
    res.json({
      success: true,
      data: {
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
      },
    });
  } catch (error) {
    console.error("[upload-auth error]", error);
    res.status(500).json({
      success: false,
      message: "Unable to prepare upload authorization",
    });
  }
};
