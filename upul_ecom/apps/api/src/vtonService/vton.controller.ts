import { Request, Response } from "express";
import { generateTryOn } from "./vton.service"; // 🔥 Clean import! No more 'proce'

// 🔥 THE ONE UNIVERSAL MODEL (Moved here to the controller)
// We use a full-body standing model so it works for shirts, pants, AND dresses!
const UNIVERSAL_MODEL = "https://replicate.delivery/pbxt/KgwTlhCMvDagRrcVzZJbuozNJ8esPqiNAIJS3eMgHrYuHmW4/KakaoTalk_Photo_2024-04-04-21-44-45.png"; 

export const processVirtualTryOn = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Extract the image URLs from the frontend request body
    const { userImageUrl, garmentImageUrl, category, garmentDescription } = req.body;

    // Basic validation
    if (!userImageUrl || !garmentImageUrl) {
      res.status(400).json({
        success: false,
        error: "Both userImageUrl and garmentImageUrl are required",
      });
      return;
    }

    const safeCategory = category || "upper_body";
    const safeDescription = garmentDescription || "A professional photo of a garment";

    // Pass the URLs to the AI service
    const generatedImageUrl = await generateTryOn(
      userImageUrl,
      garmentImageUrl,
      safeCategory,
      safeDescription
    );

    // Send the generated image URL back to frontend
    res.status(200).json({
      success: true,
      resultImage: generatedImageUrl,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error during VTON process",
    });
  }
};

export const processFashionStudio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1. Grab the image URL and AI mapping info sent from the frontend
    const { garmentImageUrl, category, garmentDescription } = req.body;

    if (!garmentImageUrl) {
      res.status(400).json({ success: false, error: "garmentImageUrl is required" });
      return;
    }

    console.log("🔥 Received 1-Click Fashion Studio request for:", garmentImageUrl);

    const safeCategory = category || "upper_body";
    const safeDescription = garmentDescription || "A professional product photo";

    // 2. 🧠 Pass the clean string to your Service!
    // We secretly inject the UNIVERSAL_MODEL here instead of asking the user for one
    const finalImage = await generateTryOn(
        UNIVERSAL_MODEL, 
        garmentImageUrl,
        safeCategory,
        safeDescription
    );

    // 3. Send the final generated image back to the frontend!
    res.status(200).json({ success: true, url: finalImage });
  } catch (error: any) {
    console.error("Fashion Studio Controller Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate fashion studio image" });
  }
};