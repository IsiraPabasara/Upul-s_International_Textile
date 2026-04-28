import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const generateTryOn = async (
  humanImageUrl: string,
  garmentImageUrl: string,
  category: "upper_body" | "lower_body" | "dresses" = "upper_body", 
  garmentDescription: string = "A professional photo of a garment"
): Promise<string> => {
  try {
    
    console.log(`Processing images (~15-20 seconds)... Category: ${category}`);

    const output: any = await replicate.run(
      "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
      {
        input: {
          human_img: humanImageUrl,
          garm_img: garmentImageUrl,
          garment_des: garmentDescription, 
          category: category,              
          steps: 30,
        },
      },
    );

    let finalImageUrl = "";
    const firstOutput = Array.isArray(output) ? output[0] : output;

    if (firstOutput && typeof firstOutput.url === "function") {
      finalImageUrl = firstOutput.url().toString();
    } else {
      finalImageUrl = String(firstOutput);
    }

    return finalImageUrl; 
  } catch (error: any) {
    console.error("Replicate AI Error Message:", error.message || error);
    throw new Error("Failed to generate Virtual Try-On image from AI model");
  }
};